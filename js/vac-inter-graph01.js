Promise.all([
  d3.json("data/ftv_world.geojson"),
  d3.csv("data/owid_total_vacc.csv")
]).then(data => {
  const graphCfg = {
    target: `#vac-inter-graph01`,
    title: `Avancée de la vaccination dans le monde`,
    subtitle: `en pourcentage de la population ayant reçu au moins une injection, au [[autoDate]]`,
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
      tooltip: {
        font: 13,
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
    people_vaccinated: {},
    people_vaccinated_per_hundred: {},
    people_fully_vaccinated: {},
    people_fully_vaccinated_per_hundred: {},
    date: {}
  };

  // répartition des données d'incidence dans le container
  for (let d of dataVacc) {

    let code_pays = d.iso_code;

    dataContainer.people_vaccinated[code_pays] = d.people_vaccinated;
    dataContainer.people_vaccinated_per_hundred[code_pays] = +d.people_vaccinated_per_hundred / 100;
    dataContainer.people_fully_vaccinated[code_pays] = d.people_fully_vaccinated;
    dataContainer.people_fully_vaccinated_per_hundred[code_pays] = +d.people_fully_vaccinated_per_hundred / 100;
    dataContainer.date[code_pays] = d.date;

  }

  // répartition des données d'incidence dans les properties des polygones de la carte
  dataMap.features = dataMap.features.map((d) => {

    let code_pays = d.properties.iso_a3;

    d.properties.people_vaccinated = +dataContainer.people_vaccinated[code_pays]; // ATTENTION STRING A TRANSPOSER EN FLOAT
    d.properties.people_vaccinated_per_hundred = +dataContainer.people_vaccinated_per_hundred[code_pays]; // ATTENTION STRING A TRANSPOSER EN FLOAT
    d.properties.people_fully_vaccinated = dataContainer.people_fully_vaccinated[code_pays]; // ATTENTION STRING A TRANSPOSER EN FLOAT
    d.properties.people_fully_vaccinated_per_hundred = dataContainer.people_fully_vaccinated_per_hundred[code_pays]; // ATTENTION STRING A TRANSPOSER EN FLOAT
    d.properties.date = new Date(dataContainer.date[code_pays]); // ATTENTION À TRANSPOSER EN FORMAT DATE

    return d;

  });

  console.log(dataMap)

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
  const formatTimeToTitle = d3.timeFormat("%d %B %Y");
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

  // Création de l'échelle de couleur

  // échelle de couleur
  const seqScale = d3.scaleLinear()
    .domain([0, 0.25, 0.5, 0.75, 1])
    .range(['#9ecae1', '#4292c6', '#2171b5', '#084594']);


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
    .attr("fill", (d) => d.properties.people_vaccinated_per_hundred ? seqScale(d.properties.people_vaccinated_per_hundred) : "#eee")
    .style("stroke-width", "0.5px");



  //---------------------------------------------------------------------------------------

  // Legende ---- fonctionne avec l'API d3-legend
  // https://d3-legend.susielu.com/

  // paramètres de la legende à l'aide de la variable legCells définie avec l'échelled de couleur
  const legend = d3
    .legendColor()
    .shapeWidth(width / 11)
    .shapeHeight(10)
    .labelFormat(d3.format(".0%"))
    .cells([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
    .orient("horizontal")
    .labelAlign("middle")
    .scale(seqScale);

  // projection de la légende
  svgLegend.call(legend)
    .selectAll("text")
    .attr("fill", "grey")
    .attr("font-size", `${graphCfg?.size?.legend?.font || commonGraph.size[graphCfg.type][graphCfg.device].legend.font}px`);


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
  const tooltip = svgPlot
    .append("g")
    .attr("transform", `translate(${0}, ${height / 1.4})`);

  tooltip
    .append("rect")
    .attr('width', '100')
    .attr('height', '100')
    .style('fill', 'transparent')

  const tooltip2 = tooltip.append("g")

  // Texte cliquez sur la carte
  tooltip
    .append("text")
    .attr("x", 10)
    .attr("y", 0)
    .text(`Cliquez sur la`)
    .style("font-weight", "bold")
    .style("font-size", "11px");

  tooltip
    .append("text")
    .attr("x", 10)
    .attr("y", 15)
    .text(`carte pour afficher`)
    .style("font-weight", "bold")
    .style("font-size", "11px");

  tooltip
    .append("text")
    .attr("x", 10)
    .attr("y", 30)
    .text(`les valeurs`)
    .style("font-weight", "bold")
    .style("font-size", "11px");

  tooltip
    .selectAll('text')
    .attr('fill', 'grey');

  // Arrow nudge

  let linePoints = [
    [70, 35],
    [90, 60],
    [110, 50]
  ];

  const lineGen = d3.line()
    .curve(d3.curveBasis);

  svg.append("svg:defs").append("svg:marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr('refX', 0)//so that it comes towards the center.
    .attr("markerWidth", 3)
    .attr("markerHeight", 3)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "grey");

  tooltip
    .append("path")
    .attr('d', lineGen(linePoints))
    .attr('fill', 'transparent')
    .attr('stroke-width', '2px')
    .attr("marker-end", "url(#arrow)")
    .attr("stroke", "grey");

  polygons.on("mouseover", function (d) {
    // lors du survol avec la souris l'opacité des barres passe à 1
    d3.select(this)
      .attr("opacity", 0.8)
      .style('cursor', 'default');

    // Activation de l'animation uniquement pour les pays qui
    // ont un pourcentage de vaccinés
    if (d.properties.people_vaccinated_per_hundred) {

      // suppresion du nudge
      tooltip.selectAll('path')
        .remove()

      tooltip.selectAll('text')
        .remove()

      // début de la création du donut
      tooltip2.html('')

      // écriture nom Pays
      tooltip2
        .append("text")
        .attr("x", 50)
        .attr("y", height - (height / 1.4))
        .attr("text-anchor", "middle")
        .text(d.properties.name_fr)
        .style("font-weight", "bold")
        .style("font-size", `${graphCfg?.size?.tooltip?.font || commonGraph.size[graphCfg.type][graphCfg.device].tooltip.font}px`)


      // Agencement des données pour la génération du pie chart
      let pieData = [
        {
          name: "Au moins une dose",
          value: d.properties.people_vaccinated_per_hundred * 100,
        },
        {
          name: "Non vacciné",
          value: 100 - d.properties.people_vaccinated_per_hundred * 100,
        }
      ];

      // Projection des donuts
      const donuts = tooltip2
        .append('g')
        .attr('transform', 'translate(50, 30)')
        .selectAll("path")
        .data(pie(pieData))
        .join("path")
        // couleurs de remplissage des arcs
        .attr("fill", (d) => d.data.name === "Au moins une dose" ? seqScale(d.data.value / 100) : "#e0e0e0")
        .attr("d", arc);

      // Ajout des valeurs en pourcentage à l'intérieur de chaque ar
      tooltip2
        .append("text")
        .text(Math.round(d.properties.people_vaccinated_per_hundred * 100) + "%")
        .attr("x", 50)
        .attr("y", 33)
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .style("font-size", `${graphCfg?.size?.tooltip?.font || commonGraph.size[graphCfg.type][graphCfg.device].tooltip.font}px`)
    }
  });

  // efface le contenu du groupe g lorsque la souris ne survole plus le polygone
  polygons.on("mouseout", function () {
    d3.select(this).attr("opacity", 1); // rétablit l'opacité à 1

    tooltip.selectAll('path')
      .remove()

    tooltip.selectAll('text')
      .remove()

    // Texte cliquez sur la carte
    tooltip
      .append("text")
      .attr("x", 10)
      .attr("y", 0)
      .text(`Cliquez sur la`)
      .style("font-weight", "bold")
      .style("font-size", "11px");

    tooltip
      .append("text")
      .attr("x", 10)
      .attr("y", 15)
      .text(`carte pour afficher`)
      .style("font-weight", "bold")
      .style("font-size", "11px");

    tooltip
      .append("text")
      .attr("x", 10)
      .attr("y", 30)
      .text(`les valeurs`)
      .style("font-weight", "bold")
      .style("font-size", "11px");

    tooltip
      .selectAll('text')
      .attr('fill', 'grey');

    tooltip
      .append("path")
      .attr('d', lineGen(linePoints))
      .attr('fill', 'transparent')
      .attr('stroke-width', '2px')
      .attr("marker-end", "url(#arrow)")
      .attr("stroke", "grey");

  });
});
