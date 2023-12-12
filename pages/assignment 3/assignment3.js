// This is what I need to compute kernel density estimation
function kernelDensityEstimator(kernel, X) {
    return function (V) {
        return X.map(function (x) {
            return [x, d3.mean(V, function (v) { return kernel(x - v); })];
        });
    };
}

function kernelEpanechnikov(k) {
    return function (v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}
var margin = { top: 60, right: 70, bottom: 70, left: 100 },
    width = 1000 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var yearDataAvg, yearDataMax, yearDataMin;

function lineChart(selectedDataset_1, selectedDataset_2, selectedDataset_3, selectedYears) {
    // append the svg object
    linechart_svg = d3.select("#linechart_1").append("svg")
        .attr("id", "linechart_svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Read the data
    Promise.all([
        d3.csv(selectedDataset_1),
        d3.csv(selectedDataset_2),
        d3.csv(selectedDataset_3)
    ]).then(function (datasets) {

        var dataAvg = datasets[0];
        var dataMax = datasets[1];
        var dataMin = datasets[2];

        var allMonths = Object.keys(dataAvg[0]).slice(2);
        var months = allMonths.slice(0, allMonths.length / 2);

        var minTemperature = d3.min(dataMin, function (d) {
            return d3.min(months, function (month) {
                return +d[month];
            });
        });

        var maxTemperature = d3.max(dataMax, function (d) {
            return d3.max(months, function (month) {
                return +d[month];
            });
        });

        var x = d3.scaleBand()
            .domain(months)
            .range([0, width])
            .padding(1);

        var y = d3.scaleLinear()
            .domain([minTemperature, maxTemperature])
            .range([height, 0]);

        linechart_svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("font-size", "14px");

        linechart_svg.append("g")
            .call(d3.axisLeft(y));

        // Add y-axis label
        linechart_svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 25 - margin.left)
            .attr("x", 10 - height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("temperature(celsius)");

        // Add x-axis label
        linechart_svg.append("text")
            .attr("y", 620)
            .attr("x", 400)
            .style("text-anchor", "middle")
            .text("month");

        var selectState = document.getElementById("dataset-dropdown");
        var stateName = selectState.options[selectState.selectedIndex].innerHTML;

        // Append a title to the SVG
        linechart_svg.append("text")
            .attr("x", width / 2)
            .attr("y", 0 - margin.top / 2)
            .attr("text-anchor", "middle")
            // .style("font-size", "20px")
            .text(`Temperature Data of ${stateName} state in ${selectedYears.join('|')} year/s`);

        selectedYears.forEach(function (selectedYear) {
            yearDataAvg = dataAvg.filter(function (d) { return +d.year === +selectedYear; });
            yearDataMax = dataMax.filter(function (d) { return +d.year === +selectedYear; });
            yearDataMin = dataMin.filter(function (d) { return +d.year === +selectedYear; });

            const color = getColorForYear(selectedYear);

            var lineMin = d3.line()
                .defined(function (d) { return !isNaN(d[1]); }) // Exclude NaN values from the line
                .x(function (d) { return x(d[0]); })
                .y(function (d) { return y(d[1]); });

            var filteredDataMin = months.map(function (month) {
                return [month, +yearDataMin[0][month]];
            }).filter(function (d) {
                return !isNaN(d[1]);
            });

            linechart_svg.append("path")
                .datum(filteredDataMin)
                .attr("class", "line-min-" + selectedYear)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 1.5)
                .attr("d", lineMin);

            var lineMax = d3.line()
                .defined(function (d) { return !isNaN(d[1]); }) // Exclude NaN values from the line
                .x(function (d) { return x(d[0]); })
                .y(function (d) { return y(d[1]); });

            var filteredDataMax = months.map(function (month) {
                return [month, +yearDataMax[0][month]];
            }).filter(function (d) {
                return !isNaN(d[1]);
            });

            linechart_svg.append("path")
                .datum(filteredDataMax)
                .attr("class", "line-max-" + selectedYear)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 1.5)
                .attr("d", lineMax);

            linechart_svg.selectAll(".circle-avg-" + selectedYear)
                .data(months.filter(function (month) {
                    return !isNaN(yearDataAvg[0][month]); // Filter out NaN values
                }))
                .enter().append("circle")
                .attr("class", "circle-avg-" + selectedYear)
                .attr("temperatureCelsius", function (d) { return yearDataAvg[0][d]; }) // Custom attribute for temperature
                .attr("temperatureFahrenheit", function (d) { return yearDataAvg[0][d + "F"]; })
                .attr("cx", function (d) { return x(d); })
                .attr("cy", function (d) { return y(yearDataAvg[0][d]); })
                .attr("r", 4)
                .style("fill", color)
                .on("mouseover", handleMouseOver)
                .on("mouseout", handleMouseOut);

            linechart_svg.selectAll(".circle-max-" + selectedYear)
                .data(months.filter(function (month) {
                    return !isNaN(yearDataMax[0][month]); // Filter out NaN values
                }))
                .enter().append("circle")
                .attr("class", "circle-max-" + selectedYear)
                .attr("temperatureCelsius", function (d) { return yearDataMax[0][d]; }) // Custom attribute for temperature
                .attr("temperatureFahrenheit", function (d) { return yearDataMax[0][d + "F"]; })
                .attr("cx", function (d) { return x(d); })
                .attr("cy", function (d) { return y(yearDataMax[0][d]); })
                .attr("r", 4)
                .style("fill", color)
                .on("mouseover", handleMouseOver)
                .on("mouseout", handleMouseOut);

            linechart_svg.selectAll(".circle-min-" + selectedYear)
                .data(months.filter(function (month) {
                    return !isNaN(yearDataMin[0][month]); // Filter out NaN values
                }))
                .enter().append("circle")
                .attr("class", "circle-min-" + selectedYear)
                .attr("temperatureCelsius", function (d) { return yearDataMin[0][d]; }) // Custom attribute for temperature
                .attr("temperatureFahrenheit", function (d) { return yearDataMin[0][d + "F"]; })
                .attr("cx", function (d) { return x(d); })
                .attr("cy", function (d) { return y(yearDataMin[0][d]); })
                .attr("r", 4)
                .style("fill", color)
                .on("mouseover", handleMouseOver)
                .on("mouseout", handleMouseOut);
        });
    });
}

function handleMouseOver(event, d) {
    // Show the tooltip
    tooltip.transition()
        .duration(200)
        .style("opacity", 1);

    // Tooltip content
    //const temperatureCelsius = getTemperatureCelsius(this);
    const temperatureCelsius = d3.select(this).attr("temperatureCelsius") + "°C";
    const temperatureFahrenheit = d3.select(this).attr("temperatureFahrenheit") + "°F";
    /*const data = d3.select(this).data()[0];
    const temperatureCelsius = data.value + "°C";
    const temperatureFahrenheit = data.valueF + "°F";*/
    tooltip.html(`${temperatureCelsius} / ${temperatureFahrenheit}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
}

function handleMouseOut() {
    // Hide the tooltip
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);
}

let tooltip = null
// Initial chart creation with the default dataset
setTimeout(() => {
    // Show the tooltip
    tooltip = d3.select("#linechart_1")
        .append("section")
        .attr("id", "linechart_tooltip")
        .attr("class", "tooltip");
    tooltip.transition()
        .duration(200)
        .style("opacity", 0);
    //lineChart("../../assets/clean_dataset/assignment3/AVG/AlabamaAVG.csv", "../../assets/clean_dataset/assignment3/MAX/AlabamaMAX.csv", "../../assets/clean_dataset/assignment3/MIN/AlabamaMIN.csv", [2000]);

    // Listen for changes in the dropdown selection
    document.getElementById("dataset-dropdown").addEventListener("change", function () {
        const selectedDataset_1 = "../../assets/clean_dataset/assignment3/AVG/" + this.value + "AVG.csv";
        const selectedDataset_2 = "../../assets/clean_dataset/assignment3/MAX/" + this.value + "MAX.csv";
        const selectedDataset_3 = "../../assets/clean_dataset/assignment3/MIN/" + this.value + "MIN.csv";

        // Select all checked checkboxes
        const checkedCheckboxes = document.querySelectorAll("#year-checkbox-form input:checked");

        // Extract values of checked checkboxes
        const selectedYears = Array.from(checkedCheckboxes).map(checkbox => checkbox.value);

        d3.select("#linechart_svg").remove();
        lineChart(selectedDataset_1, selectedDataset_2, selectedDataset_3, selectedYears);

        d3.select("#ridgeline_svg").remove();
        ridgeLine(selectedDataset_1, selectedDataset_2, selectedYears);
    });

    // Add an event listener for changes in the year dropdown
    document.getElementById("year-checkbox-form").addEventListener("change", function () {
        const selectedValue = document.getElementById("dataset-dropdown").value;

        // Select all checked checkboxes
        const checkedCheckboxes = document.querySelectorAll("#year-checkbox-form input:checked");

        // Extract values of checked checkboxes
        const selectedYears = Array.from(checkedCheckboxes).map(checkbox => checkbox.value);

        const selectedDataset_1 = "../../assets/clean_dataset/assignment3/AVG/" + selectedValue + "AVG.csv";
        const selectedDataset_2 = "../../assets/clean_dataset/assignment3/MAX/" + selectedValue + "MAX.csv";
        const selectedDataset_3 = "../../assets/clean_dataset/assignment3/MIN/" + selectedValue + "MIN.csv";

        d3.select("#linechart_svg").remove();
        lineChart(selectedDataset_1, selectedDataset_2, selectedDataset_3, selectedYears);

        d3.select("#ridgeline_svg").remove();
        ridgeLine(selectedDataset_1, selectedDataset_2, selectedYears);
    });
}, 1000);



function radarChart(selectedDataset_1, selectedDataset_2, selectedDataset_3, selectedYears) {
    var margin2 = { top: 60, right: 160, bottom: 70, left: 100 },
        width2 = 460 - margin2.left - margin2.right,
        height2 = 450 - margin2.top - margin2.bottom;
    // Read the data
    Promise.all([
        d3.csv(selectedDataset_1),
        d3.csv(selectedDataset_2),
        d3.csv(selectedDataset_3)
    ]).then(function (datasets) {

        var dataAvg = datasets[0];
        var dataMax = datasets[1];
        var dataMin = datasets[2];

        var allMonths = Object.keys(dataAvg[0]).slice(2);
        var months = allMonths.slice(0, allMonths.length / 2);

        var minTemperature = d3.min(dataMin, function (d) {
            return d3.min(months, function (month) {
                return +d[month];
            });
        });

        var maxTemperature = d3.max(dataMax, function (d) {
            return d3.max(months, function (month) {
                return +d[month];
            });
        });

        var selectState = document.getElementById("dataset-dropdown");
        var stateName = selectState.options[selectState.selectedIndex].innerHTML;
        var dataAll = [dataMin, dataAvg, dataMax]
        var name = ["radarchart_1", "radarchart_2", "radarchart_3"]

        // external_svg.append("text")
        //             .attr("x", width2 / 2)
        //             .attr("y", 0 - margin2.top / 2)
        //             .attr("text-anchor", "middle")
        //             .style("font-size", "20px")
        //             .style("text-decoration", "underline")
        //             .text(`Temperature Data for ${stateName} in ${selectedYears.join(', ')}`);

        for (let i = 0; i < 3; i++) {

            // Append the svg object
            var svg = d3.select("#" + name[i]).append("svg")
                .attr("id", name[i] + "_svg")
                .attr("width", width2 + margin2.left + margin2.right)
                .attr("height", height2 + margin2.top + margin2.bottom)
                .append("g")
                .attr("transform", `translate(${margin2.left},${margin2.top})`);

            // Define the angles for each data point
            var radialScale = d3.scaleLinear()
                .domain([d3.min([0, minTemperature]), maxTemperature])
                .range([0, 150]);

            var ticks = [minTemperature, 0, maxTemperature];

            // Add circles
            svg.selectAll("circle")
                .data(ticks)
                .join(
                    enter => enter.append("circle")
                        .attr("cx", width2 / 2)
                        .attr("cy", height2 / 2)
                        .attr("fill", "none")
                        .attr("stroke", "black")
                        .attr("r", d => radialScale(d))
                );

            // Add text labels for ticks
            svg.selectAll(".ticklabel")
                .data(ticks)
                .join(
                    enter => enter.append("text")
                        .attr("class", "ticklabel")
                        .attr("x", width2 / 2 - 8)
                        .attr("y", (d, i) => height2 / 2 + (i == 2 ? -radialScale(ticks[i]) - 2 : radialScale(ticks[i]) + 8))
                        .style("font-size", "10px")
                        .text((d, i) => (i == 1 && ticks[i - 1] > 0 ? "" : d.toString()))
                );

            // Create a function angle to coordinate
            function angleToCoordinate(angle, value) {
                var x = Math.cos(angle) * radialScale(value);
                var y = Math.sin(angle) * radialScale(value);
                return { "x": width2 / 2 + x, "y": height2 / 2 - y };
            }

            var featureData = months.map((m, i) => {
                var angle = (Math.PI / 2) + (2 * Math.PI * i / months.length);
                return {
                    "name": m,
                    "angle": angle,
                    "line_coord": angleToCoordinate(angle, maxTemperature),
                    "label_coord": angleToCoordinate(angle, maxTemperature + 6)
                };
            });

            // Draw axis lines
            svg.selectAll("line")
                .data(featureData)
                .join(
                    enter => enter.append("line")
                        .attr("x1", width2 / 2)
                        .attr("y1", height2 / 2)
                        .attr("x2", d => d.line_coord.x)
                        .attr("y2", d => d.line_coord.y)
                        .attr("stroke", "gray")
                        .attr("stroke-opacity", 0.3)
                );

            // Draw axis labels
            svg.selectAll(".axislabel")
                .data(featureData)
                .join(
                    enter => enter.append("text")
                        .attr("x", d => d.label_coord.x - 13)
                        .attr("y", d => d.label_coord.y + 5)
                        .text(d => d.name)
                );

            // Plotting the data
            var line = d3.line()
                .x(d => d.x)
                .y(d => d.y);

            function getPathCoordinates(data_point) {
                var coordinates = [];
                for (var i = 0; i < months.length; i++) {
                    var months_name = months[i];
                    if (!isNaN(data_point[months_name])) {
                        var angle = (Math.PI / 2) + (2 * Math.PI * i / months.length);
                        coordinates.push(angleToCoordinate(angle, data_point[months_name]));
                    }
                }
                coordinates.push(angleToCoordinate((Math.PI / 2) + (2 * Math.PI), data_point["Jan"]));
                return coordinates;
            }

            var selectedColors = [];

            function handleLegendClick(clickedYear) {

                // Check if the clicked color is already selected
                const index = selectedColors.indexOf(clickedYear);

                // If selected, remove it; otherwise, add it
                if (index !== -1) {
                    selectedColors.splice(index, 1);
                } else {
                    selectedColors.push(clickedYear);
                }

                // Update the visualization based on the selected colors
                updateVisualization(selectedColors);

                // Update the legend styles
                updateLegendStyles();
            }

            function updateVisualization(selectedColors) {

                const allYears = selectedYears.map(String);

                allYears.forEach(year => {
                    const isClicked = selectedColors.includes(year);
                    const displayStyle = isClicked || selectedColors.length === 0 ? null : "none";
                    const circles = d3.selectAll(`.circle-avg-${year}, .circle-max-${year}, .circle-min-${year}`);
                    const maxLines = d3.selectAll(`.line-max-${year}`);
                    const minLines = d3.selectAll(`.line-min-${year}`);
                    const avgLines = d3.selectAll(`.line-avg-${year}`);
                    const legendText = d3.selectAll(`.legend-text-${year}`);

                    circles.style("display", displayStyle);
                    maxLines.style("display", displayStyle);
                    minLines.style("display", displayStyle);
                    avgLines.style("display", displayStyle);
                    // legendText.style("font-weight", isClicked ? "bold" : "normal");

                });
            }

            function updateLegendStyles() {
                const keys = Object.keys(used_colours);
                const isColorsEmpty = selectedColors.length === 0;
                const isColorsFull = selectedColors.length === selectedYears.length;

                keys.forEach(key => {
                    const color = used_colours[key];
                    const isClicked = selectedColors.includes(key);

                    d3.selectAll(`.legend-rect-${key}`)
                        .style("fill", isClicked || isColorsEmpty ? color : "white")
                        .style("stroke", color);

                    //        d3.selectAll(`.legend-text-${key}`)
                    //        .style("font-weight", isClicked && !isColorsFull ? "bold" : "normal");
                });

                if (isColorsFull) selectedColors = [];
            }

            // Colours that are used
            var used_colours = {}

            var data = [];
            selectedYears.forEach(function (selectedYear) {
                yearData = dataAll[i].filter(function (d) { return +d.year === +selectedYear; });
                var point = {}
                months.forEach(m => point[m] = yearData[0][m]);
                data.push(point);

                // Draw paths and circles with the same color for each data point
                svg.selectAll("g")
                    .data(data)
                    .enter()
                    .append("g")
                    .each(function (d, i) {
                        const color = getColorForYear(selectedYear);
                        used_colours[selectedYear] = color;
                        const pathData = getPathCoordinates(d);

                        // Draw path element
                        d3.select(this)
                            .append("path")
                            .attr("class", function () { return (i == 0 ? "line-min-" : i == 1 ? "line-avg-" : "line-max-") + selectedYear })
                            .attr("d", line(pathData))
                            .attr("stroke", color)
                            .attr("fill", "none")
                            .attr("stroke-opacity", 1);

                        // Draw circles for data points
                        d3.select(this)
                            .selectAll("circle")
                            .data(Object.values(d))
                            .enter()
                            .filter(dp => !isNaN(dp)) // Filter out NaN values
                            .append("circle")
                            .attr("class", function () { return (i == 0 ? "circle-min-" : i == 1 ? "circle-avg-" : "circle-max-") + selectedYear })
                            .attr("temperatureCelsius", function (d) { return d; }) // Custom attribute for temperature
                            .attr("temperatureFahrenheit", function (d, i) { return yearData[0][months[i] + "F"]; })
                            .attr("cx", function (dp, j) {
                                const angle = (Math.PI / 2) + (2 * Math.PI * j / months.length);
                                return width2 / 2 + Math.cos(angle) * radialScale(dp);
                            })
                            .attr("cy", function (dp, j) {
                                const angle = (Math.PI / 2) + (2 * Math.PI * j / months.length);
                                return height2 / 2 - Math.sin(angle) * radialScale(dp);
                            })
                            .attr("r", 4) // Adjust the radius of the circles as needed
                            .attr("fill", color) // Use the same color for circles
                            .on("mouseover", handleMouseOver)
                            .on("mouseout", handleMouseOut);
                    });
            });

            if (i == 2) {
                var radarchart_legend = svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(20,20)");

                var linechart_legend = linechart_svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(20,20)");

                var keys = Object.keys(used_colours); // Get keys from the dictionary

                keys.forEach(function (key, j) {
                    var color = used_colours[key]; // Get color value for the key

                    radarchart_legend.append("rect")
                        .attr("class", `legend-rect-${key}`)
                        .attr("x", width2 + 90) // 100
                        .attr("y", j * 20)
                        .attr("width", 10)
                        .attr("height", 10)
                        .attr("fill", color)
                        .on("click", () => handleLegendClick(key))
                        .style("cursor", "pointer");

                    radarchart_legend.append("text")
                        .attr("x", width2 + 105) // 85
                        .attr("y", j * 20 + 9)
                        .attr("class", "legend-text-" + key)
                        .text(key) // Display the key associated with the color
                        .style("font-size", "12px");

                    linechart_legend.append("rect")
                        .attr("class", `legend-rect-${key}`)
                        .attr("x", width)
                        .attr("y", j * 20)
                        .attr("width", 10)
                        .attr("height", 10)
                        .attr("fill", color)
                        .on("click", () => handleLegendClick(key))
                        .style("cursor", "pointer");

                    linechart_legend.append("text")
                        .attr("x", width + 15)
                        .attr("y", j * 20 + 9)
                        .attr("class", "legend-text-" + key)
                        .text(key) // Display the key associated with the color
                        .style("font-size", "12px");
                });
            }
        };
    });
}


function handleMouseOverLinechart(event, d) {
    // Show the tooltip
    tooltip.transition()
        .duration(200)
        .style("opacity", 1);

    // Tooltip content
    const temperatureCelsius = d3.select(this).attr("temperatureCelsius") + "°C";
    const temperatureFahrenheit = d3.select(this).attr("temperatureFahrenheit") + "°F";
    tooltip.html(`${temperatureCelsius} | ${temperatureFahrenheit}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
}

function handleMouseOutLinechart() {
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);
}

function handleMouseOverRadar(event, d) {
    // Show the tooltip
    tooltip.transition()
        .duration(200)
        .style("opacity", 1);

    // Tooltip content
    const temperatureCelsius = d3.select(this).attr("temperatureCelsius") + "°C";
    const temperatureFahrenheit = d3.select(this).attr("temperatureFahrenheit") + "°F";
    tooltip.html(`Temperature: ${temperatureCelsius} / ${temperatureFahrenheit}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
}

function handleMouseOutRadar() {
    // Hide the tooltip
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);
}

function ridgeLine(selectedDataset_1, selectedDataset_2, selectedYears) {

    // append the svg object
    var svg = d3.select("#ridgeline_1").append("svg")
        .attr("id", "ridgeline_svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Read the data
    Promise.all([
        d3.csv(selectedDataset_1),
        d3.csv(selectedDataset_2)
    ]).then(function (datasets) {

        var dataMax = datasets[0];
        var dataMin = datasets[1];

        var allMonths = Object.keys(dataMax[0]).slice(2);
        var months = allMonths.slice(0, allMonths.length / 2);

        var minTemperature = d3.min(dataMin, function (d) {
            return d3.min(months, function (month) {
                return +d[month];
            });
        });

        var maxTemperature = d3.max(dataMax, function (d) {
            return d3.max(months, function (month) {
                return +d[month];
            });
        });

        var selectState = document.getElementById("dataset-dropdown");
        var stateName = selectState.options[selectState.selectedIndex].innerHTML;

        var thresholds = d3.ticks(...d3.nice(...[minTemperature, maxTemperature], 2), 12);

        // Append a title to the SVG
        // svg.append("text")
        //     .attr("x", width / 2)
        //     .attr("y", 0 - 15 - margin.top / 2)
        //     .attr("text-anchor", "middle")
        //     .style("font-size", "20px")
        //     .style("text-decoration", "underline")
        //     .text(`Temperature Data for ${stateName} in ${selectedYears.join(', ')}`);

        // Add X axis
        var x = d3.scaleLinear()
            .domain([d3.min(thresholds), d3.max(thresholds)])
            .range([0, width]);

        svg.append("g")
            .attr("class", "xAxis primary")
            .attr("transform", "translate(0," + height + ")")
            .attr("stroke", "green")
            .attr("stroke-opacity", 1)
            .call(d3.axisBottom(x).tickValues([minTemperature, maxTemperature]).tickSize(-height).tickFormat(d3.format(".1f")))
            .selectAll(".tick line") // Selecting all tick lines
            .attr("stroke", "green"); // Changing the tick color to green

        // Removing the domain line separately after the axis is created
        svg.select(".xAxis.primary")
            .select(".domain").remove();

        // Move the tick text above the tick line
        svg.select(".xAxis.primary")
            .selectAll(".tick text")
            .attr("y", -height)
            .attr("dy", "-0.71em");

        svg.append("g")
            .attr("class", "xAxis secondary")
            .attr("transform", "translate(0," + height + ")")
            .attr("stroke", "gray")
            .attr("stroke-opacity", 0.3)
            .call(d3.axisBottom(x).tickValues(thresholds).tickSize(-height))
            .select(".domain").remove();

        // Add X axis label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width / 2) // 150
            .attr("y", height + 40)
            .text("temperature(celsius)");

        // Create a Y scale for densities
        var y = d3.scaleLinear()
            .domain([0, 1])
            .range([height, 0]);

        // Create the Y axis for names
        var yName = d3.scaleBand()
            .domain(selectedYears)
            .range([0, height])
            .paddingInner(1)

        var midY = (yName.range()[0] + yName.range()[1]) / 2;

        var allDensity = [];

        selectedYears.forEach(function (selectedYear) {

            yearDataMax = dataMax.filter(function (d) { return +d.year === +selectedYear; });
            yearDataMin = dataMin.filter(function (d) { return +d.year === +selectedYear; });

            arrayDataMax = []
            months.forEach(function (month) { arrayDataMax.push(+yearDataMax[0][month]) });

            arrayDataMin = []
            months.forEach(function (month) { arrayDataMin.push(+yearDataMin[0][month]) });

            // Compute kernel density estimation for each column
            densityMax = kernelDensityEstimator(kernelEpanechnikov(1), thresholds, arrayDataMax)
            densityMin = kernelDensityEstimator(kernelEpanechnikov(1), thresholds, arrayDataMin)
            allDensity.push({ key: selectedYear, densityMax: densityMax, densityMin: densityMin, colorMax: '#FF0000', colorMin: '#0000FF' });
        });

        svg.selectAll("lines")
            .data(allDensity)
            .join("g") // Create a group for each data point
            .attr("transform", function (d) {
                var distanceFromMid = yName(d.key) - midY;
                var translation = midY + (distanceFromMid * 0.8);
                return `translate(0, ${translation - height})`;
            })
            .call(g => {
                g.append("line")
                    .attr("x1", 0)
                    .attr("x2", width)
                    .attr("y1", y(0))
                    .attr("y2", y(0))
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1);

                // Append text labels to the left of each line
                g.append("text")
                    .attr("x", -5) // Adjust the x position for the text
                    .attr("y", y(0)) // Align text vertically with the line
                    .attr("dy", "0.35em") // Fine-tune vertical alignment
                    .attr("text-anchor", "end") // Align text to the end of the label
                    .text(function (d) {
                        // Provide the label content here
                        return d.key;
                    });
            });

        // Add areas with modified translation
        svg.selectAll("areas")
            .data(allDensity)
            .join("path")
            .attr("transform", function (d) {
                var distanceFromMid = yName(d.key) - midY;
                var translation = midY + (distanceFromMid * 0.8);
                return `translate(0, ${translation - height})`;
            })
            .attr("fill", function (d) { return `${d.colorMax}80`; })
            .datum(function (d) { return d.densityMax; })
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .curve(d3.curveBasis)
                .x(function (d) { return x(d[0]); })
                .y(function (d) { return y(d[1]); })
            );

        svg.selectAll("areas")
            .data(allDensity)
            .join("path")
            .attr("transform", function (d) {
                var distanceFromMid = yName(d.key) - midY;
                var translation = midY + (distanceFromMid * 0.8);
                return `translate(0, ${translation - height})`;
            })
            .attr("fill", function (d) { return `${d.colorMin}80`; })
            .datum(function (d) { return d.densityMin; })
            .attr("stroke", "blue")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .curve(d3.curveBasis)
                .x(function (d) { return x(d[0]); })
                .y(function (d) { return y(d[1]); })
            );
    });
}

// Listen for changes in the dropdown selection

document.addEventListener("DOMContentLoaded", function (event) {
    lineChart("../../assets/clean_dataset/assignment3/AVG/AlabamaAVG.csv", "../../assets/clean_dataset/assignment3/MAX/AlabamaMAX.csv", "../../assets/clean_dataset/assignment3/MIN/AlabamaMIN.csv", [2010]);
    // Initial chart creation with the default dataset
    radarChart("../../assets/clean_dataset/assignment3/AVG/LouisianaAVG.csv", "../../assets/clean_dataset/assignment3/MAX/LouisianaMAX.csv", "../../assets/clean_dataset/assignment3/MIN/LouisianaMIN.csv", ['2020']);
    d3.select("#ridgeline_svg").remove();
    ridgeLine("../../assets/clean_dataset/assignment3/AVG/AlabamaAVG.csv", "../../assets/clean_dataset/assignment3/MAX/AlabamaMAX.csv", [2010, 2010]);
});

const distinctColors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
    '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5',
    '#393b79', '#e57171', '#4caf50', '#d32f2f', '#2196f3',
    '#ff5722', '#795548', '#9c27b0', '#607d8b', '#3f51b5',
    '#009688', '#8bc34a', '#ff4081', '#00bcd4', '#e91e63',
    '#ffc107', '#03a9f4', '#673ab7', '#ffeb3b', '#8d6e63',
    '#ff5252', '#8e24aa', '#ff9800', '#00e676', '#18ffff',
    '#304ffe', '#f50057', '#dd2c00', '#ff3d00', '#00b8d4'
];


function getColorForYear(year) {
    // You can use modulo to cycle through the colors
    const index = year % 50;
    return distinctColors[index];
}
