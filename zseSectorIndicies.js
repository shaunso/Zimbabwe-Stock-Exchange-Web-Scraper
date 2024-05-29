// load the required modules
const puppeteer = require('puppeteer');
const fs = require('fs');

// url to Zimbabwe Stock Exchange (ZSE) homepage
const url = 'https://www.zse.co.zw/';

const getSectorIndices = async () => {
  // start the web scraper by launching a headless instance of Chrome using the puppeteer module
  const browser = await puppeteer.launch();
  // open a new page in the browser instance
  const page = await browser.newPage();
  // set the viewport dimensions of the page in the browser instance
  await page.setViewport({
    width: 1680,
    height: 1080,
  })
  // request the homepage of the ZSE website from it's server
  // wait for the html data if loaded before running the JS to scrape the site
  // this website is not very performant, so extending the timeout period to 2 minutes
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  })

  // retrieve the html data from the site
  const result = await page.evaluate( () => {
    // query selector used to select each table row from the 'ZSE SECTOR INDICES' table
    const data = document.querySelectorAll('section.elementor-section:nth-child(6) tr');

    // in order to return the index name & closing price for each sector index as an array
    // create an array instance of the nodeList returned from 'data' using the '.from()' method
    // create a new 1-dimensional array of objects where each index value represents on object with key:value properties of {key: <string>, price: <number>}
    return Array.from(data).map( (val, ind) => {
      if ( ind > 0 ) {
        const index = val.querySelector('td:nth-child(1)').innerText.trim();
        const price = val.querySelector('td:nth-child(2)').innerText.trim();

        return { index, price }

      } else return
    })
  });

  // end the current session of the headless Chrome instance
  await browser.close();
  // return the scrapped data to the Promise for further processing
  return result
}

getSectorIndices().then( value => {
  // removing any null items from the returned array
  const arr = value.filter( e => e !== null);
  console.log(arr);

  // getting the current day
  const today = new Date();
  const year = today.getFullYear().toString();
  const month = (today.getMonth() + 1).toString();
  const day = today.getDate().toString();
  // today's date set as a string in the YYYY-MM-DD format
  const currDate = year.concat("-", month, "-", day);
  // append a new row to the .csv file
  // inserting todays date into the first column of the .csv file
  fs.appendFile('./sector-indices/zseSectorIndicies.csv', currDate, err => {
    if (err) throw err;
    console.log(currDate);
  })

  // inserting the index & price from today into the .csv file from each element of the array
  for ( let i = 0; i < arr.length; i++ ) {
    fs.appendFile('./sector-indices/zseSectorIndicies.csv', newLine(), (err) => {
      if (err) throw err;
      console.log(`${arr[i].index} - ZIG${arr[i].price}`);
    })
    // new-line character added - to insert new row for the next execution - if the last object in the array is being iterated
    function newLine() {
      if ( i === (arr.length - 1) ) {
        return `,${arr[i].price}\n`;
      } else return `,${arr[i].price}`;
    }
  }

  arr.unshift(`${currDate}`);

  // save the scrapped data to a JSON file
  fs.writeFile(`./sector-indices/json/zse-sector-indices-closing-price-${currDate}.json`, JSON.stringify(arr), err => {
    if (err) throw err;
    console.log("Saved to JSON");
  });
});