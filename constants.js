
// SECTION: Constant vars

export const webConstants = {
    urlPrefix : "://",
    urlSuffix : "/"
};

// SECTION: Classes

class Session {
    session = {startTime: null, endTime: null};

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
        if (endTime && endTime >= this.session.startTime) {
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

    constructor(domain, startTime) {
        this.domain = domain;
        this.startTime = startTime;
        this.currentSession = new Session(startTime);
    };

    SetSessionStartTime(startTime) {
        if (!startTime) return;

        this.startTime = startTime;
    };

    EndSession(endTime) {
        if (!endTime) {
            this.currentSession.SetEndTime(new Date().getTime());
            return;
        };

        this.currentSession.SetEndTime(endTime);
    };

    RestartSession(startTime) {
        this.currentSession.ClearSession();
        this.currentSession.SetStartTime(startTime);
    };
    
    UpdateActiveTime(endTime = null) {
        const currEndTime = endTime ? endTime : new Date().getTime();

        this.currentSession.SetEndTime(currEndTime);

        this.activeTime += this.currentSession.GetSessionTime();
        console.log("Updated Active Time For: ", this.domain, " to: ", this.activeTime);

        this.RestartSession(currEndTime);
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
            this.visitedWebsites = structuredClone(visitedWebsites);
        };
    }

    AddWebsite(website) {
        const webFound = this.GetWebsite(website);
        if (!webFound) {
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

    UpdateActiveWebsiteSession(endTime) {
        if (this.activeWebsiteDom) {
            this.GetActiveWebsite().UpdateActiveTime(endTime);
        };
    };

    UpdateActiveWebsite(webDom, time) {
        if (!webDom) return;

        // if an active website not set, AddWebsite() called only.
        // else: update session/active time of previous activeDom, add new activeDom, set it.
        this.UpdateActiveWebsiteSession(time);
        this.AddWebsite(new WebsiteAnalytic(webDom, time));
        this.activeWebsiteDom = webDom;
    };
};


// SECTION: Functions

// Checks if targetDate is later than currDate
const IsLaterDate = (currDate, targetDate) => {
    const utc1 = Date.UTC(currDate.getYear(), currDate.getMonth(), currDate.getDate(), currDate.getHours(), currDate.getMinutes());
    const utc2 = Date.UTC(targetDate.getYear(), targetDate.getMonth(), targetDate.getDate(), targetDate.getHours(), targetDate.getMinutes());

    return Math.abs(targetDate) - Math.abs(currDate) > 0;
};

