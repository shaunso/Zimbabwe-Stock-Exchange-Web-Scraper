const puppeteer = require('puppeteer');
const fs = require('fs');

// the url for which the puppeteer will head to in order to scrape the required information 
const url = 'https://www.zse.co.zw/';

const getMarketIndicies = async () => {
  // launching puppeteer and browser instance
  const browser = await puppeteer.launch();
  // open a new page on the browser
  const page = await browser.newPage();
  // setting the view width of the browser page instance
  await page.setViewport({
    width: 1680,
    height: 1080,
  });
  // requsting the page from the server
  // wait for the html content to load before puppeteer begins executing
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });

  // get the html page data
  const result = await page.evaluate( () => {
    // using a query selector to select all rows from the 'market cap indicies table'
    const data = document.querySelectorAll('section.elementor-top-section:nth-child(4) div.elementor-top-column:nth-child(3) tr');
    const getDate = document.querySelector('section.elementor-section:nth-child(9) h4').innerText.trim().split(" ").toSpliced(0,2);
    // // retrieving the current date to create a string to use when appending the CSV file and naming the JSON file
    const today = new Date(getDate);
    const year = today.getFullYear().toString();
    const month = ( today.getMonth() + 1 ).toString();
    const day = today.getDate().toString();
    // the date will be in the YYYY-MM-DD format
    const currentDate = year.concat("-", month, "-", day);
    
    // getting the name and price data 
    return Array.from(data).map( (el, pos) => {
      if (pos > 0) {
        const index = (el.querySelector('td:nth-child(1)').innerText.trim());
        const price = (el.querySelector('td:nth-child(2)').innerText.trim());

        return { currentDate, index, price };
      } else return;
    })
  })

  // ending the browser instance
  await browser.close();
  return result
}

const marketIndices =getMarketIndicies().then( arr => {
  const value = arr.filter( el => el !== null);
  console.log(value);

  // append the date to the first column of the JSON file
  fs.writeFile(`./market_indices/json/${value[0].currentDate}.json`, JSON.stringify(value), err => {
    if (err) throw err;
    console.log(`Closing price data for ${value[0].currentDate} ZSE Market Indices saved to JSON.`);
  });  

  // append the date to the first column of the CSV file
  fs.appendFileSync('./market_indices/closing_price.csv', `\n${value[0].currentDate}`, err => {
    if (err) throw err;
    console.log(`Saving closing price data for ${value[0].currentDate} ZSE Market Indices to CSV...`);
  });
  
  // append the scrapped data to the CSV file
  for ( let entity of value ) {
    fs.appendFileSync('./market_indices/closing_price.csv', `,${entity.price}`, err => {
      if (err) throw err;
      console.log(`${entity.index}: ZIG${entity.price}`);
    });
  }
  console.log(`Closing price data for ${value[0].currentDate} ZSE Market Indices successfully saved to CSV.`);
});

module.exports = marketIndices;