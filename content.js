
// constants
const webConstants = {
    urlPrefix: "://",
    urlSuffix: "/"
};

// Classes
class WebsiteAnalytic {
    domain = "";
    startTime;
    endTime = null;

    constructor(domain, startTime) {
        this.domain = domain;
        this.startTime = startTime;
    }

    UpdateScreenTime(endTime, startTime = null) {
        if (startTime) {
            this.startTime = startTime;
        };

        if (!this.endTime || IsLaterDate(this.endTime, endTime)) {
            this.endTime = endTime;
        };
    };
};

class DateAnalytic {
    visitedWebsites = [];

    constructor(visitedWebsites = []) {
        this.visitedWebsites = visitedWebsites;
    };

    AddWebsite(website) {
        if (!this.visitedWebsites.find((web) => web.domain === website.domain)) {
            this.visitedWebsites.push(website);
        };
    };

    RemoveWebsite(website) {
        this.visitedWebsites = this.visitedWebsites.filter((web) => web.domain !== website.domain);
    };
};


// Tab functions

// Get url
const GetUrl = () => {
    try {
        return window.location.href;
    } catch (error) {
        console.warn("Error: Could not get current URL: ", error);
        return null;
    }
};

// Get dom name
const GetDomName = (url) => {
    try {
        const rawDomain = url.slice(url.indexOf(webConstants.urlPrefix) + webConstants.urlPrefix.length);
        return rawDomain.indexOf(webConstants.urlSuffix) !== -1 ? rawDomain.slice(0, rawDomain.indexOf(webConstants.urlSuffix)) : rawDomain; 
    } catch (error) {
        console.warn("Error: Could not find domain of : ", url);
        return null;
    }
}

const Debugger = (actual, expected)  => {
    console.log("==============DEBUGGING==================");
    console.warn("Actual Value: " + actual);
    console.log("Expected Value: " + expected);
    console.log("==============END-DEBUGGING==============");
};


// Storage Functions

const SetToLocal = (localKey, val) => {
    const obj = {};
    obj[localKey] = val;

    chrome.storage.local.set(obj).then((succ, rej) => {
        if (rej) {
            console.warn("Error: Could not save key ", localKey, " to local storage");
            return false;
        } else {
            console.log("Key: ", localKey, " is set to Value: ", val);
            return true;
        };
      });
};

const GetFromLocal = async (localKey) => {
    const data = await chrome.storage.local.get(localKey);

    if(!data) {
        console.warn("Error: Failed to retrive local data for: ", localKey);
        return null;
    }

    return data;
};

const IsLaterDate = (currDate, targetDate) => {
    const utc1 = Date.UTC(currDate.getYear(), currDate.getMonth(), currDate.getDate(), currDate.getHours(), currDate.getMinutes());
    const utc2 = Date.UTC(targetDate.getYear(), targetDate.getMonth(), targetDate.getDate(), targetDate.getHours(), targetDate.getMinutes());

    return Math.abs(targetDate) - Math.abs(currDate) > 0;
};

const InitializeDate = (currentDate, domain = null) => {
    const dateInfo = new DateAnalytic();

    if (!domain) {
        const initialWebsite = new WebsiteAnalytic(domain, new Date());
        dateInfo.AddWebsite(initialWebsite);
    }

    SetToLocal(currentDate, dateInfo);
};

const CreateTimeStamp = async (domain) => {
    const currentTime = new Date();
    const currentDate = currentTime.toDateString();
    const currStoredWebsites = await GetFromLocal(currentDate);

    if (!currStoredWebsites) {
        InitializeDate(currentDate, domain);
    } else {
        const viewedWebsite = new WebsiteAnalytic(domain, new Date().getTime());
        const updatedStoredWebsites = new DateAnalytic(currStoredWebsites.visitedWebsites);
        
        updatedStoredWebsites.AddWebsite(viewedWebsite);

        SetToLocal(currentDate, updatedStoredWebsites);
    };
};


console.log(GetDomName(GetUrl()));

const main = async () => {
    const webDom = GetDomName(GetUrl());

    await CreateTimeStamp(webDom);
}

main();

