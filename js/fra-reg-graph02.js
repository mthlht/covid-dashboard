Promise.all([
    d3.json("data/carto_ftv_dep.geojson"),
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

    // création d'un container pour le tri des données d'incidence
    let dataContainer = { 'incid': {}, 'incid_evol': {}, 'date': {} };

    // répartition des données d'incidence dans le container
    for (let d of dataIncid) {

        let dep = d.dep;

        dataContainer.incid[dep] = d.incid;
        dataContainer.incid_evol[dep] = d.incid_evol / 100;
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
    const marginV = 20;
    const leg = 20;

    // création du canevas pour le Graphique
    const svg = d3.select('#fra-reg-graph02 .graph')
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
    const title = d3.select('#fra-reg-graph02 .graph-title')
        .html("Variation du taux d'incidence par département")
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Formateur de date en XX mois XXXX
    const formatTimeToTitle = d3.timeFormat("%d %b %Y");

    // Date à afficher dans le titre
    // ATTENTION CETTE DATE DOIT FORCÉMENT ÊTRE PRISE DANS LE DATASET DU TAUX D'INCIDENCE
    const actualDate = new Date(dataIncid[0].date);
    // Soustraction de 7 jours à la date (attention modification de l'objet en place)
    const formerDate = actualDate.setDate(actualDate.getDate() - 7);

    // Rajout des 7 jours à l'objet modifié en place
    actualDate.setDate(actualDate.getDate() + 7);

    // Foramtage des dates à afficher
    const actualDateToTitle = formatTimeToTitle(actualDate);
    const formerDateToTitle = formatTimeToTitle(formerDate);

    // Écriture du sous-titre
    const subtitle = d3.select('#fra-reg-graph02 .graph-subtitle')
        .html('entre le ' + formerDateToTitle + ' et le ' + actualDateToTitle)
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Écriture
    const caption = d3.select('#fra-reg-graph02 .graph-caption')
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

    // Fonction génératrice de l'échelle

    // définition d'une variable délimitant les 3/4 des valeurs
    const divScale = d3.scaleDiverging(t => d3.interpolateRdBu(1 - t))
        .domain([d3.min(dataIncid, d => +d.incid_evol / 100), 0, d3.max(dataIncid, d => +d.incid_evol / 100)]);

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
        .attr("fill", d => divScale(d.properties.incid_evol));


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
    minIncidEvol = d3.min(dataIncid, d => +d.incid_evol);
    maxIncidEvol = d3.max(dataIncid, d => +d.incid_evol);

    // Définition de de la liste des valeurs (legCells) qui seront affichées dans la légende
    // Dans un premier temps la fonction range10s est lancé avec 10 comme diviseur
    let legCells = range10s(minIncidEvol, maxIncidEvol, 10).map(d => d / 100)

    // Si le diviseur par 10 renvoie un trop grand nombre de valeur alors le diviseur passe à 20
    if(legCells.length>10) {
        legCells = range10s(minIncidEvol, maxIncidEvol, 20).map(d => d / 100)
    };

    // paramètres de la legende à l'aide de la variable legCells définie avec l'échelled de couleur
    const legend = d3.legendColor()
        .shapeWidth(width / legCells.length)
        .labelFormat(d3.format(".0%"))
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
        .attr("transform", `translate(0, 60)`)

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

                // variation ou baisse selon la valeur incid_evol
                let variation = (+d.properties.incid_evol > 0) ? ("hausse") : ("baisse");

                // valeur arrondie à 2 décimales de incid_evol
                let valeur = Math.abs(+d.properties.incid_evol * 100).toFixed(2);

                // 1e ligne sous le nom du département
                tooltip.append("text")
                    .attr("y", 20)
                    .text(`en ${variation} de ${valeur}%`)

                // 2e ligne sous le nom du département
                tooltip.append("text")
                    .attr("y", 35)
                    .text(`entre le ${instantT7} et le ${instantT}`);


            });
        
        // efface le contenu du groupe g lorsque la souris ne survole plus le polygone
        polygons
            .on("mouseout", function () {

                d3.select(this)
                    .attr("opacity", 1);  // rétablit l'opacité à 1

                tooltip.selectAll("text")
                    .remove();
            });


    }


}
