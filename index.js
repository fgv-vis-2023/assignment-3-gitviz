function toClassName(str) {
  return str
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/\+/g, "p")
    .replace(/#/g, "s");
}

const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);
  
  d3.csv("https://fgv-vis-2023.github.io/assignment-3-gitviz/data_sample.csv").then((data) => {
  
  data = data.filter((d) => d.stars > 0 && d.forks > 0);

  const languagesCount = data.reduce((acc, curr) => {
    if (acc[curr.language]) {
      acc[curr.language] += 1;
    } else {
      acc[curr.language] = 1;
    }
    return acc;
  }, {});

  const topLanguages = Object.keys(languagesCount)
    .filter((language) => language)
    .sort((a, b) => languagesCount[b] - languagesCount[a])
    .slice(0, 9);

  topLanguages.push("Other");

  data.forEach((d) => {
    d.language_ = d.language || "Unknown";
    d.language = topLanguages.includes(d.language) ? d.language : "Other";
    d.stars = +d.stars;
    d.forks = +d.forks;
    d.created_at = new Date(d.created_at);
    // d.pushed_at = new Date(d.pushed_at);
  });

  // Base

  const width = window.innerWidth - 20;
  const height = window.innerHeight - 20;

  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const chart = svg.append("g").attr("id", "chart");
  const hist = svg.append("g").attr("id", "hist");

  const [xMin, xMax] = d3.extent(data, (d) => d.stars);
  const xScale = d3
    .scaleLog()
    .domain([xMin, xMax])  // 0 is not allowed in log scale
    .range([110, width - 320]);
  
  const xScaleHist = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.created_at))
    .range([110, width - 320]);

  const [yMin, yMax] = d3.extent(data, (d) => d.forks);
  const yScale = d3
    .scaleLog()
    .domain([yMin, yMax])
    .range([height - 210, 100]);

  const colorScale = d3
    .scaleOrdinal()
    .domain(topLanguages)
    .range(d3.schemeTableau10);

  // Axes

  const xAxis = d3.axisBottom().scale(xScale);
  const xAxisHist = d3.axisBottom().scale(xScaleHist);
  const yAxis = d3.axisLeft().scale(yScale);

  svg
    .append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0, ${height - 190})`)
    .call(xAxis);

  svg
    .append("g")
    .attr("id", "x-axis-hist")
    .attr("transform", `translate(0, ${height - 50})`)
    .call(xAxisHist);

  svg
    .append("g")
    .attr("id", "y-axis")
    .attr("transform", `translate(80, 0)`)
    .call(yAxis);

  svg
    .append("text")
    .attr("id", "x-axis-label")
    .attr("x", (width - 280) / 2)
    .attr("y", height - 150)
    .text("Stars (log)");

  svg
    .append("text")
    .attr("id", "x-axis-hist-label")
    .attr("x", (width - 280) / 2)
    .attr("y", height - 5)
    .text("Creation Date");

  svg
    .append("text")
    .attr("id", "y-axis-label")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("transform", "rotate(-90)")
    .text("Forks (log)");

  svg
    .append("text")
    .attr("id", "title")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .text("GitViz: A Visualization of GitHub Repositories");

  // svg
  //   .append("rect")
  //   .attr("x", 110)
  //   .attr("y", height - 130)
  //   .attr("width", width - 429)
  //   .attr("height", 80)
  //   .attr("fill", "none")
  //   .attr("stroke", "black");


  // Histogram
    
    let makeBins = d3
    .bin()
    .value((d) => d.created_at)
    .domain(xScaleHist.domain())
    .thresholds(xScaleHist.ticks(30));
    
    let bins = makeBins(data);
  
    const yScaleHist = d3
      .scaleLinear()
      .range([height - 50, height - 130])
      .domain([0, d3.max(bins, (d) => d.length)]);

  hist.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", (d) => 1 + xScaleHist(d.x0))
    .attr("y", (d) => yScaleHist(d.length))
    .attr("width", (d) => xScaleHist(d.x1) - xScaleHist(d.x0) - 1)
    .attr("height", (d) => height - yScaleHist(d.length) - 50)
    .attr("fill", "steelblue")
    .attr("opacity", 0.8)
    .on("mouseover", function (event, d) {
      let item = d3.select(this);
      item.attr("stroke", "black");
      
      tooltip
        .style("left",
          `${xScaleHist(d.x1) + 10}px`)
        .style("top",
          `${item.attr("y")}px`)
        .style("opacity", 0.9);

      tooltip
        .append("p")
        .text(`Quantidade: ${d.length}`)
    })
    .on("mouseout", function () {
      item = d3.select(this);
      item.attr("stroke", "none");

      tooltip.style("opacity", 0);
      tooltip.selectAll("p").remove();
    });


  // Circles

  chart
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("data-xvalue", (d) => d.stars)
    .attr("data-yvalue", (d) => d.forks)
    .attr("cx", (d) => xScale(d.stars))
    .attr("cy", (d) => yScale(d.forks))
    .attr(
      "r",
      (d) => (Math.sqrt(d.stars / xMax) + Math.sqrt(d.forks / yMax)) * 25
    )
    .attr("fill", (d) => colorScale(d.language))
    .attr("class", (d) => toClassName(d.language))
    .classed("dot", "true")
    .classed("hoverable", "true")
    .on("mouseover", function (event, d) {
      item = d3.select(this);
      if (item.classed("hoverable")) {
        item
          .attr("stroke", "black")
          .attr("stroke-width", 1 + item.attr("r") * 0.05);
        
        // Posoiciona o tooltip próximo do canto inferior direito do círculo
        let offset = 0.9 * Math.sqrt(Number(item.attr("r"))**2 / 2) + 10;
        tooltip
          .style("left",
            `${Number(item.attr("cx")) + offset}px`)
          .style("top",
            `${Number(item.attr("cy")) + offset}px`)
          .style("opacity", 0.9);

        tooltip
          .append("p")
          .text(d.repo)
          .style("font-weight", "bold")
          .style("margin-bottom", "4px");

        tooltip.append("p").text(`Stars: ${d.stars}`);
        tooltip.append("p").text(`Forks: ${d.forks}`);
        tooltip.append("p").text(`Language: ${d.language_}`);
      }
    })
    .on("mouseout", function () {
      item = d3.select(this);
      if (item.classed("hoverable")) {
        item.attr("stroke", "none");
      }

      tooltip.style("opacity", 0);
      tooltip.selectAll("p").remove();
    })
    .on("click", function (event, d) {
      item = d3.select(this);
      if (item.classed("hoverable")) {
        window.open("https://github.com/" + d.repo, "_blank");
      }
    });

  // Legend

  const legend = chart
    .append("g")
    .attr("id", "legend")
    .attr("transform", `translate(${width - 200}, 140)`);

  legend
    .selectAll("rect")
    .data(topLanguages)
    .enter()
    .append("rect")
    .attr("class", "legend-item")
    // .classed((d) => `btn-${d.language}`, 'true')
    .attr("x", 0)
    .attr("y", (d, i) => i * 35)
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", (d) => colorScale(d))
    .attr("rx", 4)
    .on("click", (d) => {
      const btn = d3.select(d.target);
      const data = d.target.__data__;

      if (!btn.classed("active")) {
        btn.classed("active", true);
        
        d3.selectAll(`.dot`)
          .attr("fill", (d) => colorScale(d.language))
          .attr("opacity", 1)
          .classed("hoverable", true)
          .filter((d) => !(d.language == data))
          .attr("fill", "grey")
          .attr("opacity", 0.25)
          .classed("hoverable", false);
      } else {
        btn.classed("active", false);
        d3.selectAll(`.dot`)
          .attr("fill", (d) => colorScale(d.language))
          .attr("opacity", 1)
          .classed("hoverable", true);
      }
      d3.selectAll(`.hoverable`).each(function () {
        const parentNode = this.parentNode;
        parentNode.removeChild(this);
        parentNode.appendChild(this);
      });
    })
    .on("mouseover", function (d) {
      let item = d3.select(this);
      item
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      const data = d.target.__data__;
      const language = toClassName(data);
      d3.selectAll(`.hoverable.${language}`)
        .attr("stroke", "black")
        .attr("stroke-width", (d) => 1 + (Math.sqrt(d.stars / xMax) + Math.sqrt(d.forks / yMax)) * 25 * 0.05);
    })
    .on("mouseout", function (d) {
      d3.select(this).attr("stroke", "none");
      const data = d.target.__data__;

      const language = toClassName(data);
      d3.selectAll(`.hoverable.${language}`)
        .attr("stroke", "none");
    });

  legend
    .selectAll("text")
    .data(topLanguages)
    .enter()
    .append("text")
    .attr("class", "legend-text")
    .attr("x", 30)
    .attr("y", (d, i) => i * 35 + 16)
    .text((d) => d)
    .style("cursor", "pointer");

  legend
    .append("text")
    .attr("id", "legend-title")
    .attr("x", 0)
    .attr("y", -20)
    .text("Languages")
    .style("font-size", "1.5rem")
    .style("font-weight", "bold");
});
