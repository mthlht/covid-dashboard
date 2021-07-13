Promise.all([
  d3.json("data/carto_ftv_dep.geojson"),
  d3.csv("data/incid_dep.csv"),
]).then(data => {
  const graphCfg = {
    target: `#fra-reg-graph02`,
    title: `Variation du taux d'incidence par département`,
    caption: `Source. <a href='https://www.data.gouv.fr/fr/organizations/sante-publique-france/' target='_blank'>Santé publique France</a>`,
    size: {
      tooltip: {
        font: 20,
      },
    },
    type: 'square',
    device: window.screenDevice,
  };

  // Tri des données

  // données carto
  let dataMap = data[0];

  // données incidence
  let dataIncid = data[1];

  // création d'un container pour le tri des données d'incidence
  let dataContainer = { incid: {}, incid_evol: {}, date: {} };

  // répartition des données d'incidence dans le container
  for (let d of dataIncid) {
    let dep = d.dep;

    dataContainer.incid[dep] = d.incid;
    dataContainer.incid_evol[dep] = d.incid_evol / 100;
    dataContainer.date[dep] = d.date;
  }

  // répartition des données d'incidence dans les properties des polygones de la carte
  dataMap.features = dataMap.features.map((d) => {
    let dep = d.properties.insee;

    d.properties.incid = +dataContainer.incid[dep]; // ATTENTION STRING A TRANSPOSER EN FLOAT
    d.properties.incid_evol = +dataContainer.incid_evol[dep]; // ATTENTION STRING A TRANSPOSER EN FLOAT
    d.properties.date = new Date(dataContainer.date[dep]); // ATTENTION À TRANSPOSER EN FORMAT DATE

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
  }

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

  // Écriture titraille graphique

  // Définition du padding à appliquer aux titres, sous-titres, source
  // pour une titraille toujours alignée avec le graphique
  const padding = marginH / viewBox.width * 100
  const paddingTxt = `0 ${padding}%`

  document.documentElement.style.setProperty('--gutter-size', `${padding}%`)

  // Écriture du titre
  d3.select(graphCfg.target)
    .select('.grph-title')
    .html(graphCfg.title)
    .style("padding", paddingTxt)

  // Date à afficher dans le titre
  // ATTENTION CETTE DATE DOIT FORCÉMENT ÊTRE PRISE DANS LE DATASET DU TAUX D'INCIDENCE
  const formatTimeToTitle = d3.timeFormat("%d %B %Y");
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
    .style("padding", paddingTxt)

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

  // définition de la projection de la carte (en geoMercator)
  const projection = d3
    .geoMercator()
    .center([2.353515, 47.366021])
    .scale(1600)
    .translate([width / 2, height / 2]);

  // création d'un générateur géographique de formes
  const path = d3.geoPath().projection(projection);

  // projection des polygones géographiques
  const polygons = svgPlot
    .selectAll("path")
    .data(dataMap.features)
    .join("path")
    .attr("d", (d) => path(d))
    .attr("stroke", "#ffffff")
    .attr("fill", (d) => isNaN(d.properties.incid_evol) ? "#e0e0e0" : divScale(d.properties.incid_evol));

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
    .attr("font-size", `${ graphCfg?.size?.legend?.font || commonGraph.size[graphCfg.type][graphCfg.device].legend.font }px`);

  //---------------------------------------------------------------------------------------

  // Animation carte

  // création d'un groupe g qui contiendra le tooltip de la légende
  const tooltip = svgPlot.append("g").attr("transform", `translate(0, 60)`);

  // Texte cliquez sur la carte
  tooltip
    .append("text")
    .attr("x", 30)
    .attr("y", 0)
    .text(`Cliquez sur la`)
    .style("font-weight", "bold");

  tooltip
    .append("text")
    .attr("x", 30)
    .attr("y", 20)
    .text(`carte pour afficher`)
    .style("font-weight", "bold");

  tooltip
    .append("text")
    .attr("x", 30)
    .attr("y", 40)
    .text(`les valeurs`)
    .style("font-weight", "bold");
  tooltip
    .selectAll('text')
    .attr('fill', 'grey');

  // Arrow nudge

  let linePoints = [
    [80, 50],
    [80, 70],
    [100, 80]
  ];

  const lineGen = d3.line()
    .curve(d3.curveBasis);

  svg.append("svg:defs").append("svg:marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr('refX', 0)//so that it comes towards the center.
    .attr("markerWidth", 4)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "grey");

  tooltip
    .append("path")
    .attr('d', lineGen(linePoints))
    .attr('fill', 'transparent')
    .attr('stroke-width', '3px')
    .attr("marker-end", "url(#arrow)")
    .attr("stroke", "grey");

  polygons.on("mouseover", function (d) {
    // lors du survol avec la souris l'opacité des barres passe à 1
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

    // Suppression du nudge
    tooltip
      .selectAll('text')
      .remove()

    tooltip
      .selectAll('path')
      .remove()

    // Affichage du nom du département en gras
    tooltip
      .append("text")
      .attr("y", 0)
      .text(d.properties.name)
      .attr("font-size", `${graphCfg?.size?.tooltip?.font || commonGraph.size[graphCfg.type][graphCfg.device].tooltip.font}px`)
      .style("font-weight", "bold");

    // variation ou baisse selon la valeur incid_evol
    let variation = +d.properties.incid_evol > 0 ? "hausse" : "baisse";

    // valeur arrondie à 2 décimales de incid_evol
    let valeur = Math.abs(+d.properties.incid_evol * 100).toFixed(2).replace('.00', '').replace('.', ','); // Remplace le point en virgule et supprime les décimales nulles.

    if (!(isNaN(d.properties.incid_evol))) {
      // 1e ligne sous le nom du département
      tooltip
        .append("text")
        .attr("y", 20)
        .text(`en ${variation} de ${valeur}%`);

      // 2e ligne sous le nom du département
      tooltip
        .append("text")
        .attr("y", 35)
        .text(`entre le ${instantT7} et le ${instantT}`);

    };

  });

  // efface le contenu du groupe g lorsque la souris ne survole plus le polygone
  polygons.on("mouseout", function () {
    d3.select(this).attr("opacity", 1); // rétablit l'opacité à 1

    tooltip.selectAll("text").remove();

    tooltip
      .append("text")
      .attr("x", 30)
      .attr("y", 0)
      .text(`Cliquez sur la`)
      .style("font-weight", "bold");

    tooltip
      .append("text")
      .attr("x", 30)
      .attr("y", 20)
      .text(`carte pour afficher`)
      .style("font-weight", "bold");

    tooltip
      .append("text")
      .attr("x", 30)
      .attr("y", 40)
      .text(`les valeurs`)
      .style("font-weight", "bold");

    tooltip
      .selectAll('text')
      .attr('fill', 'grey');

    tooltip
      .append("path")
      .attr('d', lineGen(linePoints))
      .attr('fill', 'transparent')
      .attr('stroke-width', '3px')
      .attr("marker-end", "url(#arrow)")
      .attr("stroke", "grey");

  });

});
