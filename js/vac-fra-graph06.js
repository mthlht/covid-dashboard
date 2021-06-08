Promise.all([
    d3.json("data/ftv_reg.geojson"),
    d3.csv("data/incid_dep.csv")
]).then(showData);

function showData(data) {

    // Mise en français des objets dates
    const locale = {
        "dateTime": "%A %e %B %Y à %X",
        "date": "%d/%m/%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
        "shortDays": ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
        "months": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
        "shortMonths": ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
    }

    d3.timeFormatDefaultLocale(locale);

    //---------------------------------------------------------------------------------------

    // Tri des données

    // données carto
    let dataMap = data[0];

    // données incidence
    let dataIncid = data[1];

    //---------------------------------------------------------------------------------------

    // Création du canevas SVG

    const width = 500;
    const height = 500;
    const marginH = 80;
    const marginV = 20;
    const leg = 20;

    // création du canevas pour le Graphique
    const svg = d3.select('#vac-fra-graph06 .graph')
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
    const title = d3.select('#vac-fra-graph06 .graph-title')
        .html("Taux de vaccination par région")
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Écriture du sous-titre
    const subtitle = d3.select('#vac-fra-graph06 .graph-subtitle')
        .html('')
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Écriture du caption
    const caption = d3.select('#vac-fra-graph06 .graph-caption')
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

    // Création de l'échelle de couleur

    // échelle de couleur

    //---------------------------------------------------------------------------------------

    // Projection carte

    // définition de la projection de la carte (en geoMercator)
    const projection = d3.geoMercator()
        .center([2.2, 47.366021])
        .scale(1800)
        .translate([width / 2, height / 2]);

    // création d'un générateur géographique de formes
    const path = d3.geoPath()
        .projection(projection);

    // projection des polygones géographiques
    const polygons = svgPlot.selectAll("path")
        .data(dataMap.features)
        .join('path')
        .attr("d", d => path(d))
        .attr("stroke", "#ffffff")
        .attr("fill", "grey");


    //---------------------------------------------------------------------------------------

    // Legende ---- fonctionne avec l'API d3-legend
    // https://d3-legend.susielu.com/

    //---------------------------------------------------------------------------------------

    // Animation carte




}
