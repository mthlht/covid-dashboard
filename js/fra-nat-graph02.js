d3.csv("data/spf_fra_test.csv").then(data => {
  const graphCfg = {
    target: `#fra-nat-graph02`,
    title: `Taux de positivité et nombre de tests réalisés`,
    subtitle: `depuis le [[startDate]]`,
    caption: `Source. <a href='https://www.data.gouv.fr/fr/organizations/sante-publique-france/' target='_blank'>Santé publique France</a>`,
    startDate: {
      day: '01',
      month: '09',
      year: '2020',
    },
    type: 'landscape',
    device: window.screenDevice,
    ticksY: {
      tablet: undefined,
      desktop: undefined,
    },
  }

  // Traitement des données

  // Sélection des variables nécessaires pour le graphique
  const tempData = data.map(d => {
    return {
      date: new Date(d.date), // ATTENTION À TRANSPOSER EN FORMAT DATE
      positif: +d.roll_cas, // ATTENTION STRING A TRANSPOSER EN FLOAT
      test: +d.roll_test, // ATTENTION STRING A TRANSPOSER EN FLOAT
      taux: +d.percent / 100, // ATTENTION STRING A TRANSPOSER EN FLOAT et À DIVISER PAR 100
    };
  });

  // Filtre les données uniquement à partir du 1er septembre
  const startDate = `${ graphCfg.startDate.year}-${ graphCfg.startDate.month}-${ graphCfg.startDate.day}`
  const tidyData = tempData.filter((d) => d.date >= new Date(startDate));

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
  const paddingTxt = `0 ${ padding }%`

  document.documentElement.style.setProperty('--gutter-size', `${ padding }%`)

  // Écriture du titre
  d3.select(graphCfg.target)
    .select('.grph-title')
    .html(graphCfg.title)
    .style("padding", paddingTxt)

  // Écriture du sous-titre
  d3.select(graphCfg.target)
    .select('.grph-title')
    .append('span')
    .attr('class', 'grph-date')
    .html(graphCfg.subtitle.replace(/\[\[\s*startDate\s*\]\]/, `${ +graphCfg?.startDate?.day === 1 ? +graphCfg?.startDate?.day + 'er' : graphCfg?.startDate?.day } ${ commonGraph.locale.months[+graphCfg?.startDate?.month - 1] } ${ graphCfg?.startDate?.year }`))

  // Écriture de la source
  d3.select(graphCfg.target)
    .select('.grph-caption')
    .html(graphCfg.caption)
    .style("padding", paddingTxt)

  //---------------------------------------------------------------------------------------

  // Création des échelles

  // échelle pour l'épaisseur des barres du bar chart
  const scaleX = d3
    .scaleBand()
    .domain(d3.range(tidyData.length))
    .range([0, width])
    .padding(0.1);

  // échelle linéaire pour l'axe des Y de gauche
  const scaleY1 = d3
    .scaleLinear()
    .domain([0, d3.max(tidyData, (d) => d.test)])
    .range([height, 0]);

  // échelle linéaire pour l'axe des Y de droite
  const scaleY2 = d3
    .scaleLinear()
    .domain([0, d3.max(tidyData, (d) => d.taux)])
    .range([height, 0])

  // échelee temporelle pour l'axe des X
  const scaleT = d3
    .scaleTime()
    .domain([d3.min(tidyData, (d) => d.date), d3.max(tidyData, (d) => d.date)])
    .range([0, width]);

  //---------------------------------------------------------------------------------------

  // Création et placement de l'axe des X

  // Axe des X
  const xAxis = (g) =>
    g
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(scaleT).ticks(5).tickFormat(d3.timeFormat("%b %Y")))
      .selectAll("text")
      .style("fill", `${ graphCfg?.size?.axis?.color || commonGraph.size[graphCfg.type][graphCfg.device].axis.color }px`)
      .style("font-size", `${ graphCfg?.size?.axis?.font || commonGraph.size[graphCfg.type][graphCfg.device].axis.font }px`)

  // Placement de l'axe des X
  svgPlot.append("g").call(xAxis).attr("color", "grey"); // mise en gris des ticks de l'axe des X

  //---------------------------------------------------------------------------------------

  // Création et placement des Axes Y

  // Axe Y de gauche
  svgPlot
    .append("g")
    .attr("color", "#0072B2") // couleur texte et ticks
    .attr("opacity", 0.6) // opacité texte et ticks
    .call(
      d3
        .axisLeft(scaleY1)
        .ticks(graphCfg.ticksY && graphCfg.device in graphCfg.ticksY ? graphCfg.ticksY[graphCfg.device] : commonGraph.ticksY[graphCfg.device])
        .tickFormat((d) => d.toLocaleString("fr-FR")) // formatage grands nombre avec espace entre milliers)
    )
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width)
        .attr("stroke-opacity", 0.1)
    ) // lignes horizontales projetées sur le graphique
    .selectAll("text")
    .style('font-size', `${graphCfg?.size?.axis?.font || commonGraph.size[graphCfg.type][graphCfg.device].axis.font}px`)

  // Axe Y de droite
  svgPlot
    .append("g")
    .attr("color", "#D55E00") // couleur texte et ticks
    .attr("transform", `translate(${width + 2}, 0 )`)
    .style('font-size', `${graphCfg?.size?.axis?.font || commonGraph.size[graphCfg.type][graphCfg.device].axis.font}px`)
    .call(d3.axisRight(scaleY2).tickFormat(d3.format(".0%")).tickSizeInner(0))
    .call((g) => g.select(".domain").remove()); // lignes horizontales projetées sur le graphique

  //---------------------------------------------------------------------------------------

  // Création du Bar Chart

  const areaTest = d3
    .area()
    .curve(d3.curveLinear)
    .x((d) => scaleT(d.date))
    .y0((d) => scaleY1(0))
    .y1((d) => scaleY1(d.test))
    .curve(d3.curveBasis);

    svgPlot
    .append("path")
    .datum(tidyData)
    .attr("fill", "#0072B2")
    .attr("d", areaTest)
    .attr("opacity", 0.6);

  //---------------------------------------------------------------------------------------

  // Création du Line Chart

  // générateur de la ligne avec les échelles
  let lineGenerator = d3
    .line()
    .x((d) => scaleT(d.date))
    .y((d) => scaleY2(d.taux))
    .curve(d3.curveCardinal)

  // projection de la ligne
  svgPlot
    .append("path")
    .attr("d", lineGenerator(tidyData))
    .attr("fill", "none")
    .attr("stroke", "#D55E00")
    .attr("stroke-width", 3);

  //---------------------------------------------------------------------------------------

  // Légende

  // Objet contenant les informations à afficher dans la légende : text, couleur, opacité
  const legendeValues = [
    { label: "Nombre de tests", col: "#0072B2", op: 0.6 },
    { label: "Taux de positivité", col: "#D55E00", op: 1 },
  ];

  // Création d'un groupe g par élément de la légende (ici deux infos)
  const legend = svgLegend
    .selectAll(".legend")
    .data(legendeValues)
    .join("g")
    .attr("transform", (d, i) => {
      return `translate(${(i * width) / 3}, ${0})`;
    })
    .attr("class", "legend");

  // Création d'un rectangle avec la couleur correspondante par groupe g
  legend
    .append("rect")
    .attr("width", 20)
    .attr("height", 10)
    .attr("fill", (d) => d.col)
    .attr("opacity", (d) => d.op);

  // Écriture du texte par groupe g
  legend
    .append("text")
    .attr("x", 24)
    .attr("y", 10)
    .text((d) => d.label)
    .attr("font-size", `${ graphCfg?.size?.legend?.font || commonGraph.size[graphCfg.type][graphCfg.device].legend.font }px`);


});
