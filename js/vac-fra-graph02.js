d3.csv("data/spf_fra_vacc.csv").then(data => {
  const graphCfg = {
    target: `#vac-fra-graph02`,
    title: `Proportion de la population vaccinée contre le Covid-19`,
    subtitle: `depuis le [[startDate]]`,
    caption: `Source. <a href='https://www.data.gouv.fr/fr/organizations/sante-publique-france/' target='_blank'>Santé publique France</a>`,
    startDate: {
      day: '01',
      month: '09',
      year: '2020',
    },
    type: 'landscape',
    device: window.screenDevice,
  }
  graphCfg?.size?.legend?.height

  // Traitement des données

  // Sélection des variables nécessaires pour le graphique
  const tempData = data.map((d) => {
    return {
      date: new Date(d.jour), // ATTENTION À TRANSPOSER EN FORMAT DATE
      couv_dose1: +d.couv_dose1, // ATTENTION STRING A TRANSPOSER EN FLOAT
      couv_dose2: +d.couv_complet, // ATTENTION STRING A TRANSPOSER EN FLOAT
    };
  });

  // Date la plus récente du dataset
  const maxDate = d3.max(tempData, (d) => d.date);

  // Données filtrées à date la plus récente
  const tidyData = tempData.filter((d) => d.date === maxDate)[0];

  // Agencement des données pour la génération de pie charts
  const pieData = [
    [
      {
        name: "Au moins une dose",
        value: tidyData.couv_dose1,
      },
      {
        name: "Non vacciné",
        value: 100 - tidyData.couv_dose1,
      },
    ],
    [
      {
        name: "Vaccination complète",
        value: tidyData.couv_dose2,
      },
      {
        name: "Non vacciné",
        value: 100 - tidyData.couv_dose2,
      },
    ],
  ];

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

  // Création des donuts

  // Échelle de couleurs
  const color = d3
    .scaleOrdinal()
    .domain(["Au moins une dose", "Vaccination complète", "Non vacciné"])
    .range(["#0072B2", "#D55E00", "#E0E0E0"]);

  // Rayon des donuts
  const radius = Math.min(width / 2, height) / 2;

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

  // Création d'un groupe g pour chaque donut
  const donuts = svgPlot
    .selectAll("g")
    .data(pieData)
    .join("g")
    .attr("transform", (d, i) => `translate(${marginH * 1.5 + i * (width / 2)}, ${height / 2})`);

  // Projection des donuts
  donuts
    .selectAll("path")
    .data((d) => {
      return pie(d);
    })
    .join("path")
    .attr("fill", (d) => color(d.data.name))
    .attr("opacity", (d) => (d.data.name === "Au moins une dose" ? 0.6 : 1))
    .attr("d", arc);

  // Ajout des valeurs en pourcentage à l'intérieur de chaque arc
  donuts
    .append("g")
    .selectAll("text")
    .data((d) => pie(d))
    .join("text")
    .attr("transform", (d) => `translate(${arc.centroid(d)})`)
    .text((d) => {
      if (d.index == 0) {
        return Math.round(d.data.value) + "%";
      }
    })
    .attr("dy", "0.6em")
    .attr("dx", "-1em")
    .attr("font-weight", "bold")
    .attr("fill", "#ffffff");

  //---------------------------------------------------------------------------------------

  // Légende

  // Objet contenant les informations à afficher dans la légende : text, couleur, opacité
  const legendeValues = [
    { label: "Au moins une dose", col: "#0072B2", op: 0.6 },
    { label: "Vaccination complète", col: "#D55E00", op: 1 },
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
