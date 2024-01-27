
import { DateAnalytic, webConstants, SetToLocal, GetFromLocal, ClearLocalStorage } from "./constants.js";

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

const SetTodayAnalytic = async () => {
    console.log("setting today analytics");
    const currentDateData = await GetFromLocal(currentDate);

    if (Object.keys(currentDateData).length === 0) {
        await InitializeDate(currentDate);
        return;
    }

    todayAnalytic.SetVisited(currentDateData[currentDate].visitedWebsites);

    console.log("New TodayAnalytic: ", todayAnalytic);
};

// SECTION: Storage Functions
const UpdateActiveWebsiteTime = async (activeWebUrl) => {
    const webDom = GetDomName(activeWebUrl);
    const currTime = new Date().getTime();

    todayAnalytic.UpdateActiveWebsite(webDom, currTime);
    
    await SetToLocal(currentDate, todayAnalytic);
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
        console.warn("Warning: Could not get active tab: ", currentTab);
        return;
    };

    ClearWebsiteInterval();
    await UpdateActiveWebsiteTime(currentTab.url);
    console.log("ACTIVE TAB UPDATED TO: ", todayAnalytic);

    CreateWebsiteInterval(currentTab.url);
    return;
};

// Handle updating analytic upon url change of current tab
const TabUpdateHandler = async (changeInfo) => {
    const newTabUrl = changeInfo.url;

    if (newTabUrl) {
        ClearWebsiteInterval();
        await UpdateActiveWebsiteTime(newTabUrl);
        CreateWebsiteInterval(newTabUrl);
    };
};

// Create interval to update website analytics every
// in intervals of TAB_AUTO_UPDATE_TIME
const CreateWebsiteInterval = (activeWebUrl) => {
    if (activeWebUrl && !interval) {
        interval = setInterval(async () => {
            await UpdateActiveWebsiteTime(activeWebUrl);
        }, TAB_AUTO_UPDATE_TIME);
    };
};

// Clear existing interval for auto update
const ClearWebsiteInterval = () => {
    if (interval) {
        clearInterval(interval);
        interval = null;
    };
};


// SECTION: To Popup

// SECTION: Constants/Vars Used
const TAB_AUTO_UPDATE_TIME = 5000// 120000; // 2 minutes
const currentDate = new Date().toDateString();
const todayAnalytic = new DateAnalytic(currentDate);
let interval = null;

// SECTION: Startup Functions

// Initialize todayAnalytic Object if not in local storage
const InitializeDate = async (currentDate) => {
    const dateInfo = new DateAnalytic(currentDate);

    await SetToLocal(currentDate, dateInfo);
};


const StartUp = async () => {
    ClearLocalStorage();

    await SetTodayAnalytic();
};

chrome.storage.onChanged.addListener((changes, areaName) => {
    console.log("Recieved change to: ", areaName);
    switch (areaName) {
        case "local":
            console.log("LOCAL");
            SetTodayAnalytic ();
            break;
        
        case "sync":
            break;
    
        default:
            break;
    }
});

// Updates analytic upon active tab change
chrome.tabs.onActivated.addListener(() => {UpdateActiveTab()});

// Updates analytic current tab url change
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    () => TabUpdateHandler(changeInfo);
});


StartUp();


