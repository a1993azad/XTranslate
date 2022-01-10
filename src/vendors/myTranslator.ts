import MyLanguages from "./myTranslator.json"
import { createStorageHelper, ProxyRequestInit } from "../extension";
import { isTranslationError, ITranslationResult, TranslateParams, Translator } from "./translator";
import { createLogger, delay } from "../utils";
import { BASE_URL } from "../constants";
import axios from "axios";
import {  getAuthAsync } from "../actions/user";

class MyTranslator extends Translator {
  public name = 'myTranslator';
  public title = 'myTranslator';
  public apiUrl = BASE_URL+'/vocabulary/words/detail/';
  public publicUrl =  BASE_URL;
  public ttsMaxLength = 187;

  protected logger = createLogger({ systemPrefix: "[MY_TRANSLATOR]" });
  protected apiClients = ["gtx", "dict-chrome-ex"];
  protected apiClient = createStorageHelper<string>("my_translator_api_client", {
    defaultValue: this.apiClients[0],
  });

  constructor() {
    super(MyLanguages);
  }

  getFullPageTranslationUrl(pageUrl: string, lang: string): string {
    return `/`
  }

  // try to use next available api-client if google has blocked the traffic
  protected async refreshApiClient() {
    await delay(1000);

    var apiClient = this.apiClient.get();
    var index = this.apiClients.findIndex(client => client === apiClient);
    var nextApiClient = this.apiClients[index + 1] ?? this.apiClients[0];
    this.apiClient.set(nextApiClient);

    this.logger.info("api client refreshed", {
      oldValue: apiClient,
      newValue: nextApiClient,
    });
  }

  getAudioUrl(lang: string, text: string) {
    return ''
   /*  if (text.length > this.ttsMaxLength) return;
    var textEncoded = encodeURIComponent(text);
    var apiClient = this.apiClient.get();
    return this.apiUrl + `/translate_tts?client=${apiClient}&ie=UTF-8&tl=${lang}&q=${textEncoded}`; */
  }

  async translate(params: TranslateParams): Promise<ITranslationResult> {
 
    var apiClientRefreshed = false;
    
    var request = async (): Promise<ITranslationResult> => {
   
      var result = await axios.post(this.apiUrl,{text:params.text},{headers:await getAuthAsync()});
      const { language, concepts,text,pronunciations=[]} = result.data as MyTranslatorTranslation;
     
      const translation: ITranslationResult = {
        langDetected: language,
        translation: concepts.map(sentence => sentence.translations.join(',')).join(','),
      };
      if(pronunciations.length){
        translation.pronunciations=pronunciations.map(p=>BASE_URL+p.sound)
      }
      if (concepts) {
        translation.transcription = concepts[0].translations[0];
        translation.dictionary = concepts.map(dict => {
          return {
            wordType: dict.concept,
            transcription:dict.translations.join(','),
            meanings: dict.definitions.map(entry => {
              return {
                word: entry.text,
                translation: [entry.text],
                examples:entry.example?[[entry.example]]:null
              }
            })
          }
        });
      }
      return translation;
    }

    try {
      return await request(); // waiting for response to handle error locally
    } catch (error) {
      if (isTranslationError(error)) {
        if (error.statusCode === 503 && !apiClientRefreshed) {
          apiClientRefreshed = true;
          return this.refreshApiClient().then(request);
        }
      }
      if (error) this.logger.error(error);
      throw error;
    }
  }
}

interface MyTranslatorTranslation {
  id: string | number // lang detected
  language: string // lang detected
  text: string
  pronunciations?: {
    sound: string
  }[]
  concepts: {
    concept:string
    definitions:{
      text:string,
      example:string
    }[],
    translations:string[]
  }[]
}

const myTranslator = new MyTranslator();
Translator.vendors.set(myTranslator.name, myTranslator);
