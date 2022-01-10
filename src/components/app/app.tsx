//-- Main window app (options page)

import "./app.scss";
import "../../packages.setup";
import * as React from "react";
import { render } from "react-dom";
import { reaction } from "mobx";
import { observer } from "mobx-react";
import { cssNames } from "../../utils/cssNames";
import { getManifest } from "../../extension";
import { settingsStore } from "../settings/settings.storage";
import { themeStore } from "../theme-manager/theme.storage";
import { Footer } from "../footer";
import { Spinner } from "../spinner";
import { Tab, Tabs } from "../tabs";
import { Icon } from "../icon";
import { AppRateDialog } from "./app-rate.dialog";
import { Notifications } from "../notifications";
import { defaultPageId, getParam, navigate, PageId } from "../../navigation";
import { viewsManager } from "./views-manager";
import { getMessage, i18nInit } from "../../i18n";
import { Provider, connect, useSelector, useDispatch } from "react-redux";
import Auth from "../Auth";
import { store } from "../../utils/store";
import { Dialog } from "../dialog";
import { Button } from "../button";
import { logoutAction,getProfileAction, checkTokenAction } from "../../actions/user";
import { BASE_URL } from "../../constants";
type AppChildInterface = {
  name: string;
  version: string | number;
  useDarkTheme: any;
  detachWindow: any;
  onTabsChange: any;
  pageId: string;
  TabContent: any;
};
const AppChild = (props: AppChildInterface) => {
  const {
    name,
    version,
    useDarkTheme,
    detachWindow,
    onTabsChange,
    pageId,
    TabContent,
  } = props;
  const dispatch=useDispatch();
  const [first,setFirst]=React.useState(true)
  const { token,user } = useSelector((state: any) => ({
    token: state.globalStorage.token,
    user: state.globalStorage.user,
  }));
  const [logoutDialog,setLogoutDialog]=React.useState(false);
  const showLogoutDialog=()=>{
    setLogoutDialog(true);
  }
  const closeLogoutDialog=()=>{
    setLogoutDialog(false);
  }
  const logout=()=>{
    dispatch(logoutAction());
  }
  const getProfile=()=>{
    dispatch(getProfileAction())
  }
  React.useEffect(()=>{
    if(token){
      getProfile()
    }else{
      if(first){
        setFirst(false);
        dispatch(checkTokenAction())
      }
    }
  },[token])
  return (
    <>
      {token ? (
        <div className="App">
            <Dialog pinned animated close={closeLogoutDialog} isOpen={logoutDialog} className='rtl'>
              <>
              
            <h3 className='px-5 py-4 m-0'> 
              {
                getMessage('logoutMessage')
              }
              </h3>
              <div className="d-flex justify-content-center">

              <Button label={getMessage('Yes')} primary onClick={logout} className="m-2" />
              <Button label={getMessage('No')} onClick={closeLogoutDialog} className="m-2"  />
              </div>
              </>
          </Dialog>
          <header className="flex gaps">
            <div className="app-title box grow">
              {user && <p className="m-0">
                <img  className="rounded-circle overflow-hidden m-1" src={BASE_URL+user.profile_image}  width={40} height={40}/>
                
                {user.name}
                </p>}
              <small>
                {name} <sup className="app-version">{version}</sup>
                </small>
            </div>
            <Icon
              svg="moon"
              tooltip={{ nowrap: true, children: getMessage("use_dark_theme") }}
              className={cssNames("dark-theme-icon", { active: useDarkTheme })}
              onClick={() => (settingsStore.data.useDarkTheme = !useDarkTheme)}
            />
            <Icon
              material="open_in_new"
              tooltip={{ nowrap: true, children: getMessage("open_in_window") }}
              onClick={detachWindow}
            />
            <Icon
              material={"power_settings_new"}
              tooltip={{ nowrap: true, children: getMessage("logout") }}
              onClick={showLogoutDialog}
            />
          </header>
          <Tabs center value={pageId} onChange={onTabsChange}>
            {App.pages.map((pageId) => {
              var { Tab } = viewsManager.getPageById(pageId);
              if (Tab) return <Tab key={pageId} value={pageId} />;
            })}
          </Tabs>
          <div className="tab-content flex column">
            {TabContent && <TabContent />}
            {!TabContent && <p className="box center">Page not found</p>}
          </div>
          {/* <Footer/> */}
          <Notifications />
          <AppRateDialog />
        </div>
      ) : (
        <Auth />
      )}
    </>
  );
};
@observer
export class App extends React.Component {
  static manifest = getManifest();
  static pages: PageId[] = ["settings", "theme", "translate", "history"];

  static async init() {
    var appRootElem = document.getElementById("app");
    render(<Spinner center />, appRootElem); // show loading indicator

    // wait for dependent data before render
    await Promise.all([i18nInit(), settingsStore.ready, themeStore.ready]);

    render(
      <Provider store={store}>
        <App />
      </Provider>,
      appRootElem
    );
  }

  componentDidMount() {
    this.setUpTheme();
    reaction(() => settingsStore.data.useDarkTheme, this.setUpTheme);
    document.title = App.manifest.name;
  }

  setUpTheme = () => {
    document.body.classList.toggle(
      "theme-dark",
      settingsStore.data.useDarkTheme
    );
  };

  detachWindow = () => {
    chrome.windows.create({
      url: location.href,
      focused: true,
      width: 600,
      height: 700,
      left: 25,
      top: 25,
      type: "popup",
    });
  };

  onTabsChange = async (page: PageId) => {
    await navigate({ page });
    window.scrollTo(0, 0);
  };

  render() {
    const { name, version } = App.manifest;
    const { useDarkTheme } = settingsStore.data;
    const pageId = (getParam("page") as PageId) ?? defaultPageId;
    const { Page: TabContent } = viewsManager.getPageById(pageId);
  
    return (
      <>
        <AppChild
          TabContent={TabContent}
          detachWindow={this.detachWindow}
          name={name}
          onTabsChange={this.onTabsChange}
          pageId={pageId}
          useDarkTheme={useDarkTheme}
          version={version}
        />
      </>
    );
  }
}
const mapState = (state: any) => ({
  token: state.globalStorage.token,
});
// init app
connect(mapState)(App).init();
