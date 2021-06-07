d3.csv("data/hosp_reg.csv").then(showData);

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
            "date": new Date(d.date), // ATTENTION À TRANSPOSER EN FORMAT DATE
            "tot_hosp_7j": +d.tot_hosp_7j, // ATTENTION STRING A TRANSPOSER EN FLOAT
            "reg_nom": d.reg_nom
        }

        return newData

    });

    const tidyData = tempData.sort((a, b) => d3.ascending(a.tot_hosp_7j, b.tot_hosp_7j))

    console.log(data)



    //---------------------------------------------------------------------------------------


    // Création du canevas SVG

    const width = 500;
    const height = 500;
    const marginH = 80;
    const marginV = 20;

    const marginHratio = marginH * 2.5;
    const widthRatio = width - marginHratio;

    // création du canevas pour le Graphique
    const svg = d3.select('#fra-reg-graph04 .graph')
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
    const title = d3.select('#fra-reg-graph04 .graph-title')
        .html("Nouvelles hospitalisatons de patients Covid par région depuis une semaine")
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
    const subtitle = d3.select('#fra-reg-graph04 .graph-subtitle')
        .html("au " + dateToTitle)
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Écriture
    const caption = d3.select('#fra-reg-graph04 .graph-caption')
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

    // Création des échelles

    // échelle pour l'épaisseur des barres du bar chart
    const scaleY = d3.scaleBand()
        .domain(d3.range(tidyData.length))
        .range([height, 0])
        .padding(0.1);

    // échelle linéaire pour l'axe des Y
    const scaleX = d3.scaleLinear()
        .domain([0, d3.max(tidyData, d => d.tot_hosp_7j)])
        .range([0, widthRatio]);

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
        .style("font-size", (scaleY.bandwidth()*0.5)+"px")
        .style("fill", "grey"); // couleur du texte


    //---------------------------------------------------------------------------------------

    // Création du Bar Chart

    const rect = svgPlot.selectAll("rect")
        .data(tidyData)
        .join('rect')
        .attr("y", (d, i) => scaleY(i))
        .attr("x", scaleX(0))
        .attr("width", d => scaleX(d.tot_hosp_7j))
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
        .attr("x", d => (scaleX(d.tot_hosp_7j) >= 40) ? scaleX(d.tot_hosp_7j)-40 : scaleX(d.tot_hosp_7j)+4 )
        .text(d => Math.round(d.tot_hosp_7j))
        .attr("fill", d => (scaleX(d.tot_hosp_7j) >= 40) ? "#ffffff" : "grey")
        .attr("font-size", (scaleY.bandwidth()*0.5)+"px");


    //---------------------------------------------------------------------------------------

    // Placement des axes

    // Placement X
    svgPlot.append("g")
        .call(xAxis)
        .attr("color", "grey"); // mise en gris des ticks de l'axe des X

    // Placement Y
    svgPlot.append("g")
        .call(yAxis)
        .attr("color", "transparent");


}




