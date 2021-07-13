Promise.all([
    d3.json("data/ftv_world.geojson"),
    d3.csv("data/owid_total_dc.csv")
]).then(data => {
    const graphCfg = {
        target: `#inter-graph03`,
        title: `Nombre de morts du Covid-19 répertoriés dans le monde`,
        subtitle: `au [[autoDate]]`,
        caption: `Source. <a href='https://ourworldindata.org/coronavirus' target='_blank'>Our world in data</a>`,
        type: 'landscape', // définition du format du graphe
        device: window.screenDevice, // récupération de la largeur de l'écran
        size: {
            legend: {
                font: 9,
            },
        },
    }

    // Tri des données

    let dataMap = data[0];
    let dataDc = data[1];

    let dataContainer = {
        'continent': {},
        'date': {},
        'dc': {}
    };

    for (let d of dataDc) {

        let isoCode = d.iso_code;

        dataContainer.continent[isoCode] = d.continent;
        dataContainer.dc[isoCode] = d.total_deaths;
        dataContainer.date[isoCode] = d.date;

    };

    // répartition des données d'incidence dans les properties des polygones de la carte

    dataMap.features = dataMap.features.map(d => {

        let isoCode = d.properties.iso_a3;

        d.properties.continent = +dataContainer.continent[isoCode]; // TRANSPOSITION EN FLOAT
        d.properties.dc = +dataContainer.dc[isoCode]; // TRANSPOSITION EN FLOAT
        d.properties.date = new Date(dataContainer.date[isoCode]); // FORMAT DATE

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
        height: height + marginV
    };

    // création du canevas pour le Graphique
    const svg = d3
        .select(graphCfg.target)
        .select('.grph-content')
        .insert('svg', ':first-child')
        .attr("viewBox", [0, 0, viewBox.width, viewBox.height])
        .attr("preserveAspectRatio", "xMinYMid");

    // création d'un groupe g pour le Graphique
    const svgPlot = svg
        .append("g")
        .attr("transform", `translate(${marginH}, ${0})`);

    //---------------------------------------------------------------------------------------

    // Date à afficher dans le titre
    // ATTENTION CETTE DATE DOIT FORCÉMENT ÊTRE PRISE DANS LE DATASET DU TAUX D'INCIDENCE
    const formatTimeToTitle = d3.timeFormat("%d %B %Y");
    const actualDate = new Date(dataDc[0].date);
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
        .select('.grph-title')
        .append('span')
        .attr('class', 'grph-date')
        .html(graphCfg.subtitle.replace(/\[\[\s*autoDate\s*\]\]/, `${dateToTitle}`));

    // Écriture de la source
    d3.select(graphCfg.target)
        .select('.grph-caption')
        .html(graphCfg.caption)
        .style("padding", paddingTxt);


    //---------------------------------------------------------------------------------------

    // Projection carte

    // définition de la projection de la carte (en geoNaturalEarth1)
    const projection = d3.geoNaturalEarth1()
        .center([0.049747, 18.798336])
        //.scale([width / (1.3 * Math.PI)])
        .scale(112)
        .translate([width / 2, height / 2]);

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
        .attr("fill", "#e0e0e0")
        .style("stroke-width", "0.5px");


    //---------------------------------------------------------------------------------------

    // Spikes

    const spike = (length, w = 3) => `M${-w / 2},0L0,${-length}L${w / 2},0`;

    const dataSpikes = dataMap.features.map(d => {

        let position = projection([+d.properties.longitude, +d.properties.latitude]);

        let objSpike = {
            'pays': d.properties.name_fr,
            'dc': d.properties.dc,
            'position': position
        };

        return objSpike;

    });

    const length = d3.scaleLinear([0, d3.max(dataSpikes, d => d.dc)], [0, 100])


    svgPlot.append("g")
        .attr("fill", "#D55E00")
        .attr("fill-opacity", 0.3)
        .attr("stroke", "#D55E00")
        .selectAll("path")
        .data(dataSpikes
            .filter(d => d.position)
            .sort((a, b) => d3.ascending(a.position[1], b.position[1])
                || d3.ascending(a.position[0], b.position[0])))
        .join("path")
        .attr("transform", d => `translate(${d.position})`)
        .attr("d", d => spike(length(isNaN(d.dc) ? 0 : d.dc)))




    //---------------------------------------------------------------------------------------

    // Légende

    const legend = svgPlot.append("g")
        .attr("transform", `translate(${-10}, ${height})`)
        .attr("fill", "#777")
        // .attr("font-size", "8px")
        .selectAll("g")
        .data([600000, 200000, 50000, 10000])
        .join("g")
        .attr("transform", (d, i) => `translate(${10 + 40 * i},0)`)
        .attr("font-size", `${ graphCfg?.size?.legend?.font || commonGraph.size[graphCfg.type][graphCfg.device].legend.font }px`);

    legend.append("path")
        .attr("fill", "#D55E00")
        .attr("fill-opacity", 0.3)
        .attr("stroke", "#D55E00")
        .attr("d", d => spike(length(d)));

    legend.append("text")
        .attr("dy", "1.2em")
        .attr("dx", "-1.5em")
        .attr("font-size", "10px")
        .text(d => d.toLocaleString("fr-FR"));


    //---------------------------------------------------------------------------------------

    // Rayon des donuts
    const radius = Math.min(width / 4, height / 4) / 2;

    // Les arcs du pie en donut (avec un trou à l'intérieur)
    const arc = d3
        .arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius - 1);

    // Générateur de path
    const pie = d3
        .pie()
        .padAngle(0.005)
        .sort(null)
        .value((d) => d.value);

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
            .html(`${Math.round(d.properties.dc).toLocaleString("fr-FR")} décès`);

    });

    // efface le contenu du groupe g lorsque la souris ne survole plus le polygone
    polygons.on("mouseout", function () {

        d3.select(this).attr("opacity", 1); // rétablit l'opacité à 1

        custTooltip.style('opacity', '0')
    });
});
