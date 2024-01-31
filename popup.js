
// SECTION: Constants
const currentDate = new Date().toDateString();
const todayAnalytic = 
{
    currentDate: currentDate,
    activeWebsiteDom: null,
    visitedWebsites: null
};
const weekAnalytic = {};
const historyAnalytic = {};
let firstWebsiteVisited = null;

// SECTION: Helper Functions

// Get from local storage of key "localKey"
const GetFromLocal = async (localKey) => {
    const dateAnalyticData = await chrome.storage.local.get(localKey);

    if(!dateAnalyticData) {
        console.warn("Error: Failed to retrive local dateAnalyticData for: ", localKey);
        return null;
    };
    return dateAnalyticData;
};

const SendToBackground = async (fromMessage, requestMessage) => {
    const response = await chrome.runtime.sendMessage({from: fromMessage, reason: requestMessage});

    if (!response) {
        console.warn("Error: Could not send message from popup.js.");
        return;
    };

    console.log(response);
};

// Set constant todayAnalytic to updated data found.
const SetTodayAnalytic = (currentDateData) => {
    if (!currentDateData) return;

    firstWebsiteVisited = currentDateData.visitedWebsites.length > 0 ?
        currentDateData.visitedWebsites[0].domain : null;

    todayAnalytic.activeWebsiteDom = currentDateData.activeWebsiteDom;
    todayAnalytic.visitedWebsites = currentDateData.visitedWebsites;
    console.log("POPUP: ", todayAnalytic)
};

// Convert miliseconds to minutes.
const MSToMinutes = (miliseconds) => {
    return Math.floor(miliseconds / 60000);
}

// Get the active time of website webdom in minutes.
const GetActiveTime = (webDom) => {
    const website = todayAnalytic.visitedWebsites.find((web) => web.domain = webDom);

    if (!website) return null;

    return MSToMinutes(website.activeTime);
};

// Clear all children of an html element.
const ClearAllChildren = (element) => {
    while (element.firstChild) {
        element.removeChild(element.lastChild);
    };
};

// Append a list of children to element.
const AppendChildren = (element, children) => {
    children.forEach((child) => {
        if (child) element.appendChild(child);
    });
}

// SECTION: TO HTML FUNCTIONS

// Update active website information.
const UpdateActiveWebsite = () => {
    const webDomElement = document.getElementById("activeWebDom");
    const activeTimeElement = document.getElementById("activeTime");
    const activeTime = GetActiveTime(todayAnalytic.activeWebsiteDom);

    if (!activeTime && activeTime !== 0) return;

    webDomElement.textContent = todayAnalytic.activeWebsiteDom;
    activeTimeElement.textContent = "Total Active Time: " + activeTime.toString() + "m";
};

// Converts array of websites to HTML div with class class.
const WebsitesToHtml = (websites, className) => {
    return websites.map((website) => {
        const time = GetActiveTime(website);
        if (!time && time !== 0) return null;

        const div = document.createElement("div");
        div.className = className;
        div.textContent = (website.domain instanceof Object ? firstWebsiteVisited : website.domain)
            + " " + time.toString() + "m";

        return div;
    });
};

// Update visited websites of "Today" tab.
const UpdateTodayVisitedWebsites = () => {
    const visitedToday = document.getElementById('visitedToday');
    const updatedVisited = WebsitesToHtml(todayAnalytic.visitedWebsites, "viewed-website");

    ClearAllChildren(visitedToday);
    AppendChildren(visitedToday, updatedVisited);
}

// Updates HTML data with analytics data.
const UpdateHTML = () => {
    UpdateActiveWebsite();
    UpdateTodayVisitedWebsites();
};

// SECTION: Startup Functions

// Starts up and fills popup.html with information.
const StartUp = async () => {
    const currentDateData = await GetFromLocal(currentDate);

    SetTodayAnalytic(currentDateData[currentDate]);
    UpdateHTML();
};

StartUp();

