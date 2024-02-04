
import { DateAnalytic, GetDomName, SetToLocal, 
    GetFromLocal, ClearLocalStorage, WebsiteAnalytic, GetFromSync} from "./constants.js";

// SECTION: Helper Functions
const Debugger = (actual, expected) => {
    console.log("==============DEBUGGING==================");
    console.warn("Actual Value: " + actual);
    console.log("Expected Value: " + expected);
    console.log("==============END-DEBUGGING==============");
};

const SetTodayAnalytic = async () => {
    const currentDateData = await GetFromLocal(currentDate);

    if (!currentDateData || Object.keys(currentDateData).length === 0) {
        await InitializeDate(currentDate);
        return;
    }

    console.log("Fetched from Local: ", currentDateData);
    todayAnalytic.SetVisited(currentDateData[currentDate].visitedWebsites);
    console.log("New TodayAnalytic: ", todayAnalytic);
};

// SECTION: Storage Functions
const UpdateActiveWebsiteTime = async (activeWebUrl) => {
    const webDom = GetDomName(activeWebUrl);
    const currTime = new Date().getTime();

    todayAnalytic.UpdateActiveWebsite(new WebsiteAnalytic(webDom, currTime), currTime);

    await SetToLocal(currentDate, todayAnalytic.SerializeToObject()); // store to local
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
    } else if (blockedWebsites.find((website) => website.url === newTabUrl)) {
        console.warn("Website blocked by user");
        return;
    };

    console.log("New Active Tab: ", currentTab);

    ClearWebsiteInterval();
    await UpdateActiveWebsiteTime(currentTab.url);
    CreateWebsiteInterval(currentTab.url);

    return;
};

// Handle updating analytic upon url change of current tab
const TabUpdateHandler = async (changeInfo) => {
    const newTabUrl = changeInfo.url;

    if (newTabUrl) {
        ClearWebsiteInterval();

        if (!blockedWebsites.find((website) => website.url === newTabUrl)) {
            await UpdateActiveWebsiteTime(newTabUrl);
            CreateWebsiteInterval(newTabUrl);
        }
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
let blockedWebsites = [];
let interval = null;

// SECTION: Startup Functions

// Initialize todayAnalytic Object if not in local storage
const InitializeDate = async (currentDate) => {
    const dateInfo = new DateAnalytic(currentDate);

    await SetToLocal(currentDate, dateInfo.SerializeToObject());
};

// Starts up background.js
const StartUp = async () => {
    //ClearLocalStorage();
    const blockedData = await GetFromSync("blockedWebsites");

    if (blockedData && blockedData.blockedWebsites) {
        blockedWebsites = blockedData.blockedWebsites;
    };


    await SetTodayAnalytic();
};

// Updates analytic upon active tab change
chrome.tabs.onActivated.addListener(async () => { await UpdateActiveTab() });

// Updates analytic current tab url change
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    TabUpdateHandler(changeInfo);
});

// DEPRECATED
// // Recieves messages from popup.js for data
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     (async () => {
//         const response = { data: null };

//         if (request && request.from && request.reason) {
//             if (request.from === "popup.js" && request.reason === "startup") {
//                 response.data = await GetFromLocal(currentDate);
//             }
//         }
//         sendResponse(response);
//     })();
//     return true;
// });


StartUp();


