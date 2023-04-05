import BrowserNavigator from "./BrowserNavigator";
require('dotenv').config()
import open from 'open'

const runTime = async () => {
    try {
        const browser = await BrowserNavigator.init("https://service.berlin.de/dienstleistung/327537/");
        if (!browser) {
            throw "No Browser"
        }
        setInterval(async () => {
            console.log('Refreshing and trying again...')

            await browser.selectAppointmentLocations()
            let apptAvailable = await browser.isAppointmentAvailable();
            if (apptAvailable) {
                console.clear();
                console.log('Appointment found. Sending notification...')
                await open(browser.activePage.url());
            }
            console.log("No appointment found, refreshing..")
            await browser.navigateToURL("https://service.berlin.de/dienstleistung/327537/")
        }, 30000)

    } catch (error) {
        console.log(error)
    }
}

runTime();