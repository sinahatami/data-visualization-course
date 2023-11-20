function buildData(originalData) {
    const sankeyData = { nodes: [], links: [] };

    let states = []
    let cities = []
    let scientific_names = []
    originalData.forEach(a => {
        states.push(a.state)
        a.cities.forEach(city => {
            cities.push(city.name)
            city.scientific_names.forEach(scientific_name => {
                scientific_names.push(scientific_name.name)
            })
        })
    })
    
    let concatArray = states.concat(cities).concat(scientific_names)
    concatArray.forEach(c => sankeyData.nodes.push({name: c}))
    
    let nodes = sankeyData.nodes.reduce(function(a, b) {
      if (a.indexOf(b.name) < 0 ) a.push(b.name);
      return a;
    },[]);

    sankeyData.nodes = []
    nodes.forEach(a => {
      sankeyData.nodes.push({name: a})
    })

    originalData.forEach(a => {
        let state = a.state
        let city
        let scientific_name
        a.cities.forEach(b => {
            city = b.name
            sankeyData.links.push({ source: state, target: city, value: b.tree_count })
            b.scientific_names.forEach(c => {
                //console.log(a, b, c)
                scientific_name = c.name
                sankeyData.links.push({ source: city, target: scientific_name, value: c.count })
            })
        })
    })

    showAlluvialChart(sankeyData)
}

function showAlluvialChart(sankeyData) {
  console.log(sankeyData)
    graph=sankeyData

    var units = "counts";
 
    var margin = {top: 10, right: 10, bottom: 30, left: 10},
        width = 1200 - margin.left - margin.right,
        height = 904- margin.top - margin.bottom;
     
    var formatNumber = d3.format(",.0f"),    // zero decimal places
        format = function(d) { return formatNumber(d) + " " + units; },
        color = d3.scale.category20();
     
    // append the svg canvas to the page
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");
     
    // Set the sankey diagram properties
    var sankey = d3.sankey()
        .nodeWidth(36)
        .nodePadding(30)
        .size([width, height]);
     
    var path = sankey.link();

        
    
    var nodeMap = {};
    graph.nodes.forEach(function(x) { nodeMap[x.name] = x; });
    graph.links = graph.links.map(function(x) {
      return {
        source: nodeMap[x.source],
        target: nodeMap[x.target],
        value: x.value
      };
    });
 
  sankey
      .nodes(graph.nodes)
      .links(graph.links)
      .layout(32);
 
// add in the links
  var link = svg.append("g").selectAll(".link")
      .data(graph.links)
    .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .sort(function(a, b) { return b.dy - a.dy; });
 
// add the link titles
  link.append("title")
        .text(function(d) {
      	return d.source.name + " → " + 
                d.target.name + "\n" + format(d.value); });
 
  // add in the nodes
  var node = svg.append("g").selectAll(".node")
      .data(graph.nodes)
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { 
		  return "translate(" + d.x + "," + d.y + ")"; })
    .call(d3.behavior.drag()
      .origin(function(d) { return d; })
      .on("dragstart", function() { 
		  this.parentNode.appendChild(this); })
      .on("drag", dragmove));
 
  // add the rectangles for the nodes
  node.append("rect")
  .attr("height", function(d) { return Math.abs(d.dy); })  // Use Math.abs to ensure non-negative height
  .attr("width", sankey.nodeWidth())
  .style("fill", function(d) { return d.color = color(d.name.replace(/ .*/, "")); })
  .style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
  .append("title")
  .text(function(d) { return d.name + "\n" + format(d.value); });
 
// add in the title for the nodes
  node.append("text")
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) { return d.name; })
    .filter(function(d) { return d.x < width / 2; })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");
 
// the function for moving the nodes
  function dragmove(d) {
    d3.select(this).attr("transform", 
        "translate(" + (
        	   d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))
        	) + "," + (
                   d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
            ) + ")");
    sankey.relayout();
    link.attr("d", path);
  }
}

fetch('../../assets/clean_dataset/assignment2/scientific_names_top_shared.json')
    .then(response => response.json())
    .then(data => {
    // Process and work with the data from the JSON file    
    buildData(data)
})
.catch(error => {
  console.error('Error fetching JSON:', error);
});
