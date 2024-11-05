
const fs = require('fs').promises;
const fs5 = require('fs');
const path = require('path'); // Ajout du module path

async function ensureDirectoryExists(directory) {
    return new Promise((resolve, reject) => {
        fs5.access(directory, fs5.constants.F_OK, (err) => {
            if (err) {
                // Le répertoire n'existe pas, on tente de le créer
                fs5.mkdir(directory, { recursive: true }, (err) => {
                    if (err) {
                        console.error(`Erreur lors de la création de ${directory} : ${err}`);
                        reject(err); // Rejette la promesse si une erreur survient
                    } else {
                        console.log(`${directory} a été créé.`);
                        resolve(); // Résout la promesse une fois la création terminée
                    }
                });
            } else {
                console.log(`${directory} existe.`);
                resolve(); // Résout la promesse si le répertoire existe déjà
            }
        });
    });
}

// lancé dans Get_and_Download
async function countXlsFilesInDirectory(directoryPath) {
    try {
        const files = await fs.readdir(directoryPath);
        let xlsFileCount = 0;
        files.forEach(file => {
            if (path.extname(file) === '.xls') {
                xlsFileCount++;
            }
        });
        return xlsFileCount;
    } catch (error) {
        console.error('Erreur lors du comptage des fichiers .xls :', error);
        throw error;
    }
}


  // lancé dans Get_and_Download

  async function getMostRecentExcelFile(dir, prev) {
  console.log(dir, prev);
    //console.log("fichier getMostRecentExcelFile" + prev)
 let nbfichier_act;
    while (nbfichier_act !== prev + 1) {
        nbfichier_act = await countXlsFilesInDirectory(dir);
       // console.log("---" + nbfichier_act)
    }
    const files = await fs5.promises.readdir(dir);
    const excelFiles = files.filter(file => file.endsWith('.xls'));
    const mostRecentFile = excelFiles.reduce((a, b) => {
        const aDate = fs5.promises.stat(path.join(dir, a)).mtime;
        const bDate = fs5.promises.stat(path.join(dir, b)).mtime;
        return aDate > bDate ? a : b;
    });
    return mostRecentFile;
}

async function renameFileAsync(oldPath, newPath) {
    return new Promise((resolve, reject) => {
        try {
            fs5.renameSync(oldPath, newPath); // Opération synchrone
            resolve(); // Résout la promesse une fois le renommage réussi
        } catch (err) {
            reject(err); // Rejette la promesse en cas d'erreur
        }
    });
}     

module.exports = {
    renameFileAsync,
    getMostRecentExcelFile,
    countXlsFilesInDirectory,
    ensureDirectoryExists

};