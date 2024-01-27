
// SECTION: Constants
const currentDate = new Date().toDateString();
const todayAnalytic = 
{
    currentDate: currentDate,
    activeWebsiteDom: null,
    visitedWebsites: []
};
const weekAnalytic = {};
const historyAnalytic = {};

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

// Set constant todayAnalytic to updated data found.
const SetTodayAnalytic = async (currentDateData) => {
    if (!currentDateData || Object.keys(currentDateData).length === 0) {
        return;
    }

    todayAnalytic = {...currentDateData};
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
    children.foreach((child) => {
        if (child) element.appendChild(child);
    });
}


// SECTION: TO HTML FUNCTIONS

// Update active website information.
const UpdateActiveWebsite = () => {
    const webDomElement = document.getElementById("activeWebDom");
    const activeTimeElement = document.getElementById("activeTime");
    const activeTime = GetActiveTime(todayAnalytic.activeWebsiteDom);

    if (!activeTime) return;

    webDomElement.textContent = todayAnalytic.activeWebsiteDom;
    activeTimeElement.textContent = "Total Active Time: " + activeTime.toString() + "m";
};

// Converts array of websites to HTML div with class class.
const WebsitesToHtml = (websites, className) => {
    return websites.map((website) => {
        const time = GetActiveTime(website);
        if (!time) return null;

        const div = document.createElement("div");
        div.className = className;
        div.textContent = website.domain + " " + time.toString() + "m";

        return div;
    });
};

// Update visited websites of "Today" tab.
const UpdateTodayVisitedWebsites = () => {
    const visitedToday = document.getElementById('visitedToday');
    const updatedVisited = WebsitesToHtml(todayAnalytic.visitedWebsites);

    ClearAllChildren(visitedToday);
    AppendChildren(visitedToday, updatedVisited);
}

// Updates HTML data with analytics data.
const UpdateHTML = () => {
    UpdateTodayVisitedWebsites();
};

// Starts up and fills popup.html with information.
const StartUp = async () => {
    const currentDateData = await GetFromLocal(currentDate);

    await SetTodayAnalytic(currentDateData);
};


// Run when chrome is opened.
chrome.runtime.onStartup.addListener(function() {
    StartUp();
});

// Main: Run when local storage changes.
chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log("POPUP LOCAL STORAGE CHANGES");

    switch (namespace) {
        case "local":
            () => SetTodayAnalytic(changes);
            break;
        
        case "sync":
            break;
    
        default:
            break;
    }
});
