require('dotenv').config();
const Amplify = require('aws-amplify');
const { Predictions } = require('aws-amplify');
const { AmazonAIPredictionsProvider } = require('aws-amplify/predictions');
const awsconfig = require('./aws-exports.js');
const puppeteer = require('puppeteer');
const fs = require('fs');

Amplify.configure(awsconfig);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

const TINDER_URL = 'https://tinder.com/';
const LOGIN_DIALOG_BUTTON_XPATH = '//*[@id="q-184954025"]/div/div[1]/div/main/div[1]/div/div/div/div/header/div/div[2]/div[2]/a';
const FB_LOGIN_BUTTON_XPATH = '//*[@id="q36386411"]/div/div/div[1]/div/div[3]/span/div[2]/button';
const FB_EMAIL = process.env.FB_EMAIL;
const FB_PASSWORD = process.env.FB_PASSWORD;
const CARD_XPATH = '//*[@id="q-184954025"]/div/div[1]/div/main/div[1]/div/div/div[1]';
const PROFILE_NAME_XPATH = '//*[@id="q-184954025"]/div/div[1]/div/main/div[1]/div/div/div[1]/div/div/div[3]/div[3]/div/div[1]/div/div/span';
const LATITUDE = 43.0686645;
const LONGITUDE = 141.3485666;

(async () => {
  const page = await initialize();
  await page.goto(TINDER_URL);

  await login(page);

  await page.waitForXPath(PROFILE_NAME_XPATH);
  const clip = { width: 360, height: 550, x: 580, y: 90 };
  await page.waitForTimeout(1000);
  await page.screenshot({ clip, path: 'tmp/ss.png' })

  // const imageArrayBuffer = base64ToFile('./ss.png')
  // console.log(imageArrayBuffer)

  const file = fs.readFileSync('./tmp/ss.png');
  let imageArrayBuffer = file.buffer
  console.log(imageArrayBuffer)

  Predictions.identify({
    entities: {
      source: {
        bytes: imageArrayBuffer,
      },
    }
  })
  .then((response) => console.log({ response }))
  .catch(err => console.log({ err }));



//   await browser.close();

})();

async function clickXPath(page, xpath) {
  await page.waitForXPath(xpath);
  const [elemnt] = await page.$x(xpath);
  elemnt.click();
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
