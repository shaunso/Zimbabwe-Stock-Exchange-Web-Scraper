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
    const getDate = document.querySelector('section.elementor-section:nth-child(9) h4').innerText.trim().split(" ").toSpliced(0,2);
    // // retrieving the current date to create a string to use when appending the CSV file and naming the JSON file
    const today = new Date(getDate);
    const year = today.getFullYear().toString();
    const month = ( today.getMonth() + 1 ).toString();
    const day = today.getDate().toString();
    // the date will be in the YYYY-MM-DD format
    const currentDate = year.concat("-", month, "-", day);

    // in order to return the index name & closing price for each sector index as an array
    // create an array instance of the nodeList returned from 'data' using the '.from()' method
    // create a new 1-dimensional array of objects where each index value represents on object with key:value properties of {key: <string>, price: <number>}
    return Array.from(data).map( (val, ind) => {
      if ( ind > 0 ) {
        const index = val.querySelector('td:nth-child(1)').innerText.trim();
        const price = val.querySelector('td:nth-child(2)').innerText.trim();

        return { currentDate, index, price }

      } else return
    })
  });

  // end the current session of the headless Chrome instance
  await browser.close();
  // return the scrapped data to the Promise for further processing
  return result
}

const sectorIndices = getSectorIndices().then( arr => {
  const value = arr.filter( el => el !== null)
  console.log(value);

  // save the scrapped data to a JSON file
  fs.writeFile(`./sector_indices/json/${value[0].currentDate}.json`, JSON.stringify(value), err => {
    if (err) throw err;
    console.log(`Closing price data for ${value[0].currentDate} ZSE Sector Indices saved to JSON.`);
  });

  // append a new row to the .csv file
  // inserting todays date into the first column of the .csv file
  fs.appendFileSync('./sector_indices/closing_price.csv', `\n${value[0].currentDate}`, err => {
    if (err) throw err;
    console.log(`Saving closing price data for ${value[0].currentDate} ZSE Sector Indices to CSV...`);
  })

  // inserting the index & price from today into the .csv file from each element of the array
  for ( let entity of value) {
    fs.appendFileSync('./sector_indices/closing_price.csv', `,${entity.price}`, (err) => {
      if (err) throw err;
      console.log(`${entity.index} - ZIG${entity.price}`);
    }) 
  }
  console.log(`Closing price data for ${value[0].currentDate} ZSE Sector Indices saved to CSV.`);
});

module.exports = sectorIndices;