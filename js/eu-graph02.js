Promise.all([
    d3.json("data/ftv_eu.geojson"),
    d3.csv("data/owid_incid_evol.csv")
]).then(data => {
    const graphCfg = {
        target: `#eu-graph02`,
        title: `Variation des nouveaux cas Covid-19 par pays en Europe`,
        caption: `Source. <a href='https://ourworldindata.org/coronavirus' target='_blank'>Our world in data</a>`,
        type: 'landscape', // définition du format du graphe
        device: window.screenDevice, // récupération de la largeur de l'écran
    }

    // Tri des données

    // données carto
    let dataMap = data[0];

    // données taux de vaccination
    let dataIncid = data[1];

    // création d'un container pour le tri des données de vaccination
    let dataContainer = {
        incid_evol: {},
        incid_diff: {},
        date: {}
    };

    // répartition des données d'incidence dans le container
    for (let d of dataIncid) {
        let code_pays = d.iso_code;

        dataContainer.incid_evol[code_pays] = d.incid_evol;
        dataContainer.incid_diff[code_pays] = d.diff;
        dataContainer.date[code_pays] = d.date;
    }

    // répartition des données d'incidence dans les properties des polygones de la carte
    dataMap.features = dataMap.features.map((d) => {

        let code_pays = d.properties.iso_a3;

        d.properties.incid_evol = +dataContainer.incid_evol[code_pays] / 100; // ATTENTION STRING A TRANSPOSER EN FLOAT
        d.properties.incid_diff = +dataContainer.incid_diff[code_pays]; // ATTENTION STRING A TRANSPOSER EN FLOAT
        d.properties.date = new Date(dataContainer.date[code_pays]); // ATTENTION À TRANSPOSER EN FORMAT DATE

        return d;
    });

    //---------------------------------------------------------------------------------------

    // Création du canevas SVG

    const width = 500;
    const height = 300;
    const marginH = 80;
    const marginV = 20;
    const leg = 20;

    const viewBox = {
        width: width + marginH * 2,
        height: height + leg + marginV * 2
    };

    // création du canevas pour le Graphique
    const svg = d3
        .select(graphCfg.target)
        .select('.grph-content')
        .insert('svg', ':first-child')
        .attr("viewBox", [0, 0, viewBox.width, viewBox.height])
        .attr("preserveAspectRatio", "xMinYMid");

    // création d'un groupe g pour la Légende
    const svgLegend = svg
        .append("g")
        .attr("transform", `translate(${marginH}, ${marginV})`);

    // création d'un groupe g pour le Graphique
    const svgPlot = svg
        .append("g")
        .attr("transform", `translate(${marginH}, ${marginV + leg})`);

    //---------------------------------------------------------------------------------------

    // Écriture titraille

    // Définition du padding à appliquer aux titres, sous-titres, source
    // pour une titraille toujours alignée avec le graphique
    const paddingTxt = `0 ${marginH / viewBox.width * 100}%`

    // Écriture du titre
    d3.select(graphCfg.target)
        .select('.grph-title')
        .html(graphCfg.title)
        .style("padding", paddingTxt);

    // Date à afficher dans le titre
    // ATTENTION CETTE DATE DOIT FORCÉMENT ÊTRE PRISE DANS LE DATASET DU TAUX D'INCIDENCE
    const formatTimeToTitle = d3.timeFormat("%d %b %Y");
    const actualDate = new Date(dataIncid[0].date);
    // Soustraction de 7 jours à la date (attention modification de l'objet en place)
    const formerDate = actualDate.setDate(actualDate.getDate() - 7);
    // Rajout des 7 jours à l'objet modifié en place
    actualDate.setDate(actualDate.getDate() + 7);

    // Formatage des dates à afficher
    const actualDateToTitle = formatTimeToTitle(actualDate);
    const formerDateToTitle = formatTimeToTitle(formerDate);

    // Écriture du sous-titre
    d3.select(graphCfg.target)
        .select('.grph-title')
        .append('span')
        .attr('class', 'grph-date')
        .html("entre le " + formerDateToTitle + " et le " + actualDateToTitle)

    // Écriture de la source
    d3.select(graphCfg.target)
        .select('.grph-caption')
        .html(graphCfg.caption)
        .style("padding", paddingTxt);

    //---------------------------------------------------------------------------------------

    // Création de l'échelle de couleur

    // Fonction génératrice de l'échelle

    // définition d'une variable délimitant les 3/4 des valeurs
    const divScale = d3
        .scaleDiverging((t) => d3.interpolateRdBu(1 - t))
        .domain([
            -1,
            0,
            1
        ]);

    //---------------------------------------------------------------------------------------

    // Projection carte

    // définition de la projection de la carte (en geoNaturalEarth1)
    const projection = d3.geoNaturalEarth1()
        .center([15, 54])
        //.scale([width / (1.3 * Math.PI)])
        .translate([width / 2, height / 2])
        .scale([width / 1.1]);

    // création d'un générateur géographique de formes
    const path = d3.geoPath().projection(projection);

    // création d'un groupe g par polygone
    const polygons = svgPlot
        .selectAll("g")
        .data(dataMap.features)
        .join("g")

    // projection des polygones géographiques
    polygons
        .append("path")
        .attr("d", (d) => path(d))
        .attr("stroke", "#ffffff")
        .attr("fill", (d) => d.properties.incid_evol ? divScale(d.properties.incid_evol) : "#eee")
        .style("stroke-width", "0.5px");

    //---------------------------------------------------------------------------------------

    // Legende ---- fonctionne avec l'API d3-legend
    // https://d3-legend.susielu.com/

    // fonction génératrice de limites par dizaines
    function range10s(start, end, diviseur) {
        let container = [];

        const start10s = Math.round(start / diviseur) * diviseur;
        const end10s = Math.round(end / diviseur) * diviseur;

        for (let i = start10s; i <= end10s; i += diviseur) {
            container.push(i);
        }

        return container;
    }

    // Stockage des valeurs minimum et maximum de l'évolution
    minIncidEvol = d3.min(dataIncid, (d) => +d.incid_evol);
    maxIncidEvol = d3.max(dataIncid, (d) => +d.incid_evol);

    // Définition de de la liste des valeurs (legCells) qui seront affichées dans la légende
    // Dans un premier temps la fonction range10s est lancé avec 10 comme diviseur
    let legCells = range10s(minIncidEvol, maxIncidEvol, 10).map((d) => d / 100);

    // Si le diviseur par 10 renvoie un trop grand nombre de valeurs alors calcule une nouvelle répartition
    let i = 10;

    while (legCells.length > 10) {
        i = i + 10
        legCells = range10s(minIncidEvol, maxIncidEvol, i).map((d) => d / 100);
    };

    // paramètres de la legende à l'aide de la variable legCells définie avec l'échelled de couleur
    const legend = d3
        .legendColor()
        .shapeWidth(width / 9)
        .labelFormat(d3.format(".0%"))
        .cells([-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1])
        .orient("horizontal")
        .scale(divScale);

    // projection de la légende
    svgLegend.call(legend)
        .selectAll("text")
        .attr("fill", "grey")
        .attr("font-size", "12px");

    //---------------------------------------------------------------------------------------

    // Animation carte

    // création d'un groupe g qui contiendra le tooltip de la légende
    const tooltip = svgPlot.append("g")
        .attr("transform", `translate(${0}, ${height / 1.4})`);

    if (graphCfg.device !== 'mobile') {
        // création du tooltip de la légende personnalisé
        const custTooltip = commonGraph.tooltip(graphCfg.target, d3)

        polygons.on("mouseover", function (d) {
            // lors du survol avec la souris l'opacité des polygones passe à 0.8
            d3.select(this).attr("opacity", 0.8);

            // format de la date affichée dans le tooltip
            // stockage de la date de la barre survolée au format XX mois XXXX dans une variable
            const formatTime = d3.timeFormat("%d %b");
            let dateT = d.properties.date;
            let instantT = formatTime(dateT);

            // ON ENLÈVE 7 JOURS À LA DATE - ATTENTION car .setDate() modifie l'objet en place
            let instantT7 = formatTime(dateT.setDate(dateT.getDate() - 7));

            // ATTENTION À BIEN RAJOUTER LES 7 JOURS à dateT
            dateT.setDate(dateT.getDate() + 7);

            // variation ou baisse selon la valeur incid_evol
            let variation = +d.properties.incid_evol > 0 ? "hausse" : "baisse";

            // valeur arrondie à 2 décimales de incid_evol
            let valeur = Math.abs(+d.properties.incid_evol * 100).toFixed(2).replace('.00', '').replace('.', ','); // Remplace le point en virgule et supprime les décimales nulles.

            // efface les données du tooltip
            custTooltip.html('')

            // affiche et positionne le tooltip avec les données
            custTooltip
                .style('opacity', '1')
                .style('left', `${d3.event.pageX}px`)
                .style('top', `${d3.event.pageY}px`)
                .style('font-size', `${graphCfg?.size?.tooltip?.font || commonGraph.size[graphCfg.type][graphCfg.device].tooltip.font}px`)
                .append('div')
                .html(`<strong>${d.properties.name_fr}</strong>`);

            custTooltip
                .append('div')
                .html(`en ${variation} de ${valeur}% sur une semaine`);

        });

        // efface le contenu du groupe g lorsque la souris ne survole plus le polygone
        polygons.on("mouseout", function () {
            d3.select(this).attr("opacity", 1); // rétablit l'opacité à 1

            custTooltip.style('opacity', '0');
        });
    };
});
