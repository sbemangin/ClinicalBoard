// Fonction pour charger les données des DM depuis UserData.json
function loadDMs() {
    fetch('/download/UserData.json')
        .then(response => response.json())
        .then(data => {
            const dmFilter = document.getElementById('dm-filter');
            const dms = [...new Set(data.map(user => user.DM))]; // Extraire les DM uniques
            dms.forEach(dm => {
                const option = document.createElement('option');
                option.value = dm;
                option.textContent = dm;
                dmFilter.appendChild(option);
            });
            // Définir la valeur par défaut du filtre
            dmFilter.value = 'Anthony MANGIN';
        })
        .catch(error => console.error('Erreur lors du chargement des DM:', error));
}
