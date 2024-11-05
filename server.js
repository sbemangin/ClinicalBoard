const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const pathaction = "SS-Progr_puppeteer/action";
const app = express();
app.use(express.json());

app.use(express.static('www'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

app.get('/relance.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'relance.html'));
});

app.get('/:filename', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', req.params.filename));
});

app.get('/download/:etude/:filename', (req, res) => {
    const downloadDir = path.join(__dirname, 'www', 'download', req.params.etude);
    res.sendFile(path.join(downloadDir, req.params.filename));
});

app.get('/api/studies', (req, res) => {
    loncole.Log(pathaction)
    const studiesDir = path.join(__dirname, 'www', 'download');
    let studies = [];

    fs.readdir(studiesDir, (err, studyNames) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la lecture des études.' });
        }

        studyNames.forEach(studyName => {
            const studyPath = path.join(studiesDir, studyName);
            if (fs.lstatSync(studyPath).isDirectory()) {
                const metricsPath = path.join(studyPath, 'metrics.json');
                if (fs.existsSync(metricsPath)) {
                    try {
                        const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
                        studies.push({
                            name: metrics.name,
                            numberOfPatients: metrics.numberOfPatients,
                            currentYearInclusions: metrics.currentYearInclusions,
                            previousYearInclusions: metrics.previousYearInclusions,
                            lastInclusionDate: metrics.lastInclusionDate,
                            dm: metrics.dm || '',
                            status: metrics.status || 'invalide'
                        });
                    } catch (err) {
                        console.error(`Erreur de décodage JSON pour le fichier ${metricsPath}:`, err);
                    }
                }
            }
        });
        res.json(studies);
    });
});


app.post('/update-metrics/:trial_group', (req, res) => {
    const trialGroup = req.params.trial_group;
    console.log(`Mise à jour pour le groupe d'essai: ${trialGroup}`);

    exec(`node "${pathaction}/login.js" ${trialGroup}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur lors de l'exécution du script: ${stderr}`);
            return res.status(500).json({ 
                status: 'error', 
                message: `Erreur lors de la mise à jour des données: ${error.message}` 
            });
        }
        
        console.log(`Script Output: ${stdout}`);
        res.json({ 
            status: 'success', 
            message: `Les données pour ${trialGroup} ont été mises à jour.` 
        });
    });
});


app.post('/open', (req, res) => {
    const { etude, url } = req.body;
    console.log(`Mise à jour pour le groupe d'essai: ${etude}`);
    
    exec(`node "${pathaction}/ouverture.js" ${etude} ${url}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur lors de l'exécution du script Puppeteer: ${stderr}`);
            return res.status(500).json({ status: 'error', message: 'Erreur lors de l\'exécution du script Puppeteer.' });
        }
        console.log("done");
        res.json({ status: 'success', message: `Mail créé pour l'étude ${etude} et le site ${url}.` });
    });
});

app.post('/create_mail/:etude/:site', (req, res) => {
    const { etude, site } = req.params;
    exec(`node "${pathaction}/mail.js" "${etude}" "${site}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur lors de l'exécution du script Puppeteer: ${stderr}`);
            return res.status(500).json({ status: 'error', message: `Erreur lors de la création du mail pour l'étude ${etude} et le site ${site}.` });
        }
        console.log("done");
        res.json({ status: 'success', message: `Mail créé pour l'étude ${etude} et le site ${site}.` });
    });
});

app.listen(3000, '0.0.0.0',() => {
    if (!fs.existsSync('www')) {
        console.error("Le dossier 'www' n'existe pas.");
        process.exit(1);
    }
    console.log('Serveur en écoute sur le port 3000');
});
