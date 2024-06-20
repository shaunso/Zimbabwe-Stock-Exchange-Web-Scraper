// load the requisite modules
const puppeteer = require('puppeteer');
const fs = require('fs');

// set the URL to the Victoria Falls Stock Exchange (VFEX) homepage
const url = 'https://www.zse.co.zw/price-sheet/';

// retrieving the current date to create a string to use when appending the CSV file and naming the JSON file
function theDate() {
  const today = new Date();
  const year = today.getFullYear().toString();
  const month = ( today.getMonth() + 1 ).toString();
  const day = today.getDate().toString();
  // the date will be in the YYYY-MM-DD format
  return year.concat("-", month, "-", day);
}

// executing the web scrapper
const getEquities = async () => {
  // launch the imported Puppeteer module
  // Puppeter will start a headless instance of the Chromium browser
  const browser = await puppeteer.launch();
  // open a new page the headless instance
  const page = await browser.newPage();
  // set the viewport of the page
  await page.setViewport({
    width: 1680,
    height: 1080,
  });
  // requesting the html file for VFEX homepage from the server
  // 'waitUntil' method waits for the entire html data to be loaded before the functions are executed
  // 'timeout' method added to increase the time period Puppeteer waits for the DOM content to load before throwing a timeout error
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  })

  // take a screenshot of the full page as a backup
  await page.screenshot({ path: `./equities/screenshot/${theDate()}.png`, fullPage: true });
  
  // retrieve the html data of the requested page, after the DOM content has loaded 
  // the data is then returned to the calling function where it passed on to a Promise for further execution   
  const result = await page.evaluate( () => {
    // use a query selector to select all the rows in the market activity table on the VFEX homepage
    const data = document.querySelectorAll('.elementor-text-editor > table:nth-child(2) > tbody:nth-child(1) tr');
    const getDate = document.querySelector('.elementor-text-editor > p:nth-child(1)').innerText.trim().split(" ").toSpliced(0,3);
    // // retrieving the current date to create a string to use when appending the CSV file and naming the JSON file
    const today = new Date(getDate);
    const year = today.getFullYear().toString();
    const month = ( today.getMonth() + 1 ).toString();
    const day = today.getDate().toString();
    // the date will be in the YYYY-MM-DD format
    const currentDate = year.concat("-", month, "-", day);
    // the nodeList returned from executing 'data' is converted into an array of objects, with array elements having one 'key:value' property each
    // the array is then returned to the function that called it
    return Array.from(data).map( (el, pos) => {
      if ( pos > 0 ){
      const name = el.querySelector('td:nth-child(2)').innerText.trim();
      const openingPrice = el.querySelector('td:nth-child(3)').innerText.trim();
      const closingPrice = el.querySelector('td:nth-child(4)').innerText.trim();
      const tradeVolume = el.querySelector('td:nth-child(5)').innerText.trim();

      return { currentDate, name, openingPrice, closingPrice, tradeVolume }
    } else return
    });
  });

  // close the headless instance of Chromium
  await browser.close();
  // return the data to the calling function as a single array of objects
  return result
}

// once the market activity data is returned by the web scrapper
// log the data to the console
// then append a CSV file with the returned data 
// then save the returned data in a JSON file
const equities = getEquities().then( arr => {
  const value = arr.filter( el => el !== null).filter( el => el.name);
  console.log(value);

  // save the scrapped data to a JSON file
  fs.writeFile(`./equities/json/${value[0].currentDate}.json`, JSON.stringify(value), err => {
    if (err) throw err;
    console.log(`Data for ${value[0].currentDate} saved to JSON.`)
  }); 

  // append the date to the first column of the CSV files for CLOSING PRICE & TRADING VOLUME
  fs.appendFileSync('./equities/closing_price.csv', `\n${value[0].currentDate}`, err => {
    if (err) throw err;
    console.log(`Saving data for ${value[0].currentDate} to closing_price.csv...`);
  });
  fs.appendFileSync('./equities/trade_volume.csv', `\n${value[0].currentDate}`, err => {
    if (err) throw err;
    console.log(`Saving data for ${value[0].currentDate} to trading_volume.csv...`);
  });

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // // append the scrapped closing price data to the CLOSING PRICE CSV file
  for ( let entity of value) {
    fs.appendFileSync('./equities/closing_price.csv', `,${entity.closingPrice}`, err => {
      if (err) {
        console.log(`An error occured retrieving the closing price for ${entity.closingPrice} !!!`);
      };
      // console.log(`Saving ${entity.name} to closing_price.csv...`);
      console.log(`${entity.name}: ZIG${entity.closingPrice}`)
    });
  }
  console.log(`Closing price data for ${value[0].currentDate} successfully saved.`)
  // append the scrapped trade volume data to the TRADE VOLUME CSV file

  for (let entity of value) {
    const csvRow = `,${entity.tradeVolume}`;
    fs.appendFileSync('./equities/trade_volume.csv', csvRow, err => {
      // Error handling 
      if (err) throw err
    });
    console.log(`${entity.name}: ${entity.tradeVolume} shares`)
  }
  console.log(`Trade volume data for ${value[0].currentDate} successfully saved.`)
});

console.log('Web scrapping currently in progress');

module.exports = equities;