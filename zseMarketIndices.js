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
    
    // getting the name and price data 
    return Array.from(data).map( (el, pos) => {
      if (pos > 0) {
        const index = (el.querySelector('td:nth-child(1)').innerText.trim());
        const price = (el.querySelector('td:nth-child(2)').innerText.trim());

        return { index, price };
      } else return;
    })
  })

  // ending the browser instance
  await browser.close();
  return result
}

getMarketIndicies().then( value => {
  const arr = value.filter( e => e !== null)
  console.log(arr);

  // get the current day's date
  const today = new Date();
  const year = today.getFullYear().toString();
  const month = (today.getMonth() + 1).toString();
  const day = today.getDate().toString();
  // creating the path name for the JSON file
  // the date will be in the YYYY-MM-DD format
  const currDate = year.concat("-", month, "-", day);

  // append the date to the first column of the CSV file
  fs.appendFile('./market-indices/zse_market_indices.csv', currDate, err => {
    if (err) throw err;
    console.log(currDate);
  });
  
  // append the scrapped data in 'value' to a CSV file
  for (let i = 0; i < arr.length; i++) {
    fs.appendFile('./market-indices/zse_market_indices.csv', newLine(), err => {
      if (err) throw err;
      console.log(`${arr[i].index}: ZIG${arr[i].price}`);
    });
    // function adds a newline character to the last array element appended to the CSV file
    function newLine() {
      if ( i === arr.length - 1 ) {
        return `,${arr[i].price}\n`
      } else return `,${arr[i].price}`
    }
  }

  arr.unshift(`${currDate}`);

  // append the date to the first column of the CSV file
  fs.writeFile(`./market-indices/json/zse_market_indices_closing_price_${currDate}.json`, JSON.stringify(arr), err => {
    if (err) throw err;
    console.log(`Scraped data saved to file`);
  });  
});