import fs from 'fs';
import puppeteer from 'puppeteer';

const PAGE_BASE_URL = 'https://summerofcode.withgoogle.com/programs/2024/organizations';
const ORG_NAME_SELECTOR = '.title';
const ORG_DESCRIPTION_SELECTOR = '.constrainer--line-length > p';
const ORG_TECH_SELECTOR = '.tech__content';
const ORG_TOPIC_SELECTOR = '.topics__content';
const ORG_LINK_SELECTOR = '.link__wrapper>a.link';
const IDEALIST_LINK_SELECTOR = '.org-info-wrapper .mdc-button.mdc-button--unelevated.mat-mdc-unelevated-button.mat-primary.mat-mdc-button-base';
const GUIDANCE_LINK_SELECTOR = '.link-wrapper.ng-star-inserted > a.link';

// Encode the organization names to be used in the URL
const data = JSON.parse(fs.readFileSync('organizations.json', 'utf8'));
const orgs = data.map((el) => {
   return {...el, 
           name: el.name.toLowerCase()
           .replaceAll(/[^a-zA-Z0-9\s-]/g, '').replace(/,/g, '').replaceAll(' ', '-').replaceAll(/-+/g, '-')};
});

async function scrapeData() {
   const browser = await puppeteer.launch({ headless: true });
   const page = await browser.newPage();

   await page.setViewport({ width: 1600, height: 1080 });

   // const organizations = await Promise.all(data.map(async (org) => {
   //    const orgData = await getOrgData(org.name);
   //    return orgData;
   // }));

   for (let org of orgs) {
      try {
         if(org.techs == null){
            const orgData = await getOrgData(org, page);
            console.log(orgData);
            data.splice(org.index-1, 1, orgData);
         }
      } catch (error) {
         console.error(`Error scraping data for ${org.name}:`, error);
         data.push({ name: org.name, error: 'Failed to scrape data' });
      }
   }

   // console.log(data);
   fs.writeFileSync(`orgs.json`, JSON.stringify(data, null, 2));

   await browser.close();
}


const getOrgData = async (org, page) => {

   let attempts = 0;
   const maxAttempts = 3;
   
   while (attempts < maxAttempts) {
      try {
         await page.goto(`${PAGE_BASE_URL}/${org.name}`, {
            waitUntil: 'networkidle2',
         });

         const orgData = await page.evaluate((org, {
            ORG_NAME_SELECTOR, ORG_DESCRIPTION_SELECTOR,
            ORG_TECH_SELECTOR, ORG_TOPIC_SELECTOR, ORG_LINK_SELECTOR,
            IDEALIST_LINK_SELECTOR, GUIDANCE_LINK_SELECTOR
         }) => {
            const orgData = {};
            const name = document.querySelector(ORG_NAME_SELECTOR)?.innerText || NaN;
            const description = document.querySelector(ORG_DESCRIPTION_SELECTOR)?.innerText || NaN;
            const techs = document.querySelector(ORG_TECH_SELECTOR)?.innerText || NaN;
            const topics = document.querySelector(ORG_TOPIC_SELECTOR)?.innerText || NaN;
            const orgLink = document.querySelector(ORG_LINK_SELECTOR)?.href || NaN;
            const ideaListLink = document.querySelector(IDEALIST_LINK_SELECTOR)?.href || NaN;
            const guidanceLink = document.querySelector(GUIDANCE_LINK_SELECTOR)?.href || NaN;

            orgData.index = org.index;
            orgData.name = name || org.name;
            orgData.description = description;
            orgData.techs = techs;
            orgData.topics = topics;
            orgData.orgLink = orgLink;
            orgData.ideaListLink = ideaListLink;
            orgData.guidanceLink = guidanceLink;

            return orgData;
         }, org, {
            ORG_NAME_SELECTOR, ORG_DESCRIPTION_SELECTOR,
            ORG_TECH_SELECTOR, ORG_TOPIC_SELECTOR, ORG_LINK_SELECTOR,
            IDEALIST_LINK_SELECTOR, GUIDANCE_LINK_SELECTOR
         });

         return orgData;
      } catch (error) {
         console.error(`Attempt ${attempts + 1} failed for ${org.name}:`, error);
         attempts++;
         if (attempts < maxAttempts) {
            console.log(`Retrying ${org.name}...`);
         }
      }
   }
};


scrapeData();
