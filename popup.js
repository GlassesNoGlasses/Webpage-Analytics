
// SECTION: Constants
const webConstants = {
    urlPrefix: "://",
    urlSuffix: "/"
};

const viewIds = {
    today: "display-today",
    settings: "display-settings",
    weekly: "display-weekly",
    history: "display-history"
};

const currentDate = new Date().toDateString();
const todayAnalytic = 
{
    currentDate: currentDate,
    activeWebsiteDom: null,
    visitedWebsites: []
};
const weekAnalytic = {};
const historyAnalytic = {};
const removedBlockedWebsites = [];
let blockedWebsites = [];
let firstWebsiteVisited = null;

// SECTION: Helper Functions

// Get dom name
const GetDomName = (url) => {
    try {
        if (url.indexOf(webConstants.urlPrefix) < 0) {
            return url;
        }

        const rawDomain = url.slice(url.indexOf(webConstants.urlPrefix) + webConstants.urlPrefix.length);
        return rawDomain.indexOf(webConstants.urlSuffix) !== -1 ?
        rawDomain.slice(0, rawDomain.indexOf(webConstants.urlSuffix)) : rawDomain;
    } catch (error) {
        console.warn("Error: Could not find domain of : ", url);
        return null;
    };
};

// Compare active times of website
const CompareActiveTimes = (web1, web2) => {
    if (web2.activeTime < web1.activeTime) {
        return -1;
    } else if (web2.activeTime > web1.activeTime) {
        return 1;
    };
    return 0;
}

// Get from local storage of key "localKey"
const GetFromLocal = async (localKey) => {
    const dateAnalyticData = await chrome.storage.local.get(localKey);

    if(!dateAnalyticData) {
        console.warn("Error: Failed to retrive local dateAnalyticData for: ", localKey);
        return null;
    };

    return dateAnalyticData;
};

// Set object {key: val} to storage.sync.
const SetToSync = async (key, val) => {
    const obj = {};
    obj[key] = val;

    await chrome.storage.sync.set(obj);
};

// Get from sync storage with key "key".
const GetFromSync = async (key) => {
    const data = await chrome.storage.sync.get(key);

    if(!data) {
        console.warn("Error: Failed to retrive local dateAnalyticData for: ", key);
        return null;
    };

    return data;
};

// Set constant todayAnalytic to updated data found.
const SetTodayAnalytic = (currentDateData) => {
    if (!currentDateData) return;

    todayAnalytic.activeWebsiteDom = currentDateData.activeWebsiteDom;
    todayAnalytic.visitedWebsites = currentDateData.visitedWebsites.sort(CompareActiveTimes);

    firstWebsiteVisited = todayAnalytic.visitedWebsites.length > 0 ?
        todayAnalytic.visitedWebsites[0].domain : null;

    console.log("POPUP: ", todayAnalytic)
};

// Convert miliseconds to minutes.
const MSToMinutes = (miliseconds) => {
    return Math.floor(miliseconds / 60000);
}

// Get the active time of website webdom in minutes.
const GetActiveTime = (webDom) => {
    const website = todayAnalytic.visitedWebsites.find((web) => web.domain === webDom);

    if (!website) return null;

    return MSToMinutes(website.activeTime);
};

// Clear all children of an html element.
const ClearAllChildren = (element) => {
    while (element.firstChild) {
        element.removeChild(element.lastChild);
    };
};


// Create div element with className, id, and textContent
const CreateDefaultHTMLElement = (type, className = null, id = null, textContent = null) => {
    if (!type) return null;

    try {
        const elem = document.createElement(type);

        if (className) {
            elem.className = className;
        };

        if (id) {
            elem.id = id;
        };
    
        if (textContent) {
            elem.textContent = textContent;
        };

        return elem;
    } catch (error) {
        console.error(`Error creating element of type: ${type} `, error);
    }
};

// Append a list of children to element.
const AppendChildren = (element, children) => {
    children.forEach((child) => {
        if (child) element.appendChild(child);
    });
};

// SECTION: TO HTML FUNCTIONS

// Update active website information.
const UpdateActiveWebsite = () => {
    const webDomElement = document.getElementById("activeWebDom");
    const activeTimeElement = document.getElementById("activeTime");

    if (blockedWebsites.find((dom) => dom === todayAnalytic.activeWebsiteDom)) {
        webDomElement.textContent = "Current Website is blocked: " + todayAnalytic.activeWebsiteDom;
        return;
    }

    const activeTime = GetActiveTime(todayAnalytic.activeWebsiteDom);

    if (!activeTime && activeTime !== 0) return;

    webDomElement.textContent = todayAnalytic.activeWebsiteDom;
    activeTimeElement.textContent = "Total Active Time: " + activeTime.toString() + "m";
};

// Converts array of websites to HTML div with class class.
const WebsitesToHtml = (websites, className) => {
    return websites.map((website) => {
        const time = GetActiveTime(website.domain);

        if (!time && time !== 0) return null;

        const textContent = (website.domain instanceof Object ? firstWebsiteVisited : website.domain)
            + " " + time.toString() + "m";

        return CreateDefaultHTMLElement("div", className, null, textContent);
    });
};

// Updates the display to div with id id.
const UpdateCurrentDisplay = (id) => {
    try {
        const toDisplay = document.getElementById(id);
        const allDisplays = Array.from(document.getElementsByClassName("current-display"));

        allDisplays.forEach((div) => {
            div.id !== toDisplay.id ? div.style.display = "none" : div.style.display = "block";
        });

    } catch (error) {
        console.error("Error in updating displays: ", error);
    }
}


// SUBSECTION: TODAY ANAYLTIC DISPLAY

// Update visited websites of "Today" tab.
const UpdateTodayVisitedWebsites = () => {
    const visitedToday = document.getElementById('visitedToday');
    const unblockedWebsites = todayAnalytic.visitedWebsites.filter((website) => 
        !blockedWebsites.includes(website.domain)
    );
    const updatedVisited = WebsitesToHtml(unblockedWebsites, "viewed-website");

    if (updatedVisited.length !== 0) {
        ClearAllChildren(visitedToday);
    };

    AppendChildren(visitedToday, updatedVisited);
};

// Populates HTML data with today's analytics data.
const PopulateTodayHTML = () => {
    UpdateActiveWebsite();
    UpdateTodayVisitedWebsites();
    UpdateCurrentDisplay(viewIds.today);
};

// SUBSECTION: SETTINGS DISPLAY

// Handler for adding new blocked dom to storage.
const HandleAddBlockedDom = async() => {
    const input = document.getElementById("blocked-input");

    try {
        const verificationMessage = document.getElementById("add-verify");
        const blockedDom = GetDomName(input.value).trim();

        if (!blockedDom || blockedDom.length < 4) {
            verificationMessage.textContent = `* Could not get dom of blocked url added: ${blockedDom}`;
            verificationMessage.style.color = "red";
        } else {
            if (!blockedWebsites.find((dom) => dom === blockedDom)) {
                blockedWebsites.push(blockedDom);
            };

            await SetToSync("blockedWebsites", blockedWebsites);
            verificationMessage.textContent = `Sucessfully added ${blockedDom}.`
        };

        verificationMessage.style.display = "flex";
    } catch (error) {
        console.error(error);
    }
};

// Update popup.html to reflect unblocked doms.
const HandleRemovedBlockedDoms = async () => {
    blockedWebsites = blockedWebsites.filter((dom) => !removedBlockedWebsites.includes(dom));
    removedBlockedWebsites.splice(0, removedBlockedWebsites.length);

    await SetToSync("blockedWebsites", blockedWebsites)

    UpdateBlockedWebsitesDisplay();
}

// Update display to show blocked websites.
const UpdateBlockedWebsitesDisplay = () => {
    const buttonColor = "rgb(" + 0 + ", " + 153 + ", " + 255 + ")";
    const blockedDisplay = document.getElementById("blocked-doms-dropdown");
    const blockedDomElems = blockedWebsites.map((dom) => {
        const domain = CreateDefaultHTMLElement("button", "blocked-dom-button", null, dom);

        domain.addEventListener("click", () => {
            removedBlockedWebsites.includes(dom) ? removedBlockedWebsites.splice(removedBlockedWebsites.indexOf(dom), 1)
                : removedBlockedWebsites.push(dom);

            domain.style.backgroundColor = domain.style.backgroundColor === buttonColor 
                ? "white" : buttonColor;
        });

        return domain;
    });

    ClearAllChildren(blockedDisplay);
    AppendChildren(blockedDisplay, blockedDomElems);
};

// Populate the settings html.
const PopulateSettingHTML = () => {
    UpdateActiveWebsite();
    UpdateBlockedWebsitesDisplay();
    UpdateCurrentDisplay(viewIds.settings);
};

// SECTION: Startup Functions

// Starts up and fills popup.html with information.
const StartUp = async () => {
    const blocked = await GetFromSync("blockedWebsites");
    const currentDateData = await GetFromLocal(currentDate);

    if (blocked && blocked.blockedWebsites) {
        blockedWebsites = blocked.blockedWebsites.sort((a, b) => a.localeCompare(b));
    };

    if (currentDateData && currentDateData[currentDate]) {
        SetTodayAnalytic(currentDateData[currentDate]);
        PopulateTodayHTML();
    };
};

StartUp();


// Button click listeners.
document.getElementById("Today").addEventListener("click", () => PopulateTodayHTML());
document.getElementById("Week").addEventListener("click", PopulateTodayHTML());
document.getElementById("History").addEventListener("click", PopulateTodayHTML());
document.getElementById("Settings").addEventListener("click", () => PopulateSettingHTML());
document.getElementById("addBlocked").addEventListener("click", () => HandleAddBlockedDom());
document.getElementById("remove-blocked-doms").addEventListener("click", () => HandleRemovedBlockedDoms());

