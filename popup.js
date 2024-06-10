
// SECTION: Classes
class LimitedDom {
    constructor(domain, hours) {
        this.domain = domain;
        this.hours = hours;
    }
}

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
const weekAnalytic = {

    // websites : {totalActiveTime: n, totalTimesVisited: m, Saturday: {activeTime: x, numVisited: y}}
};
const historyAnalytic = {
    // 
};
const removedBlockedWebsites = [];
const removedLimitedWebsites = [];
let blockedWebsites = [];
let limitedWebsites = [];
let firstWebsiteVisited = null;
const buttonColor = "rgb(" + 0 + ", " + 153 + ", " + 255 + ")";

// SECTION: Helper Functions

// Get dom name from url.
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

// Compare website domain names in alphabetical order.
const CompareDomNames = (web1, web2) => {
    return web1.domain.localeCompare(web2.domain);
}

// Compare active times of websites in descending order.
const CompareActiveTimes = (web1, web2) => {
    if (web2.activeTime < web1.activeTime) {
        return -1;
    } else if (web2.activeTime > web1.activeTime) {
        return 1;
    };
    return 0;
};

// Compare num visited of websites in descending order.
const CompareNumVisited = (web1, web2) => {
    if (web2.numVisited < web1.numVisited) {
        return -1;
    } else if (web2.numVisited > web1.numVisited) {
        return 1;
    };
    return 0;
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
};

// Convert miliseconds to minutes.
const MSToMinutes = (miliseconds) => {
    return Math.floor(miliseconds / 60000);
}

// Get the active time of website webdom in minutes.
const GetActiveTime = (webDom, web = null) => {
    const website = todayAnalytic.visitedWebsites.find((web) => web.domain === webDom);

    if (!website && !web) return null;

    return !web ? MSToMinutes(website.activeTime) : MSToMinutes(web.activeTime);
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

// Fetch all analytics for the week
const GetDaysOfWeek = () => {
    const weekInfo = [];
    const date = new Date();
    let startIndex = date.getUTCDay() === 0 ? 6 : date.getUTCDay();

    while (startIndex >= 0) {
        const prevDate = new Date();

        prevDate.setDate(date.getDate() - startIndex);
        weekInfo.push(prevDate.toDateString());
        startIndex--;
    };
    
    return weekInfo;
};

// Update websites sorting options with id "htmlID".
const PostOptionSorting = (htmlID, sortCallback, filteredWebsites) => {
    const sortingDiv = document.getElementById(htmlID);
    const rawSortedWebsites = [...filteredWebsites].sort(sortCallback);
    const sortedWebsites = WebsitesToHtml(rawSortedWebsites);
    
    if (sortedWebsites.length) {
        ClearAllChildren(sortingDiv);
        AppendChildren(sortingDiv, sortedWebsites);
    };
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

const WebsiteHTMLInfo = (domain, activeTime, numVisited) => {
    const timeDisplay = `Active Time: ${activeTime}m`;
    const visitedDisplay = `Times Visited: ${numVisited}`;
    const viewedWebsite = CreateDefaultHTMLElement("button", "viewed-website", null);
    const viewedWebsiteDropdown = CreateDefaultHTMLElement("div", "viewed-website-dropdown-off");

    viewedWebsiteDropdown.appendChild(CreateDefaultHTMLElement("span", "website-information", null, timeDisplay));
    viewedWebsiteDropdown.appendChild(CreateDefaultHTMLElement("span", "website-information", null, visitedDisplay));
    viewedWebsite.appendChild(CreateDefaultHTMLElement("span", null, null, domain));
    viewedWebsite.appendChild(viewedWebsiteDropdown);
    
    viewedWebsite.addEventListener("click", () => {
        viewedWebsite.lastChild.className = viewedWebsite.lastChild.className === "viewed-website-dropdown-off" 
            ? "viewed-website-dropdown-on" : "viewed-website-dropdown-off";
    });

    return viewedWebsite;
}

// Converts array of websites to HTML.
const WebsitesToHtml = (websites) => {
    return websites.map((website) => {
        const time = GetActiveTime(website.domain, website);

        if (!time && time !== 0) return null;

        const domain = (website.domain instanceof Object ? firstWebsiteVisited : website.domain);

        return WebsiteHTMLInfo(domain, time, website.numVisited);
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
    const updatedVisited = WebsitesToHtml(unblockedWebsites);

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

// SUBSECTION: WEEK DISPLAY

// Sets targetAnalytic with date "date" information from respective dateAnalytic.
const SetAllDateAnalytic = (dateAnalytic, date, targetAnalytic) => {
    if (!dateAnalytic || !date || !(date in dateAnalytic)) return;

    dateAnalytic[date].visitedWebsites.forEach((website) => {
        if (!blockedWebsites.includes(website.domain)) {
            if (website.domain in targetAnalytic) {
                targetAnalytic[website.domain][date] = 
                    {activeTime: website.activeTime, numVisited: website.numVisited};
                targetAnalytic[website.domain].totalActiveTime += website.activeTime;
                targetAnalytic[website.domain].totalNumVisited += website.numVisited;
            } else {
                const websiteInfo = {};
                websiteInfo["totalActiveTime"] = website.activeTime;
                websiteInfo["totalNumVisited"] = website.numVisited;
                websiteInfo[date] = {activeTime: website.activeTime, numVisited: website.numVisited};
    
                targetAnalytic[website.domain] = websiteInfo;
            };
        };
    });
};

// Updates weekly analytics information.
const UpdateWeeklyAnalytics = async (DaysOfWeek) => {
    if (!DaysOfWeek) return;

    for (const date of DaysOfWeek) {
        const dateAnalytic = await GetFromLocal(date);
        SetAllDateAnalytic(dateAnalytic, date, weekAnalytic);
    };
};

// Updates weekly analytics html.
const UpdateWeekHTML = () => {
    const weekArray = Array.from(Object.keys(weekAnalytic).map((dom) => {
        return {
            domain: dom,
            activeTime: weekAnalytic[dom].totalActiveTime,
            numVisited: weekAnalytic[dom].totalNumVisited
        };
    }));

    const filteredWeekArray = weekArray.filter((website) =>
        !blockedWebsites.includes(website.domain)
    );

    PostOptionSorting('alphabetical-weekly', CompareDomNames, filteredWeekArray);
    PostOptionSorting('mostActive-weekly', CompareActiveTimes, filteredWeekArray);
    PostOptionSorting('mostVisited-weekly', CompareNumVisited, filteredWeekArray);
};

// Handle filter changes for weekly analytic doms.
const HandleWeekFilterChange = (option) => {
    try {
        const optionValue = option.target.value;
        const alphabeticalContainer = document.getElementById("alphabetical-weekly");
        const activeContainer = document.getElementById("mostActive-weekly");
        const visitedContainer = document.getElementById("mostVisited-weekly");

        switch (optionValue) {
            case "alphabetically":
                alphabeticalContainer.style.display = "block";
                activeContainer.style.display = "none";
                visitedContainer.style.display = "none";
                break;
            case "active-time":
                alphabeticalContainer.style.display = "none";
                activeContainer.style.display = "block";
                visitedContainer.style.display = "none";
                break;
            case "num-visited":
                alphabeticalContainer.style.display = "none";
                activeContainer.style.display = "none";
                visitedContainer.style.display = "block";
                break;
            default:
                break;
        };
        
    } catch (error) {
        console.warn("Error Switching Weekly Filters: ", error);
    };
}

// Populate week html.
const PopulateWeekHTML = async () => {
    UpdateActiveWebsite();
    
    const DaysOfWeek = GetDaysOfWeek();
    await UpdateWeeklyAnalytics(DaysOfWeek);
    UpdateWeekHTML();
    UpdateCurrentDisplay(viewIds.weekly);
};

// SUBSECTION: Historical Analysis.

const HandleHistoryFilterChange = (option) => {
    try {
        const optionValue = option.target.value;
        const alphabeticalContainer = document.getElementById("alphabetical-history");
        const activeContainer = document.getElementById("mostActive-history");
        const visitedContainer = document.getElementById("mostVisited-history");

        switch (optionValue) {
            case "alphabetically":
                alphabeticalContainer.style.display = "block";
                activeContainer.style.display = "none";
                visitedContainer.style.display = "none";
                break;
            case "active-time":
                alphabeticalContainer.style.display = "none";
                activeContainer.style.display = "block";
                visitedContainer.style.display = "none";
                break;
            case "num-visited":
                alphabeticalContainer.style.display = "none";
                activeContainer.style.display = "none";
                visitedContainer.style.display = "block";
                break;
            default:
                break;
        };
        
    } catch (error) {
        console.warn("Error Switching Weekly Filters: ", error);
    };
};

// Updates const historyAnalytics with user history.
const UpdateHistoryAnalytics = async () => {
    // Get all date analytics from storage.
    const allFetchedAnalytics = await GetFromLocal(null);
    Object.keys(allFetchedAnalytics).forEach((date) => {
        SetAllDateAnalytic(allFetchedAnalytics, date, historyAnalytic);
    });
};

// Updates history HTML.
const UpdateHistoryHTML = () => {
    const historyArray = Array.from(Object.keys(historyAnalytic).map((dom) => {
        return {
            domain: dom,
            activeTime: historyAnalytic[dom].totalActiveTime,
            numVisited: historyAnalytic[dom].totalNumVisited
        };
    }));

    const filteredHistoryArray = historyArray.filter((website) =>
        !blockedWebsites.includes(website.domain)
    );

    PostOptionSorting('alphabetical-history', CompareDomNames, filteredHistoryArray);
    PostOptionSorting('mostActive-history', CompareActiveTimes, filteredHistoryArray);
    PostOptionSorting('mostVisited-history', CompareNumVisited, filteredHistoryArray);
};

// Populates history html.
const PopulateHistoryHTML = async() => {
    UpdateActiveWebsite();

    await UpdateHistoryAnalytics();
    UpdateHistoryHTML();
    UpdateCurrentDisplay(viewIds.history);
};

// SUBSECTION: SETTINGS DISPLAY

// -----------------------Blocked Websites-----------------------

// Handler for adding new blocked dom to storage.
const HandleAddBlockedDom = async() => {
    const input = document.getElementById("blocked-input");

    try {
        const verificationMessage = document.getElementById("blocked-verify");
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


// -----------------------Limited Websites-----------------------

// Handler for adding new blocked dom to storage.
const HandleAddLimitedDoms = async() => {
    const input = document.getElementById("limited-input");

    try {
        const verificationMessage = document.getElementById("limited-verify");
        const limitedDom = GetDomName(input.value).trim();

        if (!limitedDom || limitedDom.length < 4) {
            verificationMessage.textContent = `* Could not get dom of limited url added: ${limitedDom}`;
            verificationMessage.style.color = "red";
        } else {
            if (!limitedWebsites.find((dom) => dom === limitedDom)) {
                limitedWebsites.push(limitedDom);
            };

            await SetToSync("limitedWebsites", limitedWebsites);
            verificationMessage.textContent = `Sucessfully added ${limitedDom}.`
        };

        verificationMessage.style.display = "flex";
    } catch (error) {
        console.error(error);
    }
};

// Update popup.html to reflect delimited doms.
const HandleRemovedLimitedDoms = async () => {
    limitedWebsites = limitedWebsites.filter((dom) => !removedLimitedWebsites.includes(dom));
    removedLimitedWebsites.splice(0, removedLimitedWebsites.length);

    await SetToSync("limitedWebsites", limitedWebsites)

    UpdateLimitedTimeDisplay();
}

// Update limited website time display.
const UpdateLimitedTimeDisplay = () => {
    const limitedDisplays = document.getElementById("limited-doms-dropdown");
    const limitedDomElems = blockedWebsites.map((dom) => {
        const domain = CreateDefaultHTMLElement("button", "blocked-dom-button", null, dom);

        domain.addEventListener("click", () => {
            removedLimitedWebsites.includes(dom) ? removedLimitedWebsites.splice(removedLimitedWebsites.indexOf(dom), 1)
                : removedLimitedWebsites.push(dom);

            domain.style.backgroundColor = domain.style.backgroundColor === buttonColor 
                ? "white" : buttonColor;
        });

        return domain;
    });

    ClearAllChildren(limitedDisplays);
    AppendChildren(limitedDisplays, limitedDomElems);
};

// Populate the settings html.
const PopulateSettingHTML = () => {
    UpdateActiveWebsite();
    UpdateBlockedWebsitesDisplay();
    UpdateLimitedTimeDisplay();
    UpdateCurrentDisplay(viewIds.settings);
};


// SECTION: Startup Functions
// Starts up and fills popup.html with information.
const StartUp = async () => {
    const blocked = await GetFromSync("blockedWebsites");
    const limited = await GetFromSync("limitedWebsites");
    const currentDateData = await GetFromLocal(currentDate);

    if (blocked && blocked.blockedWebsites) {
        blockedWebsites = blocked.blockedWebsites.sort((a, b) => a.localeCompare(b));
    };

    if (limited && limited.limitedWebsites) {
        limitedWebsites = limited.limitedWebsites.sort((a, b) => a.domain.localeCompare(b.domain));
    };

    if (currentDateData && currentDateData[currentDate]) {
        SetTodayAnalytic(currentDateData[currentDate]);
        PopulateTodayHTML();
    };
};

StartUp();


// HTML listeners.
document.getElementById("Today").addEventListener("click", () => PopulateTodayHTML());
document.getElementById("Week").addEventListener("click", () => PopulateWeekHTML());
document.getElementById("History").addEventListener("click", () => PopulateHistoryHTML());
document.getElementById("Settings").addEventListener("click", () => PopulateSettingHTML());
document.getElementById("add-blocked-button").addEventListener("click", () => HandleAddBlockedDom());
document.getElementById("remove-blocked-doms").addEventListener("click", () => HandleRemovedBlockedDoms());
document.getElementById("add-limited-button").addEventListener("click", () => HandleAddLimitedDoms());
document.getElementById("remove-limited-doms").addEventListener("click", () => HandleRemovedLimitedDoms());
document.getElementById("weekly-filter-options").onchange = (event) => HandleWeekFilterChange(event);
document.getElementById("history-filter-options").onchange = (event) => HandleHistoryFilterChange(event);

