
// SECTION: Constant vars

export const webConstants = {
    urlPrefix : "://",
    urlSuffix : "/"
};

// SECTION: Classes
export class WebsiteAnalytic {
    domain = "";
    startTime;
    endTime = null;
    activeTime = 0; // stored in ms

    constructor(domain, startTime) {
        this.domain = domain;
        this.startTime = startTime;
    };

    SetStartTime(startTime) {
        if (!startTime) return;

        this.startTime = startTime;
    };

    SetEndTime(endTime) {
        if (!endTime) return;
        
        this.endTime = endTime;
    };

    UpdateActiveTime(endTime = null) {
        if (endTime) {
            this.activeTime += endTime - this.startTime;

            this.SetStartTime(endTime);
            this.SetEndTime(endTime);
        } else if (this.endTime) {
            this.activeTime += this.endTime - this.startTime;
        }
    }
};

export class DateAnalytic {
    visitedWebsites = [];
    activeWebsiteDom;

    constructor(visitedWebsites = [], activeWebsiteDom = null) {
        this.visitedWebsites = structuredClone(visitedWebsites);
        this.activeWebsiteDom = activeWebsiteDom;

        if (activeWebsiteDom && this.visitedWebsites.length === 0) {
            this.visitedWebsites.push(activeWebsiteDom);
        }
    };

    GetWebsite(website, webDom) {
        if (website || webDom) {
            return this.visitedWebsites.find((web) => web.domain === website.domain || web.domain === webDom);
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
        return this.GetWebsite(undefined, this,this.activeWebsiteDom);
    }

    UpdateActiveWebsite(webUrl, time) {
        if (!webUrl) return;

        if (this.activeWebsiteDom) {
            const oldActiveWebsite = this.GetWebsite(this.activeWebsiteDom);
            oldActiveWebsite.UpdateActiveTime(time);
        }

        this.activeWebsiteDom = webUrl;
    };
};


// SECTION: Functions

// Checks if targetDate is later than currDate
const IsLaterDate = (currDate, targetDate) => {
    const utc1 = Date.UTC(currDate.getYear(), currDate.getMonth(), currDate.getDate(), currDate.getHours(), currDate.getMinutes());
    const utc2 = Date.UTC(targetDate.getYear(), targetDate.getMonth(), targetDate.getDate(), targetDate.getHours(), targetDate.getMinutes());

    return Math.abs(targetDate) - Math.abs(currDate) > 0;
};

