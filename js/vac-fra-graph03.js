d3.csv("data/spf_fra_vacc_dose1_2.csv").then(data => {
  const graphCfg = {
    target: `#vac-fra-graph03`,
    title: `Evolution du nombre d'injections par jour`,
    subtitle: `depuis le [[startDate]]`,
    caption: `Source. <a href='https://www.data.gouv.fr/fr/organizations/sante-publique-france/' target='_blank'>Santé publique France</a>`,
    startDate: {
      day: 1,
      month: 1,
      year: 2021,
    },
    type: 'landscape',
    device: window.screenDevice,
  }

  // Traitement des données

  // Sélection des variables nécessaires pour le graphique
  const tempData = data.map((d) => {
    let newData = {
      date: new Date(d.jour), // ATTENTION À TRANSPOSER EN FORMAT DATE
      tot_dose: +d.total_dose, // ATTENTION STRING A TRANSPOSER EN FLOAT
      roll_dose: +d.roll_dose, // ATTENTION STRING A TRANSPOSER EN FLOAT
      n_dose1: +d.n_dose1, // ATTENTION STRING A TRANSPOSER EN FLOAT
      n_dose2: +d.n_dose2, // ATTENTION STRING A TRANSPOSER EN FLOAT
    };

    return newData;
  });

  // Filtre les données uniquement à partir du 1er janvier
  const startDate = `${ graphCfg.startDate.year }-${ graphCfg.startDate.month.length < 2 ? '0' + graphCfg.startDate.month : graphCfg.startDate.month }-${ graphCfg.startDate.day.length < 2 ? '0' + graphCfg.startDate.day : graphCfg.startDate.day }`
  const tidyData = tempData.filter((d) => d.date >= new Date(startDate));

  // Données spécifique au line chart qui filtre les valeurs manquantes des 7 premiers jours
  const dataToLine = tidyData.filter((d) => isNaN(d.roll_dose) === false);

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
    .html(graphCfg.subtitle.replace(/\[\[\s*startDate\s*\]\]/, `${ graphCfg?.startDate?.day === 1 ? graphCfg?.startDate?.day + 'er' : graphCfg?.startDate?.day } ${ commonGraph.locale.months[graphCfg?.startDate?.month - 1] } ${ graphCfg?.startDate?.year }`))

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

  // échelle linéaire pour l'axe des Y
  const scaleY = d3
    .scaleLinear()
    .domain([0, d3.max(tidyData, (d) => d.tot_dose)])
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
      .style("fill", "grey"); // couleur du texte

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
      .style("fill", "grey"); // couleur du texte

  // Échelle de couleurs
  const scaleC = d3
    .scaleOrdinal()
    .domain(["n_dose1", "n_dose2"])
    .range(["#56B4E9", "#0072B2"]);

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

  // Générateur de stack

  // Transformation des données pour stack
  const series = d3
    .stack()
    .keys(["n_dose1", "n_dose2"])(tidyData)
    .map((d) => (d.forEach((v) => (v.key = d.key)), d));

  // Création des barres
  svgPlot
    .append("g")
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", (d) => scaleC(d.key))
    .selectAll("rect")
    .data((d) => d)
    .join("rect")
    .attr("x", d => scaleT(d.data.date))
    .attr("y", (d) => scaleY(d[1]))
    .attr("height", (d) => scaleY(d[0]) - scaleY(d[1]))
    .attr("width", scaleX.bandwidth());

  //---------------------------------------------------------------------------------------

  // Création du Line Chart

  // générateur de la ligne avec les échelles
  let lineGenerator = d3
    .line()
    .x((d) => scaleT(d.date))
    .y((d) => scaleY(d.roll_dose))
    .curve(d3.curveCardinal)

  // projection de la ligne
  svgPlot
    .append("path")
    .attr("d", lineGenerator(dataToLine))
    .attr("fill", "none")
    .attr("stroke", "#D55E00")
    .attr("stroke-width", 3);

  //---------------------------------------------------------------------------------------

  // Cercle de la dernière valeur

  // stocakge valeur date la plus récente du dataset
  const maxDate = d3.max(tidyData, (d) => d.date);

  // stockage valeur correspondante à la dernière date
  const maxVal = tidyData.filter((d) => d.date == maxDate);

  // création cercle
  svgPlot
    .append("circle")
    .attr("cx", scaleT(maxDate.setDate(maxDate.getDate())))
    .attr("cy", scaleY(maxVal[0].roll_dose))
    .attr("r", 4)
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 0.8)
    .attr("fill", "#D55E00");

  // Ajoute texte de la valeur du cercle

  svgPlot
    .append("text")
    .attr("x", width + 8)
    .attr("y", scaleY(maxVal[0].roll_dose))
    .text(Math.round(maxVal[0].roll_dose).toLocaleString("fr-FR"))
    .style("fill", "#D55E00");

  //---------------------------------------------------------------------------------------

  // Légende

  // Objet contenant les informations à afficher dans la légende : text, couleur, opacité
  const legendeValues = [
    { label: "Premières doses", col: "#56B4E9", op: 1 },
    { label: "Deuxièmes doses", col: "#0072B2", op: 1 },
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
    .text((d) => d.label.toLocaleString("fr-FR"))
    .attr("font-size", `${ graphCfg?.size?.legend?.font || commonGraph.size[graphCfg.type][graphCfg.device].legend.font }px`);
});
