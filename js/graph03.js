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
            "new_hosp": +d.new_hosp,
            "roll_hosp": +d.roll_hosp
        }

        return newData

    });

    let tidyData = tempData.filter(d => isNaN(d.roll_hosp) === false)

    //tidyData = tidyData.filter(d => d.date >= new Date("2020-09-01"))

    // Création du canevas SVG

    const width = 500;
    const height = 200;
    const marginH = 80;
    const marginV = 40;
    const title = 40;
    const leg = 40;
    const caption = 10;

    const svg = d3.select('#graph03')
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
        .text("Admissions à l'hôpital")

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

    const scaleX = d3.scaleBand()
        .domain(d3.range(tidyData.length))
        .range([0, width])
        .padding(0.1);


    const scaleY = d3.scaleLinear()
        .domain([0, d3.max(tidyData, d => d.new_hosp)])
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
            .text(data.y))

    // Bar Chart

    const rect = svgPlot.selectAll("rect")
        .data(tidyData)
        .enter()
        .append("rect")
        //.attr("x", (d, i) => scaleX(i))
        .attr("x", d => scaleT(d.date))
        .attr("y", d => scaleY(d.new_hosp))
        .attr("height", d => scaleY(0) - scaleY(d.new_hosp))
        .attr("width", scaleX.bandwidth())
        .attr("fill", "#0072B2")
        .attr("opacity", 0.6);

    // Line Chart

    let lineGenerator = d3.line()
        //.x((d, i) => scaleX(i))
        .x(d => scaleT(d.date))
        .y(d => scaleY(d.roll_hosp));

    svgPlot.append("path")
        .attr("d", lineGenerator(tidyData))
        .attr("fill", "none")
        .attr("stroke", "#D55E00")
        .attr("stroke-width", 3);

    // Cercle de la dernière valeur

    const maxDate = d3.max(tidyData, d => d.date);

    const maxVal = tidyData.filter(d => d.date == maxDate);

    svgPlot.append("circle")
        //.attr("cx", scaleX(tidyData.length-1))
        .attr("cx", scaleT(maxDate.setDate(maxDate.getDate())))
        .attr("cy", scaleY(maxVal[0].roll_hosp))
        .attr("r", 4)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.8)
        .attr("fill", "#D55E00");

    // Placement des axes

    svgPlot.append("g")
        .call(xAxis);

    svgPlot.append("g")
        .call(yAxis)
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width)
            .attr("stroke-opacity", 0.1));

    // Ajoute valeur max

    svgPlot.append("text")
        .attr("x", width + 8)
        .attr("y", scaleY(maxVal[0].roll_hosp))
        .text(Math.round(maxVal[0].roll_hosp))
        .style("fill", "#D55E00");


    // Légende

    const legendeValues = [
        { "label": "Nombre par jour", "col": "#0072B2", "op": 0.6 },
        { "label": "Moyenne glissante", "col": "#D55E00", "op": 1 }
    ]

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



    // Animation Bar Chart

    const tooltip = svgPlot.append("g")

    if (deviceType() == "desktop") {

        rect.on("mouseover", function (d) {
            d3.select(this)
                .attr("opacity", 1);

            let xPosition = +scaleT(d.date);
            let yPosition = +scaleY(d.new_hosp);

            const formatTime = d3.timeFormat("%d %b %Y")
            let instantT = formatTime(d.date)


            tooltip.attr("transform", `translate(${xPosition - 60}, ${yPosition - 50})`)
                .append("rect")
                .attr("width", 120)
                .attr("height", 50)
                .attr("fill", "#ffffff")

            tooltip.append("text")
                .attr("x", 5)
                .attr("y", 20)
                .text(`${instantT}`)
                .attr("font-size", "10px")

            tooltip.append("text")
                .attr("x", 5)
                .attr("y", 32)
                .text(`Moyenne lissée: ${Math.round(d.roll_hosp)}`)
                .attr("font-size", "10px")
                .attr("font-weight", "bold")

            tooltip.append("text")
                .attr("x", 5)
                .attr("y", 44)
                .text(`Nombre par jour: ${d.new_hosp}`)
                .attr("font-size", "10px")


        })
            .on("mouseout", function () {
                d3.select(this)
                    .attr("opacity", 0.6)

                tooltip.select("rect").remove()
                tooltip.selectAll("text").remove()


            });


    }

}