// Set up the SVG dimensions
const width = 1000;
const height = 1000;
const margin = 50;

// Define radii for each circle
const radii = {
  inner: 80, // Land Use
  second: 130, // Water Use
  third: 190, // GHG Emissions
  outer: 260, // Eutrophication
};

// Append SVG container
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", `translate(${width / 2}, ${height / 2})`);

// Define color scale
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Append a text element to display milk details outside the chart
const infoText = d3
  .select("body")
  .append("div")
  .style("position", "absolute")
  .style("left", `${width / 2 + 300}px`) // Positioned to the right of the chart
  .style("top", `${height / 2 - 50}px`)
  .style("font-size", "16px")
  .style("font-weight", "bold")
  .style("background-color", "#f9f9f9")
  .style("padding", "10px")
  .style("border", "1px solid #ccc")
  .style("border-radius", "5px")
  .style("visibility", "hidden"); // Hidden by default

// Fetch the data from data.json
d3.json("data.json").then((data) => {
  // Prepare data for the circles
  const milkData = data.map((d) => ({
    Entity: d.Entity,
    LandUse: d["Land use of milks (m2)"],
    WaterUse: d["Water use of milks (L)"],
    GHG: d["GHG emissions of milks (kg CO2eq)"],
    Eutrophication: d["Eutrophication from milks (g PO43-eq)"],
  }));

  // Sort milkData by the "Entity" field to unify order
  milkData.sort((a, b) => a.Entity.localeCompare(b.Entity));

  // Define pie generators for all circles (unified order)
  const pie = d3
    .pie()
    .sort(
      (a, b) =>
        milkData.findIndex((d) => d.Entity === a.Entity) -
        milkData.findIndex((d) => d.Entity === b.Entity)
    )
    .value((d) => d.LandUse);

  const secondPie = d3
    .pie()
    .sort(
      (a, b) =>
        milkData.findIndex((d) => d.Entity === a.Entity) -
        milkData.findIndex((d) => d.Entity === b.Entity)
    )
    .value((d) => d.WaterUse);

  const thirdPie = d3
    .pie()
    .sort(
      (a, b) =>
        milkData.findIndex((d) => d.Entity === a.Entity) -
        milkData.findIndex((d) => d.Entity === b.Entity)
    )
    .value((d) => d.GHG);

  const outerPie = d3
    .pie()
    .sort(
      (a, b) =>
        milkData.findIndex((d) => d.Entity === a.Entity) -
        milkData.findIndex((d) => d.Entity === b.Entity)
    )
    .value((d) => d.Eutrophication);

  // Define arc generators for each circle
  const arc = d3.arc().innerRadius(0).outerRadius(radii.inner); // Land Use
  const secondArc = d3
    .arc()
    .innerRadius(radii.inner + 20)
    .outerRadius(radii.second);
  const thirdArc = d3
    .arc()
    .innerRadius(radii.second + 20)
    .outerRadius(radii.third);
  const outerArc = d3
    .arc()
    .innerRadius(radii.third + 20)
    .outerRadius(radii.outer);

  // Function to handle mouseover for interactivity
  const handleMouseOver = function (event, d) {
    const selectedEntity = d.data.Entity;
    const milkColor = d3.color(color(selectedEntity)); // Get the slice color

    // Blend the slice color with white to create a subdued lighter color
    const backgroundColor = milkColor
      ? d3.interpolateRgb(milkColor, d3.color("white"))(0.7) // Blend 70% with white
      : "#f9f9f9"; // Fallback to light neutral color

    // Highlight the selected slice and gray out others
    svg
      .selectAll(".slice")
      .style("opacity", (d) => (d.data.Entity === selectedEntity ? 1 : 0.2));

    // Update and display the text element with all values
    infoText
      .style("visibility", "visible")
      .style("background-color", backgroundColor) // Apply the lighter background color
      .html(`
      <strong>Milk Type:</strong> ${selectedEntity}<br>
      <strong>Land Use:</strong> ${d.data.LandUse} m²<br>
      <strong>Water Use:</strong> ${d.data.WaterUse} L<br>
      <strong>GHG Emissions:</strong> ${d.data.GHG} kg CO₂eq<br>
      <strong>Eutrophication:</strong> ${d.data.Eutrophication} g PO₄³⁻eq
    `);
  };

  // Function to reset opacity and hide text on mouseout
  const handleMouseOut = function () {
    // Reset slice opacity
    svg.selectAll(".slice").style("opacity", 1);

    // Hide the text element
    infoText.style("visibility", "hidden");
  };

  // Draw inner pie (Land Use)
  svg
    .selectAll(".innerSlice")
    .data(pie(milkData))
    .enter()
    .append("path")
    .attr("class", "slice innerSlice")
    .attr("d", arc)
    .attr("fill", (d) => color(d.data.Entity))
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut);

  // Draw second pie (Water Use)
  svg
    .selectAll(".secondSlice")
    .data(secondPie(milkData))
    .enter()
    .append("path")
    .attr("class", "slice secondSlice")
    .attr("d", secondArc)
    .attr("fill", (d) => color(d.data.Entity))
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut);

  // Draw third pie (GHG Emissions)
  svg
    .selectAll(".thirdSlice")
    .data(thirdPie(milkData))
    .enter()
    .append("path")
    .attr("class", "slice thirdSlice")
    .attr("d", thirdArc)
    .attr("fill", (d) => color(d.data.Entity))
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut);

  // Draw outer pie (Eutrophication)
  svg
    .selectAll(".outerSlice")
    .data(outerPie(milkData))
    .enter()
    .append("path")
    .attr("class", "slice outerSlice")
    .attr("d", outerArc)
    .attr("fill", (d) => color(d.data.Entity))
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut);

  // Add labels directly on top of each circle with white backgrounds
  // Add labels directly on top of each circle with white backgrounds
  const labels = [
    { text: "Land Use", radius: radii.inner / 2 },
    { text: "Water Use", radius: (radii.inner + radii.second) / 2 },
    { text: "GHG Emissions", radius: (radii.second + radii.third) / 2 },
    { text: "Eutrophication", radius: (radii.third + radii.outer) / 2 },
  ];

  labels.forEach((label) => {
    // Calculate label width and height for background
    const textWidth = 120;
    const textHeight = 25;

    // Add a white rectangle background with rounded corners
    svg
      .append("rect")
      .attr("x", -textWidth / 2)
      .attr("y", -label.radius - textHeight / 2)
      .attr("width", textWidth)
      .attr("height", textHeight)
      .attr("fill", "white")
      .attr("rx", 5) // Rounded corners
      .attr("ry", 5);

    // Add the text label
    svg
      .append("text")
      .attr("x", 0)
      .attr("y", -label.radius + textHeight / 4) // Center the text vertically
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(label.text);
  });

  // Add a legend
  const legend = svg
    .append("g")
    .attr("transform", `translate(-${width / 2 - 30},-${height / 2 - 20})`);

  milkData.forEach((d, i) => {
    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", i * 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(d.Entity));

    legend
      .append("text")
      .attr("x", 20)
      .attr("y", i * 20 + 12)
      .text(d.Entity)
      .style("font-size", "12px")
      .style("alignment-baseline", "middle");
  });
});
