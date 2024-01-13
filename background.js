
import { WebsiteAnalytic, DateAnalytic, webConstants } from "./constants.js";

console.log("hiii");

// SECTION: Helper Functions
const Debugger = (actual, expected)  => {
    console.log("==============DEBUGGING==================");
    console.warn("Actual Value: " + actual);
    console.log("Expected Value: " + expected);
    console.log("==============END-DEBUGGING==============");
};

// Get dom name
const GetDomName = (url) => {
    try {
        const rawDomain = url.slice(url.indexOf(webConstants.urlPrefix) + webConstants.urlPrefix.length);
        return rawDomain.indexOf(webConstants.urlSuffix) !== -1 ? rawDomain.slice(0, rawDomain.indexOf(webConstants.urlSuffix)) : rawDomain; 
    } catch (error) {
        console.warn("Error: Could not find domain of : ", url);
        return null;
    };
};

// SECTION: Storage Functions

// Set to local storage {localKey : val}
const SetToLocal = (localKey, val) => {
    const obj = {};
    obj[localKey] = val;

    chrome.storage.local.set(obj).then((succ, rej) => {
        if (rej) {
            console.warn("Error: Could not save key ", localKey, " to local storage");
            return false;
        } else {
            console.log("Key: ", localKey, " is set to Value: ", val);
            return true;
        };
    });
};

// Get from local storage of key "localKey"
const GetFromLocal = async (localKey) => {
    const dateAnalyticData = await chrome.storage.local.get(localKey);

    if(!dateAnalyticData) {
        console.warn("Error: Failed to retrive local dateAnalyticData for: ", localKey);
        return null;
    }
    console.log(dateAnalyticData);
    return dateAnalyticData;
};


const UpdateActiveWebsiteTime = (activeWebUrl) => {
    const webDom = GetDomName(activeWebUrl);
    const currTime = new Date().getTime();

    todayAnalytic.UpdateActiveWebsite(webDom, currTime);
    
    SetToLocal(currentDate, todayAnalytic);
};

// SECTION: Active Tab / Update

// Get the most recent active tab/curr tab
const GetRecentActiveTab = async () => {
    const queryOptions = { active: true, lastFocusedWindow: true };

    const [tab] = await chrome.tabs.query(queryOptions);
    return tab;
};

// Update timestamps to accomodate active tab changes
const UpdateActiveTab = async () => {
    // use currentTab.url to get current url of active tab
    const currentTab = await GetRecentActiveTab();

    if (!currentTab || currentTab.url.length === 0) {
        console.error("Error: Could not get active tab: ", currentTab);
        return false;
    };

    console.log(currentTab);

    UpdateActiveWebsiteTime(currentTab.url);
    return true;
};

// SECTION: To Popup

// Send message/data to popup.js
const SendToPopup = async () => {

}

// SECTION: Constants/Vars Used
const currentDate = new Date().toDateString();
const todayAnalytic = new DateAnalytic(currentDate);

// SECTION: Startup Functions

// Initialize todayAnalytic Object if not in local storage
const InitializeDate = (currentDate, webDom = null) => {
    console.log("initializing date");
    const dateInfo = new DateAnalytic(currentDate);

    if (!webDom) {
        const initialWebsite = new WebsiteAnalytic(webDom, new Date().getTime());
        dateInfo.AddWebsite(initialWebsite);
    }

    SetToLocal(currentDate, dateInfo);
};


const StartUp = async () => {
    const currentDateData = await GetFromLocal(currentDate);

    if (Object.keys(currentDateData).length === 0) {
        InitializeDate(currentDate);
        return;
    }

    todayAnalytic.SetVisited(currentDateData[currentDate].visitedWebsites);

    console.log("Startup From Local: ", currentDateData);
    console.log("Startup TodayAnalytic: ", todayAnalytic);

};

chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log(changes, namespace);

    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(
          `Storage key "${key}" in namespace "${namespace}" changed.`,
          `Old value was "${oldValue}", new value is "${newValue}".`
        );
    }

    switch (namespace) {
        case "local":

            break;
        
        case "sync":
            break;
    
        default:
            break;
    }
});

chrome.tabs.onActivated.addListener(() => {UpdateActiveTab()});


StartUp();


