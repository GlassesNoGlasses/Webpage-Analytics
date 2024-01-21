
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

        this.currentSession.SetEndTime(endTime);
    };

    RestartSession(startTime) {
        this.currentSession.ClearSession();
        this.currentSession.SetStartTime(startTime ? startTime : new Date().getTime());
    };

    UpdateActiveTime(endTime = null, isStillActive = false) {
        this.EndSession(endTime);
        this.activeTime += this.currentSession.GetSessionTime();

        console.log("Updated Active Time For: ", this.domain, " to: ", this.activeTime);
    };

    IncrementVisitedCount() {
        this.numVisited += 1;
    };
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
            this.visitedWebsites = structuredClone(visitedWebsites.map((web) => {
                return web instanceof WebsiteAnalytic ? web : 
                new WebsiteAnalytic(web.domain, web.startTime, web.currentSession, web.endTime, web.numVisited, web.activeTime);
            }));
        };
    };

    AddWebsite(website) {
        const webFound = this.GetWebsite(website);

        if (!(website instanceof WebsiteAnalytic)) {
            console.error("Error: added website is not of class: WebsiteAnalytic");
        } else if (!webFound) {
            this.visitedWebsites.push(website);
        };
    };

    RemoveWebsite(website) {
        this.visitedWebsites = this.visitedWebsites.filter((web) => web.domain !== website.domain);
    };

    // UpdateWebsiteEndtime(website, endtime) {
    //     const webIndex = this.GetWebsite(website);

    //     if (webIndex && webIndex !== -1) {
    //         this.visitedWebsites[webIndex].UpdateScreenTime(endtime);
    //     };
    // };

    GetActiveWebsite() {
        return this.GetWebsite(undefined, this.activeWebsiteDom);
    };

    UpdateActiveWebsiteSession(endTime, webDom) {
        if (this.activeWebsiteDom) {
            const previousActiveWebsite = this.GetActiveWebsite();

            console.log("PREV ACTIVE WEB: ", previousActiveWebsite);
            previousActiveWebsite.UpdateActiveTime(endTime, this.activeWebsiteDom.localeCompare(webDom) === 0);
        };
    };

    UpdateActiveWebsite(webDom, time) {
        if (!webDom) return;


        // if an active website not set, AddWebsite() called only.
        // else: update session/active time of previous activeDom, add new activeDom, set it.
        this.UpdateActiveWebsiteSession(time, webDom);
        this.AddWebsite(new WebsiteAnalytic(webDom, time));

        this.activeWebsiteDom = webDom;

        const currentActiveWebsite = this.GetActiveWebsite();
        currentActiveWebsite.IncrementVisitedCount();
        currentActiveWebsite.RestartSession(time);
    };
};


// SECTION: Functions

// Checks if targetDate is later than currDate
const IsLaterDate = (currDate, targetDate) => {
    const utc1 = Date.UTC(currDate.getYear(), currDate.getMonth(), currDate.getDate(), currDate.getHours(), currDate.getMinutes());
    const utc2 = Date.UTC(targetDate.getYear(), targetDate.getMonth(), targetDate.getDate(), targetDate.getHours(), targetDate.getMinutes());

    return Math.abs(targetDate) - Math.abs(currDate) > 0;
};

