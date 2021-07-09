d3.csv("data/owid_top5_newcases_eu.csv").then(data => {
    const graphCfg = {
      target: `#eu-graph03`,
      title: `Evolution du nombre de contaminations en Europe`,
      subtitle: `en moyenne lissée du nombre de cas pour un million d'habitants*`,
      caption: `* dans les cinq pays européens qui comptent actuellement le plus grand nombre de nouveaux cas<br>Source. <a href='https://ourworldindata.org/coronavirus' target='_blank'>Our world in data</a>`,
      type: 'landscape',
      device: window.screenDevice,
    }

    // Traitement des données

    // Sélection des variables nécessaires pour le graphique
    const tidyData = data.map((d) => {
      return {
        date: new Date(d.date), // ATTENTION À TRANSPOSER EN FORMAT DATE
        pays: d.name_fr,
        new_cases_smoothed_per_million: +d.new_cases_smoothed_per_million, // ATTENTION STRING A TRANSPOSER EN FLOAT
      };
    });

    // Stockage dans un array des labels de chaque courbe
    const arrayLabels = [...new Set(tidyData.map((d) => d.pays))];

    // Création d'un array d'arrays d'objets adapté à la projection des lignes
    // avec les données groupées par label (courbe) chacune dans un array d'objets différent
    const dataLine = arrayLabels.map((d) => {
      let label = d;
      return tidyData.filter((d) => d.pays === label);
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
      .html(graphCfg.subtitle.replace(/\[\[\s*startDate\s*\]\]/, `${ graphCfg?.startDate?.day } ${ commonGraph.locale.months[graphCfg?.startDate?.month - 1] } ${ graphCfg?.startDate?.year }`))

    // Écriture de la source
    d3.select(graphCfg.target)
      .select('.grph-caption')
      .html(graphCfg.caption)
      .style("padding", paddingTxt)

    //---------------------------------------------------------------------------------------

    // Création des échelles X et Y

    // échelle linéaire pour l'axe des Y
    const scaleY = d3
      .scaleLinear()
      .domain([0, d3.max(tidyData, (d) => d.new_cases_smoothed_per_million)])
      .range([height, 0]);

    // échelee temporelle pour l'axe des X
    const scaleT = d3
      .scaleTime()
      .domain([d3.min(tidyData, (d) => d.date), d3.max(tidyData, (d) => d.date)])
      .range([0, width]);

    //---------------------------------------------------------------------------------------

    // Création de l'échelle de couleurs

    // array pour les labels dans le bon ordre d'afficahge
    const labelsLegend = arrayLabels;

    // liste des couleurs à utiliser (couleurs adaptées au daltonisme)
    // source. https://jfly.uni-koeln.de/color/
    const okabeIto = [
      "#E69F00",
      "#56B4E9",
      "#009E73",
      "#F0E442",
      "#0072B2",
      "#D55E00",
      "#CC79A7",
    ];

    // échelle de couleurs pour les labels
    const scaleC = d3.scaleOrdinal().domain(labelsLegend).range(okabeIto);

    //---------------------------------------------------------------------------------------

    // Création des axes

    // Axe des X
    const xAxis = (g) =>
      g
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(scaleT).ticks(4).tickFormat(d3.timeFormat("%b %Y")))
        .selectAll("text")
        .style("fill", graphCfg?.size?.axis?.color || commonGraph.size[graphCfg.type][graphCfg.device].axis.color) // couleur du texte
        .style("font-size", `${ graphCfg?.size?.axis?.font || commonGraph.size[graphCfg.type][graphCfg.device].axis.font }px`)

    // Axe des Y
    const yAxis = (g) =>
      g
        .attr("transform", `translate(0, 0)`)
        .call(
          d3
            .axisLeft(scaleY)
            .ticks(graphCfg.ticksY && graphCfg.device in graphCfg.ticksY ? graphCfg.ticksY[graphCfg.device] : commonGraph.ticksY[graphCfg.device])
            .tickFormat(d3.format(",.2r"))
        ) // formatage grands nombre avec virgule entre milliers
        .call((g) => g.select(".domain").remove()) // supprime la ligne de l'axe
        .selectAll("text")
        .style("fill", graphCfg?.size?.axis?.color || commonGraph.size[graphCfg.type][graphCfg.device].axis.color) // couleur du texte
        .style("font-size", `${ graphCfg?.size?.axis?.font || commonGraph.size[graphCfg.type][graphCfg.device].axis.font }px`)

    //---------------------------------------------------------------------------------------

    // Line Chart

    // générateur de la ligne avec les échelles
    const lineGenerator = d3
      .line()
      .x((d) => scaleT(d.date))
      .y((d) => scaleY(d.new_cases_smoothed_per_million))
      .curve(d3.curveCardinal)

    // projection des lignes
    svgPlot
      .selectAll("g")
      .data(dataLine)
      .join("g")
      .append("path")
      .attr("d", (d) => lineGenerator(d))
      .attr("fill", "none") // ATTENTION A BIEN METTRE FILL NONE
      .attr("stroke", (d) => scaleC(d[0].pays))
      .attr("stroke-width", 3);

    //---------------------------------------------------------------------------------------

    // Légende

    // Création d'un groupe g par élément de la légende (ici 7 éléments répartis sur 2 lignes)
    const legend = svgLegend
      .selectAll(".legend")
      .data(labelsLegend)
      .join("g")
      .attr("transform", (d, i) => {
        if (i < 4) {
        return `translate(${(i * width) / 4}, ${0})`; // coordonnées des 4 éléments de la première ligne
        } else if (i >= 4) {
          return `translate(${((i - 4) * width) / 4}, ${20})`; // coordonnées des 3 élements de la deuxième ligne
        }
      })
      .attr("class", "legend");

    // Création d'un rectangle couleur par groupe g
    legend
      .append("rect")
      .attr("width", 20)
      .attr("height", 5)
      .attr("fill", (d) => scaleC(d));

    // écriture label par groupe g
    legend
      .append("text")
      .attr("x", 26)
      .attr("y", 5)
      .text((d) => d)
      .attr("font-size", `${ graphCfg?.size?.legend?.font || commonGraph.size[graphCfg.type][graphCfg.device].legend.font }px`);

    //---------------------------------------------------------------------------------------

    // Annotations - affichage des dernières valeurs

    // stocakge valeur date la plus récente du dataset
    const maxDate = d3.max(tidyData, (d) => d.date);

    const lastValues = tidyData.filter((d) => d.date + "" === maxDate + "");

    // Création de noeuds
    const labels = lastValues.map((d) => {
      return {
        fx: 0,
        targetY: scaleY(d.new_cases_smoothed_per_million),
      };
    });

    // Simulation de force sur les noeuds
    const force = d3
      .forceSimulation()
      .nodes(labels)
      .force("collide", d3.forceCollide(7))
      .force("y", d3.forceY((d) => d.targetY).strength(0.5))
      .stop();

    // Execute la simulation
    for (let i = 0; i < 300; i++) force.tick();

    // Ajout d'une valeur y dans chaque objet de l'array lastValues
    labels.sort((a, b) => a.y - b.y);
    lastValues.sort((a, b) => b.new_cases_smoothed_per_million - a.new_cases_smoothed_per_million);
    lastValues.forEach((d, i) => (d.y = labels[i].y));

    // Ajout des valeurs sur le graphique
    svgPlot
      .selectAll("g")
      .data(lastValues)
      .join("g")
      .append("text")
      .attr("x", width + 8)
      .attr("y", (d) => d.y)
      .text((d) => Math.round(d.new_cases_smoothed_per_million).toLocaleString("fr-FR"))
      .style("fill", (d) => scaleC(d.pays));

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
  });
