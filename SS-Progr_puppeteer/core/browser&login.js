// ancien nom pageSCraper.js
var fs = require('fs').promises;
const puppeteer = require('puppeteer');



const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};

async function startBrowser(resp){
	let browser;
	
	try {
	    console.log("Opening the browser......");

	    browser = await puppeteer.launch({
	        headless: false,
			ignoreDefaultArgs: ['--disable-extensions'],
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
			browserContext: 'default',
			defaultViewport: null,
			timeout: 90000,


	    });
	} catch (err) {
	    console.log("Could not create a browser instance => : ", err);
	}
	return browser;
}

//,args: ["--disable-setuid-sandbox"],'ignoreHTTPSErrors': true


// -----------------------------------------------------------------------------------------------------------------------------------------------------------------//
//                                                    Create_log - permet de setup log                                                                              //
// -----------------------------------------------------------------------------------------------------------------------------------------------------------------//

async function retryOperation(action, args = [], timeout = 5000, retryDelay = 500) {
    const startTime = Date.now();
    let success = false;

    while (!success && (Date.now() - startTime) < timeout) {
        try {
            // Tente d'exécuter l'action avec les arguments fournis
            await action(...args);
            success = true;
            console.log("Action réussie !");
            await new Promise(r => setTimeout(r, 600)); // Pause facultative après succès
        } catch (error) {
            console.log("Échec de l'action, réessaye...");
            await new Promise(resolve => setTimeout(resolve, retryDelay)); // Attendre avant de réessayer
        }
    }

    if (!success) {
        console.log(`Échec de l'action après ${timeout} millisecondes.`);
    }
}

async function Create_log(study) {
    try {
        const data = await fs.readFile('./www/download/UserData.json', 'utf8');

        // Analyser les données JSON
        const jsonData = JSON.parse(data);

        // Rechercher les informations associées au "trial" spécifié
        const trialInfo = jsonData.find(entry => entry.trialGroup === study);

        if (!trialInfo) {
            console.error("Trial non trouvé :", study);
            throw new Error("Trial non trouvé");
        }

        // Extraire les informations d'utilisateur associées au "trial"
        const username = trialInfo.username;
        const password = trialInfo.password;
        const userRole = trialInfo.userRole;
        const mylog = { trial: study, user: username, pass: password, roleid: userRole };
       // console.log(mylog);

        return mylog;
    } catch (error) {
        console.error("Erreur dans la fonction Create_log", error);
        throw error;
    }
}

async function selection_du_role(page, role) {
    console.log("Début de la fonction selection_du_role");

    if (await page.$('#MainContainer > div > input')) {
        console.log("Page de sélection du rôle détectée.");

        // Récupère tous les labels
        const labels = await page.$$eval('label.k-radio-label', labels => labels.map(label => label.textContent.trim()));

        // Recherche de l'index du label correspondant au rôle spécifié
        const roleIndex = labels.findIndex(label => label === role);

        if (roleIndex !== -1) {
            console.log(`Rôle "${role}" trouvé, tentative de sélection.`);
            
            // Sélection du rôle via un clic avec mécanisme de réessai
            const selectRole = async () => {
                await page.$$eval('input.k-radio', (inputs, index) => inputs[index].click(), roleIndex);
            };

            // Sélection du rôle avec retry
            await retryOperation(selectRole, [], 60000);

            // Clic sur le bouton de soumission avec mécanisme de réessai
            const clickSubmit = async () => {
                await page.click('input[type="submit"]');
            };

            // Soumission du formulaire avec retry
            await retryOperation(clickSubmit, [], 60000);

            console.log("Rôle sélectionné et formulaire soumis.");
        } else {
            console.error(`Le rôle "${role}" n'a pas été trouvé.`);
        }
    } else {
        console.error("La page de sélection du rôle n'a pas été détectée.");
    }
}

async function changement_mdp(page,oldp,newp){

    const changePW = async () => {
        await page.type('input[name=OldPassword]', oldp);
        await page.type('input[name=NewPassword]', newp);
        await page.type('input[name=ConfirmPassword]', newp);
        await page.click('input[type="submit"]');  
    };

    await retryOperation(changePW, [], 5000);
    const reassignpw = async () => {
     await page.goto("https://ecrftm50.gustaveroussy.fr/50036/TrialMaster/Manage/ChangeLoginPassword")
     await page.type('input[name=OldPassword]', newp);
     await page.type('input[name=NewPassword]',oldp );
     await page.type('input[name=ConfirmPassword]', oldp);
     await page.click('input[type="submit"]'); 
    };
    await retryOperation(reassignpw, [], 5000);

    }
    

    async function option_connexion(page){
        return  await page.evaluate(() => {
        const select_role = document.querySelector('input[type="submit"].btn.btn-primary[title="Select Role"]');
        const changement_pw = document.querySelector('input[value="Change password"]');
        const timing = document.querySelector('#yes_btn');



        
           if (select_role) return "Select Role"
            else if(changement_pw) return "ChangePW"
            else if(timing) return "Delai"
            else return "None"
        })
    }

    
    async function saisir_compte(page,log){
        console.log("betude saisir_compte")

const typeTrial = async () => {
    await page.type('#txtTrialGroupName', log.trial);
    await page.type('#txtUsername', log.user);
    await page.type('#Password', log.pass);
    await page.click("#btnLogin");  
};
await retryOperation(typeTrial, [], 5000);
        }
        


	async function getlog(trial){

        console.log("Connexion à scrap...");
        let browser= await startBrowser("new");
        const log = await Create_log(trial);
    
       console.log("betude getlog")
        const url= 'https://ecrftm50.gustaveroussy.fr/50036/TrialMaster/Account/Login';
        const page = await browser.newPage();
        await page.goto(url);
        await saisir_compte(page,log);
         let choix="";
         let prev="";
         while (choix !="None"){
choix=await option_connexion(page)
console.log(choix)
if (choix=="Delai")await page.click('#yes_btn'); 
else if (choix=="ChangePW") await changement_mdp(page,"Chocolat33!","Ch0capic33")
else   if (choix=="Select Role" && prev!="Select Role") await selection_du_role(page,log.roleid);   
prev=choix
await new Promise(r => setTimeout(r, 800));
}
return browser;
    // await page.close;

	}



module.exports = {
    getlog: getlog,
};
