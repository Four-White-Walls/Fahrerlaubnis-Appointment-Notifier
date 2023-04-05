import { Browser, Page } from "puppeteer";
import puppeteer from 'puppeteer';
import { IBrowserNavigator } from "../types";
const chromeLauncher = require("chrome-launcher/dist/chrome-launcher");
const util = require('util');
const request = require('request');

export default class BrowserNavigator {

    public browser: Browser;
    public activePage: Page;


    constructor(browser: Browser, page: Page) {
        this.browser = browser;
        this.activePage = page;
    }

    public static async init(starterURL?: string): Promise<IBrowserNavigator | undefined> {
        try {
            console.log("Launching Anmeldung Appointment Finder...");
            let chrome = await chromeLauncher.launch({
                userDataDir: false,
                chromeFlags: ['--headless']
            })
            const resp = await util.promisify(request)(`http://localhost:${chrome.port}/json/version`);
            const { webSocketDebuggerUrl } = JSON.parse(resp.body);
            const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl, defaultViewport: null });
            const page = await browser.newPage();
            if (starterURL) {
                await page.goto(starterURL);
            }
            return new BrowserNavigator(browser, page);
        } catch (e) {
            console.error(e);
        }
    }

    public async navigateToURL(url: string): Promise<void> {
        try {
            await this.activePage.goto(url);
        } catch (e) {
            console.error(e);
        }
    }

    public async clickByXPath(page: Page, xSelector: string) {
        try {
            const elements = await page.$x(xSelector)
            await elements[0].click()
        } catch (error) {
            console.error(`error clicking selector ${xSelector}`)
        }
    }

    public async selectAppointmentLocations() {
        await this.clickByXPath(this.activePage, `//a[contains(text(), "Termin berlinweit suchen und buchen")]`);
    }

    public async isAppointmentAvailable() {
        
        console.log('Checking for available appointments...')
        await this.activePage.waitForNetworkIdle();
        let apptAvailable = await this.activePage.evaluate(() => {
            const calendars = document.querySelectorAll('.calendar-table');
            for(const calendar of calendars) {
                let days = calendar?.querySelectorAll('td');
                if (!days) {
                    return false;
                }
                for (let i = 0; i < days?.length; i++) {
                    if (days[i].getAttribute('class') === "buchbar") {
                        return true;
                    }
                }

            }
            return false;
        })
        return apptAvailable
    }

    public async close() {
        try {
            await this.browser.close();
        } catch (e) {
            console.error(e);
        }
    }

    public async disconnect(): Promise<void> {
        await this.browser.disconnect()
    }
}