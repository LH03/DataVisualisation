import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

console.log("Displaying simple bar chart");
// Set the dimensions and margins of the graph
const width = 1000;
const height = 600;
const marginTop = 50;
const marginRight = 30;
const marginBottom = 150;
const marginLeft = 100;

async function fetchData() {
  const url = "./food-data.json";
  let response = await fetch(url);

  if (response.ok) {
    let json = await response.json();
    console.log("Response: ", json);
    drawChart(json, "food_emissions_farm", "Farm"); // Default category is Farm
    setupRadioButtons(json);
  } else {
    alert("HTTP-Error: " + response.status);
  }
}

function setupRadioButtons(data) {
  const categories = [
    "food_emissions_land_use",
    "food_emissions_farm",
    "food_emissions_animal_feed",
    "food_emissions_processing",
    "food_emissions_transport",
    "food_emissions_retail",
    "food_emissions_packaging",
    "food_emissions_losses",
  ];

  // Create a nicer display name mapping
  const displayNames = {
    food_emissions_land_use: "Land Use Change",
    food_emissions_farm: "Farm",
    food_emissions_animal_feed: "Animal Feed",
    food_emissions_processing: "Processing",
    food_emissions_transport: "Transport",
    food_emissions_retail: "Retail",
    food_emissions_packaging: "Packaging",
    food_emissions_losses: "Losses",
  };

  const container = document.getElementById("container");
  const radioDiv = document.createElement("div");
  radioDiv.style.marginBottom = "20px";

  categories.forEach((category) => {
    const label = document.createElement("label");
    label.style.marginRight = "15px";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "category";
    input.value = category;
    input.checked = category === "food_emissions_farm"; // Default to farm
    input.onchange = () => {
      const oldSvg = document.querySelector("svg");
      if (oldSvg) {
        oldSvg.remove();
      }
      drawChart(data, category, displayNames[category]);
    };

    label.appendChild(input);
    label.appendChild(document.createTextNode(displayNames[category]));
    radioDiv.appendChild(label);
  });

  container.insertBefore(radioDiv, container.firstChild);

  // Initial chart
  drawChart(data, "food_emissions_farm", "Farm");
}

function drawChart(data, selectedCategory, displayName) {
  // Create mapping for food names
  const foodNames = {
    0: "Beef (beef herd)",
    1: "Lamb & Mutton",
    2: "Dairy",
    3: "Prawns",
    4: "Fish (farmed)",
    5: "Eggs",
    6: "Rice",
    7: "Nuts",
    8: "Beef (dairy herd)",
    9: "Cheese",
    10: "Pig Meat",
    11: "Poultry Meat",
    12: "Tofu",
    13: "Peas",
    14: "Nuts",
  };

  // Clear any existing SVG
  d3.select("#container svg").remove();

  // Create the SVG container
  const svg = d3.create("svg").attr("width", width).attr("height", height);

  // Create array of food items with their values
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: foodNames[key], // Use the mapping here
    value: Number(value[selectedCategory]),
  }));

  // Get maximum value
  const maxValue = d3.max(chartData, (d) => d.value);

  // Declare the x scale
  const x = d3
    .scaleBand()
    .domain(chartData.map((d) => d.name))
    .range([marginLeft, width - marginRight])
    .padding(0.2);

  // Declare the y scale
  const y = d3
    .scaleLinear()
    .domain([0, maxValue])
    .range([height - marginBottom, marginTop]);

  // Create a color scale based on the category with darker colors
  const categoryColors = {
    food_emissions_land_use: "#2c7a58",
    food_emissions_farm: "#a04e2d",
    food_emissions_animal_feed: "#4d5a9e",
    food_emissions_processing: "#8e356a",
    food_emissions_transport: "#5e7d2f",
    food_emissions_retail: "#b38b15",
    food_emissions_packaging: "#7b6040",
    food_emissions_losses: "#5a5a5a",
  };

  const selectedColor = categoryColors[selectedCategory] || "steelblue";

  // Create a tooltip div
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");

  // Create the bars with tooltip interaction
  svg
    .append("g")
    .selectAll("rect")
    .data(chartData)
    .join("rect")
    .attr("fill", selectedColor) // Use the darker color for the selected category
    .attr("x", (d) => x(d.name))
    .attr("y", (d) => y(Math.max(0, d.value)))
    .attr("height", (d) =>
      Math.max(0, height - y(Math.max(0, d.value)) - marginBottom)
    )
    .attr("width", x.bandwidth())
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "white").attr("stroke-width", 2);

      tooltip
        .style("opacity", 1)
        .html(`${displayName}: ${d.value.toFixed(2)} kg CO₂ eq.`)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 10 + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", null);

      tooltip.style("opacity", 0);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 10 + "px");
    });

  // Add x-axis with rotated labels
  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end")
    .style("font-size", "12px")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-45)");

  // Add y-axis
  svg
    .append("g")
    .attr("transform", `translate(${marginLeft}, 0)`)
    .call(d3.axisLeft(y));

  // Add title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", marginTop / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("fill", "black") // Set the title color to black
    .text(`${displayName} Emissions by Food Product`);

  // Append the SVG element
  const container = document.getElementById("container");
  container.append(svg.node());
}

fetchData();
