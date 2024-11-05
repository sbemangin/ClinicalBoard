
const fs = require('fs');
const { exec } = require('child_process');

// Promisifier exec pour utiliser avec async/await
const execCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else if (stderr) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
};

// Fonction asynchrone pour traiter chaque utilisateur séquentiellement
const runScriptsSequentially = async (users) => {
    for (const user of users) {
        const trialGroup = user.trialGroup;

        try {
            // Exécuter login.js avec trialGroup comme argument
            console.log(`Exécution de login.js pour le trialGroup ${trialGroup}...`);
            const output = await execCommand(`node login.js ${trialGroup}`);
            
            // Afficher la sortie du script login.js
            console.log(`Sortie pour ${trialGroup}: ${output}`);
        } catch (error) {
            console.error(`Erreur pour le trialGroup ${trialGroup}:`, error);
        }
    }

    console.log('Tous les scripts ont été exécutés.');
};

// Lire le fichier JSON
fs.readFile('www/download/UserData.json', 'utf8', async (err, data) => {
    if (err) {
        console.error('Erreur lors de la lecture du fichier:', err);
        return;
    }
    
    try {
        // Convertir la chaîne JSON en objet
        const users = JSON.parse(data);

        // Exécuter les scripts de manière séquentielle
        await runScriptsSequentially(users);
        await new Promise(r => setTimeout(r, 3000));
    } catch (parseErr) {
        console.error('Erreur lors du parsing du JSON:', parseErr);
    }
});
