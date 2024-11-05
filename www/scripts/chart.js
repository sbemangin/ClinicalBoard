// Fonction pour créer le graphique en barres pour chaque étude
function createChart(study) {
    const ctx = document.getElementById(`chart-${study.name}`).getContext('2d');
    
    if (!study.statusCounts) {
        console.error(`Les données de statusCounts sont manquantes pour l'étude ${study.name}`);
        return;
    }

    const order = ['Inclusion', 'Screening', 'Treatment', 'AE', 'Follow-up', 'End of study'];
    const colors = {
        'Screening': '#FF6384',
        'Treatment': '#36A2EB',
        'Follow-up': '#FFCE56',
        'End of study': '#4BC0C0'
    };

    const sortedStatuses = order.filter(status => study.statusCounts[status] !== undefined);
    const data = sortedStatuses.map(status => study.statusCounts[status]);
    const backgroundColors = sortedStatuses.map(status => colors[status]);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedStatuses,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            responsive: false,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: 'white',
                        font: {
                            size: 20
                        },
                        backgroundColor: sortedStatuses.map(label => 
                            label.includes('S') || label.includes('D') ? 'red' : 'white'
                        )
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'black',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}


function GconvertDate(inputDate) {
    try{
    const datePart = inputDate.split(' ')[0]; // "30/09/2024"
    const [day, month, year] = datePart.split('/'); // ["30", "09", "2024"]

    // Créer un objet Date à partir de la date d'entrée
    const date = new Date(year, month - 1, day); // Le mois est indexé à partir de 0
    const today = new Date();

    // Calculer le nombre de jours entre aujourd'hui et la date d'entrée
    const timeDiff = today - date; // Différence en millisecondes
    const index = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // Convertir en jours

    // Récupérer la première lettre du jour de la semaine
    const options = { weekday: 'long' }; // ou 'short' pour une version abrégée
    const weekDayLetter = date.toLocaleDateString('fr-FR', options)[0].toUpperCase();
    // Retourner le format "index-lettre"
    console.log(` test ${zeropad(index, 2)}-${weekDayLetter}` )
    return `${zeropad(index, 2)}-${weekDayLetter}`;
}
catch{
    console.log("error")
}
}

async function createChart_activity(study) {
    
    try {
        let nbjour = 30;
        const response = await fetch(`download/${study.name}/QueryByForm.json`);
        if (!response.ok) {
            throw new Error('Erreur de réseau');
        }
        const data_raw = await response.json();
        const data = data_raw.filter(status => status["iCRF Status"] != "No Data" && status["TypeOfForm"] != "Inclusion");
        // Obtenir la date d'aujourd'hui
        const today = new Date();
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(today.getDate() - nbjour); // Date il y a 15 jours

        // Création d'un objet pour compter les occurrences par centre et date
        const countsByDateAndSite = {};

        // Initialiser les dates et sites dans l'objet
        for (let i = 0; i <= nbjour; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
        
            // Récupérer la première lettre du jour de la semaine
            const options = { weekday: 'long' }; // ou 'short' pour une version abrégée
            const weekDayLetter = date.toLocaleDateString('fr-FR', options)[0].toUpperCase();
        
            // Créer le format "i-lettre"
            const formattedDate = `${zeropad(i, 2)}-${weekDayLetter}`;
            console.log(formattedDate)
        //console.log(formattedDate)
            countsByDateAndSite[formattedDate] = {};
        }

        // Remplir l'objet avec les comptages
        data.forEach(item => {
            const originalDate = new Date(item["Last Status Update"].split(' ')[0].split('/').reverse().join('-')); // Conversion pour comparaison
            if (originalDate >= fifteenDaysAgo) {
                console.log("Processing date:", item["Last Status Update"]); // Vérifier que la date est correcte
                //console.log(item["Last Status Update"])
                const formattedDate = GconvertDate(item["Last Status Update"]);
                console.log(formattedDate)
                const site = item["Site"] || "Inconnu"; // Gérer les cas où le site est manquant

                // Initialiser le site si ce n'est pas déjà fait
                if (!countsByDateAndSite[formattedDate][site]) {
                    countsByDateAndSite[formattedDate][site] = 0;
                }
                countsByDateAndSite[formattedDate][site]++;
            }
        });

        // Conversion de l'objet en tableau pour le graphique
        const resultArray = [];
        const sites = new Set();

        // Créer des tableaux pour les étiquettes et les données
        for (const date in countsByDateAndSite) {
            const siteCounts = countsByDateAndSite[date];
            const counts = {};
            for (const site in siteCounts) {
                counts[site] = siteCounts[site];
                sites.add(site);
            }
            resultArray.push({ date, counts });
        }
        
        // Dessiner le graphique
        await drawChart(study.name,resultArray, Array.from(sites));

    } catch (error) {
        console.error('Erreur lors de la récupération du fichier JSON:', error);
    }
}


// async function drawChart(study, data, sites) {
//     const labels = data
//         .map(item => item.date)
//         .sort((a, b) => new Date(b) - new Date(a)); // Tri décroissant

//     // Inverser l'ordre des labels pour l'axe X
//     const reversedLabels = [...labels].reverse();

//     const datasets = sites.map(site => {
//         return {
//             x: reversedLabels, // Utilise les labels inversés
//             y: reversedLabels.map(label => data.find(item => item.date === label)?.counts[site] || 0), // Nombre d'entrées par site
//             type: 'bar',
//             name: site,
//             marker: {
//                 color: getRandomColor() // Couleur aléatoire pour chaque site
//             }
//         };
//     });





    
//     const layout = {
//         title: `Graphique des Entrées par Site - Étude ${study}`,
//         barmode: 'stack',
//         xaxis: {
//             title: 'Nombre de fiches saisies par Centre',
//             tickvals: [], // Valeurs des ticks inversées
//             ticktext: [], // Étiquettes des ticks inversées
//             tickfont: {
//                 color: 'white' // Couleur par défaut
//             },
//         },
//         yaxis: {
//             title: 'Historique du mois en cours',
//             color: 'white',
//             rangemode: 'tozero'
//         },
//         paper_bgcolor: 'rgba(0, 0, 0, 0)',
//         plot_bgcolor: 'rgba(0, 0, 0, 0)',
//         font: {
//             color: 'white'
//         }
//     };

//     // Annotations pour les étiquettes personnalisées
//     const annotations = reversedLabels.map((label, index) => {
//         return {
//             x: index, // Position horizontale
//             y: -6, // Décale vers le haut des barres (ajuste selon la hauteur de tes barres)
//             text: label,
//             showarrow: false,
//             font: {
//                 color: label.includes('S') || label.includes('D') ? 'red' : 'white'
//             },
//             textangle: 90 // Pivote le texte de 90 degrés
//         };
//     });

//     layout.annotations = annotations;

//     const config = {
//         responsive: true
//     };

//     // Nettoyer l'élément cible avant de dessiner
//     // Plotly.purge(`chart2-${study}`);

//     // Dessiner le graphique
//     Plotly.newPlot(`chart2-${study}`, datasets, layout, config);


//     const chartElement = document.getElementById(`chart2-${study}`);
//     chartElement.addEventListener('click', () => {
//         if (chartElement.requestFullscreen) {
//             chartElement.requestFullscreen();
//         } else if (chartElement.mozRequestFullScreen) { // Firefox
//             chartElement.mozRequestFullScreen();
//         } else if (chartElement.webkitRequestFullscreen) { // Chrome, Safari, and Opera
//             chartElement.webkitRequestFullscreen();
//         } else if (chartElement.msRequestFullscreen) { // IE/Edge
//             chartElement.msRequestFullscreen();
//         }
//     });
// }
    // Activation de la sélection par lasso
    // Plotly.newPlot(`chart2-${study}`, datasets, layout, {
    //     ...config,
    //     dragmode: 'lasso'
    // });

 // Fonction pour générer une couleur à partir d'un label
 function getColorFromLabel(label) {
    // Normaliser le label pour retirer les accents et garder uniquement les lettres
    const normalizedLabel = label
        .normalize("NFD") // Décompose les caractères accentués
        .replace(/[\u0300-\u036f]/g, "") // Retire les accents
        .replace(/[^A-ZÀ-ÿ]/gi, "") // Retire les chiffres et les espaces
        .toUpperCase(); // Met en majuscules

    // Utilise une méthode simple de hachage pour générer une couleur
    let hash = 0;
    for (let i = 0; i < normalizedLabel.length; i++) {
        hash = normalizedLabel.charCodeAt(i) + ((hash << 5) - hash); // Hachage simple
    }
    
    // Génére une couleur hexadécimale
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff; // Récupère les valeurs RGB
        color += ('00' + value.toString(16)).slice(-2); // Convertit en hexadécimal
    }
    return color;
}

async function drawChart(study, data, sites) {
    const labels = data
        .map(item => item.date)
        .sort((a, b) => new Date(b) - new Date(a)); // Tri décroissant

    const reversedLabels = [...labels].reverse();

    const datasets = sites.map(site => {
        return {
            x: reversedLabels,
            y: reversedLabels.map(label => data.find(item => item.date === label)?.counts[site] || 0),
            type: 'bar',
            name: site,
            marker: {
                color: getColorFromLabel(site) // Utilise la fonction de couleur
            }
        };
    });

    const layout = {
        title: `Graphique des Entrées par Site - Étude ${study}`,
        barmode: 'stack',
        xaxis: {
            title: 'Titre de l\'axe X',
            tickvals: reversedLabels,
            ticktext: reversedLabels,
            tickfont: {
                color: 'white'
            },
        },
        yaxis: {
            title: 'Titre de l\'axe Y',
            color: 'white',
            rangemode: 'tozero',
            range: [0, Math.max(...datasets.flatMap(dataset => dataset.y)) * 1.1]
        },
        paper_bgcolor: 'rgba(0, 0, 0, 0)',
        plot_bgcolor: 'rgba(0, 0, 0, 0)',
        font: {
            color: 'white'
        }
    };

    const annotations = reversedLabels.map((label, index) => {
        return {
            x: index,
            y: -6,
            text: label,
            showarrow: false,
            font: {
                color: label.includes('S') || label.includes('D') ? 'red' : 'white'
            },
            textangle: 90
        };
    });

    layout.annotations = annotations;

    const config = {
        responsive: true
    };

    // Dessiner le graphique
    Plotly.newPlot(`chart2-${study}`, datasets, layout, config);

    // Ajout d'un écouteur d'événements pour le clic
    const chartElement = document.getElementById(`chart2-${study}`);
    chartElement.addEventListener('click', () => {
        if (chartElement.requestFullscreen) {
            chartElement.requestFullscreen();
        } else if (chartElement.mozRequestFullScreen) {
            chartElement.mozRequestFullScreen();
        } else if (chartElement.webkitRequestFullscreen) {
            chartElement.webkitRequestFullscreen();
        } else if (chartElement.msRequestFullscreen) {
            chartElement.msRequestFullscreen();
        }
    });
}


function zeropad(number, length) {
    return String(number).padStart(length, '0');
}