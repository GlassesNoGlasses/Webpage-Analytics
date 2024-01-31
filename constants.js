
// SECTION: Constant vars

export const webConstants = {
    urlPrefix: "://",
    urlSuffix: "/"
};

// SECTION: Classes

class Session {
    session = { startTime: null, endTime: null };

    constructor(startTime, endTime = null) {
        this.session.startTime = startTime;
        this.session.endTime = endTime;
    };

    SetStartTime(startTime) {
        if (!startTime) {
            this.session.startTime = new Date().getTime();
            return;
        };

        this.session.startTime = startTime;
    };

    SetEndTime(endTime) {
        if (!endTime || endTime >= this.session.startTime) {
            this.session.endTime = endTime;
        };
    };

    GetSessionTime() {
        if (this.session.endTime) {
            return Math.max(0, this.session.endTime - this.session.startTime);
        };
    };

    GetPropsAsObject() {
        return this.session;
    }

    ClearSession() {
        this.session.startTime = null;
        this.session.endTime = null;
    };
}

export class WebsiteAnalytic {
    domain = "";
    startTime;
    currentSession;
    numVisited = 0; // TODO
    activeTime = 0; // stored in ms

    constructor(domain, startTime, currentSession = new Session(startTime), numVisited = 0, activeTime = 0) {
        this.domain = domain;
        this.startTime = startTime;
        this.currentSession = currentSession;
        this.numVisited = numVisited;
        this.activeTime = activeTime;
    };

    SetSessionStartTime(startTime) {
        if (!startTime) return;

        this.startTime = startTime;
    };

    EndSession(endTime) {
        const currEndTime = endTime ? endTime : new Date().getTime()

        this.currentSession.SetEndTime(currEndTime);
    };

    RestartSession(startTime) {
        this.currentSession.ClearSession();
        this.currentSession.SetStartTime(startTime ? startTime : new Date().getTime());
    };

    UpdateActiveTime(endTime = null) {
        this.EndSession(endTime);
        this.activeTime += this.currentSession.GetSessionTime();

        console.log("Updated Active Time For: ", this.domain, " to: ", this.activeTime);
    };

    IncrementVisitedCount() {
        this.numVisited += 1;
    };

    GetPropsAsObject() {
        return {
            domain: this.domain,
            startTime: this.startTime,
            currentSession: this.currentSession.GetPropsAsObject(),
            numVisited: this.numVisited,
            activeTime: this.activeTime
        };
    }
};

export class DateAnalytic {
    currentDate;
    visitedWebsites = [];
    activeWebsiteDom;

    constructor(currentDate, visitedWebsites = [], activeWebsiteDom = null) {
        this.currentDate = currentDate;
        this.visitedWebsites = structuredClone(visitedWebsites);
        this.activeWebsiteDom = activeWebsiteDom;

        if (activeWebsiteDom && this.visitedWebsites.length === 0) {
            this.visitedWebsites.push(activeWebsiteDom);
        }
    };

    GetWebsite(website, webDom = null) {
        if (webDom) {
            return this.visitedWebsites.find((web) => web.domain === webDom);
        } else if (website) {
            return this.visitedWebsites.find((web) => web.domain === website.domain);
        };

        return null;
    };

    SetVisited(visitedWebsites) {
        if (visitedWebsites.length !== 0) {
            this.visitedWebsites = visitedWebsites.map((web) => {
                const session = new Session(web.currentSession.startTime, web.currentSession.endTime);
                return web instanceof WebsiteAnalytic ? web : 
                new WebsiteAnalytic(web.domain, web.startTime, 
                    session, web.endTime, web.numVisited, web.activeTime);
            });
        };
    };

    AddWebsite(website) {
        const webFound = this.GetWebsite(website);

        if (!(website instanceof WebsiteAnalytic)) {
            console.error("Error: added website is not of class: WebsiteAnalytic");
        } else if (!webFound) {
            console.log("pushing");
            this.visitedWebsites.push(website);
        };
    };

    RemoveWebsite(website) {
        this.visitedWebsites = this.visitedWebsites.filter((web) => web.domain !== website.domain);
    };

    GetActiveWebsite() {
        return this.GetWebsite(undefined, this.activeWebsiteDom);
    };

    UpdateActiveWebsiteSession(endTime, website) {
        if (this.activeWebsiteDom) {
            const previousActiveWebsite = this.GetActiveWebsite();
            previousActiveWebsite.UpdateActiveTime(endTime);
        };
    };

    UpdateActiveWebsite(website, time) {
        if (!website || !(website instanceof WebsiteAnalytic)) return;

        // if an active website not set, AddWebsite() called only.
        // else: update session/active time of previous activeDom, add new activeDom, set it.
        this.AddWebsite(website);

        if (website.domain.localeCompare(this.activeWebsiteDom) !== 0) {
            this.GetWebsite(website).IncrementVisitedCount();
        }

        this.UpdateActiveWebsiteSession(time, website);
        this.activeWebsiteDom = website.domain;

        const currentActiveWebsite = this.GetActiveWebsite();
        currentActiveWebsite.RestartSession(time);
    };

    SerializeToObject() {
        return {
            currentDate: this.currentDate,
            activeWebsiteDom: this.activeWebsiteDom,
            visitedWebsites: this.visitedWebsites
            .filter((website) => website !== null)
            .map((website) => {return website.GetPropsAsObject()}),
        };
    };
};


// SECTION: Functions

// Checks if targetDate is later than currDate
const IsLaterDate = (currDate, targetDate) => {
    const utc1 = Date.UTC(currDate.getYear(), currDate.getMonth(), currDate.getDate(), currDate.getHours(), currDate.getMinutes());
    const utc2 = Date.UTC(targetDate.getYear(), targetDate.getMonth(), targetDate.getDate(), targetDate.getHours(), targetDate.getMinutes());

    return Math.abs(targetDate) - Math.abs(currDate) > 0;
};

// Set to local storage {localKey : val}
export const SetToLocal = async (localKey, val) => {
    const obj = {};
    obj[localKey] = val;
    console.log("trying to set to local storage obj: ", obj);

    await chrome.storage.local.set(obj);
};

// Get from local storage of key "localKey"
export const GetFromLocal = async (localKey) => {
    const dateAnalyticData = await chrome.storage.local.get(localKey);

    if(!dateAnalyticData) {
        console.warn("Error: Failed to retrive local dateAnalyticData for: ", localKey);
        return null;
    };
    return dateAnalyticData;
};

export const ClearLocalStorage = (callback = null) => {
    if (chrome.runtime.lastError) {
        console.error("Error: clearing local storage: " + chrome.runtime.lastError)
    } else {
        chrome.storage.local.clear(callback ? callback : () => {
            console.warn("Local Storage cleared successfully")
        });
    };
};


