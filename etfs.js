const puppeteer = require('puppeteer');
const fs = require('fs');

// the url for which the puppeteer will head to in order to scrape the required information 
const url = 'https://www.zse.co.zw/';

const getETFs = async () => {
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
    const data = document.querySelectorAll('section.elementor-section:nth-child(5) tr');
    const getDate = document.querySelector('section.elementor-section:nth-child(9) h4').innerText.trim().split(" ").toSpliced(0,2);
    // // retrieving the current date to create a string to use when appending the CSV file and naming the JSON file
    const today = new Date(getDate);
    const year = today.getFullYear().toString();
    const month = ( today.getMonth() + 1 ).toString();
    const day = today.getDate().toString();
    // the date will be in the YYYY-MM-DD format
    const currentDate = year.concat("-", month, "-", day);
    
    // getting the name and price data 
    return Array.from(data).map( ( el, pos ) => {
      if ( pos > 0 ) {      
        const etf = (el.querySelector('td:nth-child(1)').innerText.trim());
        const price = (el.querySelector('td:nth-child(2)').innerText.trim());

        return { currentDate, etf, price };
      } else return
    }).filter( el => el != null)
  })
  
  // ending the browser instance
  await browser.close();
  // return the data to the calling function as a single array of objects
  return result
}

const etfs = getETFs().then( value => {
  console.log(value)

  // append the date to the first column of the JSON file
  fs.writeFile(`./etf/json/${value[0].currentDate}.json`, JSON.stringify(value), err => {
    if (err) throw err;
    console.log(`Data successfully saved for ${value[0].currentDate} to JSON`);
  });  

  // append the date to the first column of the CSV file
  fs.appendFileSync('./etf/closing_price.csv', `\n${value[0].currentDate}`, err => {
    if (err) throw err;
    console.log(`Saving closing price data for ${value[0].currentDate} to CSV...`);
  });

  // appending the CSV files with the scrapped data
  for ( let entity of value) {
    fs.appendFileSync('./etf/closing_price.csv', `,${entity.price}`, err => {
      if (err) throw err;
      console.log(`${entity.etf}: ZIG${entity.price}`);
    });
  }
  console.log(`Closing price data for ${value[0].currentDate} successfully saved`)
  // for ( let entity of value) {
  //   fs.appendFileSync('./etf/trading_volume.csv', `,${entity.volume}`, err => {
  //     if (err) throw err;
  //     console.log(`${entity.etf}: ZIG${entity.volume}`);
  //   });
  // }
  // console.log(`Trade volume data for ${value[0].currentDate} successfully saved`)
});

module.exports = etfs;