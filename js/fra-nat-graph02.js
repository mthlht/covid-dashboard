d3.csv("https://raw.githubusercontent.com/mthlht/covid-dashboard/main/data/spf_fra_test.csv").then(showData);

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

    // Traitement des données

    // Sélection des variables nécessaires pour le graphique
    const tempData = data.map(d => {

        let newData = {
            "date": new Date(d.date), // ATTENTION À TRANSPOSER EN FORMAT DATE
            "positif": +d.roll_cas, // ATTENTION STRING A TRANSPOSER EN FLOAT
            "test": +d.roll_test, // ATTENTION STRING A TRANSPOSER EN FLOAT
            "taux": +d.percent / 100 // ATTENTION STRING A TRANSPOSER EN FLOAT et À DIVISER PAR 100
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
    const svg = d3.select('#fra-nat-graph02 .graph')
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
    const title = d3.select('#fra-nat-graph02 .graph-title')
        .html('Taux de positivité et nombre de tests réalisés')
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Écriture du sous-titre
    const subtitle = d3.select('#fra-nat-graph02 .graph-subtitle')
        .html('depuis septembre 2020')
        .style('padding-right', paddingTitles + "px")
        .style('padding-left', paddingTitles + "px");

    // Écriture
    const caption = d3.select('#fra-nat-graph02 .graph-caption')
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
    const scaleX = d3.scaleBand()
        .domain(d3.range(tidyData.length))
        .range([0, width])
        .padding(0.1);

    // échelle linéaire pour l'axe des Y de gauche
    const scaleY1 = d3.scaleLinear()
        .domain([0, d3.max(tidyData, d => d.test)])
        .range([height, 0]);

    // échelle linéaire pour l'axe des Y de droite
    const scaleY2 = d3.scaleLinear()
        .domain([0, d3.max(tidyData, d => d.taux)])
        .range([height, 0]);

    // échelee temporelle pour l'axe des X
    const scaleT = d3.scaleTime()
        .domain([d3.min(tidyData, d => d.date),
        d3.max(tidyData, d => d.date)])
        .range([0, width]);

    //---------------------------------------------------------------------------------------

    // Création et placement de l'axe des X
    
    // Axe des X
    const xAxis = g => g
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(scaleT)
            .ticks(5)
            .tickFormat(d3.timeFormat("%b %Y")))
        .selectAll('text')
        .style("fill", "grey"); // couleur du texte
    
    // Placement de l'axe des X
    svgPlot.append("g")
        .call(xAxis)
        .attr("color", "grey"); // mise en gris des ticks de l'axe des X

        //---------------------------------------------------------------------------------------

    // Création et placement des Axes Y
    
    // Axe Y de gauche
    svgPlot.append("g")
        .attr("color", "#0072B2") // couleur texte et ticks
        .attr("opacity", 0.6) // opacité texte et ticks
        .call(d3.axisLeft(scaleY1)
            .tickFormat(d => d.toLocaleString('fr-FR'))) // formatage grands nombre avec espace entre milliers)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width)
            .attr("stroke-opacity", 0.1)); // lignes horizontales projetées sur le graphique

    // Axe Y de droite 
    svgPlot.append("g")
        .attr("color", "#D55E00") // couleur texte et ticks
        .attr("transform", `translate(${width + 2}, 0 )`)
        .call(d3.axisRight(scaleY2)
            .tickFormat(d3.format(".0%"))
            .tickSizeInner(0))
        .call(g => g.select(".domain").remove()); // lignes horizontales projetées sur le graphique

    //---------------------------------------------------------------------------------------

    // Création du Bar Chart

    const rect = svgPlot.selectAll("rect")
        .data(tidyData)
        .join('rect')
        .attr("x", d => scaleT(d.date))
        .attr("y", d => scaleY1(d.test))
        .attr("height", d => scaleY1(0) - scaleY1(d.test))
        .attr("width", scaleX.bandwidth()) // width des barres avec l'échelle d'épaiseur
        .attr("fill", "#0072B2")
        .attr("opacity", 0.6);
    
    //---------------------------------------------------------------------------------------

    // Création du Line Chart
    
    // générateur de la ligne avec les échelles
    let lineGenerator = d3.line()
        .x(d => scaleT(d.date))
        .y(d => scaleY2(d.taux));
    
    // projection de la ligne
    svgPlot.append("path")
        .attr("d", lineGenerator(tidyData))
        .attr("fill", "none")
        .attr("stroke", "#D55E00")
        .attr("stroke-width", 3);
    
    //---------------------------------------------------------------------------------------

    // Légende

    // Objet contenant les informations à afficher dans la légende : text, couleur, opacité
    const legendeValues = [
        { "label": "Nombre de tests", "col": "#0072B2", "op": 0.6 },
        { "label": "Taux de positivité", "col": "#D55E00", "op": 1 }
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

    //---------------------------------------------------------------------------------------

    // Animation Bar Chart
    
    // création d'un groupe g qui contiendra le tooltip de la légende
    const tooltip = svgPlot.append("g")
    
    // condition pour que l'animation ne fonctionne que sur desktop
    // voir script device_detector pour la fonction deviceType()
    if (deviceType() == "desktop") {

        rect.on("mouseover", function (d) {

            // lors du survol avec la souris l'opacité des barres passe à 1
            d3.select(this)
                .attr("opacity", 1);
            
            // stockage dans deux deux variables des positions x et y de la barre survolée
            let xPosition = +scaleT(d.date);
            let yPosition = +scaleY1(d.test);
            const largeurBande = scaleX.bandwidth();

            // format de la date affichée dans le tooltip
            // stockage de la date de la barre survolée au format XX mois XXXX dans une variable
            const formatTime = d3.timeFormat("%d %b %Y");
            const instantT = formatTime(d.date);

            // création d'un rectangle blanc pour le tooltip
            tooltip.attr("transform", `translate(${xPosition - 70 + largeurBande / 2},
            ${yPosition - 50})`)
                .append("rect")
                .attr("width", 140)
                .attr("height", 50)
                .attr("fill", "#ffffff")
            
            // écriture texte dans le tooltip : ici la DATE
            tooltip.append("text")
                .attr("x", 5)
                .attr("y", 20)
                .text(`${instantT}`)
                .attr("font-size", "10px")
            
            // écriture texte dans le tooltip : ici la MOYENNE LISSÉE
            tooltip.append("text")
                .attr("x", 5)
                .attr("y", 32)
                .text(`Moyenne lissée: ${Math.round(d.test).toLocaleString('fr-FR')}`)
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
            
            // écriture texte dans le tooltip : ici le NOMBRE PAR JOUR
            tooltip.append("text")
                .attr("x", 5)
                .attr("y", 44)
                .text(`Nombre par jour: ${d.test.toLocaleString('fr-FR')}`)
                .attr("font-size", "10px")


        });

        // efface le contenu du groupe g lorsque la souris ne survole plus la barre
        rect.on("mouseout", function () {
            d3.select(this)
                .attr("opacity", 0.6) // rétablit l'opacité à 0.6

            tooltip.select("rect").remove()
            tooltip.selectAll("text").remove()


        });



    }




}