
async function clickWithRetry(page, selector, timeout = 99999999999) {
    const startTime = Date.now(); // Temps de début
    let clicked = false; // État du clic
	let saved = false; // État du clic

    while (!clicked) {
        try {
            await page.click(selector);
            clicked = true; // Clic réussi
         } catch (error) {
           // console.log("Échec du clic, réessaye...");
            await new Promise(resolve => setTimeout(resolve, 500)); // Attendre un peu avant de réessayer
        }
	}
		while (!saved) {

			try {
				const txt2 = await page.$eval('#messageContent', element => element.textContent);

		const spans = await page.$eval('span', element => element.textContent);
		console.log("test" & spans)
		// Vérifie si le texte de l'élément contient "form saved"
if (spans.includes('form saved') || txt2.includes('form saved')) {


	saved = true; // État du clic
} 
		}catch (error) {
			// console.log("Échec du clic, réessaye...");
			 await new Promise(resolve => setTimeout(resolve, 500)); // Attendre un peu avant de réessayer
		 }}

    

    if (!clicked) {
        console.log("Échec de clic après 30 secondes.");
    }
}

async function nbquery(page) {
	//await new Promise(r => setTimeout(r, 1000));
    // Attendre que l'élément de statut soit présent
   await page.waitForSelector('.form-header-group', { timeout: 0 });

    // Vérifier si l'élément 'i.fa-stack-1x.widgetWhite' est présent
    const isElementPresent = await page.$('i.fa-stack-1x.widgetWhite') !== null;

	// const statusText = await page.$eval('.form-header-group', element => {
	// 	// Récupère le texte complet de l'élément
	// 	const text = element.textContent;
		
	// 	// Extrait et retourne le statut
	// 	const statusMatch = text.match(/iCRF Status: (\w+)/); // Utilise une expression régulière pour capturer le statut
	// 	return statusMatch ? statusMatch[1] : null; // Retourne "Incomplete" ou null si non trouvé
	// });

	const statusText = await page.$eval('.form-header-group', element => {
		// Récupère le texte complet de l'élément
		const text = element.textContent.trim(); // Nettoie les espaces
	
		// Extrait et retourne le statut
		const statusMatch = text.match(/iCRF Status:\s*(.*)/); // Utilise une expression régulière pour capturer tout après "iCRF Status:"
		return statusMatch ? statusMatch[1].trim() : null; // Retourne le statut, nettoyé
	});
	
let number=0;
    if (isElementPresent) {
        // Récupérer le chiffre de l'élément
         number = await page.$eval('i.fa-stack-1x.widgetWhite', element => element.textContent.trim());
        // console.log(`Le chiffre trouvé : ${number}`);
    } else {
        // console.log("L'élément 'i.fa-stack-1x.widgetWhite' est absent.");
		number=0;
       
    }
	return {statusText,number}; // Retourner null si l'élément est absent
}
const longin_page = {
	
	async get_form(browser,test,pat,resave=false){
		// console.log(`Navigating to ${test}...`);
		//console.log(`Navigating to ${this.url}...`);
		const page = await browser.newPage();
		await page.goto(test);
		//await clickWithRetry(page, '#complete', 5000);
		// await new Promise(r => setTimeout(r, 1500));

		// // const clicked = await page.evaluate(() => {
		// // 	const element = document.querySelector('input[type="submit"].btn.btn-primary[title="Select Role"]');
		// // 	if (element) {
		// // 		element.click();
		// // 		console.log("Select Role trouvé")
		// // 		return true;  // Clic réussi
		// // 	}
		// // 	return false;  // Élement non trouvé
		// // });
		// // await new Promise(r => setTimeout(r, 1000));
		// await page.click(selector='#complete');
		
		// await new Promise(r => setTimeout(r, 1000));


		// Supposons que 'page' soit déjà défini et que tu sois sur la page contenant l'élément
		 let stat = await nbquery(page)
//console.log(stat, pat)
if (stat.number==0 && stat.statusText=="Incomplete") {
	console.log(stat, pat)
	if (resave){await clickWithRetry(page, '#complete', 5000);	
	}
	else{await page.close();
		return test
	}
	}
await page.close();
}}


module.exports = longin_page;