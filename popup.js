import { DateAnalytic, GetFromLocal } from "./constants.js";


// SECTION: Constants
const currentDate = new Date().toDateString();
const todayAnalytic = new DateAnalytic(currentDate);

// SECTION: Functions

// Updates HTML data with analytics data.
const UpdateHtml = () => {

};

// Starts up and fills popup.html with information.
const StartUp = async () => {
    const currentDateData = await GetFromLocal(currentDate);

    if (Object.keys(currentDateData).length === 0) {
        return;
    };

    todayAnalytic.SetVisited(currentDateData[currentDate].visitedWebsites);
};



// Action Start

chrome.runtime.onStartup.addListener(function() {
    StartUp();
    console.log('open');
});
