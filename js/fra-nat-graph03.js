d3.csv("data/spf_fra_data.csv").then(data => {
  const graphCfg = {
    target: `#fra-nat-graph03`,
    title: `Evolution des admisssions à l'hôpital des patients Covid`,
    subtitle: `depuis [[startDate]]`,
    caption: `Source. <a href='https://www.data.gouv.fr/fr/organizations/sante-publique-france/' target='_blank'>Santé publique France</a>`,
    startDate: {
      day: 1,
      month: 3,
      year: 2020,
    },
    type: 'landscape',
    device: window.screenDevice,
  }

  // Traitement des données

  // Sélection des variables nécessaires pour le graphique
  const tempData = data.map((d) => {
    return {
      date: new Date(d.date), // ATTENTION À TRANSPOSER EN FORMAT DATE
      new_hosp: +d.new_hosp, // ATTENTION STRING A TRANSPOSER EN FLOAT
      roll_hosp: +d.roll_hosp, // ATTENTION STRING A TRANSPOSER EN FLOAT
    };
  });

  // Filtre supprimant les valeurs manquantes pour les premières dates
  const tidyData = tempData.filter((d) => isNaN(d.roll_hosp) === false);

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

  // Écriture
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
    .domain([0, d3.max(tidyData, (d) => d.new_hosp)])
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

  let legendeValues = [];
  let rect;

  if (graphCfg.device === 'mobile') {
    legendeValues = [
      { label: "Moyenne glissante", col: "#D55E00", op: 1 },
    ];

    // Création du Area Chart
    const area = d3
      .area()
      .curve(d3.curveLinear)
      .x(d => scaleT(d.date))
      .y0(scaleY(0))
      .y1((d) => scaleY(d.roll_hosp))
      .curve(d3.curveCardinal)

    svgPlot
      .append("path")
      .datum(tidyData)
      .attr("d", area)
      .attr("fill", "#D55E00")
      .attr("opacity", 0.6);
  } else {
    legendeValues = [
      { label: "Nombre par jour", col: "#0072B2", op: 0.6 },
      { label: "Moyenne glissante", col: "#D55E00", op: 1 },
    ];

    // Création du Bar Chart
    rect = svgPlot
      .selectAll("rect")
      .data(tidyData)
      .join("rect")
      .attr("x", (d) => scaleT(d.date))
      .attr("y", (d) => scaleY(d.new_hosp))
      .attr("height", (d) => scaleY(0) - scaleY(d.new_hosp))
      .attr("width", scaleX.bandwidth()) // width des barres avec l'échelle d'épaiseur
      .attr("fill", "#0072B2")
      .attr("opacity", 0.6);
  }

  //---------------------------------------------------------------------------------------

  // Création du Line Chart

  // générateur de la ligne avec les échelles
  let lineGenerator = d3
    .line()
    .x((d) => scaleT(d.date))
    .y((d) => scaleY(d.roll_hosp))
    .curve(d3.curveCardinal)

  // projection de la ligne
  svgPlot
    .append("path")
    .attr("d", lineGenerator(tidyData))
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
    .attr("cy", scaleY(maxVal[0].roll_hosp))
    .attr("r", 4)
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 0.8)
    .attr("fill", "#D55E00");

  // Ajoute texte de la valeur du cercle

  svgPlot
    .append("text")
    .attr("x", width + 8)
    .attr("y", scaleY(maxVal[0].roll_hosp))
    .text(Math.round(maxVal[0].roll_hosp))
    .style("fill", "#D55E00");

  //---------------------------------------------------------------------------------------

  // Légende

  // Objet contenant les informations à afficher dans la légende : text, couleur, opacité
  // const legendeValues = [
  //   { label: "Nombre par jour", col: "#0072B2", op: 0.6 },
  //   { label: "Moyenne glissante", col: "#D55E00", op: 1 },
  // ];

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

  //---------------------------------------------------------------------------------------

  // Animation Bar Chart

  // condition pour que l'animation fonctionne sur desktop ou tablette
  if (graphCfg.device !== 'mobile') {
    // création du tooltip de la légende personnalisé
    const custTooltip = commonGraph.tooltip(graphCfg.target, d3)

    // condition pour que l'animation ne fonctionne que sur desktop
    // voir script device_detector pour la fonction deviceType()
    rect.on("mouseover", function (d) {
      // lors du survol avec la souris l'opacité des barres passe à 1
      d3.select(this).attr("opacity", 1);

      // format de la date affichée dans le tooltip
      // stockage de la date de la barre survolée au format XX mois XXXX dans une variable
      const formatTime = d3.timeFormat("%d %b %Y");
      const instantT = formatTime(d.date);

      // efface les données du tooltip
      custTooltip.html('')

      // affiche et positionne le tooltip avec les données
      custTooltip
        .style('opacity', '1')
        .style('left', `${ d3.event.pageX }px`)
        .style('top', `${ d3.event.pageY }px`)
        .style('font-size', `${ graphCfg?.size?.tooltip?.font || commonGraph.size[graphCfg.type][graphCfg.device].tooltip.font }px`)
        .append('div')
        .html(`${instantT}`)
      custTooltip
        .append('div')
        .html(`Moyenne lissée: ${Math.round(d.roll_hosp).toLocaleString("fr-FR")}`)
      custTooltip
        .append('div')
        .html(`Nombre par jour: ${d.new_hosp.toLocaleString("fr-FR")}`)
    });

    // efface le contenu du groupe g lorsque la souris ne survole plus la barre
    rect.on("mouseout", function () {
      d3.select(this).attr("opacity", 0.6); // rétablit l'opacité à 0.6

      // rend invisible le tooltip
      custTooltip.style('opacity', '0')
    });
  }
});
