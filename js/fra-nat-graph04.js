d3.csv("data/spf_fra_data.csv").then(showData);

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
            "total_hosp": +d.total_hosp, // ATTENTION STRING A TRANSPOSER EN FLOAT
            "part_rea": +d.total_rea, // ATTENTION STRING A TRANSPOSER EN FLOAT
            "part_hosp": (+d.total_hosp)-(+d.total_rea) // ATTENTION STRING A TRANSPOSER EN FLOAT
        }

        return newData

    });

    // Filtre les données uniquement à partir du 1er septembre
    const tidyData = tempData.filter(d => d.date >= new Date("2020-09-01"));

    //---------------------------------------------------------------------------------------


    // Création du canevas SVG

    const width = 500;
    const height = 200;
    const marginH = 80;
    const marginV = 20;
    const leg = 40;

    // création du canevas pour le Graphique
    const svg = d3.select('#fra-nat-graph04 .graph')
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
    const title = d3.select('#fra-nat-graph04 .graph-title')
        .html('Evolution du nombre de patients Covid hospitalisés')
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Écriture du sous-titre
    const subtitle = d3.select('#fra-nat-graph04 .graph-subtitle')
        .html('depuis septembre 2020')
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Écriture
    const caption = d3.select('#fra-nat-graph04 .graph-caption')
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

    // échelle linéaire pour l'axe des Y
    const scaleY = d3.scaleLinear()
        .domain([0, d3.max(tidyData, d => d.total_hosp)])
        .range([height, 0]);

    // échelee temporelle pour l'axe des X
    const scaleT = d3.scaleTime()
        .domain([d3.min(tidyData, d => d.date),
        d3.max(tidyData, d => d.date)])
        .range([0, width]);

    //---------------------------------------------------------------------------------------

    // Création des axes

    // Axe des X
    const xAxis = g => g
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(scaleT)
            .ticks(4)
            .tickFormat(d3.timeFormat("%b %Y")))
        .selectAll('text')
        .style("fill", "grey") // couleur du texte

    // Axe des Y
    const yAxis = g => g
        .attr("transform", `translate(0, 0)`)
        .call(d3.axisLeft(scaleY)
            .ticks(8) // Nombre de ticks
            .tickFormat(d => d.toLocaleString('fr-FR'))) // formatage grands nombre avec espace entre milliers
        .call(g => g.select(".domain").remove()) // supprime la ligne de l'axe
        .selectAll('text')
        .style("fill", "grey") // couleur du texte

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

    //---------------------------------------------------------------------------------------

    // Création du Bar Chart
    
    // générateur de l'aire des hospitalisations
    const areaHosp = d3.area()
        .curve(d3.curveLinear)
        .x(d => scaleT(d.date))
        .y0(d => scaleY(d.part_rea))
        .y1(d => scaleY(d.part_hosp));
    
    // générateur de l'aire des réanimations
    const areaRea = d3.area()
        .curve(d3.curveLinear)
        .x(d => scaleT(d.date))
        .y0(scaleY(0))
        .y1(d => scaleY(d.part_rea));
    
    // projection de l'aire des hospitalisations
    svgPlot.append("path")
        .datum(tidyData)
        .attr("fill", "#0072B2")
        .attr("d", areaHosp)
        .attr("opacity", 0.6)
    
    // projection de l'aire des réanimations
    svgPlot.append("path")
        .datum(tidyData)
        .attr("fill", "#D55E00")
        .attr("d", areaRea)

    //---------------------------------------------------------------------------------------

    // Affichage des dernières valeurs

    const maxDate = d3.max(tidyData, d => d.date);

    const maxVal = tidyData.filter(d => d.date == maxDate);

    svgPlot.append("text")
        .attr("x", width + 8)
        .attr("y", scaleY(maxVal[0].part_rea))
        .text(maxVal[0].part_rea.toLocaleString('fr-FR'))
        .style("fill", "#D55E00");

    svgPlot.append("text")
        .attr("x", width + 8)
        .attr("y", scaleY(maxVal[0].part_hosp))
        .text(maxVal[0].part_hosp.toLocaleString('fr-FR'))
        .style("fill", "#0072B2");

    //---------------------------------------------------------------------------------------

    // Légende

    // Objet contenant les informations à afficher dans la légende : text, couleur, opacité
    const legendeValues = [
        { "label": "Hospitalisations", "col": "#0072B2", "op": 0.6 },
        { "label": "Réanimations", "col": "#D55E00", "op": 1 }
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




