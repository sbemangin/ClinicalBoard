
const fs = require('fs').promises;
const fs5 = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');


const {renameFileAsync,getMostRecentExcelFile,countXlsFilesInDirectory,ensureDirectoryExists} = require('C:/Users/a_mangin/Documents/SERVER3/SS-Progr_puppeteer/core/DownFunction.js');
  


  
    async function Get_and_Download(browser, trial) {
 
        const Study_FIle = `./www/Download/${trial}`;
        const raw_file=`${Study_FIle}/RAW`;
        console.log("Lancement de Get and Download");
        
        await ensureDirectoryExists(Study_FIle);
        await ensureDirectoryExists(raw_file);
        
        let nbfichier = await countXlsFilesInDirectory(raw_file);
        console.log(`${nbfichier} fichiers présents de base`);
        const page = await browser.newPage();
        //await import_Table(page, Study_FIle, nbfichier);
     


 // partie creation de XML
 const queryUrls = [
    { link:"https://ecrftm50.gustaveroussy.fr/50036/TrialMaster/PatientListView/Grid", fileName: "patientList.html"},
    { link:"https://ecrftm50.gustaveroussy.fr/50036/TrialMaster/ReportsAdvanced/GetReport?t=87",fileName: "QueryBySite.html"},
    {  link:"https://ecrftm50.gustaveroussy.fr/50036/TrialMaster/ReportsAdvanced/GetReport?t=88",fileName: "QueryByTypeForm.html"},
    {  link:"https://ecrftm50.gustaveroussy.fr/50036/TrialMaster/ReportsAdvanced/GetReport?t=51",fileName: "QueryByForm.html"},
    {  link:'https://ecrftm50.gustaveroussy.fr/50036/TrialMaster/Task/QueryTask?t=36',fileName: "Query.html"},
    {  link:"https://ecrftm50.gustaveroussy.fr/50036/TrialMaster/Task/DiscrepancyTask?t=99",fileName: "Discrepancy.html"},
    {  link:"https://ecrftm50.gustaveroussy.fr/50036/TrialMaster/ReportsAdvanced/GetReport?t=70",fileName: "AssignRole.html"}
];
 
const downloadPath = path.resolve(`${raw_file}`);
fs5.mkdirSync(downloadPath, { recursive: true });

await page._client().send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
});

for (const query of queryUrls) {
    await page.goto(query.link, { timeout: 0 });

    //         await new Promise(r => setTimeout(r, 2000));




    const clicked = await page.evaluate(() => {
        const element = document.querySelector('span[title="Export to Excel"]');
        if (element) {
            element.click();
            return true;  // Clic réussi
        }
        return false;  // Élement non trouvé
    });

    if (clicked) {
        console.log("Clic effectué sur le bouton d'export vers Excel");
    } else {
        console.log("Le bouton d'export vers Excel n'a pas été trouvé.");
    }
    await new Promise(r => setTimeout(r, 400));
    const patientfile = await getMostRecentExcelFile(raw_file, nbfichier);
    await new Promise(r => setTimeout(r, 400));
    await renameFileAsync(
        path.join(raw_file, 'GridExport.xls'),
        `${raw_file}/${query.fileName}`
    );
     await new Promise(r => setTimeout(r, 400));
     await Get_To_JSON(`${raw_file}/${query.fileName}`, `${Study_FIle}/${query.fileName.replace('.html', '.json')}`);
     await new Promise(r => setTimeout(r, 400));
    };

console.log("fin de la save brut")
await new Promise(r => setTimeout(r, 400));



            console.log("on est a get_stat_pat")
             await updateQueryByForm(Study_FIle);
            await get_stat_pat(Study_FIle);
            await create_metrics(Study_FIle);
            await Add_form_by_pat_to_site(Study_FIle);
            await Add_metric_to_site(trial);
            await trial_user_update(Study_FIle,page);
            await count_query_form(Study_FIle)
     
    
        await browser.close();
    }
    


    async function updateQueryByForm(Study_FIle) {
        const QueryByFom = `${Study_FIle}/QueryByForm.json`;
    
        try {
            const jsonQueryByFom = JSON.parse(await fs.readFile(QueryByFom, 'utf8'));
    
            const formsToCheck = [
                {text: "3months", type: "Follow-up"},
                {text: "patient information", type: "Inclusion"},
                {text: "randomization", type: "Inclusion"},
                {text: "registration", type: "Inclusion"},
                {text: "enrollm", type: "Inclusion"},
                {text: "adverse", type: "AE"},
                {text: "SAE", type: "AE"},
                {text: "recist", type: "Recist"},
                {text: "progression", type: "Progression"},
                {text: "relapse", type: "Progression"},
                {text: "follow", type: "Follow-up"},
                {text: "end of study", type: "End of study"},
                {text: "death", type: "Death"},
                {text: "baseline", type: "Baseline"},
                {text: "assessment", type: "Baseline"},
                {text: "after end of treatment", type: "Follow-up"},
                {text: "end of induction", type: "Evaluation"},
                {text: "end of consolidation", type: "Evaluation"},
                {text: "mid induction", type: "Evaluation"},
                {text: "evaluation", type: "Evaluation"},
                {text: "cycle", type: "Treatment"},
                {text: "treatment", type: "Treatment"},
                {text: "traite", type: "Treatment"},
                {text: "surgery", type: "Treatment"},
                {text: "consolidation", type: "Treatment"},
                {text: "screening", type: "Baseline"},
                {text: "week", type: "Treatment"},
                {text: "w?d1", type: "Treatment"},
                {text: "radiotherapy", type: "Treatment"},
                {text: "maintenance", type: "Treatment"},
                {text: "neo-adjuvant", type: "Treatment"},
                {text: "ae", type: "AE"},
                {text: "FU", type: "Follow-up"}
            ];
    
            const updatedEntries = jsonQueryByFom.map(entry => {
                const Visit = entry.Visit;
                const stat = entry["iCRF Status"];
                const eCRF = entry["iCRF_link"];
                const visitName = enleverChiffresEtSlash(Visit);
                const FORMname = enleverChiffresEtSlash(eCRF);
                const dates = [trouverDate(eCRF), trouverDate(entry["Visit Date"]), trouverDate(Visit)];
                const alt_dates = entry["Last Status Update"];
                const datePart = alt_dates.split(' ')[0]; // "18/04/2024"
    
                // Vérifier si la date est au format "dd/mm/yyyy"
                const [day, month, year] = datePart.split('/');
                const alt_formattedDate = `${day}/${month}/${year}`;
                const finaldate = dates.find(date => date !== null);
                let typeOfForm = "Other";
    
                formsToCheck.forEach(form => {
                    if (typeOfForm === "Other" && (FORMname.toLowerCase().includes(form.text) || visitName.toLowerCase().includes(form.text))) {
                        typeOfForm = form.type;
                    }
                });
    
                // Condition pour appliquer alt_formattedDate si finaldate est null et que typeOfForm est l'un des spécifiés
                const dateToUse = finaldate || (((typeOfForm === "Progression" || typeOfForm === "Follow-up" || typeOfForm === "End of study") && stat !="No Data") ? alt_formattedDate : "unknown");
    
                return {
                    ...entry,
                    TypeOfForm: typeOfForm,
                    date: dateToUse
                };
            });
    
            await fs.writeFile(QueryByFom, JSON.stringify(updatedEntries, null, 2));
            console.log('QueryByForm.json updated successfully.');
        } catch (error) {
            console.error('Error updating QueryByForm.json:', error);
        }
    }
    async function get_stat_pat(Study_FIle, centre) {
        const QueryByFomPath = `${Study_FIle}/QueryByForm.json`;
        const patientListPath = `${Study_FIle}/patientList.json`;
    
        // Lire et parser le fichier QueryByForm.json
        const jsonQueryByFom = JSON.parse(await fs.readFile(QueryByFomPath, 'utf8'));
    
        // Filtrer les données par statut et éventuellement par centre
        const filteredJsonQueryByFom = jsonQueryByFom.filter(entry => 
            entry["iCRF Status"] !== "No Data" && (!centre || entry["Site"] === centre ) && entry["Visit"] != "" &&  entry["date"] != "unknown"  
        );
        let visitDate = {};
    
        // Parcourir les entrées filtrées
        filteredJsonQueryByFom.forEach(entry => {
            const Patient = entry.Patient;
            const TypeOfForm = entry.TypeOfForm;
            const formDate = parseDate(entry.date);
    
            if (!visitDate[Patient]) {
                visitDate[Patient] = {};
            }
    
            if (formDate) {
                if (!visitDate[Patient][TypeOfForm]) {
                    visitDate[Patient][TypeOfForm] = formDate;
                } else {
                    visitDate[Patient][TypeOfForm] = new Date(Math.max(visitDate[Patient][TypeOfForm], formDate));
                }
            }
        });
    
    
    
        // Lire les données des patients
        const patientListData = JSON.parse(await fs.readFile(patientListPath, 'utf8'));
    
        // Mettre à jour patientListData avec les dates de visitDate
        patientListData.forEach(patient => {
            const patientID = patient["Patient Caption_link"]; // Assurez-vous que c'est la clé unique
            if (visitDate[patientID]) {
                // Ajouter ou mettre à jour les informations de date
                Object.keys(visitDate[patientID]).forEach(typeOfForm => {
                    const date = visitDate[patientID][typeOfForm];
                    // Assurez-vous que la date est valide avant de la convertir
                    patient[typeOfForm] = date instanceof Date && !isNaN(date.getTime()) 
        ? `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
        : null;
                });
            }
        });
    
    
        patientListData.forEach(patient => {
            // console.log(patient);
            patient.statut = determinePatientStatus(patient);
           
        });
        
    
        // Trier les données par patient
        patientListData.sort((a, b) => a["Patient Caption_link"].localeCompare(b["Patient Caption_link"]));
    
        // Écrire les données mises à jour dans patientList.json
        await fs.writeFile(patientListPath, JSON.stringify(patientListData, null, 2), 'utf8');
    
        console.log(`Les données ont été mises à jour dans ${patientListPath}`);
    }

    

    
async function create_metrics(Study_FIle) {

    const patientListPath = path.join(Study_FIle, 'patientList.json');
    const QueryPath = path.join(Study_FIle, 'patientList.json');

    // Lire le fichier patientList.json
    const patientListData = JSON.parse(await fs.readFile(patientListPath, 'utf8'));

    // Initialiser les variables pour les statistiques
    const metrics = {
        totalPatients: 0,
        statusCounts: {},
        lastInclusionDate: null,
        currentYearInclusions: 0,
        previousYearInclusions: 0
    };

    // Obtenir l'année en cours et l'année précédente
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    patientListData.forEach(patient => {
        metrics.totalPatients += 1;

        // Compter les statuts
        const status = patient["statut"];
        if (status) {
            metrics.statusCounts[status] = (metrics.statusCounts[status] || 0) + 1;
        }
        

        // Calculer la dernière date d'inclusion
        const inclusionDateString = patient["Inclusion"] ?? patient["Baseline"];
        if (inclusionDateString) {
            const inclusionDate =parseDate(inclusionDateString);
            //console.log(inclusionDate)
            if (!metrics.lastInclusionDate || inclusionDate > metrics.lastInclusionDate) {
                metrics.lastInclusionDate = inclusionDate ;
            }

            // Vérifier si l'inclusion est dans l'année en cours ou précédente
            const inclusionYear = inclusionDate.getFullYear();
            if (inclusionYear === currentYear) {
                metrics.currentYearInclusions += 1;
            } else if (inclusionYear === previousYear) {
                metrics.previousYearInclusions += 1;
            }
        }
    });

    // Convertir lastInclusionDate en format DD/MM/YYYY si elle existe
    if (metrics.lastInclusionDate) {
        const lastInclusionDate = new Date(metrics.lastInclusionDate);
        const day = lastInclusionDate.getDate().toString().padStart(2, '0');
        const month = (lastInclusionDate.getMonth() + 1).toString().padStart(2, '0');
        const year = lastInclusionDate.getFullYear();
        metrics.lastInclusionDate = `${day}/${month}/${year}`;
    }

    // Écrire les données dans metrics.json
    const metricsPath = path.join(Study_FIle, 'metrics.json');
    await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2), 'utf8');

    console.log(`Les données ont été mises à jour dans ${metricsPath}`);
}




    // async function clickIfExists(selector) {
    //     try {
    //         await page.waitForSelector(selector, { timeout: 3000 }); // Attendre que le sélecteur soit présent
    //         await page.click(selector); // Si présent, effectuer le clic
    //         console.log(`Clic effectué sur le sélecteur : ${selector}`);
    //     } catch (error) {
    //         console.log(`Sélecteur non trouvé : ${selector}`);
    //     }
    // }



       
      async function Add_form_by_pat_to_site(Study_FIle) {
        console.log("Lancement de Add_form_by_pat_to_site");
        
    
        try {
            // Charger les données JSON depuis les fichiers
            const queryData = await fs.readFile(`${Study_FIle}/Query.json`, 'utf8');
            const patientListData = await fs.readFile(`${Study_FIle}/patientList.json`, 'utf8');
    
            // Analyser les données JSON
            const queryDataParsed = JSON.parse(queryData);
            const patientListDataParsed = JSON.parse(patientListData);
    
            // Créer une correspondance entre les clés "Patient Caption_link" et "Patient Caption_url"
            const patientMap = new Map();
            patientListDataParsed.forEach(patientItem => {
                patientMap.set(patientItem["Patient Caption_link"], patientItem["Patient Caption_url"]);
            });
    
            // Mettre à jour les données de Query.json
            queryDataParsed.forEach(item => {
                const patientCaptionLink = item["Patient Caption_link"];
                if (patientMap.has(patientCaptionLink)) {
                    item["Patient Caption_url"] = patientMap.get(patientCaptionLink);
                }
            });


        }catch{}}


    //console.log(queryDataParsed)
            // Écrire les données mises à jour dans Query.json
    //         await fs.writeFile(`${Study_FIle}/Query.json`, JSON.stringify(queryDataParsed, null, 2), 'utf8');
    
    //         console.log(`Les données ont été mises à jour dans ${Study_FIle}/Query.json`);
    //     } catch (error) {
    //         console.error('Une erreur est survenue :', error);
    //     }
    // }


    
    
      
  async function Add_metric_to_site(trial){

    let Study_FIle=`./www/Download/${trial}`;
  
    console.log("Lancement de Add_metric_to_site");
    const QueryByFom = `${Study_FIle}/QueryByForm.json`;
    const Query = `${Study_FIle}/Query.json`;
    const Discrepancy = `${Study_FIle}/Discrepancy.json`;
    const QueryBySite = `${Study_FIle}/QueryBySite.json`; // Utilisation d'un nouveau nom de fichier pour éviter de modifier le fichier d'origine
    const metricsFilePath = `${Study_FIle}/metrics.json`; // Utilisation d'un nouveau nom de fichier pour éviter de modifier le fichier d'origine
let ttresponse=0;
  
        const jsonQuery = JSON.parse(fs5.readFileSync(Query, 'utf8'));
        const jsonQueryByFom = JSON.parse(fs5.readFileSync(QueryByFom, 'utf8'));
        const jsonDiscrepancy = JSON.parse(fs5.readFileSync(Discrepancy, 'utf8'));
        const jsonQueryBySite = JSON.parse(fs5.readFileSync(QueryBySite, 'utf8'));
        const jsonmetrics = JSON.parse(fs5.readFileSync(metricsFilePath, 'utf8'));
                      
        const dataBySite = {};
    
    


jsonQuery.forEach(entry => {
    const site = entry.Site;
    const status_query = entry.Status; // Ajout de la vérification du statut



    


        // Vérifier si le site existe déjà dans l'objet dataBySite
            if (!dataBySite[site]) {
                dataBySite[site] = {            
                    nombrePatients: new Set(),
                    nombreFiches: 0,
                    nombreComplete: 0, // Initialiser le compteur pour les fiches Complete
                    nombreIncomplete: 0, // Initialiser le compteur pour les fiches Incomplete
                    nombreMonitored: 0, // Initialiser le compteur pour les fiches Monitored
                    nombreNoData: 0, // Initialiser le compteur pour les fiches No Data
                    nombreMissing: 0,
                    nombreWarning: 0,
                    nombreResponded: 0,
                    nombreSS_relance: 0
                };
            }
    
        // Incrémenter le nombre de fiches pour le site
            if (status_query=="Responded"){
                dataBySite[site].nombreResponded++;
                ttresponse++;
            }
    });
    console.log("total responded : ",ttresponse)

    jsonmetrics.totalResponded = ttresponse;

    await fs.writeFile(metricsFilePath, JSON.stringify(jsonmetrics, null, 2));














        // Parcourir les données JSON pour effectuer le comptage
        jsonQueryByFom.forEach(entry => {
            const site = entry.Site;
            const status = entry["iCRF Status"]; // Ajout de la vérification du statut
            const relanced = entry["relanced"];
            const Daterelanced = entry["Daterelanced"];
    const openq=parseInt(entry["Open Queries/Discrepancies"]);
    
        // Vérifier si le site existe déjà dans l'objet dataBySite
            if (!dataBySite[site]) {
                dataBySite[site] = {
                    nombreFiches: 0,
                    nombrePatients: new Set(),
                    nombreComplete: 0, // Initialiser le compteur pour les fiches Complete
                    nombreIncomplete: 0, // Initialiser le compteur pour les fiches Incomplete
                    nombreMonitored: 0, // Initialiser le compteur pour les fiches Monitored
                    nombreNoData: 0, // Initialiser le compteur pour les fiches No Data
                    nombreMissing: 0,
                    nombreWarning: 0,
                    nombreResponded: 0,
                    nombreSS_relance: 0,
                    Last_relance :new Date()
                };
            }
    
        // Incrémenter le nombre de fiches pour le site
            dataBySite[site].nombreFiches++;
    
        // Incrémenter le compteur pour chaque statut
            switch (status) {
                case 'Complete':
                    dataBySite[site].nombreComplete++;
                    break;
                case 'Incomplete':
                    dataBySite[site].nombreIncomplete++;
                    break;
                case 'Monitored':
                    dataBySite[site].nombreMonitored++;
                    break;
                case 'No Data':
                    dataBySite[site].nombreNoData++;
                    break;
            }

            if ( Daterelanced>dataBySite[site].Last_relance &&
                ( (openq>0 && status=="Complete" ) ||
                (status=="Incomplete"|| status=="No Data")
            )) dataBySite[site].Last_relance= Daterelanced;
    
            if (
                ( (openq>0 && status=="Complete" ) ||
                (status=="Incomplete"|| status=="No Data")
            )) dataBySite[site].nombreSS_relance++;

  


            // Ajouter l'identifiant du patient à l'ensemble correspondant au site
            dataBySite[site].nombrePatients.add(entry.Patient);
    });
    
    
    jsonDiscrepancy.forEach(entry => {
    
        const site = entry.Site;
        const message = entry.Message;
    
        // Vérifier si le site existe déjà dans l'objet dataBySite
        if (dataBySite[site]) {
    
        // Incrémenter le compteur correspondant au type de message
        if (message === 'This item is required') {
            dataBySite[site].nombreMissing++;
        } else {
            dataBySite[site].nombreWarning++;
        }
    }
    });
    
        
    // Calculer le rapport nombreFiches / nombrePatients pour chaque site
    for (const site in dataBySite) {
        const { nombreFiches, nombrePatients, nombreFichesParfaites} = dataBySite[site];
        dataBySite[site] = {
            ratioFichesParfaites: (dataBySite[site].nombreComplete +  dataBySite[site].nombreMonitored) /  nombrePatients.size, // Calculer le ratio de fiches parfaites
            ratioFichesrempli: nombreFiches / nombrePatients.size, // Calculer le ratio de fiches actuelles
            nombreComplete: dataBySite[site].nombreComplete,
            nombreIncomplete: dataBySite[site].nombreIncomplete,
            nombreMonitored: dataBySite[site].nombreMonitored,
            nombreNoData: dataBySite[site].nombreNoData,
            nombreWarning: dataBySite[site].nombreWarning,
            nombreMissing: dataBySite[site].nombreMissing,
            nombreResponded: dataBySite[site].nombreResponded,
            nombreSS_relance: dataBySite[site].nombreSS_relance,
            Last_relance:dataBySite[site].Last_relance
        };
    }
    
    
    jsonQueryBySite.forEach(siteEntry => {
        const site = siteEntry.Site;
        if (dataBySite[site]) {
            siteEntry.ratioFichesParfaites = dataBySite[site].ratioFichesParfaites.toFixed(2);
            siteEntry.ratioFichesrempli = dataBySite[site].ratioFichesrempli.toFixed(2);
            siteEntry.nombreComplete = dataBySite[site].nombreComplete;
            siteEntry.nombreIncomplete = dataBySite[site].nombreIncomplete;
            siteEntry.nombreMonitored = dataBySite[site].nombreMonitored;
            siteEntry.nombreNoData = dataBySite[site].nombreNoData;
            siteEntry.nombreWarning= dataBySite[site].nombreWarning;
            siteEntry.nombreMissing= dataBySite[site].nombreMissing;
            siteEntry.nombreResponded= dataBySite[site].nombreResponded;
            siteEntry.nombreSS_relance= dataBySite[site].nombreSS_relance;
            siteEntry.Last_relance= dataBySite[site].Last_relance;
        }
    });
    

    // Enregistrer les données mises à jour dans le fichier QueryBySite.json
    fs.writeFile(QueryBySite, JSON.stringify(jsonQueryBySite, null, 2), err => {
        if (err) {
            console.error('Erreur lors de l\'enregistrement des données dans QueryBySite.json :', err.message);
            return;
        }
        console.log('Les nouvelles données ont été enregistrées avec succès dans le fichier QueryBySite.json.');
    });
    
    
    
    //console.log(dataBySite);

    
    
    }

 

    
    
  async function Get_To_JSON(filePath, output) {
    //console.log("Get JSON")
    return new Promise((resolve, reject) => {
        fs5.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                const $ = cheerio.load(data);
                const tableData = [];
  
                $('table').each((tableIndex, table) => {
                    if (tableIndex === 0) {
                        // Ignore the first table
                        return;
                    }
  
                    const tableColumns = [];
                    $(table).find('thead th').each((columnIndex, column) => {
                        tableColumns.push($(column).text().trim());
                    });
  
                    $(table).find('tbody tr').each((rowIndex, row) => {
                        const rowData = {};
                        $(row).find('td').each((cellIndex, cell) => {
                            const columnName = tableColumns[cellIndex];
                            const cellText = $(cell).text().trim();
  
                            // Check if the cell contains a hyperlink
                            const link = $(cell).find('a');
                            if (link.length > 0) {
                                const linkText = link.text().trim();
                                const linkUrl = link.attr('href'); // Get the URL attribute
                                // Assign both link text and URL to the cell's content
                                rowData[`${columnName}_link`] = linkText;
                                rowData[`${columnName}_url`] = linkUrl;
                            } else {
                                // Dynamically assign keys based on column names
                                rowData[columnName] = cellText;
                            }
                        });
                        tableData.push(rowData);
                    });
                });
  
                fs5.writeFile(output, JSON.stringify(tableData, null, 7), 'utf8', (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`Les données ${filePath} ont été sauvegardées dans ${output}`);
                });
                resolve(tableData);
            }
        });
    });
  }
  
  
async function trial_user_update(Study_FIle,page){

    console.log("Lancement de trial_user_update");
      
    function customSort(a, b) {
        // Compare "Patient Type"
    
        if (a["User Name"] !== b["User Name"]) {
            return a["User Name"].localeCompare(b["User Name"]);
        }
    
        if (a["Role"] !== b["Role"]) {
            return a["Role"].localeCompare(b["Role"]);
        }
        // Si "Patient Type" est le même, compare "Visit Sequence"
    
            return a["Site"] - b["Site"];
    
        // Si "Visit Sequence" est le même, compare "iCRF Sequence"
    }

          let Table_role= await Get_HTML_To_objet(`${Study_FIle}/RAW/AssignRole.html`);
        
          const Table_role_filter= Table_role.sort(customSort).filter( data => data.Status=="Active" && data.Role !="n/a")
    
     let UserAccount=[];
    
     for (let i=0; i<Table_role_filter.length;i++){
        let username=Table_role_filter[i]["User Name"];
        let role=Table_role_filter[i]["Role"];
        let Site=Table_role_filter[i]["Site"];
        let Country=Table_role_filter[i]["Country"];
        let existinguser = UserAccount.findIndex(user => user.username === username);
        //console.log(existinguser)
    if (existinguser===-1) {
        //console.log("ajout" + use)
        UserAccount.push({ username: username, ROLE:[]});
    existingUserIndex = UserAccount.length - 1;
    }
    let existingRole = UserAccount[existingUserIndex].ROLE.findIndex(role => role.role === role);
    
    if (existingRole===-1) {
        //console.log("ajout" + use)
        UserAccount[existingUserIndex].ROLE.push({ role: role, SITE:[]});
    existingRoleIndex = UserAccount[existingUserIndex].ROLE.length - 1;
    }
    
    UserAccount[existingUserIndex].ROLE[existingRoleIndex].SITE.push({ Site:Site,Country:Country });
    
    
    
     }
    

            let nbElement = UserAccount.length+200;
            
    
    
            let existingUser = [];
            let Final_User_table = [];
            let absent = 0;
            const maxAbsents = 15; // Arrêter la boucle après 25 utilisateurs absents
            const totalUsers = 1500; // Nombre maximum d'utilisateurs à vérifier
            
            for (var g = 0; g < totalUsers; g++) {
                console.log("Utilisateur absent : ", absent);
                if (absent > maxAbsents) break; // Sortir de la boucle si le nombre d'absents dépasse 25
            
                try {
                    await page.goto("https://ecrftm50.gustaveroussy.fr/50036/TrialMaster/User/EditUser?userId=" + g);
            
                    // Vérifier si le champ NamePrefix est présent
                    const prefix = await page.$eval('#NamePrefix', input => input.value);
                    const email = await page.$eval('#EmailAddress', input => input.value);
                    const link = "https://ecrftm50.gustaveroussy.fr/50036/TrialMaster/User/EditUser?userId=" + g;
            
                    let username = await page.$eval('#divPageTitle > h2', div => div.textContent);
                    username = username.replace("Edit User: ", "");
            
                    let Comment = await page.$eval('#Comment', div => div.textContent);
                    Comment = Comment.replace(",", "-");
            
                    // Rechercher si l'utilisateur existe déjà dans UserAccount
                    existingUser = UserAccount.find(user => user.username === username);
            
            
                    // Si l'utilisateur existe, mettre à jour ses informations
                    if (existingUser){
                        existingUser.prefix = prefix;
                        existingUser.email = email;
                        existingUser.link = link;
                        existingUser.Comment = Comment;
                        Final_User_table.push(existingUser);
                    }
            
                    // Réinitialiser le compteur des absents puisque l'utilisateur a été trouvé
                    absent = 0;
            
                } catch (err) {
                    // Si une exception survient, l'utilisateur est probablement absent
                    absent++;
               //     console.log(`Utilisateur absent pour l'ID ${g}. Nombre d'absents consécutifs : ${absent}`);
                }
            }
        
        console.log('fin du chargement, debut d ecriture')
          await fs.writeFile(`${Study_FIle}/Contact.json`, JSON.stringify(Final_User_table, null, 2), 'utf8', (err) => {
            if (err) {
                console.error("Erreur lors de l'écriture du fichier JSON :", err);
            } else {
                console.log(`Le fichier ${Study_FIle}/Contact.json a été écrit avec succès.`);
            }
        });
        
        }
    
    
    
    
    
          async function Get_HTML_To_objet(filePath) {
            const fs = require('fs').promises;
            const data=await fs.readFile(filePath, 'utf8', (err, data) => {
                        if (err) {
                            reject(err);
                            return;
           
        };} )
     
                 const $ = cheerio.load(data);
                    const tableData = [];
                    const secondTable = $('table').eq(1);
                    //console.log(secondTable)    
                    if (!secondTable) {
                                    reject("Deuxième tableau introuvable dans le HTML.");
                                    return;
                                }
    
                                const columnHeaders = [];
                                        secondTable.find('thead th').each((index, element) => {
                                            const headerText = $(element).text().trim();
                                            columnHeaders.push(headerText);
                                        });
    
    
     
                    secondTable.find('tbody tr').each((index, row) => {
                        const rowData = {};
                        $(row).find('td').each((cellIndex, cell) => {
                            const columnName = columnHeaders[cellIndex];
                            const cellText = $(cell).text().trim();
                            rowData[columnName] = cellText;
                        });
                        tableData.push(rowData);
                    });
    
                    return tableData;
        }
      




function enleverChiffresEtSlash(chaine) {
    // Utilisation d'une expression régulière pour remplacer les chiffres et les "/"
    var chaineModifiee = chaine.replace(/[0-9/]/g, '');
    return chaineModifiee;
}

function trouverDate(chaine) {
    // Expression régulière pour trouver une date au format DD/MM/YYYY ou YYYY/MM/DD
    var regex = /(\d{2})\/(\d{2})\/(\d{4})|(\d{4})\/(\d{2})\/(\d{2})/;
    
    // Recherche de la première correspondance dans la chaîne de caractères
    var match = chaine.match(regex);
    
    // Si une correspondance est trouvée
    if (match) {
        if (match[1] && match[2] && match[3]) {
            // Correspondance pour DD/MM/YYYY (match[1] = jour, match[2] = mois, match[3] = année)
            return `${match[1]}/${match[2]}/${match[3]}`;
        } else if (match[4] && match[5] && match[6]) {
            // Correspondance pour YYYY/MM/DD (match[4] = année, match[5] = mois, match[6] = jour)
            return `${match[6]}/${match[5]}/${match[4]}`;
        }
    } 
    
    return null; // Retourne null si aucune date n'est trouvée
}

function determinePatientStatus(patient) {
    // console.log(patient)
    let status = "Screening"; // Valeur par défaut

    // Vérifier les conditions spécifiques
    if (patient.Death || patient['End of study']) {
        status = "End of study";
    } else if (patient['Follow-up'] || patient.Progression) {
        status = "Follow-up";
    } else if (patient.Treatment) {
        status = "Treatment";
    }
// console.log('determinePatientStatus', patient)
    return status;
}




function parseDate(dateString) {
    if (!dateString || typeof dateString !== 'string' || !dateString.includes('/')) {
        console.error('Erreur : dateString est invalide', dateString);
        return null; // ou une autre valeur par défaut
    }

    // Remplacer les barres obliques par des tirets pour uniformiser le format (optionnel)
    // const normalizedDate = dateString.replace(/\//g, '-');

    // Diviser la chaîne en utilisant des tirets après la normalisation
    const [day, month, year] = dateString.split('/').map(Number);

    // Vérification supplémentaire pour s'assurer que chaque partie de la date est correcte
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        console.error('Erreur : dateString contient des parties non numériques', dateString);
        return null;
    }

    // Créer l'objet Date
    const final = new Date(year, month - 1, day);
    return final;
}



async function count_query_form(Study_FIle) {
    const QueryByFormPath = `${Study_FIle}/QueryByForm.json`;
    const QueryPath = `${Study_FIle}/Query.json`;

    // Lire et parser le fichier QueryByForm.json
    const jsonQueryByForm = JSON.parse(await fs.readFile(QueryByFormPath, 'utf8'));

    // Lire et parser le fichier Query.json
    const jsonQuery = JSON.parse(await fs.readFile(QueryPath, 'utf8'));

    // Filtrer les données par statut et éventuellement par centre dans QueryByForm
    // const filteredJsonQueryByForm = jsonQueryByForm.filter(entry =>
    //     entry["iCRF Status"] !== "No Data" &&
    //     (!centre || entry["Site"] === centre) &&
    //     entry["Visit"] !== "" &&
    //     entry["date"] !== "unknown"
    // );

    // Stocker les comptages des statuts "New" et "Reopened" pour chaque Patient
    let queryCounts = {};


    jsonQuery.forEach(query => {
        const { Patient, Visit, iCRF_link, Status } = query;
        if (Status === "New" || Status === "Reopened") {
            const key = `${Patient}_${Visit}_${iCRF_link}`;

            if (!queryCounts[key]) {
                queryCounts[key] = { New: 0, Reopened: 0 };
            }
            queryCounts[key][Status]++;
        }
    });

    // Parcourir les entrées filtrées de QueryByForm et mettre à jour les queries par Patient, Visit et iCRF_link
    jsonQueryByForm.forEach(entry => {
        const patientId = entry.Patient;
        const visit = entry.Visit;
        const iCRF_link = entry.iCRF_link;

        const key = `${patientId}_${visit}_${iCRF_link}`;

        // Si des queries ont été comptées pour cette combinaison, mettre à jour le champ
        if (queryCounts[key]) {
            entry["QueriesDM_MON"] = queryCounts[key].New + queryCounts[key].Reopened;
        } else {
            // Sinon, indiquer qu'il n'y a pas de queries ouvertes
            entry["QueriesDM_MON"] = 0;
        }
    });

    // // Parcourir chaque query dans Query.json et compter les "New" et "Reopened"
    // jsonQuery.forEach(query => {
    //     const { Patient, Status } = query;
    //     if (Status === "New" || Status === "Reopened") {
    //         if (!queryCounts[Patient]) {
    //             queryCounts[Patient] = { New: 0, Reopened: 0 };
    //         }
    //         queryCounts[Patient][Status]++;
    //     }
    // });


    //    jsonQuery.forEach(query => {
    //     const { Patient, Visit, iCRF_link, Status } = query;
    //     if (Status === "New" || Status === "Reopened") {
    //         const key = `${Patient}_${Visit}_${iCRF_link}`;

    //         if (!queryCounts[key]) {
    //             queryCounts[key] = { New: 0, Reopened: 0 };
    //         }
    //         queryCounts[key][Status]++;
    //     }
    // });

    // // Parcourir les entrées filtrées de QueryByForm et mettre à jour les queries par Patient, Visit et iCRF_link
    // filteredJsonQueryByForm.forEach(entry => {
    //     const patientId = entry.Patient;
    //     const visit = entry.Visit;
    //     const iCRF_link = entry.iCRF_link;

    //     const key = `${patientId}_${visit}_${iCRF_link}`;

    //     // Si des queries ont été comptées pour cette combinaison, mettre à jour le champ
    //     if (queryCounts[key]) {
    //         entry["Open Queries/Discrepancies"] = queryCounts[key].New + queryCounts[key].Reopened;
    //     } else {
    //         // Sinon, indiquer qu'il n'y a pas de queries ouvertes
    //         entry["Open Queries/Discrepancies"] = 0;
    //     }
    // });
    // // Parcourir les entrées filtrées de QueryByForm et mettre à jour les queries par Patient
    // jsonQueryByForm.forEach(entry => {
    //     const patientId = entry.Patient;

    //     // Si des queries ont été comptées pour ce patient, mettre à jour le champ
    //     if (queryCounts[patientId]) {
    //         entry["Open Queries/Discrepancies"] = queryCounts[patientId].New + queryCounts[patientId].Reopened;
    //     } else {
    //         // Sinon, indiquer qu'il n'y a pas de queries ouvertes
    //         entry["Open Queries/Discrepancies"] = 0;
    //     }
    // });

    // Écrire le fichier QueryByForm.json avec les nouvelles données
    await fs.writeFile(QueryByFormPath, JSON.stringify(jsonQueryByForm, null, 2), 'utf8');
    console.log("Mise à jour des queries dans QueryByForm.json terminée !");
}



module.exports = {
    Get_and_Download: Get_and_Download
};