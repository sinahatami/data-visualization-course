const myColors = [
    "Black",
    "LightSeaGreen",
    "MediumSlateBlue",
    "Green",
    "DarkKhaki",
    "PaleVioletRed",
    "IndianRed",
    "ForestGreen",
    "CadetBlue",
    "RosyBrown",
    "DimGray",
];

function dot_plot(is_multiple, canvas_name) {
    let base_radius = 2;
    var width = window.innerWidth * 0.9,
        height = 0.6 * width;

    // Load GeoJSON data and display the map
    Promise.all([
        d3v5.csv("../../assets/clean_dataset/assignment4/result.csv"),
        d3v5.json("../../assets/clean_dataset/assignment4/usaRegs.json")
    ]).then(function (results) {
        const data = results[0];
        const world = results[1];

        const canvas = d3v5.select(canvas_name)
            .attr("width", width)
            .attr("height", height);

        const context = canvas.node().getContext("2d");

        var allYears = Object.keys(data[0]).slice(1);

        if (is_multiple) {
            const legendWidth = 120;
            const legendHeight = myColors.length * 20;
            const legendX = 10;
            const legendY = 10;

            context.save();
            context.fillStyle = "rgba(0, 0, 0, 0.002)";
            context.fillRect(legendX, legendY, legendWidth, legendHeight);

            let legendItems = [];
            myColors.forEach((color, i) => {
                const dotX = legendX + 10;
                const dotY = legendY + 10 + i * 20;

                legendItems.push({
                    color: color,
                    dotX: dotX,
                    dotY: dotY,
                    labelX: dotX + 10,
                    labelY: dotY + 4,
                    year: allYears[i]
                });
            });

            legendItems.forEach(item => {
                context.beginPath();
                context.fillStyle = item.color;
                context.fillRect(item.dotX, item.dotY, 5, 5);

                context.font = "13px sans-serif";
                context.fillStyle = "black";
                context.fillText(item.year, item.labelX, item.labelY);
            });

            context.restore();
        }

        const projection = d3v5.geoAlbersUsa()
            .scale(width)
            .translate([width / 2, height / 2]);

        const path = d3v5.geoPath().projection(projection).context(context);
        const path_ = d3v5.geoPath().projection(projection);

        world.features.forEach(function (feature) {
            let state = data.find(d => d.state === feature.properties.name);

            if (state) {
                context.beginPath();
                path(feature);
                context.lineWidth = 0.7;
                context.strokeStyle = "black";
                context.stroke();
            }
        });

        world.features.forEach(function (feature) {
            feature.properties.area = path_.area(feature);
            feature.properties.bounds = path_.bounds(feature);
        });

        let max_trees = d3v5.max(data, d => d3v5.sum(Object.values(d).slice(1).map(el => +el)));
        let max_state_area = d3v5.max(world.features, d => d.properties.area);

        world.features.forEach(function (feature) {
            context.save()
            context.beginPath();
            path(feature);
            context.clip()

            let x = feature.properties.bounds[0][0]
            let y = feature.properties.bounds[0][1]
            let w = feature.properties.bounds[1][0] - x
            let h = feature.properties.bounds[1][1] - y

            let state = data.find(d => d.state === feature.properties.name);

            if (state) {
                let stateValues = Object.values(state).slice(1).map(el => +el);
                let relative_tree_count = d3v5.sum(stateValues) / max_trees;
                let relative_state_area = feature.properties.area / max_state_area;
                let state_box_area = w * h;

                let real_density = relative_tree_count / relative_state_area;
                let box_density = real_density;
                let radius = base_radius / Math.sqrt(box_density);

                let points = createPoints(w, h, radius);
                points.forEach(d => {
                    d[0] += x;
                    d[1] += y;
                });

                points.forEach(d => {
                    context.beginPath();
                    context.fillStyle = is_multiple ? myColors[getRandomMultinomial(stateValues)] : "black";
                    context.fillRect(d[0], d[1], 2, 2);
                });

            }
            context.restore()
        });

        function getRandomMultinomial(odds) {
            const total_odds = d3v5.sum(odds)
            let probs = odds.map(d => d / total_odds)
            const rand = Math.random();
            let cumulative_prob = 0;
            for (let i = 0; i < probs.length; i++) {
                cumulative_prob += probs[i];
                if (rand <= cumulative_prob) {
                    return i;
                }
            }
        }
    });


    function createPoints(width, height, radius) {
        var sample = poissonDiscSampler(width, height, radius);
        for (var data = [], d; d = sample();) {
            data.push(d);
        }
        return data;
    }

    function poissonDiscSampler(width, height, radius) {
        var k = 30,
            radius2 = radius * radius,
            R = 3 * radius2,
            cellSize = radius * Math.SQRT1_2,
            gridWidth = Math.ceil(width / cellSize),
            gridHeight = Math.ceil(height / cellSize),
            grid = new Array(gridWidth * gridHeight),
            queue = [],
            queueSize = 0,
            sampleSize = 0;

        return function () {
            if (!sampleSize) return sample(Math.random() * width, Math.random() * height);

            while (queueSize) {
                var i = Math.random() * queueSize | 0,
                    s = queue[i];

                for (var j = 0; j < k; ++j) {
                    var a = 2 * Math.PI * Math.random(),
                        r = Math.sqrt(Math.random() * R + radius2),
                        x = s[0] + r * Math.cos(a),
                        y = s[1] + r * Math.sin(a);

                    if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) return sample(x, y);
                }

                queue[i] = queue[--queueSize];
                queue.length = queueSize;
            }
        };

        function far(x, y) {
            var i = x / cellSize | 0,
                j = y / cellSize | 0,
                i0 = Math.max(i - 2, 0),
                j0 = Math.max(j - 2, 0),
                i1 = Math.min(i + 3, gridWidth),
                j1 = Math.min(j + 3, gridHeight);

            for (j = j0; j < j1; ++j) {
                var o = j * gridWidth;
                for (i = i0; i < i1; ++i) {
                    if (s = grid[o + i]) {
                        var s,
                            dx = s[0] - x,
                            dy = s[1] - y;
                        if (dx * dx + dy * dy < radius2) return false;
                    }
                }
            }

            return true;
        }

        function sample(x, y) {
            var s = [x, y];
            queue.push(s);
            grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;
            ++sampleSize;
            ++queueSize;
            return s;
        }
    }
}


function choropleth(data) {
    var width = 960;
    var height = 500;

    // d3v5 Projection
    var projection = d3v5.geoAlbersUsa()
        .translate([width / 2, height / 2]) // translate to center of screen
        .scale([1000]); // scale things down so see entire US

    // Define path generator
    var path = d3v5.geoPath() // path generator that will convert GeoJSON to SVG paths
        .projection(projection); // tell path generator to use albersUsa projection

    //Create SVG element and append map to the SVG
    var svg = d3v5.select("#ChoroplethMapsContainer")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var dataArray = [];
    for (var d = 0; d < data.length; d++) {
        dataArray.push(data[d].totalTrees)
    }
    var minVal = d3v5.min(dataArray)
    var maxVal = d3v5.max(dataArray)
    var ramp = d3v5.scaleSequential(d3v5.interpolatePuBuGn)
        .domain([0, maxVal]);

    // Load GeoJSON data and merge with states data
    d3v5.json("../../assets/clean_dataset/assignment4/usaRegs.json").then(function (json) {

        // Loop through each state data value in the .csv file
        for (var i = 0; i < data.length; i++) {

            // Grab State Name
            var dataState = data[i].name;

            // Grab data value 
            var dataValue = data[i].totalTrees;

            var Area = data[i].totalArea;

            // Find the corresponding state inside the GeoJSON
            for (var j = 0; j < json.features.length; j++) {
                var jsonState = json.features[j].properties.name;

                if (dataState == jsonState) {

                    // Copy the data value into the JSON
                    json.features[j].properties.totalTrees = dataValue;
                    json.features[j].properties.totalArea = Area;

                    // Stop looking through the JSON
                    break;
                }
            }
        }

        var tooltip = d3v5.select("#ChoroplethMapsContainer")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background-color", "lightgreen")
            .style("color", "black")
            .style("border", "solid")
            //     .style("border-width", "1px")
            //   .style("border-radius", "5px")
            .style("padding", "2px");

        let mouseOver = function (d) {
            getArea = +(this.__data__.properties.totalArea);
            d3v5.selectAll(".state")
                .transition()
                .style("opacity", .6)
            d3v5.select(this)
                .transition()
                .style("opacity", 1)
                .style("stroke", "red")
            /// console.log(this);
            tooltip.style("opacity", 1)
                .html("<b>" + this.__data__.properties.name + "</b><br/>Total Area: " + getArea.toFixed(2) + " m<sup>2</sup><br/>Total Trees: " + this.__data__.properties.totalTrees)
                .style("left", (d3v5.event.pageX - 50) + "px")
                .style("top", (d3v5.event.pageY - 100) + "px");
        }

        let mouseLeave = function (d) {
            d3v5.selectAll(".state")
                .transition()
                .duration(200)
                .style("opacity", 1)
            d3v5.select(this)
                .style("stroke", "black")
                .transition()
                .duration(200)
                .style("stroke", "transparent")
            tooltip.style("opacity", 0);
        }

        // Bind the data to the SVG and create one path per GeoJSON feature
        svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("stroke", "#fff")
            .style("stroke-width", "1")
            .style("fill", function (d) { return ramp(d.properties.totalTrees) })
            .attr("class", function (d) { return "state" })
            .on("mouseover", mouseOver)
            .on("mouseleave", mouseLeave);

        // add a legend
        var w = 140, h = 300;

        var key = d3v5.select("#ChoroplethMapsContainer")
            .append("svg")
            .attr("width", w)
            .attr("height", h)
            .attr("class", "legend");

        var legendScale = d3v5.scaleSequential(d3v5.interpolatePuBuGn)
            .domain([0, maxVal]);

        var legend = key.append("defs")
            .append("svg:linearGradient")
            .attr("id", "gradient")
            .attr("x1", "100%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");

        legend.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", legendScale(maxVal))
            .attr("stop-opacity", 1);

        legend.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", legendScale(0))
            .attr("stop-opacity", 1);

        key.append("rect")
            .attr("width", w - 100)
            .attr("height", h)
            .style("fill", "url(#gradient)")
            .attr("transform", "translate(0,10)");

        var y = d3v5.scaleLinear()
            .range([h, 0])
            .domain([minVal, maxVal]);

        var yAxis = d3v5.axisRight(y);

        key.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(41,10)")
            .call(yAxis)
    });
}

document.addEventListener("DOMContentLoaded", function (event) {
    dot_plot(false, "#map_dot");
    dot_plot(true, "#map_dot_multiple");
    // Load in my states data!
    d3v5.csv("../../assets/clean_dataset/assignment4/State_Level_data.csv").then(function (data) {
        choropleth(data)
    })
    // Promise.all([
    //     d3.csv("../../assets/clean_dataset/assignment4/result.csv").then(data => data.map(d => ({ ...d, rate: +d.rate }))),
    //     d3.json("../../assets/clean_dataset/assignment4/us.json")
    // ])
    //     .then(([unemployment, us]) => {
    //         const counties = topojson.feature(us, us.objects.counties);
    //         const states = topojson.feature(us, us.objects.states);
    //         const statemap = new Map(states.features.map(d => [d.id, d]));
    //         const statemesh = topojson.mesh(us, us.objects.states, (a, b) => a !== b)
    //         const chart_map = Choropleth(unemployment, {
    //             id: d => d.id,
    //             value: d => d.rate,
    //             scale: d3.scaleQuantize,
    //             domain: [1, 284739],
    //             range: d3.schemePuBuGn[9],
    //             title: (f, d) => ` ${statemap.get(f.id.slice(0, 2)).properties.name}\n${d?.rate}`,
    //             features: states,
    //             borders: statemesh,
    //             width: 975,
    //             height: 610,
    //         })
    //         const chartMapContainer = document.getElementById('chart_map');
    //         chartMapContainer.appendChild(chart_map);
    //     })
});

