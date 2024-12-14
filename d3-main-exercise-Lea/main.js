// Set up SVG canvas dimensions and margins
const margin = { top: 20, right: 30, bottom: 60, left: 0 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Append SVG container
const svg = d3
  .select("#bar-chart")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Add a glow filter definition with a fixed white color
const defs = svg.append("defs");

const filter = defs.append("filter").attr("id", "glow");
filter
  .append("feGaussianBlur")
  .attr("stdDeviation", "4") // Blur intensity for the glow
  .attr("result", "coloredBlur");
filter
  .append("feFlood")
  .attr("flood-color", "white") // Set the glow color to white
  .attr("flood-opacity", "1"); // Full opacity for the glow
filter.append("feComposite").attr("in2", "coloredBlur").attr("operator", "in");
const feMerge = filter.append("feMerge");
feMerge.append("feMergeNode").attr("in", "coloredBlur");
feMerge.append("feMergeNode").attr("in", "SourceGraphic");

// Create a tooltip div
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background-color", "rgba(0, 0, 0, 0.7)")
  .style("color", "white")
  .style("padding", "8px")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("opacity", 0);

// Define a muted color palette for stacked bars
const colorPalette = d3.scaleOrdinal([
  "#6e6e6e", // Dark gray
  "#8c8c8c", // Medium gray
  "#b0b0b0", // Light gray
  "#e0e0e0", // Off-white
]);

// Load the data
d3.json("data.json").then((data) => {
  // Group data by decades
  const decades = Array.from(
    d3.group(data, (d) => Math.floor(d.Year / 10) * 10),
    ([key, value]) => ({
      Decade: key,
      TotalCO2: d3.sum(value, (d) => d["CO2 Emissions in tons"]),
      LaunchesByCountry: Object.entries(
        value.reduce((acc, d) => {
          Object.keys(d).forEach((k) => {
            if (
              k !== "Year" &&
              k !== "CO2 Emissions in tons" &&
              k !== "Total Number of Launches"
            ) {
              acc[k] = (acc[k] || 0) + d[k];
            }
          });
          return acc;
        }, {})
      )
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]),
    })
  );

  // Define xScale for decades
  const xScale = d3
    .scaleBand()
    .domain(decades.map((d) => d.Decade))
    .range([0, width])
    .padding(0.2);

  // Define yScale for CO2 emissions (total values)
  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(decades, (d) =>
        Math.max(d.TotalCO2, d3.sum(d.LaunchesByCountry.map((c) => c[1])))
      ),
    ])
    .range([height, 0]);

  // Add bars for Total CO2 emissions
  svg
    .selectAll(".co2-bar")
    .data(decades)
    .enter()
    .append("rect")
    .attr("class", "co2-bar")
    .attr("x", (d) => xScale(d.Decade))
    .attr("y", (d) => yScale(d.TotalCO2))
    .attr("width", xScale.bandwidth() / 2)
    .attr("height", (d) => height - yScale(d.TotalCO2))
    .attr("fill", "#ffffff") // White for CO2 bars
    .attr("stroke", "#cccccc") // Light gray outline
    .attr("stroke-width", "2px")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("filter", "url(#glow)");
      tooltip
        .style("opacity", 1)
        .html(
          `Decade: ${d.Decade}<br>Total CO2 Emissions: ${d.TotalCO2.toFixed(
            1
          )}00 tons`
        );
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`);
    })
    .on("mouseout", function () {
      d3.select(this).attr("filter", null);
      tooltip.style("opacity", 0);
    });

  // Add stacked bars for launches
  const launchGroups = svg
    .selectAll(".stacked-bar")
    .data(decades)
    .enter()
    .append("g")
    .attr(
      "transform",
      (d) => `translate(${xScale(d.Decade) + xScale.bandwidth() / 2},0)`
    );

  launchGroups.each(function (d) {
    let yPos = height;
    d.LaunchesByCountry.forEach(([country, count], i) => {
      const barHeight = Math.max(height - yScale(count), 5);
      d3.select(this)
        .append("rect")
        .attr("x", 0)
        .attr("y", yPos - barHeight)
        .attr("width", xScale.bandwidth() / 2)
        .attr("height", barHeight)
        .attr("fill", colorPalette(i))
        .attr("stroke", d3.rgb(colorPalette(i)).darker(1))
        .attr("stroke-width", "2px")
        .on("mouseover", function (event) {
          d3.select(this).attr("filter", "url(#glow)");
          tooltip
            .style("opacity", 1)
            .html(
              `Decade: ${d.Decade}<br>Country: ${country}<br>Launches: ${count}`
            );
        })
        .on("mousemove", function (event) {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function () {
          d3.select(this).attr("filter", null);
          tooltip.style("opacity", 0);
        });

      yPos -= barHeight;
    });
  });

  // Add x-axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickSize(0).tickPadding(10))
    .selectAll("text")
    .attr("transform", "translate(0,10)")
    .style("text-anchor", "middle")
    .style("fill", "white");

  // Add legend
  const legend = svg.append("g").attr("class", "legend");
  legend
    .append("rect")
    .attr("x", width - 150)
    .attr("y", -10)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "#ffffff");
  legend
    .append("text")
    .attr("x", width - 130)
    .attr("y", 2)
    .text("Total CO2 Emissions")
    .attr("fill", "white")
    .style("font-size", "12px");

  legend
    .append("rect")
    .attr("x", width - 150)
    .attr("y", 20)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "#8c8c8c");
  legend
    .append("text")
    .attr("x", width - 130)
    .attr("y", 32)
    .text("Launches per Country")
    .attr("fill", "white")
    .style("font-size", "12px");
});
