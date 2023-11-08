function buindingData(cities) {
  setTimeout(() => {
    var select = document.getElementById("city");

    for(var i = 0; i < cities.length; i++)
    {
        var option = document.createElement("option"),
            txt = document.createTextNode(cities[i]);
        option.appendChild(txt);
        option.setAttribute("value",cities[i]);
        select.insertBefore(option,select.lastChild);
    }
  });
}

function showBarChart(cityRow) {
    const data = cityRow

    if(document.getElementById('bar-chart-container') && document.getElementById('bar-chart-container').children.length > 0)
        document.getElementById('bar-chart-container').children[0].remove()
    
    // Chart dimensions
    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    // Create an SVG container
    const svg = d3.select("#bar-chart-container").append("svg")


    
    // Calculate chart dimensions within margins
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create a group for the bars
    const barGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Define scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.scientific_name))
        .range([0, innerWidth])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .nice()
        .range([innerHeight, 0]);

    // Create bars
    barGroup.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.scientific_name))
        .attr("y", d => yScale(d.count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => innerHeight - yScale(d.count))
        .attr("fill", "green");

    // Create x-axis
    barGroup.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-45)");

    // Create y-axis
    barGroup.append("g")
        .call(d3.axisLeft(yScale).ticks(5));

    // Add a tooltip
    barGroup.on("mouseover", function(d) {
        const x = d3.select(this).attr("x");
        const y = d3.select(this).attr("y");
        const width = d3.select(this).attr("width");
        const count = d.count;

        // Create and display the tooltip
        const tooltip = document.createElement("div").
        attr("class", "tooltip")
        .attr("x", +x + +width / 2)
        .attr("y", +y - 10)
        .text(13218318)
        .style("text-anchor", "middle");

        body = document.getElementsByTagName("body")[0]
        body.appendChild(tooltip)
            
    })

    .on("mouseout", function() {
        // Remove the tooltip on mouseout
        barGroup.select(".tooltip").remove();
    });
}

function selectedCity(city) {
    let selectedCityRow = tree_data[city]
    showBarChart(selectedCityRow)
}

document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
        var e = document.getElementById("city");
        function onChange() {
            var value = e.value;
            if(e.options[e.selectedIndex] || e.options[e.selectedIndex] == -1) {
              var text = e.options[e.selectedIndex].text;
                selectedCity(value)
            }
            else {
              selectedCity('Adair')
            }
        }   
        e.onchange = onChange;
        onChange();
    }, 1000);
});

function showHeatmapBarChart(data) {
    // Extract unique cities and plant species
  const cities = Array.from(new Set(data.map(d => d.city)));
  const species = Array.from(new Set(Object.keys(data[0]).filter(key => key !== "city" && key !== "total")));

  // Create an empty heatmap dataset
  const heatmapData = [];

  // Iterate through species and cities to populate the heatmap
  species.forEach(speciesName => {
      const row = { species: speciesName };
      cities.forEach(city => {
          const dataPoint = data.find(d => d.city === city);
          row[city] = dataPoint[speciesName] || 0;
      });
      heatmapData.push(row);
  });
  // Define dimensions for the chart
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const margHeatin = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 600 - margHeatin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create an SVG container for the heatmap
  const svg = d3.select("#heatmap-chart-container")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // Define scales for x and y axes
  const x = d3.scaleBand()
      .domain(heatmapData.map(d => d.species))
      .range([0, width])
      .padding(0.1);

  const y = d3.scaleBand()
      .domain(Object.keys(heatmapData[0]).filter(key => key !== "species"))
      .range([height, 0])
      .padding(0.1);

  const customColors = ["rgb(80, 255, 27)", "rgb(7, 153, 46)", "rgb(10, 94, 32)", "rgb(8, 53, 20)"];
  // Create a custom color scale
  const customColorScale = d3.scaleSequential()
    .domain([0, d3.max(heatmapData, d => d3.max(Object.keys(d).slice(1), key => d[key]))]) // Adjust the domain as needed
    .interpolator(d3.interpolateRgbBasis(customColors)); // Use your custom color array
      

  // Create the heatmap rectangles
  svg.selectAll()
      .data(heatmapData, d => d.species)
      .enter()
      .append("g")
      .selectAll("rect")
      .data(d => Object.keys(d).slice(1).map(city => ({ species: d.species, city, count: d[city] })))
      .enter()
      .append("rect")
      .attr("x", d => x(d.species))
      .attr("y", d => y(d.city))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", d => customColorScale(d.count));

  // Add x-axis
  svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

  // Add y-axis
  svg.append("g")
      .call(d3.axisLeft(y));
}

function createStackedBarChartSmallMultiples(data) {

  const container = d3.select("#stack-bar-chart-small-multiple-container");

  const categories = Object.keys(data[0]).filter(key => key !== "city" && key !== "total");

  categories.forEach(category => {
      const svg = container
          .append("svg")
          .attr("width", 1000)
          .attr("height", 300)
          .attr("class", 'col-sm-4');

      const keys = data.map(d => d.city);

      const x = d3.scaleLinear()
          .domain([0, d3.max(data, d => d[category])])
          .nice()
          .range([0, 300]);

      const y = d3.scaleBand()
          .domain(keys)
          .range([30, 260])
          .padding(0.1);

      const color = d3.scaleOrdinal()
          .domain(keys)
          .range(d3.schemeCategory10);

      svg.selectAll("rect")
          .data(data)
          .enter().append("rect")
          .attr("y", d => y(d.city))
          .attr("x", 0)
          .attr("width", d => x(d[category]))
          .attr("height", y.bandwidth())
          .attr("fill", d => color(d.city));

      svg.append("g")
          .call(d3.axisLeft(y));

      svg.append("g")
          .attr("transform", "translate(0, 260)")
          .call(d3.axisBottom(x).ticks(5));
  });
}

function showStackBarChart(data) {
  var svg = d3.select("svg"),
    margin = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 40
    },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom - 100,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var y = d3.scaleBand()
    .rangeRound([0, height])
    .paddingInner(0.05)
    .align(0.1);

  var x = d3.scaleLinear()
    .rangeRound([0, width]);

  var z = d3.scaleOrdinal()
    .range(["rgb(8, 53, 20)", "rgb(10, 94, 32)", "rgb(7, 153, 46)", "rgb(80, 255, 27)"]);

    const result = [];

    for (const city in data) {
        const cityData = data[city];
        const cityEntry = { city };
    
        for (const item of cityData) {
            cityEntry[item.scientific_name] = item.count;
        }
    
        result.push(cityEntry);
    }
    
    data = result.filter(a => (a.city == 'New York' || a.city == 'Los Angeles' || a.city == 'Boston' || a.city == 'Houston' || a.city == 'Irvine'))
    // Define the keys to exclude
    const keysToExclude = ["city", "Platanus acerifolia", 'Pyrus calleryana', 'Magnolia grandiflora'];

    // Filter out the excluded key-value pairs
    data.forEach((a, index) => {
      a = Object.fromEntries(Object.entries(a).filter(([key]) => keysToExclude.includes(key)))
      data[index] = a
    })

  // fix pre-processing
  var keys = [];
  for (key in data[0]){
    if (key != "city")
      keys.push(key);
  }
  data.forEach(function(d){
    d.total = 0;
    keys.forEach(function(k){
      d.total += d[k];
    })
  });

  data.sort(function(a, b) {
    return b.total - a.total;
  });

  // Ensure the domain for the x scale covers the range of total values
  x.domain([0, d3.max(data, function (d) {
    return d.total;
  })]);

  y.domain(data.map(function (d) {
    return d.city;
  }));

  g.append("g")
  .selectAll("g")
  .data(d3.stack().keys(keys)(data))
  .enter().append("g")
  .attr("fill", function (d) {
    return z(d.key);
  })
  .selectAll("rect")
  .data(function (d) {
    return d;
  })
  .enter().append("rect")
  .attr("x", function (d) {
    return x(d[0]);
  })
  .attr("y", function (d) {
    return y(d.data.city);
  })
  .attr("width", function (d) {
    return x(d[1]) - x(d[0]);
  })
  .attr("height", y.bandwidth());

  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y));

  g.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(null, "s"));
  
  var legend = g.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(keys.slice().reverse())
    .enter().append("g")
    .attr("transform", function(d, i) {
      return "translate(0," + i * 20 + ")";
    });

  legend.append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", z);

  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(function(d) {
      return d;
    });
    createStackedBarChartSmallMultiples(data)
    showHeatmapBarChart(data)
}

cities = []
let tree_data
fetch('../../assets/clean_dataset/top_city_scientific_names_with_average_height (1).json')
  .then(response => response.json())
  .then(data => {
    // Process and work with the data from the JSON file
    tree_data = data
    cities = Object.keys(tree_data)
    buindingData(cities)
    showStackBarChart(tree_data)
  })
  .catch(error => {
    console.error('Error fetching JSON:', error);
});
