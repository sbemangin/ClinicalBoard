

function convertDate(inputDate) {
    // Extraire la date de la chaîne (en ignorant l'heure et le suffixe)
    const datePart = inputDate.split(' ')[0]; // "03/10/2024"
    const [day, month, year] = datePart.split('/'); // ["03", "10", "2024"]

    // Réorganiser les parties dans le format souhaité "YYYY/MM/DD"
    return `${year}/${month}/${day}`;
}
async function get_date_test() {
    try {
        const response = await fetch('download/better2/QueryByForm.json');
        if (!response.ok) {
            throw new Error('Erreur de réseau');
        }
        const data = await response.json();

        // Obtenir la date d'aujourd'hui
        const today = new Date();
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(today.getDate() - 15); // Date il y a 15 jours

        // Création d'un objet pour compter les occurrences par date
        const countsByDate = {};

        // Initialiser les dates dans l'objet avec 0
        for (let i = 0; i <= 15; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const formattedDate = convertDate(date.toLocaleDateString('fr-FR')); // Format "YYYY/MM/DD"
            countsByDate[formattedDate] = 0; // Initialisation à 0
        }

        // Remplir l'objet avec les comptages
        data.forEach(item => {
            const originalDate = new Date(item["Last Status Update"].split(' ')[0].split('/').reverse().join('-')); // Conversion pour comparaison
            if (originalDate >= fifteenDaysAgo) {
                const formattedDate = convertDate(item["Last Status Update"]);
                countsByDate[formattedDate]++;
            }
        });

       return countsByDate;
        // document.getElementById('output').innerHTML = output;

    } catch (error) {
        console.error('Erreur lors de la récupération du fichier JSON:', error);
    }
}
       

function updateTable(studies) { 
    get_date_test();
    const tableBody = document.querySelector('#study-table tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    studies.forEach(study => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>
        <div> 
        <table>
        <tr>    <td>${study.name} <br> Act. : ${study.lastModified}</td> </tr>
        <tr>     <td><span class="status-icon ${study.status}"></span></td> </tr> 
        <tr>     <td>${study.totalPatients || 'N/A'} <br> dernière inclusion : ${study.lastInclusionDate || 'N/A'}</td></tr>
        <tr>     <td>2024 :${study.currentYearInclusions || 'N/A'} <br> 2023:${study.previousYearInclusions || 'N/A'}</td></tr>
        <tr>     <td><button class="responded" data-trial-group="${study.name}">${study.totalResponded || 'N/A'}</button></td></tr>

        </table>
        </div></td>
                   <td><canvas id="chart-${study.name}" width="400" height="200"></canvas></td>
            <td  width="1000" height="300"><div id="chart2-${study.name}" width="1000" height="300"></div></td>
            <td><a href="relance.html?etude=${encodeURIComponent(study.name)}">Voir Détails</a></td>
            <td><button class="refresh-btn" data-trial-group="${study.name}">Actualiser</button></td>
            
        `;
        tableBody.appendChild(row);
        createChart(study);
        createChart_activity(study);
    });

    // Ajouter l'écouteur d'événements pour les boutons refresh
    const refreshButtons = document.querySelectorAll('.refresh-btn');
    refreshButtons.forEach(button => {
        button.addEventListener('click',async (event) => {
            const trialGroup = event.currentTarget.getAttribute('data-trial-group');
            console.log(`Actualiser pour le groupe d'essai : ${trialGroup}`);
            await refreshStudyData(trialGroup);
        });
    });

    
document.querySelectorAll('.responded').forEach(button => {
    button.addEventListener('click', function() {
        const trialGroup = this.getAttribute('data-trial-group');
        openstudy(trialGroup,"https://ecrftm50.gustaveroussy.fr/50036/TrialMaster/Task/QueryTask?t=96");
    });
});

}
    
function openstudy(trialGroup, url) {
fetch('/open', {
method: 'POST',
headers: {
'Content-Type': 'application/json'
},
body: JSON.stringify({
etude: trialGroup,
url: url
})
})
.then(response => response.json())
.then(data => {
console.log(data.message);
// Recharger les études après la mise à jour
})
.catch(error => console.error('Erreur lors de l\'actualisation des données:', error));
}
// Fonction pour mettre à jour le tableau avec les études données

async function refreshStudyData(trialGroup) {
    console.log('test');
    try {
        const response = await fetch(`/update-metrics/${trialGroup}`, { method: 'POST' });
        const data = await response.json();
        console.log(data.message);
        // Recharger les études après la mise à jour
        //loadAvailableStudies();
    } catch (error) {
        console.error('Erreur lors de l\'actualisation des données:', error);
    }
};
