// Fonction pour filtrer les études en fonction du DM sélectionné
function filterStudies() {
    const dmFilterValue = document.getElementById('dm-filter').value;
    loadAvailableStudies(dmFilterValue);
}


// Charger les DM et les études au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadDMs();
    loadAvailableStudies("Anthony MANGIN");
    document.getElementById('dm-filter').addEventListener('change', filterStudies);

  
 
    
    document.getElementById('trigger-all').addEventListener('click', async function() {
        console.log("boutton all")
    const refreshButtons = document.querySelectorAll('.refresh-btn');
    console.log(refreshButtons)
    for (let button of refreshButtons) {
    
        await simulateClick(button); // Attend la fin de chaque clic avant de passer au suivant
    
    }
    });
    
    // Fonction pour simuler le clic, renvoie une promesse
    async function simulateClick(button) {
    return new Promise(resolve => {
    button.click();
    setTimeout(() => { // Simule un délai avant de considérer le clic comme terminé
        resolve();
    }, 60000); // Ajustez ce délai selon vos besoins (par ex: temps d'exécution de chaque action)
    });
    }
    
    
    

});
