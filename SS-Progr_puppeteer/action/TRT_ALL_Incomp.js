const path = require('path');
const {  Create_log,getlog } = require('./SS-Progr puppeteer/browser&login.js');
const browserObject = require('./SS-Progr puppeteer/browser');
const {Get_and_Download} = require('./SS-Progr puppeteer/Get_And_Download.js');
const {get_form} = require('./SS-Progr puppeteer/get_and_complete.js');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fs5 = require('fs');

global.downloadsDir = 'C:/Users/a_mangin/Downloads';

global.maxAttempts = 3;
let groupFunctions = [];
let urlsToProcess = [];
(async () => {
    const trial = "mucila";

    const patient = "false";
    const query_res = "false";
    const discrep_req = "false";
    const user_req = "true";
    console.log("Connexion à scrap...");
    
    let browserInstance = browserObject.startBrowser("new");
    let browser = await browserInstance;
    const log = await Create_log(trial);
    await getlog(browser, log);

    let Study_FIle = `./www/Download/${trial}`;
    const QueryByForm = `${Study_FIle}/QueryByForm.json`;

    // Lire et parser le fichier JSON
    const jsonQueryByForm = JSON.parse(await fs.readFile(QueryByForm, 'utf8'));

    // Filtrer pour "iCRF Status": "Incomplete"
    const filteredjsonQuery = jsonQueryByForm.filter(query => query['iCRF Status'] === 'Incomplete' && query["Open Queries/Discrepancies"]=="0");
    let groupFunctions = [];
    let urlsToProcess = [];
 

    // Boucler sur les éléments filtrés et préparer les fonctions qui lanceront les promesses
    for (const query of filteredjsonQuery) {
        const pat=`${query["Patient"]} - ${query["Visit"]}  - ${query["Visit"]} - ${query["iCRF_link"]}`
        const iCRFUrl = query['iCRF_url'];
        const base = "https://ecrftm50.gustaveroussy.fr/50036/TrialMaster/Form/Icrf/";

        const regex = /fIcrf%2f(\d+)%3fretur/;
        const match = iCRFUrl.match(regex);

        if (match && match[1]) {
            const number = match[1];  // Capturer le nombre
            console.log(`Le nombre extrait est : ${number}`);

            // Ajouter une fonction qui retourne la promesse lorsque l'on veut l'exécuter
            groupFunctions.push(() => get_form(browser, base + number,pat,true));
        } else {
            console.log("Le nombre n'a pas pu être extrait");
        }
    }
    let filteredResults = [];
    // Boucle pour exécuter les promesses par lots de 3
    for (let i = 0; i < groupFunctions.length; i += 1) {
        console.log(`${i} sur ${groupFunctions.length}`)
        // Créer un sous-groupe de 3 fonctions (ou moins si on est à la fin du tableau)
        const group = groupFunctions.slice(i, i + 1);

        // Exécuter les fonctions et attendre les promesses
          // Exécuter les fonctions et attendre les promesses
    const results = await Promise.all(group.map(func => func()));

    // Filtrer les résultats non nuls (les URLs renvoyées par get_form)
    //filteredResults = results.filter(url => url !== null);
        // console.log(`Groupe de ${group.length} traitements terminé.`);
    }
// console.log(filteredResults)

// for (const link of filteredResults){

//     await get_form(browser, link,"pat",true)
// }

    console.log('Tous les traitements sont terminés.');
})();





// -----------------------------------------------------------------------------------------------------------------------------------------------------------------//
//                                                      SCRAP - lancer le telechargement pour une étude                                                             //
// -----------------------------------------------------------------------------------------------------------------------------------------------------------------//

