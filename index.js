require('dotenv').config();
const puppeteer = require('puppeteer');

const TINDER_URL = 'https://tinder.com/';
const LOGIN_DIALOG_BUTTON_XPATH = '//*[@id="q-184954025"]/div/div[1]/div/main/div[1]/div/div/div/div/header/div/div[2]/div[2]/a';
const FB_LOGIN_BUTTON_XPATH = '//*[@id="q36386411"]/div/div/div[1]/div/div[3]/span/div[2]/button';
const FB_EMAIL = process.env.FB_EMAIL;
const FB_PASSWORD = process.env.FB_PASSWORD;
const CARD_XPATH = '//*[@id="q-184954025"]/div/div[1]/div/main/div[1]/div/div/div[1]';
const REVIEW_DIALOG_XPATH = '//*[@id="q36386411"]/div/div/div[2]/button[2]';
const PROMOTE_DIALOG_XPATH = '//*[@id="q36386411"]/div/div/div[3]/button[2]';
const MAX_LIKE_COUNT = 20;
const LATITUDE = 43.0686645;
const LONGITUDE = 141.3485666;

(async () => {
  const page = await initialize();
  await page.goto(TINDER_URL);
  await login(page);

  let likeCount = 0;

  const timerId = setInterval(async () => {
    clickXPath(page, REVIEW_DIALOG_XPATH);
    clickXPath(page, PROMOTE_DIALOG_XPATH);

    if(likeCount > MAX_LIKE_COUNT) {
      clearInterval(timerId);
      await browser.close();
    }

    const random = Math.random() * 3;
    if(random > 1) {
      await page.keyboard.press('ArrowRight');
      likeCount++;
    } else {
      await page.keyboard.press('ArrowLeft');
    }
  }, 500);

//   await browser.close();
})();

async function clickXPath(page, xpath) {
  await page.waitForXPath(xpath);
  const elemnts = await page.$x(xpath);
  if(elemnts.length > 0) {
    await elemnts[0].click();
  }
}

async function initialize() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page._client.send('Emulation.clearDeviceMetricsOverride');

  const context = browser.defaultBrowserContext();
  await context.overridePermissions(TINDER_URL, ['geolocation']);

  await page.setGeolocation({
    latitude: LATITUDE,
    longitude: LONGITUDE
  });

  return page;
}

async function login(page) {
  await clickXPath(page, LOGIN_DIALOG_BUTTON_XPATH)
  await clickXPath(page, FB_LOGIN_BUTTON_XPATH)

  const newPage = new Promise(resolve => page.once('popup', resolve))
  const fbPopup = await newPage;

  await fbPopup.waitForSelector('#email');
  await fbPopup.click('#email')
  await fbPopup.keyboard.type(FB_EMAIL)

  await fbPopup.click('#pass')
  await fbPopup.keyboard.type(FB_PASSWORD)

  await fbPopup.waitForSelector('#loginbutton');
  await fbPopup.click('#loginbutton');

  try {
    await page.waitForXPath(CARD_XPATH);
    console.log('success login!!');
  } catch (error) {
    console.log('failed login!!');
    console.log(error);
    process.exit();
  }
}