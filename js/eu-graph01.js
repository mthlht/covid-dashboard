Promise.all([
    d3.json("data/ftv_eu.geojson"),
    d3.csv("data/owid_incid.csv")
]).then(data => {
    const graphCfg = {
        target: `#eu-graph01`,
        title: `Nombre de cas Covid-19 par pays en Europe`,
        subtitle: `en nombre de cas, lissés sur une semaine, pour un million d'habitants [[autoDate]]`,
        caption: `Source. <a href='https://ourworldindata.org/coronavirus' target='_blank'>Our world in data</a>`,
        type: 'landscape', // définition du format du graphe
        device: window.screenDevice, // récupération de la largeur de l'écran
        size: {
            svg: {
                height: 300,
            },
            legend: {
                height: 20,
            },
        },
    }

    // Tri des données

    // données carto
    let dataMap = data[0];

    // données taux de vaccination
    let dataVacc = data[1];

    // création d'un container pour le tri des données de vaccination
    let dataContainer = {
        new_cases_smoothed_per_million: {},
        date: {}
    };

    // répartition des données d'incidence dans le container
    for (let d of dataVacc) {

        let code_pays = d.iso_code;

        dataContainer.new_cases_smoothed_per_million[code_pays] = d.new_cases_smoothed_per_million;
        dataContainer.date[code_pays] = d.date;

    }

    // répartition des données d'incidence dans les properties des polygones de la carte
    dataMap.features = dataMap.features.map((d) => {

        let code_pays = d.properties.iso_a3;

        d.properties.new_cases_smoothed_per_million = +dataContainer.new_cases_smoothed_per_million[code_pays]; // ATTENTION STRING A TRANSPOSER EN FLOAT
        d.properties.date = new Date(dataContainer.date[code_pays]); // ATTENTION À TRANSPOSER EN FORMAT DATE

        return d;

    });

    //---------------------------------------------------------------------------------------

    // Création du canevas SVG

    const width = graphCfg?.size?.svg?.width || commonGraph.size[graphCfg.type][graphCfg.device].svg.width;
    const height = graphCfg?.size?.svg?.height || commonGraph.size[graphCfg.type][graphCfg.device].svg.height;
    const marginH = graphCfg?.size?.margin?.horizontal || commonGraph.size[graphCfg.type][graphCfg.device].margin.horizontal;
    const marginV = graphCfg?.size?.margin?.vertical || commonGraph.size[graphCfg.type][graphCfg.device].margin.vertical;
    const leg = graphCfg?.size?.legend?.height || commonGraph.size[graphCfg.type][graphCfg.device].legend.height;

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

    // Date à afficher dans le titre
    // ATTENTION CETTE DATE DOIT FORCÉMENT ÊTRE PRISE DANS LE DATASET DU TAUX D'INCIDENCE
    const formatTimeToTitle = d3.timeFormat("%d %b %Y");
    const actualDate = new Date(dataVacc[0].date);
    const dateToTitle = formatTimeToTitle(actualDate);

    // Écriture titraille graphique

    // Définition du padding à appliquer aux titres, sous-titres, source
    // pour une titraille toujours alignée avec le graphique
    const paddingTxt = `0 ${marginH / viewBox.width * 100}%`

    // Écriture du titre
    d3.select(graphCfg.target)
        .select('.grph-title')
        .html(graphCfg.title)
        .style("padding", paddingTxt);

    // Écriture du sous-titre
    d3.select(graphCfg.target)
        .select('.grph-subtitle')
        .html(graphCfg.subtitle.replace(/\[\[\s*autoDate\s*\]\]/, `${dateToTitle}`))
        .style("padding", paddingTxt);

    // Écriture de la source
    d3.select(graphCfg.target)
        .select('.grph-caption')
        .html(graphCfg.caption)
        .style("padding", paddingTxt);

    //---------------------------------------------------------------------------------------

    // Création de l'échelle de couleur

    // échelle de couleur
    const seqScale = d3.scaleLinear()
        .domain([0, 0.5, 2.5, 5, 10, 50, 100, 500, 1000, 4000])
        .range(['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d', '#011615']);


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
        .attr("fill", (d) => d.properties.new_cases_smoothed_per_million ? seqScale(d.properties.new_cases_smoothed_per_million) : "#eee")
        .style("stroke-width", "0.5px");



    //---------------------------------------------------------------------------------------

    // Legende ---- fonctionne avec l'API d3-legend
    // https://d3-legend.susielu.com/

    // paramètres de la legende à l'aide de la variable legCells définie avec l'échelled de couleur
    const legend = d3
        .legendColor()
        .shapeWidth(width / 10)
        .cells([0, 0.5, 2.5, 5, 10, 50, 100, 500, 1000, 4000])
        .orient("horizontal")
        .labelAlign("middle")
        .scale(seqScale);

    // projection de la légende
    svgLegend.call(legend)
        .selectAll("text")
        .attr("fill", "grey")
        .attr('font-size', `${graphCfg?.size?.legend?.font || commonGraph.size[graphCfg.type][graphCfg.device].legend.font}px`)

    //---------------------------------------------------------------------------------------

    // Animation carte

    // création d'un groupe g qui contiendra le tooltip de la légende
    const tooltip = svgPlot.append("g")
        .attr("transform", `translate(${0}, ${height / 1.4})`);

    // création du tooltip de la légende personnalisé
    const custTooltip = commonGraph.tooltip(graphCfg.target, d3)

    polygons.on("mouseover", function (d, idx, arr) {
        // lors du survol avec la souris l'opacité des polygones passe à 0.6
        d3.select(this).attr("opacity", 0.6);

        // format de la date affichée dans le tooltip
        // stockage de la date de la barre survolée au format XX mois XXXX dans une variable
        const formatTime = d3.timeFormat("%d %b %Y");
        const instantT = formatTime(d.date);

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
            .html(`${Math.round(d.properties.new_cases_smoothed_per_million).toLocaleString("fr-FR")} cas pour un million d'habitants`);

    });

    // efface le contenu du groupe g lorsque la souris ne survole plus le polygone
    polygons.on("mouseout", function () {

        d3.select(this).attr("opacity", 1); // rétablit l'opacité à 1

        custTooltip.style('opacity', '0')
    });
});
