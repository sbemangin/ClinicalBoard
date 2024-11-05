// Fonction pour charger la liste des études et vérifier les dossiers
async function loadAvailableStudies(dm) {
    try {
        const response = await fetch(`/download/UserData.json`);
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement des données utilisateur: ${response.statusText}`);
        }

        const usersData = await response.json();
        const filteredUsers = usersData.filter(user => user.DM === dm);
        const trialGroups = new Set(filteredUsers.map(user => user.trialGroup));

        const tableBody = document.querySelector('#study-table tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        const loadMetricsPromises = Array.from(trialGroups).map(async (trialGroup) => {
            const studyPath = `/download/${trialGroup}/metrics.json`;
            try {
                const headResponse = await fetch(studyPath, { method: 'HEAD' });
                //console.log(headResponse)
                if (!headResponse.ok) {
                    return { name: trialGroup, status: 'invalid', dm: usersData.find(user => user.trialGroup === trialGroup)?.DM || '', statusCounts: {} };
                }

                const metricsResponse = await fetch(studyPath);
                if (!metricsResponse.ok) {
                    throw new Error(`Erreur lors du chargement des métriques: ${metricsResponse.statusText}`);
                }

                const metrics = await metricsResponse.json();
                const lastModified = headResponse.headers.get('Last-Modified') || '';
                return { ...metrics, name: trialGroup, dm: usersData.find(user => user.trialGroup === trialGroup)?.DM || '', status: 'valid', lastModified: formatDate(lastModified) };
            } catch (error) {
                console.error(`Erreur lors du chargement de ${studyPath}: ${error.message}`);
                return { name: trialGroup, status: 'invalid', dm: usersData.find(user => user.trialGroup === trialGroup)?.DM || '', statusCounts: {} };
            }
        });

        const studies = await Promise.all(loadMetricsPromises);
        updateTable(studies);
    } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
    }
}
function formatDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    };
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', options);
}