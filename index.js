const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Company = require('./models/company');
const CompanyKladno = require('./models/companyKladno');
const LekarnaKladno = require('./models/lekarnaKladno');

const COMPANY_LENGTH_SELECTOR = '#box5 > div > div.premiseListBoxes.pl-catalog > div.premiseBox'
const COMPANY_WRAP_SELECTOR = '#box5 > div > div.premiseListBoxes.pl-catalog > div.premiseBox:nth-child(INDEX)'
const COMPANY_NAME_SELECTOR = '#box5 > div > div.premiseListBoxes.pl-catalog > div.premiseBox:nth-child(INDEX) > div > div.companyWrap > h3 > a > span'
const COMPANY_ADDR_SELECTOR = '#box5 > div > div.premiseListBoxes.pl-catalog > div.premiseBox:nth-child(INDEX) > div > div.companyWrap > span > span.importantDisplayBlock > span'
const COMPANY_TELE_SELECTOR = '#box5 > div > div.premiseListBoxes.pl-catalog > div.premiseBox:nth-child(INDEX) > div > div.companyWrap > div.actions > div > div.action.actionPhone > span'
const COMPANY_SITE_SELECTOR = '#box5 > div > div.premiseListBoxes.pl-catalog > div.premiseBox:nth-child(INDEX) > div > div.companyWrap > div.actions > div > div.action.actionUrl > a'
const COMPANY_LOGO_SELECTOR = '#box3 > div > div > div.logo > img'
const COMPANY_PHOTO_SELECTOR = '#box5 > div > div.premiseListBoxes.pl-catalog > div.premiseBox:nth-child(INDEX) > div > div.companyPhoto > a > img'

const COMPANY_PROFILE_URL_SELECTOR = 'div.fullPremiseBox:nth-child(INDEX) > div > div.companyWrap > h3 > a'
const COMPANY_EMAIL_SELECTOR = '#box2 > div > div.box > div.tab.basicInfo > div > div > a.companyMail'

const COMPANY_ADDR_STREET_SELECTOR = '#box2 > div > div.box > div.addressList > h2 > div:nth-child(1)'
const COMPANY_ADDR_ZIP_SELECTOR = '#box2 > div > div.box > div.addressList > h2 > div:nth-child(2)'
const COMPANY_ADDR_CITY_SELECTOR = '#box2 > div > div.box > div.addressList > h2 > div:nth-child(3)'

const SRC_URL = 'https://www.firmy.cz/Prvni-pomoc-a-zdravotnictvi/Prodejci-zdravotnickeho-zbozi-a-leciv/Leky-a-farmaka/Prodejci-leku-a-farmak/Lekarny/kraj-stredocesky/kladno?prodejna'
// const SRC_URL = 'https://www.firmy.cz/Prvni-pomoc-a-zdravotnictvi/Prodejci-zdravotnickeho-zbozi-a-leciv/Zdravotnicke-potreby/kraj-praha/'

const NUMBERING_SELECTOR = '#box6 > div > div > div.results > p:nth-child(1) > strong:nth-child(5)'

async function getNumPages(page) {
  let inner = await page.evaluate((sel) => {
    let html = document.querySelector(sel).innerHTML;
    
    // format is: "69,803 users"
    return html.replace(',', '').replace('users', '').trim();
  }, NUMBERING_SELECTOR);

  let numUsers = parseInt(inner);

  console.log('numCompanies: ', numUsers);

  /*
  * Firmy shows 14 results per page, so
  */
  let numPages = Math.ceil(numUsers / 14);
  return numPages;
}

async function run() {
    let count = 0
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

    await page.goto(SRC_URL);
    // await page.goto('https://github.com');
    await page.waitFor(3*1000);

  let numPages = await getNumPages(page);

  console.log('Numpages: ', numPages);

    for (let h = 1; h <= numPages; h++) {
        let pageUrl = SRC_URL + '?page=' + h;

        await page.goto(pageUrl);
        // await page.goto('https://github.com');
        await page.waitFor(3*1000);

        let listLength = await page.evaluate((sel) => {
            return document.querySelectorAll(sel).length;
        }, COMPANY_LENGTH_SELECTOR);

        console.log('listLength: ' + listLength)

        for (let i = 3; i <= (listLength * 2) + 1; i++) {
            count++
            // this is shady, better comeup with better selector
            if (i % 2 == 1) {
                // change the index to the next child
                let wrapSelector = COMPANY_WRAP_SELECTOR.replace("INDEX", i);
                let nameSelector = COMPANY_NAME_SELECTOR.replace("INDEX", i);
                let addrSelector = COMPANY_ADDR_SELECTOR.replace("INDEX", i);
                let teleSelector = COMPANY_TELE_SELECTOR.replace("INDEX", i);
                let siteSelector = COMPANY_SITE_SELECTOR.replace("INDEX", i);
                let photoSelector = COMPANY_PHOTO_SELECTOR.replace("INDEX", i);
                let profileSelector = COMPANY_PROFILE_URL_SELECTOR.replace("INDEX", i);

                let email = null
                let logo_url = null
                let photo_url = null
                let street = null
                let city = null
                let zip = null

                let name = await page.evaluate((sel) => {
                    let element = document.querySelector(sel);
                    return element? element.innerHTML: null;
                  }, nameSelector);

                console.log(name)

                let addr = await page.evaluate((sel) => {
                    let element = document.querySelector(sel);
                    return element? element.innerText: null;
                  }, addrSelector);

                console.log(addr)

                let tele = await page.evaluate((sel) => {
                    let element = document.querySelector(sel);
                    return element? element.innerHTML: null;
                  }, teleSelector);

                console.log(tele)

                let site = await page.evaluate((sel) => {
                    let element = document.querySelector(sel);
                    return element? element.getAttribute('href'): null;
                  }, siteSelector);

                console.log(site)

                let profile_url = await page.evaluate((sel) => {
                    let element = document.querySelector(sel);
                    return element? element.getAttribute('href'): null;
                  }, profileSelector);

                console.log('profile_url')
                console.log(profile_url)

                photo_url = await page.evaluate((sel) => {
                    let element = document.querySelector(sel);
                    return element? element.getAttribute('src'): null;
                }, photoSelector);

                console.log('profile_url')
                console.log(profile_url)

                if (profile_url) {
                    console.log('** ** ** ** ')
                    // try to parse email from profile page
                    const profile_page = await browser.newPage()

                    await profile_page.goto('https://firmy.cz' + profile_url);
                    await profile_page.waitFor(3*1000);
                    
                    email = await profile_page.evaluate((sel) => {
                        let element = document.querySelector(sel);
                        return element? element.innerText: null;
                    }, COMPANY_EMAIL_SELECTOR);

                    logo_url = await profile_page.evaluate((sel) => {
                        let element = document.querySelector(sel);
                        return element? element.getAttribute('src'): null;
                    }, COMPANY_LOGO_SELECTOR);

                    street = await profile_page.evaluate((sel) => {
                        let element = document.querySelector(sel);
                        return element? element.innerText: null;
                    }, COMPANY_ADDR_STREET_SELECTOR);

                    city = await profile_page.evaluate((sel) => {
                        let element = document.querySelector(sel);
                        return element? element.innerText: null;
                    }, COMPANY_ADDR_CITY_SELECTOR);

                    zip = await profile_page.evaluate((sel) => {
                        let element = document.querySelector(sel);
                        return element? element.innerText: null;
                    }, COMPANY_ADDR_ZIP_SELECTOR);

                    await profile_page.waitFor(5*1000);

                    console.log(' ')
                    console.log('$$ _____ $$')

                    console.log(email)
                    console.log('logo_url')
                    console.log(logo_url)

                    console.log('$$ _____ $$')
                    console.log(' ')

                    profile_page.close()
                }


                // not all users have emails visible
                if (!addr)
                  continue;

                console.log('********************************************')
                if (email) {
                    console.log(name, ' -> ', addr, ' -> ', tele, ' -> ', site, ' -> ', profile_url, ' -> ', email);
                } else {
                    console.log(name, ' -> ', addr, ' -> ', tele, ' -> ', site, ' -> ', profile_url);
                }
                console.log('********************************************')

                // TODO save this user
                upsertCompany({
                  name: name,
                  addr: addr,
                  street: street,
                  city: city,
                  zip: zip,
                  tele: tele,
                  site: site,
                  email: email,
                  logo_url: logo_url,
                  photo_url: photo_url,
                  dateCrawled: new Date()
                });
            }
            console.log("count: " + count)
        }
    }




  // await page.screenshot({ path: 'screenshots/firmy.png' });

  console.log('before close')
  
  browser.close();
}

run();


function upsertCompany(companyObj) {
    
    const DB_URL = 'mongodb://localhost/thal';

    if (mongoose.connection.readyState == 0) { mongoose.connect(DB_URL); }

    // if this email exists, update the entry, don't insert
    let conditions = { addr: companyObj.addr };
    let options = { upsert: true, new: true, setDefaultsOnInsert: true };

    LekarnaKladno.findOneAndUpdate(conditions, companyObj, options, (err, result) => {
        if (err) throw err;
        console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^')
        console.log(result)
    });

console.log('imported')
}

data.forEach(function(item, index){
    delete item.dateCrawled
    delete item._id
    delete item.__v

    if(item.logo_url != null){
        var position_logo = item.logo_url.indexOf('?')
        item.logo_url = item.logo_url.substring(0, position_logo)
    }

    if(item.photo_url != null){
        var position_photo = item.photo_url.indexOf('?')
        item.photo_url = item.photo_url.substring(0, position_photo)
    }

    item.url_name = index + 1
})