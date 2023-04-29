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

d3.csv("https://fgv-vis-2023.github.io/assignment-3-gitviz/data.csv").then(
  (data) => {
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

    const [xMin, xMax] = d3.extent(data, (d) => d.stars);
    const xScale = d3
      .scaleLog()
      .domain([xMin, xMax]) // 0 is not allowed in log scale
      .range([110, width - 320]);

    const [yMin, yMax] = d3.extent(data, (d) => d.forks);
    const yScale = d3
      .scaleLog()
      .domain([yMin, yMax])
      .range([height - 210, 100]);

    const colorScale = d3
      .scaleOrdinal()
      .domain(topLanguages)
      .range(d3.schemePaired);

    // Axes

    const xAxis = d3.axisBottom().scale(xScale);
    const yAxis = d3.axisLeft().scale(yScale);

    svg
      .append("g")
      .attr("id", "x-axis")
      .attr("transform", `translate(0, ${height - 190})`)
      .call(xAxis);

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

    // Histogram

    const hist = svg.append("g").attr("id", "hist");

    const histXAxis = d3.axisBottom();
    const histXAxisEl = svg
      .append("g")
      .attr("id", "x-axis-hist")
      .attr("transform", `translate(0, ${height - 50})`);

    const xScaleHist = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.created_at))
      .range([110, width - 320]);

    histXAxis.scale(xScaleHist);

    const histBrush = d3
      .brushX()
      .extent([
        [110, height - 130],
        [width - 320, height - 50],
      ])
      .on("end", (e) => drawCircles(e.selection));

    svg.append("g").attr("id", "brush").call(histBrush);

    function drawHistogram(language = null) {
      const filteredData = language
        ? data.filter((d) => d.language === language)
        : data;

      const bins = d3
        .histogram()
        .value((d) => d.created_at)
        .domain(xScaleHist.domain())
        .thresholds(xScaleHist.ticks(30))(filteredData);

      const yScaleHist = d3
        .scaleLinear()
        .range([height - 50, height - 130])
        .domain([0, d3.max(bins, (d) => d.length)]);

      histXAxisEl.call(histXAxis);

      const bars = hist.selectAll("rect").data(bins);

      bars
        .enter()
        .append("rect")
        .merge(bars)
        .transition()
        .duration(250)
        .attr("x", (d) => 1 + xScaleHist(d.x0))
        .attr("y", (d) => yScaleHist(d.length))
        .attr("width", (d) => xScaleHist(d.x1) - xScaleHist(d.x0) - 1)
        .attr("height", (d) => height - yScaleHist(d.length) - 50)
        .attr("fill", "steelblue")
        .attr("opacity", 0.8)
        .style("fill", language ? colorScale(language) : "black");

      bars.exit().remove();
    }

    drawHistogram();

    // Circles

    function drawCircles(interval = null) {
      const filteredData = interval
        ? data.filter((d) => {
            const date = new Date(d.created_at);
            const min = xScaleHist.invert(interval[0]);
            const max = xScaleHist.invert(interval[1]);

            return date >= min && date <= max;
          })
        : data;

      console.log(filteredData.length);

      const circles = chart.selectAll("circle").data(filteredData);

      circles
        .enter()
        .append("circle")
        .merge(circles)
        .transition()
        .duration(250)
        .attr("data-xvalue", (d) => d.stars)
        .attr("data-yvalue", (d) => d.forks)
        .attr("cx", (d) => xScale(d.stars))
        .attr("cy", (d) => yScale(d.forks))
        .attr("r", (d) =>
          Math.min(
            30,
            Math.max(
              3,
              Math.sqrt(d.stars / xMax) + Math.sqrt(d.forks / yMax) * 30
            )
          )
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
            let offset = 0.9 * Math.sqrt(Number(item.attr("r")) ** 2 / 2) + 10;
            tooltip
              .style("left", `${Number(item.attr("cx")) + offset}px`)
              .style("top", `${Number(item.attr("cy")) + offset}px`)
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

      circles.exit().remove();
    }

    drawCircles();

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
        const language = d.target.__data__;

        if (!btn.classed("active")) {
          btn.classed("active", true);

          d3.selectAll(`.dot`)
            .attr("fill", (d) => colorScale(d.language))
            .attr("opacity", 1)
            .classed("hoverable", true)
            .filter((d) => !(d.language == language))
            .attr("fill", "grey")
            .attr("opacity", 0.25)
            .classed("hoverable", false);

          drawHistogram(language);
        } else {
          btn.classed("active", false);
          d3.selectAll(`.dot`)
            .attr("fill", (d) => colorScale(d.language))
            .attr("opacity", 1)
            .classed("hoverable", true);

          drawHistogram();
        }
        d3.selectAll(`.hoverable`).each(function () {
          const parentNode = this.parentNode;
          parentNode.removeChild(this);
          parentNode.appendChild(this);
        });
      })
      .on("mouseover", function (d) {
        let item = d3.select(this);
        item.attr("stroke", "black").attr("stroke-width", 1);

        const data = d.target.__data__;
        const language = toClassName(data);
        d3.selectAll(`.hoverable.${language}`)
          .attr("stroke", "black")
          .attr(
            "stroke-width",
            (d) =>
              1 +
              (Math.sqrt(d.stars / xMax) + Math.sqrt(d.forks / yMax)) *
                25 *
                0.05
          );
      })
      .on("mouseout", function (d) {
        d3.select(this).attr("stroke", "none");
        const data = d.target.__data__;

        const language = toClassName(data);
        d3.selectAll(`.hoverable.${language}`).attr("stroke", "none");
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
  }
);
