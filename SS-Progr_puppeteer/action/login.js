const path = require('path');


const {  getlog } = require('../core/browser&login.js');
const {Get_and_Download} = require('../core/Get_And_Download.js');



(async () => {
    // Récupérer les arguments passés depuis Python
    const trial = process.argv[2]; // Le deuxième argument est l'étude (trialGroup)
    //const trial = "better2"
    browser=await getlog(trial);

    

   await Get_and_Download(browser,trial)



})();


// -----------------------------------------------------------------------------------------------------------------------------------------------------------------//
//                                                      SCRAP - lancer le telechargement pour une étude                                                             //
// -----------------------------------------------------------------------------------------------------------------------------------------------------------------//

