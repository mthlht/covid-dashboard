d3.csv("data/vacc_age.csv").then(showData);

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
            "tx_rea": +d.couv_dose1, // ATTENTION STRING A TRANSPOSER EN FLOAT
            "age": +d.age, // ATTENTION STRING A TRANSPOSER EN FLOAT
            "reg_nom": d.label_age
        }

        return newData

    });

    // Tri des variables dans l'ordre décroissant
    const tidyData = tempData.sort((a, b) => d3.ascending(a.age, b.age));

    //---------------------------------------------------------------------------------------

    // Création du canevas SVG

    const width = 500;
    const height = 500;
    const marginH = 80;
    const marginV = 20;

    // variables d'ajustement du graphique pour les noms des régions
    const marginHratio = marginH * 2.5; // uniquement utilisée pour la création de svgPlot
    const widthRatio = width - marginHratio; // uniquement utilisée pour l'échelle scaleX

    // création du canevas pour le Graphique
    const svg = d3.select('#vac-fra-graph05 .graph')
        .append("svg")
        .attr("viewBox", [0, 0, width + marginH*2, height + marginV * 2])
        .attr("preserveAspectRatio", "xMinYMid");

    // création d'un groupe g pour le Graphique
    const svgPlot = svg.append("g")
        .attr("transform", `translate(${marginH + marginHratio}, ${marginV})`);

    //---------------------------------------------------------------------------------------

    // Écriture titraille graphique

    // Stockage de la taille du graphique dans le navigateur à l'ouverture de la page
    let svgSizeInNav = svg.node().getBoundingClientRect().right - svg.node().getBoundingClientRect().left;

    // Stockage du total des dimensions du graphique
    let totalDims = width + marginH*2;

    // Définition du padding à appliquer aux titres, sous-titres, source
    // pour une titraille toujours alignée avec le graphique
    let paddingTitles = svgSizeInNav / totalDims * marginH;

    // Écriture du titre
    const title = d3.select('#vac-fra-graph05 .graph-title')
        .html("Pourcentage de personnes ayant reçu au moins une première dose par classe d'âge")
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Formateur de date en XX mois XXXX
    const formatTimeToTitle = d3.timeFormat("%d %b %Y");

    // Date à afficher dans le titre
    // ATTENTION CETTE DATE DOIT FORCÉMENT ÊTRE PRISE DANS LE DATASET DU TAUX D'INCIDENCE
    const actualDate = new Date(tidyData[0].date);

    // Foramtage de la date à afficher
    const dateToTitle = formatTimeToTitle(actualDate);

    // Écriture du sous-titre
    const subtitle = d3.select('#vac-fra-graph05 .graph-subtitle')
        .html("au " + dateToTitle)
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Écriture du caption
    const caption = d3.select('#vac-fra-graph05 .graph-caption')
        .html("Source. <a href='https://www.data.gouv.fr/fr/organizations/sante-publique-france/' target='_blank'>Santé publique France</a>, <a href='https://data.drees.solidarites-sante.gouv.fr/explore/dataset/707_bases-administratives-sae/information/' target='_blank'>Drees</a>")
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

    // Création des échelles

    // échelle linéaire pour l'axe des X
    const scaleX = d3.scaleLinear()
        .domain([0, 100]) // graphique en pourcentages, donc minimum à 0 et max à 100
        .range([0, widthRatio]);

    // échelle pour l'épaisseur des barres des barres et les placement sur l'axe Y
    const scaleY = d3.scaleBand()
        .domain(d3.range(tidyData.length))
        .range([height, 0])
        .padding(0.1);

    //---------------------------------------------------------------------------------------

    // Création des axes

    // Axe des X
    const xAxis = g => g
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisLeft(scaleX)
            .ticks(0))
        .call(g => g.select(".domain").remove()); // supprime la ligne de l'axe

    // Axe des Y
    const yAxis = g => g
        .attr("transform", `translate(0, 0)`)
        .call(d3.axisLeft(scaleY)
            .tickFormat((i) => tidyData[i].reg_nom)
            .tickSizeOuter(0))
        .call(g => g.select(".domain").remove()) // supprime la ligne de l'axe
        .selectAll('text')
        .style("font-size", (scaleY.bandwidth()*0.4)+"px")
        .style("fill", "grey"); // couleur du texte


    //---------------------------------------------------------------------------------------

    // Création du Bar Chart

    const rect = svgPlot.selectAll("rect")
        .data(tidyData)
        .join('rect')
        .attr("y", (d, i) => scaleY(i))
        .attr("x", scaleX(0))
        .attr("width", d => scaleX(d.tx_rea))
        .attr("height", scaleY.bandwidth()) // width des barres avec l'échelle d'épaiseur
        .attr("fill", "#0072B2")
        .attr("opacity", 0.6);


    //---------------------------------------------------------------------------------------

    // Création des labels

    const text = svgPlot.selectAll("text")
        .data(tidyData)
        .join('text')
        .attr("y", (d, i) => {
            return scaleY(i) + (scaleY.bandwidth()/1.5)
        })
        // écriture à l'intérieur ou à l'extérieur des barres
        .attr("x", d => (scaleX(d.tx_rea) >= 50) ? scaleX(d.tx_rea)-50 : scaleX(d.tx_rea)+4 ) 
        .text(d => Math.round(d.tx_rea)+"%")
        // en blanc si à l'intérieur des barres, en gris si à l'extérieur
        .attr("fill", d => (scaleX(d.tx_rea) >= 50) ? "#ffffff" : "grey")
        .attr("font-size", (scaleY.bandwidth()*0.4)+"px");


    //---------------------------------------------------------------------------------------

    // Placement des axes

    // Placement X
    svgPlot.append("g")
        .call(xAxis);

    // Placement Y
    svgPlot.append("g")
        .call(yAxis)
        .attr("color", "transparent"); // les ticks de l'axe X sont transparents


}




