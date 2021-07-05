d3.csv('data/spf_fra_data.csv').then(data => {
  const graphCfg = {
    target: `#fra-nat-graph01`,
    title: `Evolution du nombre de contaminations au Covid-19`,
    subtitle: `depuis le [[startDate]]`,
    caption: `Source. <a href="https://www.data.gouv.fr/fr/organizations/sante-publique-france/" target="_blank">Santé publique France</a>`,
    startDate: {
      day: 1,
      month: 9,
      year: 2020,
    },
    type: 'landscape',
    device: window.screenDevice,
  }

  // Traitement des données

  // Sélection des variables nécessaires pour le graphique
  const tempData = data.map(d => {
    return {
      date: new Date(d.date), // ATTENTION À TRANSPOSER EN FORMAT DATE
      new_cases: +d.new_cases, // ATTENTION STRING A TRANSPOSER EN FLOAT
      roll_cases: +d.roll_cases, // ATTENTION STRING A TRANSPOSER EN FLOAT
    }
  });

  // Filtre les données uniquement à partir du 1er septembre
  const startDate = `${ graphCfg.startDate.year }-${ graphCfg.startDate.month.length < 2 ? '0' + graphCfg.startDate.month : graphCfg.startDate.month }-${ graphCfg.startDate.day.length < 2 ? '0' + graphCfg.startDate.day : graphCfg.startDate.day }`
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
    .domain([0, d3.max(tidyData, d => d[graphCfg.device === 'mobile' ? 'roll_cases' : 'new_cases'])])
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
      .style("fill", "grey") // couleur du texte
      // .style("font-size", "14px")

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

  // Tableau contenant les informations à afficher dans la légende : text, couleur, opacité
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
      .y1((d) => scaleY(d.roll_cases))
      .curve(d3.curveCardinal) // Adoucit la ligne

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
      .attr("y", (d) => scaleY(d.new_cases))
      .attr("height", (d) => scaleY(0) - scaleY(d.new_cases))
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
    .y((d) => scaleY(d.roll_cases))
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
    .attr("cy", scaleY(maxVal[0].roll_cases))
    .attr("r", 4)
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 0.8)
    .attr("fill", "#D55E00");

  // Ajoute texte de la valeur du cercle

  svgPlot
    .append("text")
    .attr("x", width + 8)
    .attr("y", scaleY(maxVal[0].roll_cases))
    .text(Math.round(maxVal[0].roll_cases).toLocaleString("fr-FR"))
    .style("fill", "#D55E00");

  //---------------------------------------------------------------------------------------

  // Légende

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

  //---------------------------------------------------------------------------------------

  // Animation Bar Chart

  if (graphCfg.device !== 'mobile') {
    const custTooltip = commonGraph.tooltip(graphCfg.target, d3)

    // création d'un groupe g qui contiendra le tooltip de la légende
    const tooltip = svgPlot.append("g")

    // condition pour que l'animation ne fonctionne que sur desktop
    // voir script device_detector pour la fonction deviceType()
    rect.on('mouseover', function (d, e, f, g) {
      // lors du survol avec la souris l'opacité des barres passe à 1
      d3.select(this).attr("opacity", 1);

      // stockage dans deux deux variables des positions x et y de la barre survolée
      let xPosition = +scaleT(d.date);
      let yPosition = +scaleY(d.new_cases);
      const largeurBande = scaleX.bandwidth();

      // format de la date affichée dans le tooltip
      // stockage de la date de la barre survolée au format XX mois XXXX dans une variable
      const formatTime = d3.timeFormat("%d %b %Y");
      const instantT = formatTime(d.date);

      custTooltip
        .select('div')
        .remove()

      custTooltip
        .style('opacity', '1')
        .style('left', `${ d3.event.pageX }px`)
        .style('top', `${ d3.event.pageY }px`)
        .style("font-size", `${ graphCfg?.size?.tooltip?.font || commonGraph.size[graphCfg.type][graphCfg.device].tooltip.font }px`)
        .append('div')
        .html(`${instantT}`)
        .append('div')
        .html(`Moyenne lissée: ${Math.round(d.roll_cases).toLocaleString("fr-FR")}`)
        .append('div')
        .html(`Nombre par jour: ${d.new_cases.toLocaleString("fr-FR")}`)

      // création d'un rectangle blanc pour le tooltip
      tooltip
        .attr(
          "transform",
          `translate(${xPosition - 70 + largeurBande / 2},
            ${yPosition - 50})`
        )
        .append("rect")
        .attr("width", 140)
        .attr("height", 50)
        .attr("fill", "#ffffff");

      // écriture texte dans le tooltip : ici la DATE
      tooltip
        .append("text")
        .attr("x", 5)
        .attr("y", 20)
        .text(`${instantT}`)
        .attr("font-size", `${ graphCfg?.size?.tooltip?.font || commonGraph.size[graphCfg.type][graphCfg.device].tooltip.font }px`)

      // écriture texte dans le tooltip : ici la MOYENNE LISSÉE
      tooltip
        .append("text")
        .attr("x", 5)
        .attr("y", 32)
        .text(
          `Moyenne lissée: ${Math.round(d.roll_cases).toLocaleString("fr-FR")}`
        )
        .attr("font-size", `${ graphCfg?.size?.tooltip?.font || commonGraph.size[graphCfg.type][graphCfg.device].tooltip.font }px`)
        .attr("font-weight", "bold")

      // écriture texte dans le tooltip : ici le NOMBRE PAR JOUR
      tooltip
        .append("text")
        .attr("x", 5)
        .attr("y", 44)
        .text(`Nombre par jour: ${d.new_cases.toLocaleString("fr-FR")}`)
        .attr("font-size", `${ graphCfg?.size?.tooltip?.font || commonGraph.size[graphCfg.type][graphCfg.device].tooltip.font }px`);
    });

    // efface le contenu du groupe g lorsque la souris ne survole plus la barre
    rect.on("mouseout", function () {
      d3.select(this).attr("opacity", 0.6); // rétablit l'opacité à 0.6

      custTooltip
        .style('opacity', '0')

      tooltip.select("rect").remove();
      tooltip.selectAll("text").remove();
    });
  }
});
