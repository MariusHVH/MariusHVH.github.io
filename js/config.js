//Global variable
const appdata = {};
appdata.accounts = {};
appdata.fileManager = {
    mainContent: {},
    toCopy: null,
    toMove: null,
    contentFilter: "",
    sortField : "name",
    sortDirection : 1,
    contentsSelected: {},
    lastContentSelected: {
      id: undefined,
      checked: undefined,
      processing: false
    },
    uploadProxy : "upload"
  };
appdata.uploads = {};
appdata.uploads.activeUploads = 0
appdata.servers = {};
appdata.servers.serversList = [];
appdata.servers.timestamp = null;
appdata.wt = "4fd6sg89d7s6"
appdata.apiServer = "api"
appdata.billing = {}
appdata.ads = {}
appdata.ads.mustLoadAdcash = false
appdata.ads.mustLoadAdcashPop = false
appdata.ads.mustLoadClickadu = false
appdata.ads.mustLoadClickaduInPage = false
appdata.ads.mustLoadCleverad = false
appdata.ads.mustLoadGalaksionInPage = false
appdata.ads.clickaduScriptLoaded = false
appdata.ads.clickaduInPageScriptLoaded = false
appdata.ads.cleveradScriptLoaded = false
appdata.ads.galaksionInPageScriptLoaded = false
appdata.ads.adcashScriptLoaded = false
appdata.ads.adcashPopScriptLoaded = false

appdata.random = new URLSearchParams(window.location.search).get('random') ? parseFloat("0." + new URLSearchParams(window.location.search).get('random')) : Math.random(); //Set the random value to the url param "random" if present, if not, generate random
if (window.location.hostname.includes('dev')) {
    appdata.apiServer = "api-dev";
}
appdata.pressedKeys = {}; //Contain pressed keys. Needed for some file manager logic.
