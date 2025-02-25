// [IPC]: inter-process communications (background <-> options-page <-> content-pages)
import { ITranslationResult } from "../vendors";

export const enum MessageType {
  PROXY_REQUEST = "PROXY_REQUEST",
  GET_SELECTED_TEXT = "GET_SELECTED_TEXT",
  TRANSLATE_WITH_VENDOR = "TRANSLATE_WITH_VENDOR",
  TRANSLATE_FULL_PAGE = "TRANSLATE_FULL_PAGE",
  SAVE_TO_HISTORY = "SAVE_TO_HISTORY",
}

export type MessageId = string | number;

export interface Message<Payload = any /*json-serializable*/> {
  id?: MessageId;
  type: MessageType;
  payload?: Payload;
}

export interface ProxyRequestPayload {
  url: string;
  responseType?: "json" /*default*/ | "text" | "data-uri";
  requestInit?: ProxyRequestInit;
}

export type ProxyRequestInit = Omit<RequestInit, "window" | "signal" | "body"> & {
  body?: string;
};

export interface ProxyRequestResponse<Data = any, Error = any> {
  messageId: MessageId;
  url: string;
  data?: Data;
  error?: Error;
}

export interface TranslateWithVendorPayload {
  vendor: string;
  text: string;
  from?: string;
  to?: string;
}

export interface SaveToHistoryPayload {
  translation: ITranslationResult;
}
