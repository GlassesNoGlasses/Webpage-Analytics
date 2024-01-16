
import { WebsiteAnalytic, DateAnalytic, webConstants } from "./constants.js";

console.log("hiii");

// SECTION: Helper Functions
const Debugger = (actual, expected)  => {
    console.log("==============DEBUGGING==================");
    console.warn("Actual Value: " + actual);
    console.log("Expected Value: " + expected);
    console.log("==============END-DEBUGGING==============");
};

const ClearLocalStorage = (callback = null) => {
    if (chrome.runtime.lastError) {
        console.error("Error: clearing local storage: " + chrome.runtime.lastError)
    } else {
        chrome.storage.local.clear(callback ? callback : () => {
            console.warn("Local Storage cleared successfully")
        });
    };
}

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

const SetTodayAnalytic = async() => {
    const currentDateData = await GetFromLocal(currentDate);

    if (Object.keys(currentDateData).length === 0) {
        InitializeDate(currentDate);
        return;
    }

    todayAnalytic.SetVisited(currentDateData[currentDate].visitedWebsites.filter((website) => website.domain));

    console.log("Fetched From Local: ", currentDateData);
    console.log("New TodayAnalytic: ", todayAnalytic);
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
    };
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

    console.log("FETCHED TAB: ", currentTab);

    UpdateActiveWebsiteTime(currentTab.url);
    console.log("ACTIVE TAB UPDATED TO: ", todayAnalytic);
    return true;
};

// SECTION: To Popup

// Send message/data to popup.js
const SendToPopup = async (popupData) => {

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
    ClearLocalStorage();

    await SetTodayAnalytic();
};

chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log(changes, namespace);

    switch (namespace) {
        case "local":
            () => SetTodayAnalytic();
            break;
        
        case "sync":
            break;
    
        default:
            break;
    }
});

chrome.tabs.onActivated.addListener(() => {UpdateActiveTab()});


StartUp();


