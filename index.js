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

d3.csv("/data_sample.csv").then((data) => {
  // Data

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
  });

  // Base

  const width = window.innerWidth - 20;
  const height = window.innerHeight - 20;

  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xMin = d3.min(data, (d) => +d.stars);
  const xMax = d3.max(data, (d) => +d.stars);
  const xScale = d3
    .scaleLog()
    .domain([xMin, xMax])
    .range([120, width - 320]);

  const yMin = d3.min(data, (d) => +d.forks);
  const yMax = d3.max(data, (d) => +d.forks);
  const yScale = d3
    .scaleLog()
    .domain([yMin, yMax])
    .range([height - 100, 140]);

  const colorScale = d3
    .scaleOrdinal()
    .domain(topLanguages)
    .range(d3.schemeTableau10);

  // Axes

  const xAxis = d3.axisBottom().scale(xScale);
  const yAxis = d3.axisLeft().scale(yScale);

  svg
    .append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0, ${height - 80})`)
    .call(xAxis);

  svg
    .append("g")
    .attr("id", "y-axis")
    .attr("transform", `translate(100, 0)`)
    .call(yAxis);

  svg
    .append("text")
    .attr("id", "x-axis-label")
    .attr("x", (width - 280) / 2)
    .attr("y", height - 20)
    .text("Stars");

  svg
    .append("text")
    .attr("id", "y-axis-label")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("transform", "rotate(-90)")
    .text("Forks");

  svg.append("text")
    .attr("id", "title")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .text("GitViz: A Visualization of GitHub Repositories");

  // Circles

  svg
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
          .attr("stroke-width", 1 + d3.select(this).attr("r") * 0.05);

        tooltip
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px")
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
    });

  // Legend

  const legend = svg
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
      const language = toClassName(data);

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
      d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 1 + d3.select(this).attr("r") * 0.05);

      const data = d.target.__data__;
      const language = toClassName(data);
      const circles = d3
        .selectAll(`.hoverable.${language}`)
        .attr("stroke", "black")
        .attr("stroke-width", (d) => 1 + (Math.sqrt(d.stars / xMax) + Math.sqrt(d.forks / yMax)) * 25 * 0.05);
    })
    .on("mouseout", function (d) {
      d3.select(this).attr("stroke", "none");
      const data = d.target.__data__;

      const language = toClassName(data);
      const circles = d3
        .selectAll(`.hoverable.${language}`)
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
