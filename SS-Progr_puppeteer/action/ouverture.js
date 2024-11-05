const path = require('path');
const {  getlog } = require('../core/browser&login.js');

const puppeteer = require('puppeteer');

global.downloadsDir = 'C:/Users/a_mangin/Downloads';

global.maxAttempts = 3;

(async () => {
    // Récupérer les arguments passés depuis Python
     const trial = process.argv[2]; // Le deuxième argument est l'étude (trialGroup)
     const url = process.argv[3]

     const browser=await getlog(trial);


    const page = await browser.newPage();
    await page.goto(url);

})();


// -----------------------------------------------------------------------------------------------------------------------------------------------------------------//
//                                                      SCRAP - lancer le telechargement pour une étude                                                             //
// -----------------------------------------------------------------------------------------------------------------------------------------------------------------//

