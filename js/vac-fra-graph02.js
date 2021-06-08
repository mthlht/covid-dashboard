d3.csv("data/spf_fra_vacc.csv").then(showData);

function showData(data) {

    // Mise en français des objets dates
    const localeT = {
        "dateTime": "%A %e %B %Y à %X",
        "date": "%d/%m/%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
        "shortDays": ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
        "months": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
        "shortMonths": ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
    };

    d3.timeFormatDefaultLocale(localeT);

    //---------------------------------------------------------------------------------------

    // Traitement des données

    // Sélection des variables nécessaires pour le graphique
    const tempData = data.map(d => {

        let newData = {
            "date": new Date(d.jour), // ATTENTION À TRANSPOSER EN FORMAT DATE
            "couv_dose1": +d.couv_dose1, // ATTENTION STRING A TRANSPOSER EN FLOAT
            "couv_dose2": +d.couv_complet // ATTENTION STRING A TRANSPOSER EN FLOAT
        }

        return newData

    });

    // Date la plus récente du dataset
    const maxDate = d3.max(tempData, d => d.date);

    // Données filtrées à date la plus récente
    const tidyData = tempData.filter(d => d.date === maxDate)[0]

    // Agencement des données pour la génération de pie charts
    const pieData = [[{
        'name': 'Au moins une dose',
        'value': tidyData.couv_dose1
    },
    {
        'name': 'Non vacciné',
        'value': 100 - tidyData.couv_dose1
    }],
    [{
        'name': 'Vaccination complète',
        'value': tidyData.couv_dose2
    },
    {
        'name': 'Non vacciné',
        'value': 100 - tidyData.couv_dose2
    }]];

    //---------------------------------------------------------------------------------------


    // Création du canevas SVG

    const width = 500;
    const height = 200;
    const marginH = 80;
    const marginV = 20;
    const leg = 40;

    // création du canevas pour le Graphique
    const svg = d3.select('#vac-fra-graph02 .graph')
        .append("svg")
        .attr("viewBox", [0, 0, width + marginH * 2, height + leg + marginV * 2])
        .attr("preserveAspectRatio", "xMinYMid");

    // création d'un groupe g pour la Légende
    const svgLegend = svg.append("g")
        .attr("transform", `translate(${marginH}, ${marginV})`);

    // création d'un groupe g pour le Graphique
    const svgPlot = svg.append("g")
        .attr("transform", `translate(${marginH}, ${marginV + leg})`);

    //---------------------------------------------------------------------------------------

    // Écriture titraille graphique

    // Stockage de la taille du graphique dans le navigateur à l'ouverture de la page
    let svgSizeInNav = svg.node().getBoundingClientRect().right - svg.node().getBoundingClientRect().left;

    // Stockage du total des dimensions du graphique
    let totalDims = width + marginH * 2;

    // Définition du padding à appliquer aux titres, sous-titres, source
    // pour une titraille toujours alignée avec le graphique
    let paddingTitles = svgSizeInNav / totalDims * marginH;

    // Écriture du titre
    const title = d3.select('#vac-fra-graph02 .graph-title')
        .html('Proportion de la population vaccinée contre le Covid-19')
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Écriture du sous-titre
    const subtitle = d3.select('#vac-fra-graph02 .graph-subtitle')
        .html('depuis janvier 2021')
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Écriture
    const caption = d3.select('#vac-fra-graph02 .graph-caption')
        .html("Source. <a href='https://www.data.gouv.fr/fr/organizations/sante-publique-france/' target='_blank'>Santé publique France</a>")
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Adaptation du padding à chaque resize de la fenêtre du navigateur
    d3.select(window).on("resize", () => {

        let svgSizeInNavTemp = svg.node().getBoundingClientRect().right - svg.node().getBoundingClientRect().left;

        let paddingTitlesTemp = svgSizeInNavTemp / totalDims * marginH;

        title
            .style('padding-right', paddingTitlesTemp + "px")
            .style('padding-left', paddingTitlesTemp + "px");

        subtitle
            .style('padding-right', paddingTitlesTemp + "px")
            .style('padding-left', paddingTitlesTemp + "px");

        caption
            .style('padding-right', paddingTitlesTemp + "px")
            .style('padding-left', paddingTitlesTemp + "px");

    });

    //---------------------------------------------------------------------------------------

    // Création des donuts

    // Échelle de couleurs
    const color = d3.scaleOrdinal()
        .domain(['Au moins une dose', 'Vaccination complète', 'Non vacciné'])
        .range(['#0072B2', '#D55E00', '#e0e0e0']);

    // Rayon des donuts
    const radius = Math.min(width / 2, height) / 2;

    // Les arcs du pie en donut (avec un trou à l'intérieur)
    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius - 1);

    // Générateur de path
    const pie = d3.pie()
        .padAngle(0.005)
        .sort(null)
        .value(d => d.value);

    // Création d'un groupe g pour chaque donut
    const donuts = svgPlot.selectAll("g")
        .data(pieData)
        .join("g")
        .attr('transform', (d, i) => `translate(${marginH*1.5 + i * (width / 2)}, ${height/2})`);

    // Projection des donuts
    donuts.selectAll('path')
        .data(d => {
            return pie(d)
        })
        .join('path')
        .attr("fill", d => color(d.data.name))
        .attr("opacity", d => (d.data.name === "Au moins une dose") ? 0.6 : 1 )
        .attr("d", arc);
    
    // Ajout des valeurs en pourcentage à l'intérieur de chaque arc
    donuts.append("g")
        .selectAll("text")
        .data(d => pie(d))
        .join("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .text(d => {
            if (d.index == 0) {
                return Math.round(d.data.value) + '%'
            }
        })
        .attr("dy", "0.6em")
        .attr("dx", "-1em")
        .attr("font-weight", "bold")
        .attr("fill", "#ffffff")

    //---------------------------------------------------------------------------------------

    // Légende

    // Objet contenant les informations à afficher dans la légende : text, couleur, opacité
    const legendeValues = [
        { "label": "Au moins une dose", "col": "#0072B2", "op": 0.6 },
        { "label": "Vaccination complète", "col": "#D55E00", "op": 1 }
    ];

    // Création d'un groupe g par élément de la légende (ici deux infos)
    const legend = svgLegend.selectAll(".legend")
        .data(legendeValues)
        .join("g")
        .attr("transform",
            (d, i) => {
                return `translate(${i * width / 3}, ${0})`
            })
        .attr("class", "legend");

    // Création d'un rectangle avec la couleur correspondante par groupe g
    legend.append('rect')
        .attr("width", 20)
        .attr("height", 10)
        .attr("fill", d => d.col)
        .attr("opacity", d => d.op);

    // Écriture du texte par groupe g
    legend.append('text')
        .attr("x", 24)
        .attr("y", 10)
        .text(d => d.label)
        .attr("font-size", "14px");


}