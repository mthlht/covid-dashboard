Promise.all([
    d3.json("../data/carto_ftv_dep.geojson"),
    d3.csv("../data/incid_dep.csv")
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

    // création d'un container pour le tri des données d'incidence
    let dataContainer = { 'incid': {}, 'incid_evol': {}, 'date': {} };

    // répartition des données d'incidence dans le container
    for (let d of dataIncid) {

        let dep = d.dep;

        dataContainer.incid[dep] = d.incid;
        dataContainer.incid_evol[dep] = d.incid_evol;
        dataContainer.date[dep] = d.date;

    };



    // répartition des données d'incidence dans les properties des polygones de la carte
    dataMap.features = dataMap.features.map(d => {

        let dep = d.properties.insee;

        d.properties.incid = +dataContainer.incid[dep]; // ATTENTION STRING A TRANSPOSER EN FLOAT
        d.properties.incid_evol = +dataContainer.incid_evol[dep]; // ATTENTION STRING A TRANSPOSER EN FLOAT
        d.properties.date = new Date(dataContainer.date[dep]); // ATTENTION À TRANSPOSER EN FORMAT DATE

        return d;

    });

    //---------------------------------------------------------------------------------------

    // Création du canevas SVG

    const width = 500;
    const height = 500;
    const marginH = 80;
    const marginV = 40;
    const title = 50;
    const leg = 20;
    const caption = 10;

    // création du canevas englobant (titre, légende, graphique, source)
    const svg = d3.select('#carte_fra_incid')
        .append("svg")
        .attr("viewBox", [0, 0, width + marginH * 2, height + title + leg + caption + marginV * 2]);

    // création d'un groupe g pour le Titre
    const svgTitle = svg.append("g")
        .attr("transform", `translate(${marginH}, ${marginV})`);

    // création d'un groupe g pour la Légende
    const svgLegend = svg.append("g")
        .attr("transform", `translate(${marginH}, ${title + marginV})`);

    // création d'un groupe g pour le Graphique
    const svgPlot = svg.append("g")
        .attr("transform", `translate(${marginH}, ${title + marginV + leg})`);

    // création d'un groupe g pour la Source
    const svgCaption = svg.append("g")
        .attr("transform", `translate(${marginH}, ${title + marginV * 2 + leg + height})`);

    //---------------------------------------------------------------------------------------



    // Titre Graphique
    svgTitle.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("font-size", "24px")
        .attr("font-weight", "bold")
        .text("Taux d'incidence par département");

    // Formateur de date en XX mois XXXX
    const formatTimeToTitle = d3.timeFormat("%d %b %Y");

    // Date à afficher dans le titre
    // ATTENTION CETTE DATE DOIT FORCÉMENT ÊTRE PRISE DANS LE DATASET DU TAUX D'INCIDENCE
    const actualDate =new Date( dataIncid[0].date);

    // Foramtage de la date à afficher
    const dateToTile = formatTimeToTitle(actualDate);

    // Un sous-titre
    svgTitle.append("text")
        .attr("x", 0)
        .attr("y", 22)
        .attr("font-size", "16px")
        .text("au " + dateToTile);

    // Source
    svgCaption.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("font-size", "14px")
        .text("Source. Santé publique France - Crédits. franceinfo");

    //---------------------------------------------------------------------------------------

    // Création de l'échelle de couleur

    // Fonction génératrice de l'échelle

    // définition d'une variable délimitant les 3/4 des valeurs
    const quantile = d3.quantile(dataIncid, 0.75, d => +d.incid);

    let maxValColor;
    let legCells;

    // liste des conditions qui fixent la valeur max (maxValColor) de l'échelle de couleurs
    // et la liste des valeurs (legCells) qui seront à afficher dans la légende
    if (quantile > 600) {

        maxValColor = 800
        legCells = [0, 50, 150, 250, 400, 800]

    } else if (quantile > 400) {

        maxValColor = 600
        legCells = [0, 50, 150, 250, 400, 600]

    } else if (quantile > 250) {

        maxValColor = 400
        legCells = [0, 50, 150, 250, 400]

    } else if (quantile > 150) {

        maxValColor = 250
        legCells = [0, 50, 150, 250]

    } else {

        maxValColor = 150
        legCells = [0, 50, 100, 150]

    };
    
    // échelle de couleur
    const divScale = d3.scaleDiverging(t => d3.interpolateRdBu(1 - t))
        .domain([0, 50, maxValColor]);

    //---------------------------------------------------------------------------------------

    // Projection carte

    // définition de la projection de la carte (en geoMercator)
    const projection = d3.geoMercator()
        .center([2.353515, 47.366021])
        .scale(1600)
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
        .attr("fill", d => divScale(d.properties.incid));


    //---------------------------------------------------------------------------------------

    // Legende ---- fonctionne avec l'API d3-legend
    // https://d3-legend.susielu.com/

    // paramètres de la legende à l'aide de la variable legCells définie avec l'échelled de couleur
    const legend = d3.legendColor()
        .shapeWidth(width / legCells.length)
        .labelFormat(d3.format(".0f"))
        .cells(legCells)
        .orient("horizontal")
        .scale(divScale);

    // projection de la légende
    svgLegend
        .call(legend);

    //---------------------------------------------------------------------------------------

    // Animation carte

    // création d'un groupe g qui contiendra le tooltip de la légende
    const tooltip = svgPlot.append("g")
        .attr("transform", `translate(0, 60)`); // placement du groupe en haut à gauche sous le titre et la légende

    // condition pour que l'animation ne fonctionne que sur desktop
    // voir script device_detector pour la fonction deviceType()
    if (deviceType() == "desktop") {


        polygons
            .on("mouseover", function (d) {

                // lors du survol avec la souris l'opacité des barres passe à 1
                d3.select(this)
                    .attr("opacity", 0.8);

                // format de la date affichée dans le tooltip
                // stockage de la date de la barre survolée au format XX mois XXXX dans une variable
                const formatTime = d3.timeFormat("%d %b");
                let dateT = d.properties.date;
                let instantT = formatTime(dateT);

                // ON ENLÈVE 7 JOURS À LA DATE - ATTENTION car .setDate() modifie l'objet en place
                let instantT7 = formatTime(dateT.setDate(dateT.getDate() - 7));

                // ATTENTION À BIEN RAJOUTER LES 7 JOURS à dateT
                dateT.setDate(dateT.getDate() + 7);

                // Affichage du nom du département en gras
                tooltip.append("text")
                    .attr("y", 0)
                    .text(d.properties.name)
                    .style("font-size", "20px")
                    .style("font-weight", "bold");

                // 1e ligne sous le nom du département
                tooltip.append("text")
                    .attr("y", 20)
                    .text(`${Math.round(d.properties.incid)} nouvelles contaminations`);

                // 2e ligne sous le nom du département
                tooltip.append("text")
                    .attr("y", 35)
                    .text(`pour 100 000 habitants`);

                // 3e ligne sous le nom du département
                tooltip.append("text")
                    .attr("y", 50)
                    .text(`entre le ${instantT7} et le ${instantT}`);





            });
        
        // efface le contenu du groupe g lorsque la souris ne survole plus le polygone
        polygons
            .on("mouseout", function () {

                d3.select(this)
                    .attr("opacity", 1) // rétablit l'opacité à 1

                tooltip.selectAll("text")
                    .remove()
            });

    }


}
