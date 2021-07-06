Promise.all([
  d3.json("data/tidy_ftv_reg.geojson"),
  d3.csv("data/vacc_reg.csv"),
]).then(data => {
  const graphCfg = {
    target: `#vac-fra-graph06`,
    title: `Part de la population ayant reçu au moins une injection par région`,
    subtitle: `au [[autoDate]]`,
    caption: `Source. <a href='https://www.data.gouv.fr/fr/organizations/sante-publique-france/' target='_blank'>Santé publique France</a>`,
    type: 'square',
    device: window.screenDevice,
  }

  // Tri des données

  // données carto
  let dataMap = data[0];

  // données taux de vaccination
  let dataVacc = data[1];

  // création d'un container pour le tri des données de vaccination
  let dataContainer = { t_dose1: {}, p_dose1: {}, date: {} };

  // répartition des données d'incidence dans le container
  for (let d of dataVacc) {

    let reg = d.reg;

    dataContainer.t_dose1[reg] = d.n_tot_dose1;
    dataContainer.p_dose1[reg] = d.couv_tot_dose1 / 100;
    dataContainer.date[reg] = d.jour;

  }

  // répartition des données d'incidence dans les properties des polygones de la carte
  dataMap.features = dataMap.features.map((d) => {
    let reg = d.properties.INSEE_REG;

    d.properties.t_dose1 = +dataContainer.t_dose1[reg]; // ATTENTION STRING A TRANSPOSER EN FLOAT
    d.properties.p_dose1 = +dataContainer.p_dose1[reg]; // ATTENTION STRING A TRANSPOSER EN FLOAT
    d.properties.date = new Date(dataContainer.date[reg]); // ATTENTION À TRANSPOSER EN FORMAT DATE

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

  // Date à afficher dans le titre
  // ATTENTION CETTE DATE DOIT FORCÉMENT ÊTRE PRISE DANS LE DATASET DU TAUX D'INCIDENCE
  const formatTimeToTitle = d3.timeFormat("%d %b %Y");
  const actualDate = new Date(dataVacc[0].jour);
  const dateToTitle = formatTimeToTitle(actualDate);

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

  // Écriture du sous-titre
  d3.select(graphCfg.target)
    .select('.grph-subtitle')
    .html(graphCfg.subtitle.replace(/\[\[\s*autoDate\s*\]\]/, `${ dateToTitle }`))
    .style("padding", paddingTxt);

  // Écriture de la source
  d3.select(graphCfg.target)
    .select('.grph-caption')
    .html(graphCfg.caption)
    .style("padding", paddingTxt)

  //---------------------------------------------------------------------------------------

  // Création de l'échelle de couleur

  // échelle de couleur

  const listVals = dataVacc.map(d => +d.couv_tot_dose1/100);

  console.log(listVals);

  // Calling the d3.quantile() function
  const Q0 = d3.quantile(listVals, 0);
  const Q1 = d3.quantile(listVals, 0.25);
  const Q2 = d3.quantile(listVals, 0.5);
  const Q3 = d3.quantile(listVals, 0.75);

  const arrayQuantiles = [Q0, Q1, Q2, Q3];

  console.log(arrayQuantiles);

  const seqScale = d3
    .scaleLinear()
    .domain(arrayQuantiles)
    .range(["#eff3ff", "#bdd7e7", "#6baed6", "#2171b5"]);


  //---------------------------------------------------------------------------------------

  // Projection carte

  // définition de la projection de la carte (en geoMercator)
  const projection = d3
    .geoMercator()
    .center([2.2, 47.366021])
    .scale(1800)
    .translate([width / 2, height / 2.5]);

  // création d'un générateur géographique de formes
  const path = d3.geoPath().projection(projection);

  // projection des polygones géographiques

  //const mapMetro = dataMap.features.filter(d => +d.properties.INSEE_REG>=10)
  //const mapOm = dataMap.features.filter(d => +d.properties.INSEE_REG<10)


  const polygons = svgPlot
    .selectAll("g")
    .data(dataMap.features)
    .join("g")

  polygons
    .append("path")
    .attr("d", (d) => path(d))
    .attr("stroke", d => +d.properties.INSEE_REG<10 || +d.properties.INSEE_REG==94 ? "#999999" : "#ffffff")
    .attr("fill", (d) => seqScale(d.properties.p_dose1));

  polygons
    .append("text")
    .attr("x", d => +d.properties.INSEE_REG<10 || +d.properties.INSEE_REG==94 ? path.centroid(d)[0]-55 : path.centroid(d)[0]-15)
    .attr("y", d => path.centroid(d)[1]+10)
    .text(d => Math.round(d.properties.p_dose1*100) + "%")
    .style("font-size", 11)
    .style("fill", d => +d.properties.INSEE_REG<10 || +d.properties.INSEE_REG==94 ? "#000000" : "#ffffff");



  //---------------------------------------------------------------------------------------

  // Legende ---- fonctionne avec l'API d3-legend
  // https://d3-legend.susielu.com/

  //---------------------------------------------------------------------------------------

  // Animation carte

  // création d'un groupe g qui contiendra le tooltip de la légende
  const tooltip = svgPlot.append("g").attr("transform", `translate(0, 0)`);

  // condition pour que l'animation ne fonctionne que sur desktop
  // voir script device_detector pour la fonction deviceType()
  if (deviceType() == "desktop") {
    polygons.on("mouseover", function (d) {
      // lors du survol avec la souris l'opacité des barres passe à 1
      d3.select(this)
        .attr("opacity", 0.8)
        .style('cursor', 'default');

      // format de la date affichée dans le tooltip
      // stockage de la date de la barre survolée au format XX mois XXXX dans une variable
      const formatTime = d3.timeFormat("%d %b");
      let dateT = d.properties.date;
      let instantT = formatTime(dateT);

      // Affichage du nom du département en gras
      tooltip
        .append("text")
        .attr("y", 0)
        .text(d.properties.NOM)
        .style("font-size", "20px")
        .style("font-weight", "bold");

      // variation ou baisse selon la valeur incid_evol
      let labelNbDoses1 = +d.properties.t_dose1>=1000000
        ? `${ (+d.properties.t_dose1 / 1000000).toFixed(2).replace('.', ',')} million${ (+d.properties.t_dose1/1000000) >= 2 ? 's' : '' } de vaccinés` // permet d'ajouter un 's' à partir de 2 millions
        : `${ (+d.properties.t_dose1 + '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') } vaccinés`; // Permet d'ajouter un espace entre les milliers

      // valeur arrondie à 2 décimales de incid_evol
      let pcDoses1 = Math.round(+d.properties.p_dose1*100);

      // 1e ligne sous le nom du département
      tooltip
        .append("text")
        .attr("y", 22)
        .text(labelNbDoses1);

      // 2e ligne sous le nom du département
      tooltip
        .append("text")
        .attr("y", 40)
        .text(`soit ${pcDoses1}% de la population`);
    });

    // efface le contenu du groupe g lorsque la souris ne survole plus le polygone
    polygons.on("mouseout", function () {
      d3.select(this).attr("opacity", 1); // rétablit l'opacité à 1

      tooltip.selectAll("text").remove();
    });
  }

});
