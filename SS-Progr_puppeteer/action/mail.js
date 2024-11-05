const puppeteer = require('puppeteer');
const fs5 = require('fs');
const path = require('path');
const fs = require('fs').promises;
//const study="better2"
//const site="01-Gustave Roussy"
const study=process.argv[2]
const site=process.argv[3]


async function getHtmlContent(url) {
    const browser = await puppeteer.launch(); // Lance un navigateur sans tête
    const page = await browser.newPage(); // Ouvre une nouvelle page
    await page.goto(url, { waitUntil: 'networkidle2' }); // Charge la page

    const htmlContent = await page.content(); // Récupère le contenu HTML de la page

    await browser.close(); // Ferme le navigateur
    return htmlContent;
}

async function createEmlFile(study,site) {

    await ensureDirectoryExists(`../relance/${study}`)
    // Récupérer le contenu HTML de l'URL
     const url = `http://127.0.0.1:3000/mail.html?etude=${study}&centre=${site}`;
    
    const htmlContent = await getHtmlContent(url);
    
    if (!htmlContent) {
        console.error('Le contenu HTML est vide ou introuvable.');
        return;
    }

    async function ensureDirectoryExists(directory) {
        console.log("test")
        fs5.access(directory, fs5.constants.F_OK, (err) => {
            if (err) {
                fs.mkdir(directory, { recursive: true }, (err) => {
                    if (err) console.error(`Erreur lors de la création de ${directory} : ${err}`);
                    else console.log(`${directory} a été créé.`);
                });
            } else {
                console.log(`${directory} existe.`);
            }
        });
    }

    async function get_adresse(trial,Monsite,mrole,mrole2) {
        try {
            
            const data =  await fs5.promises.readFile(`./www/download/${trial}/Contact.json`, 'utf8');
            const jsonData =  await JSON.parse(data); // Convertir les données JSON en objet JavaScript
            console.log(jsonData)
            // Filtrer les données pour obtenir les adresses du site spécifique
            const filteredData = await jsonData.filter(item =>
                !item.username.includes(2) &&  !item.prefix.includes("NONE")  &&
                item.ROLE.some(role =>
                    role.SITE.some(site =>
                        site.Site === Monsite
                    )
                )&&
                item.ROLE.some(role =>role.role.includes(mrole) || role.role.includes(mrole2))
                    
                )
            ;
    
            return filteredData;
        } catch (error) {
            console.error("Erreur lors de la lecture du fichier :", error);
        }
    }


 
    
    emails= await get_adresse(study,site,"ARC","CRA")
 
    to=""
    for (em=0;em<emails.length;em++){

   
        to = to + emails[em].email + ";"; // Créez un nouvel objet 'to' à chaque itération

    
    }
    console.log(to)

    emailscc= await get_adresse(study,site,"Moni","Moni")
   
    cc=""
    for (em=0;em<emailscc.length;em++){

   
        cc = cc + emailscc[em].email + ";"; // Créez un nouvel objet 'to' à chaque itération

    
    }
    console.log(cc)

    // Contenu de l'email au format .eml avec le HTML récupéré
    const emlContent = `Subject: ${study} -  ${site} _ Etat de la base 
From: anthony.mangin@gustaveroussy.fr
To: ${to}
Cc:${cc}
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: 7bit
MIME-Version: 1.0

${htmlContent}`;

    // Chemin du fichier à créer
    const emlFilePath = `./www/relance/${study}/${study}_${site}.eml`;

    // Écriture du fichier .eml avec le contenu de l'email
    fs.writeFile(emlFilePath, emlContent, { encoding: 'utf8' }, (err) => {
        if (err) {
            console.error('Erreur lors de la création du fichier .eml:', err);
            return;
        }
        console.log('Le fichier .eml a été créé avec succès.');
    });




    const { exec } = require('child_process');

    // Chemin vers le fichier VBS et les arguments
    const vbsFilePath = 'C:/Users/a_mangin/\Documents/SERVER3/convert.vbs';
    
    
    // Commande pour exécuter le script VBS avec les arguments
    const command = `cscript "${vbsFilePath}" "${study}" "${site}"`;
    console.log(command)
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur lors de l'exécution du script VBS : ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Erreur dans le script VBS : ${stderr}`);
            return;
        }
        console.log(`Sortie du script VBS : ${stdout}`);
    });
    



}

// Appel de la fonction pour créer le fichier .eml

createEmlFile(study,site);
