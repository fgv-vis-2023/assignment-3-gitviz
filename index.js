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

const filters = {
  language: null,
  createdAtInterval: null,
};

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

    const [xMin, xMax] = d3.extent(data, (d) => +d.stars);
    const [yMin, yMax] = d3.extent(data, (d) => +d.forks);

    data.forEach((d) => {
      d.language_ = d.language || "Unknown";
      d.language = topLanguages.includes(d.language) ? d.language : "Other";
      d.stars = +d.stars;
      d.forks = +d.forks;
      d.radius = Math.min(
        30,
        Math.max(3, Math.sqrt(d.stars / xMax) + Math.sqrt(d.forks / yMax) * 30)
      );
      d.created_at = new Date(d.created_at);
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

    const xScale = d3
      .scaleLog()
      .domain([xMin, xMax]) // 0 is not allowed in log scale
      .range([110, width - 320]);

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
      .attr("x", 20)
      .attr("y", 35)
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
      .on("end", (e) => {
        filters.interval = e.selection?.map(xScaleHist.invert);
        drawCircles();
      });

    svg.append("g").attr("id", "brush").call(histBrush);

    function drawHistogram() {
      const language = filters.language;

      const filteredData = language
        ? data.filter((d) => d.language === language)
        : data.slice();

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
        .attr("opacity", 0.8)
        .style("fill", language ? colorScale(language) : "darkgray");

      bars.exit().remove();
    }

    drawHistogram();

    // Circles

    function drawCircles() {
      const language = filters.language;
      const interval = filters.interval;

      const filteredData = interval
        ? data.filter((d) => {
            const [min, max] = interval;
            return d.created_at >= min && d.created_at <= max;
          })
        : data.slice();

      filteredData.sort((a, b) => b.radius - a.radius);

      const circles = chart
        .selectAll("circle")
        .data(filteredData, (d) => d.repo);

      circles
        .enter()
        .append("circle")
        .attr("r", 0)
        .merge(circles)
        .attr("data-selected", (d) => language && d.language === language)
        .attr("cursor", (d) =>
          !language || d.language === language ? "pointer" : "default"
        )
        .on("mouseover", function (_, d) {
          if (!language || d?.language === language) {
            const item = d3.select(this);

            item
              .attr("stroke", "black")
              .attr("stroke-width", 1 + item.attr("r") * 0.05);

            const formattedDate = d3.timeFormat("%B %d, %Y")(d.created_at);

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
            tooltip.append("p").text(`Created: ${formattedDate}`);
          }
        })
        .on("mouseout", function (_, d) {
          if (!language || d?.language === language) {
            const item = d3.select(this);
            item.attr("stroke", "none");
          }

          tooltip.style("opacity", 0);
          tooltip.selectAll("p").remove();
        })
        .on("click", function (_, d) {
          if (!language || d?.language === language) {
            window.open("https://github.com/" + d.repo, "_blank");
          }
        })
        .attr("cx", (d) => xScale(d.stars))
        .attr("cy", (d) => yScale(d.forks))
        .attr("class", (d) => toClassName(d.language) + " dot hoverable")
        .transition()
        .duration(250)
        .attr("r", (d) => d.radius)
        .attr("fill", (d) =>
          !language || language === d.language ? colorScale(d.language) : "gray"
        )
        .style("opacity", (d) =>
          !language || language === d.language ? 0.9 : 0.2
        );

      circles.exit().transition().duration(250).attr("r", 0).remove();

      chart.selectAll("[data-selected='true']").each(function () {
        this.parentNode.appendChild(this);
      });
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
      .attr("x", 0)
      .attr("y", (d, i) => i * 35)
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", (d) => colorScale(d))
      .attr("rx", 4)
      .style("cursor", "pointer")
      .on("click", (d) => {
        const newLanguage = d.target.__data__;

        if (filters.language === newLanguage) {
          filters.language = null;
        } else {
          filters.language = newLanguage;
        }

        drawHistogram();
        drawCircles();
      })
      .on("mouseover", function (d) {
        let item = d3.select(this);
        item.attr("stroke", "black").attr("stroke-width", 1);

        const data = d.target.__data__;
        const language = toClassName(data);
        d3.selectAll(`.hoverable.${language}`)
          .attr("stroke", "black")
          .attr("stroke-width", (d) => 1 + d.radius * 0.05);
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
      .text((d) => d);

    legend
      .append("text")
      .attr("id", "legend-title")
      .attr("x", 0)
      .attr("y", -20)
      .text("Languages")
      .style("font-size", "1.5rem")
      .style("font-weight", "bold");

    // Source

    chart
      .append("text")
      .attr("x", width - 330)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .text("Source:");

    chart
      .append("text")
      .attr("x", width - 150)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .append("a")
      .attr("fill", "blue")
      .attr(
        "xlink:href",
        "https://www.kaggle.com/datasets/joonasyoon/github-topics"
      )
      .attr("target", "_blank")
      .text("Github Topics and Repositories 2022");
  }
);
