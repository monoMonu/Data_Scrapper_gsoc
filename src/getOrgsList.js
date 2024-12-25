import puppeteer from 'puppeteer';
import fs from 'fs';

const PAGE_URL = 'https://summerofcode.withgoogle.com/programs/2024/organizations';
const ORG_CARD_SELECTOR = 'app-orgs-card';
const ORG_NAME_SELECTOR = '.info .name';
const ORG_NUM_SELECTOR = '.mat-mdc-paginator-range-label';
const ORG_NEXT_BTN_SELECTOR = '.mat-mdc-paginator-navigation-next';

(async () => {
   // Launch browser
   const browser = await puppeteer.launch({ headless: true});
   const page = await browser.newPage();

   await page.setViewport({ width: 1600, height: 1080 });

   // Go to the GSoC organizations page
   await page.goto(PAGE_URL, {
      waitUntil: 'networkidle2',
   });

   // Wait for the organization elements to load
   await page.waitForSelector(ORG_CARD_SELECTOR);

   // const sortBtn = await page.waitForSelector('#mat-button-toggle-2-button');
   // await sortBtn.click();
   // await page.locator('.mat-mdc-paginator-range-label').scroll({
   //    scrollLeft: 10,
   //    scrollTop: 20,
   // });
      
   // Total Organizations
   const totalOrgs = await page.evaluate((ORG_NUM_SELECTOR) => {
      const totalOrgs = document.querySelector(ORG_NUM_SELECTOR)?.innerText;
      return parseInt(totalOrgs.trim().slice(-3));
   }, ORG_NUM_SELECTOR);
    
   const organizations = await page.evaluate(async ({totalOrgs, ORG_CARD_SELECTOR, ORG_NAME_SELECTOR, ORG_NEXT_BTN_SELECTOR}) => {
      const orgs = [];
      let orgsNum = totalOrgs;
      
      function getOrgData() {
         const orgCards = document.querySelectorAll(ORG_CARD_SELECTOR);
         orgCards.forEach((card) => {
            orgsNum--;
            const num = totalOrgs - orgsNum;
            const name = card.querySelector(ORG_NAME_SELECTOR)?.innerText;
            
            orgs.push({ number: num, name: name});
         });
      }
      
      while(orgsNum > 0) {
         // await .screenshot({ path: `screenshot${totalOrgs%50}.png`, fullPage: true });
         getOrgData();
         const nextButton = document.querySelector(ORG_NEXT_BTN_SELECTOR);
         await nextButton.click();
      }

      return orgs;
   }, { totalOrgs, ORG_CARD_SELECTOR, ORG_NAME_SELECTOR, ORG_NEXT_BTN_SELECTOR }, { waitUntil: 'networkidle2' });

   console.log(organizations);

   // Save the results or process further
   // e.g., write to a JSON file
   fs.writeFileSync('organizations.json', JSON.stringify(organizations, null, 2));

   // Close browser
   await browser.close();
})();
