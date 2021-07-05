Promise.all([
  d3.json("data/ftv_world.geojson"),
  d3.csv("data/owid_total_vacc.csv")
]).then(showData);

function showData(data) {
  const graphCfg = {
    target: `#vac-inter-graph01`,
    title: `Avancée de la vaccination dans le monde`,
    subtitle: `en pourcentage de la population ayant reçu au moins une injection, au [[autoDate]]`,
    caption: `Source. <a href='https://www.data.gouv.fr/fr/organizations/sante-publique-france/' target='_blank'>Santé publique France</a>`,
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

  const width = 500;
  const height = 300;
  const marginH = 80;
  const marginV = 20;
  const leg = 20;

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
    .attr("font-size", "12px");


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

  // Animation carte

  // création d'un groupe g qui contiendra le tooltip de la légende
  const tooltip = svgPlot.append("g")
    .attr("transform", `translate(${0}, ${height / 1.4})`);

  // condition pour que l'animation ne fonctionne que sur desktop
  // voir script device_detector pour la fonction deviceType()
  if (deviceType() == "desktop") {
    polygons.on("mouseover", function (d) {
      // lors du survol avec la souris l'opacité des barres passe à 1
      d3.select(this)
        .attr("opacity", 0.8)
        .style('cursor', 'default');

      // Activation de l'animation uniquement pour les pays qui
      // ont un pourcentage de vaccinés
      if (d.properties.people_vaccinated_per_hundred) {

        // écriture nom Pays
        tooltip
          .append('g')
          .append("text")
          .attr("x", 12)
          .attr("y", height - (height / 1.4))
          .text(d.properties.name_fr)
          .style("font-size", "13px")
          .style("font-weight", "bold");


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
        const donuts = tooltip
          .append('g')
          .attr('transform', 'translate(45, 30)')
          .selectAll("path")
          .data(pie(pieData))
          .join("path")
          // couleurs de remplissage des arcs
          .attr("fill", (d) => d.data.name === "Au moins une dose" ? seqScale(d.data.value / 100) : "#e0e0e0")
          .attr("d", arc);

        // Ajout des valeurs en pourcentage à l'intérieur de chaque ar
        tooltip
          .append('g')
          .attr('transform', d.properties.people_vaccinated_per_hundred < 0.1 ? `translate(${radius - 4}, ${radius - 4})` : `translate(${radius - 6}, ${radius - 4})`)
          .append("text")
          .text(Math.round(d.properties.people_vaccinated_per_hundred * 100) + "%")
          .attr("font-weight", "bold")
          .attr("font-size", "12px")
          .attr("fill", "#000000");

      }

    });

    // efface le contenu du groupe g lorsque la souris ne survole plus le polygone
    polygons.on("mouseout", function () {

      d3.select(this).attr("opacity", 1); // rétablit l'opacité à 1

      tooltip.selectAll("text").remove();
      tooltip.selectAll("rect").remove();
      tooltip.selectAll("path").remove();

    });
  }

}
