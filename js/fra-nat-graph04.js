d3.csv("data/spf_fra_data.csv").then(data => {
  const graphCfg = {
    target: `#fra-nat-graph04`,
    title: `Evolution du nombre d'hospitalisations de patients Covid-19`,
    subtitle: `depuis le [[startDate]]`,
    caption: `Source. <a href="https://www.data.gouv.fr/fr/organizations/sante-publique-france/" target="_blank">Santé publique France</a>`,
    startDate: {
      day: '01',
      month: '09',
      year: '2020',
    },
    type: 'landscape',
    device: window.screenDevice,
  }

  // Traitement des données

  // Sélection des variables nécessaires pour le graphique
  const tempData = data.map((d) => {
    return {
      date: new Date(d.date), // ATTENTION À TRANSPOSER EN FORMAT DATE
      total_hosp: +d.total_hosp, // ATTENTION STRING A TRANSPOSER EN FLOAT
      part_rea: +d.total_rea, // ATTENTION STRING A TRANSPOSER EN FLOAT
      part_hosp: +d.total_hosp - +d.total_rea, // ATTENTION STRING A TRANSPOSER EN FLOAT
    };
  });

  // Filtre les données uniquement à partir du 1er septembre
  const startDate = `${graphCfg.startDate.year}-${graphCfg.startDate.month}-${graphCfg.startDate.day}`
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
  const paddingTxt = `0 ${padding}%`

  document.documentElement.style.setProperty('--gutter-size', `${padding}%`)

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
    .html(graphCfg.subtitle.replace(/\[\[\s*startDate\s*\]\]/, `${+graphCfg?.startDate?.day === 1 ? +graphCfg?.startDate?.day + 'er' : graphCfg?.startDate?.day} ${commonGraph.locale.months[+graphCfg?.startDate?.month - 1]} ${graphCfg?.startDate?.year}`))

  // Écriture de la source
  d3.select(graphCfg.target)
    .select('.grph-caption')
    .html(graphCfg.caption)
    .style("padding", paddingTxt)

  //---------------------------------------------------------------------------------------

  // Création des échelles

  // échelle linéaire pour l'axe des Y
  const scaleY = d3
    .scaleLinear()
    .domain([0, d3.max(tidyData, (d) => d.total_hosp)])
    .range([height, 0]);

  // échelee temporelle pour l'axe des X
  const scaleT = d3
    .scaleTime()
    .domain([d3.min(tidyData, (d) => d.date), d3.max(tidyData, (d) => d.date)])
    .range([0, width]);

  //---------------------------------------------------------------------------------------

  // Création des axes

  // Axe des X
  const xAxis = (g) =>
    g
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(scaleT).ticks(4).tickFormat(d3.timeFormat("%b %Y")))
      .selectAll("text")
      .style("fill", `${ graphCfg?.size?.axis?.color || commonGraph.size[graphCfg.type][graphCfg.device].axis.color }px`)
      .style("font-size", `${ graphCfg?.size?.axis?.font || commonGraph.size[graphCfg.type][graphCfg.device].axis.font }px`)

  // Axe des Y
  const yAxis = (g) =>
    g
      .attr("transform", `translate(0, 0)`)
      .call(
        d3
          .axisLeft(scaleY)
          .ticks(graphCfg.ticksY && graphCfg.device in graphCfg.ticksY ? graphCfg.ticksY[graphCfg.device] : commonGraph.ticksY[graphCfg.device])
          .tickFormat((d) => d.toLocaleString("fr-FR"))
      ) // formatage grands nombre avec espace entre milliers
      .call((g) => g.select(".domain").remove()) // supprime la ligne de l'axe
      .selectAll("text")
      .style("fill", `${ graphCfg?.size?.axis?.color || commonGraph.size[graphCfg.type][graphCfg.device].axis.color }px`)
      .style("font-size", `${ graphCfg?.size?.axis?.font || commonGraph.size[graphCfg.type][graphCfg.device].axis.font }px`)

  //---------------------------------------------------------------------------------------

  // Placement des axes

  // Placement X
  svgPlot.append("g").call(xAxis).attr("color", "grey"); // mise en gris des ticks de l'axe des X

  // Placement Y
  svgPlot
    .append("g")
    .call(yAxis)
    .attr("color", "grey")
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width)
        .attr("stroke-opacity", 0.1)
    ); // lignes horizontales projetées sur le graphique

  //---------------------------------------------------------------------------------------

  // Création du Stack Area Chart

  // générateur de l'aire des hospitalisations
  const areaHosp = d3
    .area()
    .curve(d3.curveLinear)
    .x((d) => scaleT(d.date))
    .y0((d) => scaleY(d.part_rea))
    .y1((d) => scaleY(d.part_hosp))
    .curve(d3.curveBasis)

  // générateur de l'aire des réanimations
  const areaRea = d3
    .area()
    .curve(d3.curveLinear)
    .x((d) => scaleT(d.date))
    .y0(scaleY(0))
    .y1((d) => scaleY(d.part_rea))
    .curve(d3.curveBasis)

  // projection de l'aire des hospitalisations
  svgPlot
    .append("path")
    .datum(tidyData)
    .attr("fill", "#0072B2")
    .attr("d", areaHosp)
    .attr("opacity", 0.6);

  // projection de l'aire des réanimations
  svgPlot
    .append("path")
    .datum(tidyData)
    .attr("fill", "#D55E00")
    .attr("d", areaRea);

  //---------------------------------------------------------------------------------------

  // Affichage des dernières valeurs

  const maxDate = d3.max(tidyData, (d) => d.date);

  const maxVal = tidyData.filter((d) => d.date == maxDate);

  svgPlot
    .append("text")
    .attr("x", width + 8)
    .attr("y", scaleY(maxVal[0].part_rea))
    .text(maxVal[0].part_rea.toLocaleString("fr-FR"))
    .style("fill", "#D55E00");

  svgPlot
    .append("text")
    .attr("x", width + 8)
    .attr("y", scaleY(maxVal[0].part_hosp))
    .text(maxVal[0].part_hosp.toLocaleString("fr-FR"))
    .style("fill", "#0072B2");

  //---------------------------------------------------------------------------------------

  // Légende

  // Objet contenant les informations à afficher dans la légende : text, couleur, opacité
  const legendeValues = [
    { label: "Soins critiques", col: "#D55E00", op: 1 },
    { label: "Autres hospitalisations", col: "#0072B2", op: 0.6 }
  ];

  // Création d'un groupe g par élément de la légende (ici deux infos)
  const legend = svgLegend
    .selectAll(".legend")
    .data(legendeValues)
    .join("g")
    .attr("transform", (d, i) => {
      return `translate(${(i * width) / 4}, ${0})`;
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
    .attr("font-size", `${graphCfg?.size?.legend?.font || commonGraph.size[graphCfg.type][graphCfg.device].legend.font}px`);
});
