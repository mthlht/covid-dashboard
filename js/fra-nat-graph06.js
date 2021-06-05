d3.csv("data/spf_fra_incid_age.csv").then(showData);

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

        let data = {
            "date": new Date(d.date), // ATTENTION À TRANSPOSER EN FORMAT DATE
            "age_label": d.age_label, // ATTENTION STRING A TRANSPOSER EN FLOAT
            "incid": +d.incid // ATTENTION STRING A TRANSPOSER EN FLOAT
        }

        return data

    });

    // Filtre les données uniquement à partir du 1er janvier 2021
    const tidyData = tempData.filter(d => d.date >= new Date("2021-01-01"));

    // Stockage dans un array des labels de chaque courbe
    const arrayLabels = [... new Set(tidyData.map(d => d.age_label))];

    // Création d'un array d'arrays d'objets adapté à la projection des lignes
    // avec les données groupées par label (courbe) chacune dans un array d'objets différent
    const dataLine = arrayLabels.map(d => {
        let label = d;
        return tidyData.filter(d => d.age_label === label);
    });

    //---------------------------------------------------------------------------------------

    // Création du canevas SVG

    const width = 500;
    const height = 200;
    const marginH = 80;
    const marginV = 20;
    const leg = 40;

    // création du canevas pour le Graphique
    const svg = d3.select('#fra-nat-graph06 .graph')
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
    const title = d3.select('#fra-nat-graph06 .graph-title')
        .html("Evolution du taux d'incidence par classe d'âge")
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Écriture du sous-titre
    const subtitle = d3.select('#fra-nat-graph06 .graph-subtitle')
        .html('depuis janvier 2021')
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Écriture
    const caption = d3.select('#fra-nat-graph06 .graph-caption')
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

    // Création des échelles X et Y

    // échelle linéaire pour l'axe des Y
    const scaleY = d3.scaleLinear()
        .domain([0, d3.max(tidyData, d => d.incid)])
        .range([height, 0]);

    // échelee temporelle pour l'axe des X
    const scaleT = d3.scaleTime()
        .domain([d3.min(tidyData, d => d.date),
        d3.max(tidyData, d => d.date)])
        .range([0, width]);

    //---------------------------------------------------------------------------------------

    // Création de l'échelle de couleurs

    // array pour les labels dans le bon ordre d'afficahge
    const labelsLegend = ['moins de 10 ans', 'de 10 à 19 ans', 'de 20 à 29 ans',
        'de 30 à 49 ans', 'de 50 à 59 ans', 'de 60 à 89 ans', '90 ans et plus'];

    // liste des couleurs à utiliser (couleurs adaptées au daltonisme)
    // source. https://jfly.uni-koeln.de/color/
    const okabeIto = ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2',
        '#D55E00', '#CC79A7'];

    // échelle de couleurs pour les labels
    const scaleC = d3.scaleOrdinal()
        .domain(labelsLegend)
        .range(okabeIto);

    //---------------------------------------------------------------------------------------

    // Création des axes

    // Axe des X
    const xAxis = g => g
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(scaleT)
            .ticks(4)
            .tickFormat(d3.timeFormat("%b %Y")))
        .selectAll('text')
        .style("fill", "grey"); // couleur du texte


    // Axe des Y
    const yAxis = g => g
        .attr("transform", `translate(0, 0)`)
        .call(d3.axisLeft(scaleY)
            .ticks(8) // Nombre de ticks
            .tickFormat(d3.format(",.2r"))) // formatage grands nombre avec virgule entre milliers
        .call(g => g.select(".domain").remove()) // supprime la ligne de l'axe
        .selectAll('text')
        .style("fill", "grey"); // couleur du texte

    //---------------------------------------------------------------------------------------

    // Line Chart

    // générateur de la ligne avec les échelles
    const lineGenerator = d3.line()
        .x(d => scaleT(d.date))
        .y(d => scaleY(d.incid));

    // projection des lignes
    svgPlot.selectAll("g")
        .data(dataLine)
        .join("g")
        .append("path")
        .attr("d", d => lineGenerator(d))
        .attr("fill", "none") // ATTENTION A BIEN METTRE FILL NONE
        .attr("stroke", d => scaleC(d[0].age_label))
        .attr("stroke-width", 3);

    //---------------------------------------------------------------------------------------

    // Légende

    // Création d'un groupe g par élément de la légende (ici 7 éléments répartis sur 2 lignes)
    const legend = svgLegend.selectAll(".legend")
        .data(labelsLegend)
        .join("g")
        .attr("transform",
            (d, i) => {
                if (i < 4) {
                    return `translate(${i * width / 4}, ${0})` // coordonnées des 4 éléments de la première ligne
                } else if (i >= 4) {
                    return `translate(${(i - 4) * width / 4}, ${20})` // coordonnées des 3 élements de la deuxième ligne
                }
            })
        .attr("class", "legend");

    // Création d'un rectangle couleur par groupe g
    legend.append('rect')
        .attr("width", 20)
        .attr("height", 5)
        .attr("fill", d => scaleC(d));

    // écriture label par groupe g
    legend.append('text')
        .attr("x", 22)
        .attr("y", 5)
        .text(d => d)
        .attr("font-size", "12px");

    //---------------------------------------------------------------------------------------

    // Annotations - affichage des dernières valeurs

    // stocakge valeur date la plus récente du dataset
    const maxDate = d3.max(tidyData, d => d.date);

    const lastValues = tidyData.filter(d => d.date + '' === maxDate + '');

    // Création de noeuds
    const labels = lastValues.map(d => {
        return {
            fx: 0,
            targetY: scaleY(d.incid)
        };
    });

    // Simulation de force sur les noeuds
    const force = d3.forceSimulation()
        .nodes(labels)
        .force('collide', d3.forceCollide(7))
        .force('y', d3.forceY(d => d.targetY).strength(1))
        .stop();

    // Execute la simulation
    for (let i = 0; i < 300; i++) force.tick();

    // Ajout d'une valeur y dans chaque objet de l'array lastValues
    labels.sort((a, b) => a.y - b.y);
    lastValues.sort((a, b) => b.incid - a.incid);
    lastValues.forEach((d, i) => d.y = labels[i].y);

    // Ajout des valeurs sur le graphique
    svgPlot.selectAll('g')
        .data(lastValues)
        .join('g')
        .append('text')
        .attr("x", width + 8)
        .attr("y", d => d.y)
        .text(d => Math.round(d.incid))
        .style("fill", d => scaleC(d.age_label));

    //---------------------------------------------------------------------------------------

    // Placement des axes

    // Placement X
    svgPlot.append("g")
        .call(xAxis)
        .attr("color", "grey"); // mise en gris des ticks de l'axe des X

    // Placement Y
    svgPlot.append("g")
        .call(yAxis)
        .attr("color", "grey")
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width)
            .attr("stroke-opacity", 0.1)); // lignes horizontales projetées sur le graphique


}




