const path = require('path');
const fs5 = require('fs');
const { Create_log, getlog } = require('./SS-Progr puppeteer/browser&login.js');
const browserObject = require('./SS-Progr puppeteer/browser');
const { Get_and_Download } = require('./SS-Progr puppeteer/Get_And_Download.js');
const puppeteer = require('puppeteer');

global.downloadsDir = 'C:/Users/a_mangin/Downloads';
global.maxAttempts = 3;




(async () => {

    
    async function retryOperation(action, args = [], timeout = 5000, retryDelay = 500) {
        const startTime = Date.now();
        let success = false;
    
        while (!success && (Date.now() - startTime) < timeout) {
            try {
                // Tente d'exécuter l'action avec les arguments fournis
                await action(...args);
                success = true;
                //console.log("Action réussie !");
                await new Promise(r => setTimeout(r, 600)); // Pause facultative après succès
            } catch (error) {
              //  console.log("Échec de l'action, réessaye...");
                await new Promise(resolve => setTimeout(resolve, retryDelay)); // Attendre avant de réessayer
            }
        }}


    let browserInstance = browserObject.startBrowser("new");
    let browser = await browserInstance;

    async function CheckUser(user,trial) {
        const page = await browser.newPage();
        let url = "https://ecrftm50.gustaveroussy.fr/eLearning50/webapp/admin/UserAdmin.aspx?engineID=20a7e59ea2eb4b32bcb938288854c12b";
        await page.goto(url);
        await page.click('#lbSearch');



        const check = async () => {
            await page.type('#tbSearchLoginName', user);
            await page.click('#Ok');
            await new Promise(r => setTimeout(r, 200))
            
        };
        await retryOperation(check, [], 8000);
        // Sélection du rôle avec retry
        
       let test= await checkTableForStatus(page, trial)
      //  await new Promise(r => setTimeout(r, 1500)); // Pause facultative après succès
      const hasPassed = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table#cgUserAdminS tr'));
        
        // Vérifie si au moins une ligne a "Passed" dans la 8ème colonne
        const hasMatchingRow = rows.some(row => {
            const cell = row.querySelector('td:nth-child(8)'); // Sélectionner la 8ème colonne de la ligne
            return cell && cell.innerText.includes("Passed"); // Vérifier si le texte contient 'Passed'
        });
    
        return hasMatchingRow; // Renvoie true ou false
    });
       
//console.log(user," pour better2",test)

        await page.close();
//console.log(`${user} sur HRNBL2 = ${test} , tt = ${hasPassed} `)
        if (test=="Passed")res="OK"
        else if (test=="Open"&&  hasPassed==true) res="A valider";
        else res="Elearning non fait";
        return res;
    }

    async function checkTableForStatus(page, study) {
        // Capturer les logs du navigateur pour le débogage
        //page.on('console', msg => console.log(`Message de la page: ${msg.text()}`));
    
        // Récupérer les lignes qui contiennent 'study' dans la 3ème colonne
        const results = await page.evaluate((studyKeyword) => {
            // Sélectionner toutes les lignes dans le tbody de la table avec l'ID #cgUserAdminS
            const rows = Array.from(document.querySelectorAll('#cgUserAdminS > tbody > tr'));
            
            // Filtrer les lignes où la 3ème colonne (td:nth-child(3)) contient le mot-clé
            const matchingRows = rows.filter(row => {
                const cell = row.querySelector('td:nth-child(3)'); // Sélectionner la 3ème colonne de la ligne
                return cell && cell.innerText.includes(studyKeyword); // Vérifier si le texte contient 'study'
            });
    
            // Pour chaque ligne trouvée, récupérer le contenu de la 8ème colonne de la 17ème ligne
            const contents = matchingRows.map(row => {
                    const targetCell = row.querySelector('td:nth-child(8)'); // Sélectionner la 8ème colonne de la 17ème ligne
                    console.log(targetCell)
                    return targetCell ? targetCell.innerText : ""; // Retourner le texte ou null si pas trouvé
                })
              
            return contents; // Retourner les contenus trouvés
        }, study);
       
        // Vérifier si au moins un résultat est 'Open' ou une chaîne vide
        const hasOpenOrEmpty = results.some(content => content === 'Open');
    
  
        // Retourner 'Open' si au moins un résultat correspond, sinon 'Passed'
        const finalResult = hasOpenOrEmpty ? 'Open' : 'Passed';
    
     
        //console.log(`Résultat final pour "${study}": ${finalResult}`);
        return finalResult; // Retourner le résultat final
    }
    

    async function evaluate_study(trial) {
        const data = await fs5.promises.readFile(`./www/Download/${trial}/Contact.json`, 'utf8');
        const jsonData = JSON.parse(data); // Convertir les données JSON en objet JavaScript
        const fjsonData = jsonData.filter(data=> !data.username.includes("tmsystem") &&
         !data.username.includes("setupuser") && 
         !data.username.includes("tmimport")   && 
         !data.username.includes("tmvalidation")  && 
         !data.username.includes("tmimport") );
         //console.log(fjsonData)
        // Fonction pour gérer les utilisateurs par groupe de 10
        async function processBatch(batch) {
            const results = await Promise.all(batch.map(user => CheckUser(user.username,trial)));
            return results        }

        const batchSize = 1;
        for (let em = 0; em < fjsonData.length; em += batchSize) {
            try{
            const batch = fjsonData.slice(em, em + batchSize); // Prendre un groupe de 10 utilisateurs
            results= await processBatch(batch); // Traiter le groupe en parallèle
            results.forEach((result, index) => {
                if(result == "A valider") console.log( `user ${em} sur ${fjsonData.length}`, " ", batch[index].username, result);
             });
            }catch{ console.log("error on",em)}
        }
        console.log("FINIS !!!")

    }


    evaluate_study("better2");
})();
