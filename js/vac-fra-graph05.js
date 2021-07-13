d3.csv("data/vacc_age.csv").then(data => {
  const graphCfg = {
    target: `#vac-fra-graph05`,
    title: `Pourcentage de personnes ayant reçu au moins une première dose par classe d'âge`,
    subtitle: `au [[autoDate]]`,
    caption: `Source. <a href='https://www.data.gouv.fr/fr/organizations/sante-publique-france/' target='_blank'>Santé publique France</a>, <a href='https://data.drees.solidarites-sante.gouv.fr/explore/dataset/707_bases-administratives-sae/information/' target='_blank'>Drees</a>`,
    type: 'square',
    device: window.screenDevice,
  }

  // Traitement des données

  // Sélection des variables nécessaires pour le graphique
  const tempData = data.map((d) => {
    let newData = {
      date: new Date(d.jour), // ATTENTION À TRANSPOSER EN FORMAT DATE
      tx_rea: +d.couv_tot_dose1, // ATTENTION STRING A TRANSPOSER EN FLOAT
      age: +d.age, // ATTENTION STRING A TRANSPOSER EN FLOAT
      reg_nom: d.label_age,
    };

    return newData;
  });

  // Tri des variables dans l'ordre décroissant
  const tidyData = tempData.sort((a, b) => d3.ascending(a.age, b.age));

  //---------------------------------------------------------------------------------------

  // Création du canevas SVG

  const width = graphCfg?.size?.svg?.width || commonGraph.size[graphCfg.type][graphCfg.device].svg.width;
  const height = graphCfg?.size?.svg?.height || commonGraph.size[graphCfg.type][graphCfg.device].svg.height;
  const marginH = graphCfg?.size?.margin?.horizontal || commonGraph.size[graphCfg.type][graphCfg.device].margin.horizontal;
  const marginV = graphCfg?.size?.margin?.vertical || commonGraph.size[graphCfg.type][graphCfg.device].margin.vertical;

  const viewBox = {
    width: width + marginH * 2,
    height: height + marginV * 2
  }

  // variables d'ajustement du graphique pour les noms des régions
  const marginHratio = marginH * 2.5; // uniquement utilisée pour la création de svgPlot
  const widthRatio = width - marginHratio; // uniquement utilisée pour l'échelle scaleX

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
    .attr("transform", `translate(${marginH + marginHratio}, ${marginV})`);

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
  const actualDate = new Date(tidyData[0].date);
  const dateToTitle = formatTimeToTitle(actualDate);

  // Écriture du sous-titre
  d3.select(graphCfg.target)
    .select('.grph-title')
    .append('span')
    .attr('class', 'grph-date')
    .html(graphCfg.subtitle.replace(/\[\[\s*autoDate\s*\]\]/, `${ dateToTitle }`))


  // Écriture de la source
  d3.select(graphCfg.target)
    .select('.grph-caption')
    .html(graphCfg.caption)
    .style("padding", paddingTxt)

  //---------------------------------------------------------------------------------------

  // Création des échelles

  // échelle linéaire pour l'axe des X
  const scaleX = d3
    .scaleLinear()
    .domain([0, 100]) // graphique en pourcentages, donc minimum à 0 et max à 100
    .range([0, widthRatio]);

  // échelle pour l'épaisseur des barres des barres et les placement sur l'axe Y
  const scaleY = d3
    .scaleBand()
    .domain(d3.range(tidyData.length))
    .range([height, 0])
    .padding(0.12);

  //---------------------------------------------------------------------------------------

  // Création des axes

  // Axe des X
  const xAxis = (g) =>
    g
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisLeft(scaleX).ticks(0))
      .call((g) => g.select(".domain").remove()); // supprime la ligne de l'axe

  // Axe des Y
  const yAxis = (g) =>
    g
      .attr("transform", `translate(0, 0)`)
      .call(
        d3
          .axisLeft(scaleY)
          .tickFormat((i) => tidyData[i].reg_nom)
          .tickSizeOuter(0)
      )
      .call((g) => g.select(".domain").remove()) // supprime la ligne de l'axe
      .selectAll("text")
      .style("font-size", scaleY.bandwidth() * 0.4 + "px")
      .style("fill", "grey"); // couleur du texte

  //---------------------------------------------------------------------------------------

  // Création du Bar Chart

  const rectFill = svgPlot
    .append("g")
    .selectAll("rect")
    .data(tidyData)
    .join("rect")
    .attr("y", (d, i) => scaleY(i))
    .attr("x", scaleX(0))
    .attr("width", (d) => scaleX(d.tx_rea))
    .attr("height", scaleY.bandwidth()) // width des barres avec l'échelle d'épaiseur
    .attr("fill", "#0072B2")
    .attr("opacity", 0.6);

  const rectFillFreeSpace = svgPlot
    .append("g")
    .selectAll("rect")
    .data(tidyData)
    .join("rect")
    .attr("y", (d, i) => scaleY(i))
    .attr("x", (d) => scaleX(d.tx_rea))
    .attr("width", (d) => scaleX(100 - d.tx_rea))
    .attr("height", scaleY.bandwidth()) // width des barres avec l'échelle d'épaiseur
    .attr("fill", "#0072B2")
    .attr("opacity", 0.05);

  const rectFrame = svgPlot
    .append("g")
    .selectAll("rect")
    .data(tidyData)
    .join("rect")
    .attr("y", (d, i) => scaleY(i))
    .attr("x", (d) => scaleX(0))
    .attr("width", (d) => scaleX(100))
    .attr("height", scaleY.bandwidth()) // width des barres avec l'échelle d'épaiseur
    .attr("fill", "transparent")
    .attr("stroke-width", "1px")
    .attr("stroke", "#0072B2")
    .attr("opacity", 0.6);

  //---------------------------------------------------------------------------------------

  // Création des labels

  const text = svgPlot
    .selectAll("text")
    .data(tidyData)
    .join("text")
    .attr("y", (d, i) => {
      return scaleY(i) + scaleY.bandwidth() / 1.5;
    })
    // écriture à l'intérieur ou à l'extérieur des barres
    .attr("x", (d) =>
      scaleX(d.tx_rea) >= 50 ? scaleX(d.tx_rea) - 50 : scaleX(d.tx_rea) + 4
    )
    .text((d) => Math.round(d.tx_rea) + "%")
    // en blanc si à l'intérieur des barres, en gris si à l'extérieur
    .attr("fill", (d) => (scaleX(d.tx_rea) >= 50 ? "#ffffff" : "grey"))
    .attr("font-size", scaleY.bandwidth() * 0.4 + "px");

  //---------------------------------------------------------------------------------------

  // Placement des axes

  // Placement X
  svgPlot.append("g").call(xAxis);

  // Placement Y
  svgPlot.append("g").call(yAxis).attr("color", "transparent"); // les ticks de l'axe X sont transparents
});
