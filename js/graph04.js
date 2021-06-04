d3.csv("../data/spf_fra_data.csv").then(showData);

function showData(data) {


    // Mise en français des objets dates
    const locale = {
        "dateTime": "%A %e %B %Y à %X",
        "date": "%d/%m/%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
        "shortDays": ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
        "months": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
        "shortMonths": ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
    }

    d3.timeFormatDefaultLocale(locale);


    // Tri des données

    const tempData = data.map(d => {

        let newData = {
            "date": new Date(d.date),
            "total_hosp": +d.total_hosp,
            "total_rea": +d.total_rea
        }

        return newData

    });

    let tidyData = tempData.filter(d => isNaN(d.total_rea) === false)

    //tidyData = tidyData.filter(d => d.date >= new Date("2020-09-01"))

    // Création du canevas SVG

    const width = 500;
    const height = 200;
    const marginH = 80;
    const marginV = 40;
    const title = 40;
    const leg = 40;
    const caption = 10;

    const svg = d3.select('#graph04')
        .append("svg")
        //.attr("height", height)
        //.attr("width", width)
        .attr("viewBox", [0, 0, width + marginH * 2, height + title + leg + caption + marginV * 2]);


    const svgTitle = svg.append("g")
        .attr("transform", `translate(${marginH}, ${marginV})`)

    const svgLegend = svg.append("g")
        .attr("transform", `translate(${marginH}, ${title + marginV})`)

    const svgPlot = svg.append("g")
        .attr("transform", `translate(${marginH}, ${title + marginV + leg})`)

    const svgCaption = svg.append("g")
        .attr("transform", `translate(${marginH}, ${title + marginV * 2 + leg + height})`)


    // Titre Graphique

    svgTitle.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Patients hospitalisés")

    svgTitle.append("text")
        .attr("x", 0)
        .attr("y", 22)
        .attr("font-size", "16px")
        .text("depuis mars 2020")

    // Titre Caption

    svgCaption.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("font-size", "10px")
        .text("Source. Santé publique France - Crédits. franceinfo")

    // Création des échelles

    const scaleY = d3.scaleLinear()
        .domain([0, d3.max(tidyData, d => d.total_hosp)])
        .range([height, 0]);

    const scaleT = d3.scaleTime()
        .domain([d3.min(tidyData, d => d.date),
        d3.max(tidyData, d => d.date)])
        .range([0, width]);

    // Création des axes

    const xAxis = g => g
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(scaleT)
            .ticks(5)
            .tickFormat(d3.timeFormat("%b %Y")))

    const yAxis = g => g
        .attr("transform", `translate(0, 0)`)
        .call(d3.axisLeft(scaleY).ticks(null, data.format))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", -marginH)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(data.y));

    // Bar Chart


    let areaHosp = d3.area()
        .curve(d3.curveLinear)
        .x(d => scaleT(d.date))
        .y0(d => scaleY(d.total_rea))
        .y1(d => scaleY(d.total_hosp));

    let areaRea = d3.area()
        .curve(d3.curveLinear)
        .x(d => scaleT(d.date))
        .y0(scaleY(0))
        .y1(d => scaleY(d.total_rea));

    svgPlot.append("path")
        .datum(tidyData)
        .attr("fill", "#0072B2")
        .attr("d", areaHosp)
        .attr("opacity", 0.6)

    svgPlot.append("path")
        .datum(tidyData)
        .attr("fill", "#D55E00")
        .attr("d", areaRea)


    // Dernières valeurs

    const maxDate = d3.max(tidyData, d => d.date);

    const maxVal = tidyData.filter(d => d.date == maxDate);

    svgPlot.append("text")
        .attr("x", width + 8)
        .attr("y", scaleY(maxVal[0].total_rea))
        .text(maxVal[0].total_rea)
        .style("fill", "#D55E00");

    svgPlot.append("text")
        .attr("x", width + 8)
        .attr("y", scaleY(maxVal[0].total_hosp))
        .text(maxVal[0].total_hosp)
        .style("fill", "#0072B2");


    // Placement des axes

    svgPlot.append("g")
        .call(xAxis);

    svgPlot.append("g")
        .call(yAxis)
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width)
            .attr("stroke-opacity", 0.1));

    // Légende

    const legendeValues = [
        { "label": "Hospitalisations", "col": "#0072B2", "op": 0.6 },
        { "label": "Soins critiques", "col": "#D55E00", "op": 1 }
    ];

    const legend = svgLegend.selectAll(".legend")
        .data(legendeValues)
        .join("g")
        .attr("transform",
            (d, i) => {
                if (i < 4) {
                    return `translate(${i * width /  3}, ${0})`
                } else if (i >= 4) {
                    return `translate(${(i - 4) * width / 3}, ${20})`
                }
            })
        .attr("class", "legend");

    legend.append('rect')
        .attr("width", 20)
        .attr("height", 10)
        .attr("fill", d => d.col)
        .attr("opacity", d => d.op);

    legend.append('text')
        .attr("x", 24)
        .attr("y", 10)
        .text(d => d.label)
        .attr("font-size", "14px");


}