function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1, //ems
            y = text.attr("y"),
            x = text.attr("x"),
            dy = parseFloat(text.attr("dy")) || 0,
            tspan = text.text(null).append('tspan').attr("x", x).attr("y", y).attr("dy", dy + "em");
        while(word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

function redrawSVG(dataset) {
    //Data Headers
    //agency: data["Agency Name"],
    //avgCostVar: data["Avg. Cost Variance(%)"],
    //avgScheduleVar: data["Avg. Scedule Variance(%)"],
    //avgCost: data["Avg. Project Cost ($ M)"],
    //totalProjects: data["Projects Number"],
    //avgLifecycleCost: data["Avg. Lifecycle Cost ($ M)"]

    d3.selectAll("svg").remove();
    d3.select(".point-tooltip").remove();

    var tooltipScaleWidth = 120;
    var tooltipScaleHeight = 20;
    var tooltipPadding = 5;
    var maxCost = d3.max(dataset, function(d) { return +d["Avg. Project Cost ($ M)"]; } );
    var minCost = d3.min(dataset, function(d) { return +d["Avg. Project Cost ($ M)"]; } );
    var maxProject = d3.max(dataset, function(d) { return +d["Projects Number"]; } );
    var minProject = d3.min(dataset, function(d) { return +d["Projects Number"]; } );
    var colour = d3.scaleLinear().domain([minCost, maxCost]).range([d3.rgb("#e6b3ff"), d3.rgb("#b31aff"), d3.rgb("#550080")]);
    var borderColour = d3.scaleLinear().domain([minCost, maxCost]).range([d3.rgb("#dd99ff"), d3.rgb("#aa00ff"), d3.rgb("#440066")]);

    
    var width = 0.6*window.innerWidth >=400? 0.6*window.innerWidth: 400;
    var height = 600;
    var margin = {
        top: 30,
        right: 30,
        bottom: 30,
        left: 30
    }
    var legendWidth = 0.15*window.innerWidth >= 300? 0.15*window.innerWidth: 300;
    var legendHeight = 600;
    var legendMargin = {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
    }

    var svgParent = d3.select('main').append('svg')
    .attr('width', width + legendWidth + margin.left + margin.right + legendMargin.left + legendMargin.right)
    .attr('height', height + margin.top + margin.bottom)

    var svg = svgParent
    .append("g")
    .attr('width', width + margin.right)
    .attr('transform', 'translate('+margin.left+','+margin.top+')')
    var x = d3.scaleLinear().domain([-58, 10]).range([0, width]);
    var y = d3.scaleLinear().domain([-50, 15]).range([height, 0]);
    
    //Axis and labels
    svg.append("g").attr("class", "x-axis").attr("transform", "translate(0, "+ y(0) +")")
    .call(d3.axisBottom(x));
    
    svg.append("text")
    .attr('class', 'x-axis-label')            
    .attr("transform", "translate("+ (width + margin.left/2) + "," + y(0) + ")rotate(90)")
    .style("text-anchor", "middle")
    .text("Avg. Scedule Variance(%)");

    svg.append("g").attr("class", "y-axis").attr("transform", "translate("+ x(0) +", 0)").call(d3.axisLeft(y));

    svg.append("text")
    .attr('class', 'y-axis-label')             
    .attr("transform", "translate(" + x(0) + " ," + -10 + ")")
    .style("text-anchor", "middle")
    .text("Avg. Cost Variance(%)");

    svg.append("text").text("In Time & In Budget")
    .attr('id', 'in-time-in-budget')
    .attr('class','quarter-label')
    .attr('x', (x(0) + x(10))/2)
    .attr('y', (y(0) + y(20))/2)
    .attr("font-size", "12")

    svg.append("text").text("Out of Time & In Budget")
    .attr('id', 'out-time-in-budget')
    .attr('class','quarter-label')
    .attr('x', (x(0) + x(-20))/2)
    .attr('y', (y(0) + y(20))/2)
    .attr("font-size", "12")

    svg.append("text").text("In Time & Out of Budget")
    .attr('id', 'in-time-out-budget')
    .attr('class','quarter-label')
    .attr('x', (x(0) + x(10))/2)
    .attr('y', (y(0) + y(-20))/2)
    .attr("font-size", "12")

    svg.append("text").text("Late & Out of Budget")
    .attr('id', 'out-time-out-budget')
    .attr('class','quarter-label')
    .attr('x', (x(0) + x(-20))/2)
    .attr('y', (y(0) + y(-20))/2)
    .attr("font-size", "12")   

    svg.selectAll(".quarter-label").call(wrap, 50)

    //Data drawing
    var point = svg.selectAll(".point").data(dataset).enter().append("g");
    
    //Group events
    d3.selection.prototype.moveToFront = function() {
        return this.each(function() {
            this.parentNode.appendChild(this);
        })
    }

    //Circles
    point.append("circle").attr("class", "point")
    .attr("id", function(d) {
        return d["Agency Name"];
    })
    .attr("cy", function(d) {
        return y(d["Avg. Cost Variance(%)"]);
    }).attr("cx", function(d) {
        return x(d["Avg. Scedule Variance(%)"]);
    }).attr("r", function(d) {
        return Math.sqrt(d["Projects Number"]/Math.PI) * 5;
    }).attr("stroke", function(d) {
        return borderColour(d["Avg. Project Cost ($ M)"]);
    })
    .attr("stroke-width", 5)
    .attr("fill", function(d) {
        return colour(d["Avg. Project Cost ($ M)"]);
    }).attr("opacity", 0.8)
    .on('mouseover', function(d) {
        d3.select(this).attr('r', function(d) {
            return Math.sqrt(d["Projects Number"]/Math.PI) * 5 * 1.2;
        }).attr("opacity", 1);
        //position tooltip
        tooltip.transition()
            .duration(200)
            .style("opacity", 1);
        tooltip.style("left", ((+d3.select(this).attr('cx')) +  100)+ "px")
            .style("top", (+d3.select(this).attr('cy') - 100) + "px")

        //transform project cost index
        var dCost = ((maxCost - minCost) - (maxCost - d["Avg. Project Cost ($ M)"])) / (maxCost - minCost);
        var indexTransform = (dCost ? (dCost === 1? (tooltipScaleWidth - 1.3*tooltipPadding): tooltipScaleWidth*dCost): 1.3*tooltipPadding);
        d3.select("#cost-index").attr('transform', 'translate('+indexTransform+',0)');
        d3.select(".cost-value").text((+d["Avg. Project Cost ($ M)"]).toFixed(2))
        d3.select(".point-tooltip-title").html(d["Agency Name"]);
        d3.select(".project-number").html("Number of projects: " + d["Projects Number"])
    })
    .on("mouseout", function(d) {
        d3.select(this).attr('r', function(d) {
            return Math.sqrt(d["Projects Number"]/Math.PI) * 5;
        }).attr("opacity", 0.8);
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    });

    //Add circle labels
    point.append("text").text(function(d) {
        switch(d["Agency Name"]) {
            case "Department of Transportation":
            return "DOT";
            case "Department of Labor":
            return "DOL";
            case "Department of Agriculture":
            return "USDA";
            case "Department of Veterans Affairs":
            return "VA";
            case "Department of Housing and Urban Development":
            return "HUD";
            case "Department of Commerce":
            return "DOC";
            case "Department of the Interior":
            return "DOI";
            case "Department of Homeland Security":
            return "DHS";
            case "Department of Health and Human Services":
            return "HHS";
            case "Department of the Treasury":
            return "TRE";
            case "Department of Defense":
            return "DOD";
            case "Department of Justice":
            return "DOJ";
            case "Department of State":
            return "DOS";
            case "Department of Education":
            return "ED";
            case "Department of Energy":
            return "DOE";
            default:
            return d["Agency Name"];
        }
    }).attr("x", function(d) {
        return x(d["Avg. Scedule Variance(%)"]);
    }).attr("y", function(d) {
        return y(d["Avg. Cost Variance(%)"]);
    })
    .attr("dominant-baseline", "central")
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .attr("font-size", "12")
    .attr("class", "point-label");
    
    point.on('mouseover', function(d) {
        d3.select(this).moveToFront();
    })

    //legend
    var legendItemHeight = 35;
    var legendSvg = svgParent.append("g")
    .attr('transform',  'translate('+(width + margin.left + margin.right + legendMargin.right)+','+margin.top+')')
    .attr('width', legendWidth)
    .attr('height', (dataset.length+1)*legendItemHeight + legendMargin.top + legendMargin.bottom)
    
    //legend background
    legendSvg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", legendWidth)
    .attr("height", (dataset.length+1)*legendItemHeight)
    .attr("fill", d3.rgb("#e0e0eb"))
    .attr("stroke", "black")
    .attr('stroke-width', "1")
    

    legendSvg.append("text").text("Department of :")
    .attr("text-anchor", "right")
    .attr('y', legendItemHeight/2)
    .attr('x', legendMargin.left)

    //legend sorting
    legendSvg.append("text").text("Sort by avg. project cost")
    .attr("text-anchor", "left")
    .style("font", "bold 10px sans-serif")
    .attr("text-decoration", "underline")
    .attr('y', legendItemHeight/2)
    .attr("transform", "translate("+ (legendWidth-9*legendMargin.left) +",0)")
    .style("cursor", "pointer")
    .on("click", function() {
        var current = d3.select(this).text();
        var transition = legendSvg.transition().duration(750),
        delay = function(d, i) { return i * 50; };
        if (current === "Sort by avg. project cost") {
            d3.select(this).text("Sort by total projects");
            legendSvg.selectAll(".legendItem")
            .sort(function(a, b){return a["Avg. Project Cost ($ M)"] - b["Avg. Project Cost ($ M)"]})
            transition.selectAll(".legendItem").delay(delay)
            .attr("transform",function(d, i) { return ("translate(0," +(i*legendItemHeight + legendItemHeight)+")" )})

        }
        else {
            d3.select(this).text("Sort by avg. project cost");
            legendSvg.selectAll(".legendItem")
            .sort(function(a, b){return a["Projects Number"] - b["Projects Number"]})
            transition.selectAll(".legendItem").delay(delay)
            .attr("transform",function(d, i) { return ("translate(0," +(i*legendItemHeight + legendItemHeight)+")" )})
        }
    })

    //legend items
    var items = legendSvg.selectAll(".legendItem")
    .data(dataset.sort(function(a, b){return a["Projects Number"] - b["Projects Number"]}))
    .enter().append("g")
    .attr("class","legendItem")
    .attr("transform",function(d, i) { return ("translate(0," +(i*legendItemHeight + legendItemHeight)+")" )})
    
    //Legend item background
    items.append("rect").attr('class', "legend-separator")
    .attr("x", 0)
    .attr("width", legendWidth)
    .attr("height", legendItemHeight)
    .attr("fill", d3.rgb("#e0e0eb"))
    .attr("stroke", "black")
    .attr('stroke-width', "1")
    .on('mouseover', function(d) {
        d3.select(this).attr("fill", d3.rgb("#a2a2c3"));
        var points = d3.selectAll(".point");
        points.each(function(point, i) {
            if (point["Agency Name"] === d["Agency Name"]) {
                d3.select(this).attr('r', function(d) {
                    return Math.sqrt(d["Projects Number"]/Math.PI) * 5 * 1.5;
                }).attr("opacity", 1);
            }
        })
        if (d["Avg. Scedule Variance(%)"] >=0 && d["Avg. Cost Variance(%)"] >=0) {
            d3.select('#in-time-in-budget').style("font-weight", "bold").style("font-size", "15px")
        }
        else if(d["Avg. Scedule Variance(%)"] < 0 && d["Avg. Cost Variance(%)"] >=0) {
            d3.select('#out-time-in-budget').style("font-weight", "bold").style("font-size", "15px")
        }
        else if(d["Avg. Scedule Variance(%)"] < 0 && d["Avg. Cost Variance(%)"] < 0) {
            d3.select('#out-time-out-budget').style("font-weight", "bold").style("font-size", "15px")
        }
        else if(d["Avg. Scedule Variance(%)"] >=0 && d["Avg. Cost Variance(%)"] <0){
            d3.select('#in-time-out-budget').style("font-weight", "bold").style("font-size", "15px")
        }
    })
    .on("mouseout", function(d) {
        d3.select(this).attr("fill", d3.rgb("#e0e0eb"));
        var points = d3.selectAll(".point");
        points.each(function(point, i) {
            if (point["Agency Name"] === d["Agency Name"]) {
                d3.select(this).attr('r', function(d) {
                    return Math.sqrt(d["Projects Number"]/Math.PI) * 5;
                }).attr("opacity", 0.7);
            }
        })
        d3.selectAll(".quarter-label").style("font-weight", "normal").style("font-size", "12px")
    });

    //legend item project bar
    items.append('rect')
    .attr('width', function(d) {
        var dProject = ((maxProject - minProject) - (maxProject - d["Projects Number"])) / (maxProject - minProject);
        return (legendWidth * dProject) || 5;
    })
    .attr("height", legendItemHeight)
    .attr("fill", d3.rgb("#003399"))
    .attr("x", function(d) {
        var dProject = ((maxProject - minProject) - (maxProject - d["Projects Number"])) / (maxProject - minProject);
        return legendWidth - (legendWidth * dProject || 5);
    })
    .style("pointer-events", "none")
    .attr("opacity", "0.5")

    //Legend item cost circle
    items.append('circle')
    .attr("r", 5)
    .attr("fill", function(d) {
        return colour(d["Avg. Project Cost ($ M)"]);
    })
    .attr("transform", "translate("+ legendMargin.left +","+ (legendItemHeight*0.5) +")")
    .style("pointer-events", "none");

    //Legend item label
    items.append("text")
    .datum(function(d) {return {name: d["Agency Name"].replace('Department of ','')};})
    .text(function(d) { return d.name; })
    .style("font", "11px sans-serif")
    .attr("text-anchor", "right")
    .attr("alignment-baseline", "middle")
    .attr("transform", "translate("+ 2*legendMargin.left +","+ ( legendItemHeight*0.5) +")")
    .style("pointer-events", "none");

    items.append("text")
    .text(function(d) { return d["Projects Number"] + " projects"; })
    .style("font", "11px sans-serif")
    .attr("text-anchor", "left")
    .attr("alignment-baseline", "middle")
    .attr("transform", function(d,i){return "translate("+ (legendWidth-5*legendMargin.left) +","+ (35*0.5) +")"})
    .style("pointer-events", "none");

    //Tooltip div
    var tooltip = d3.select("main").append("div")
    .attr("class", "point-tooltip")
    .style("opacity", 0);
    
    tooltip.append("h3").attr("class", "point-tooltip-title")
    tooltip.append("p").attr("class", "project-number");
    tooltip.append("p").html("Average project cost in million dollars ($), compared to the other departments:");
    var tooltipScale = tooltip.append("div").attr("class", "point-tooltip-scale")
    tooltipScale.append('span').attr('id', 'min-cost').html(parseFloat(minCost).toFixed(2));
    
    var tooltipSvg = tooltipScale.append('svg').attr('class', 'point-tooltip-metrics')
    .attr('width', (tooltipScaleWidth + 2*tooltipPadding)).attr('height', (tooltipScaleHeight + 2*tooltipPadding))
    

    var svgDefs = tooltipSvg.append('defs');
    var mainGradient = svgDefs.append('linearGradient')
                .attr('id', 'mainGradient');

    // Create the stops of the main gradient. 
    mainGradient.append('stop')
        .attr('offset', '0')
        .attr('stop-color', "#e6b3ff");
    mainGradient.append('stop')
        .attr('offset', '0.5')
        .attr('stop-color', "#b31aff");
    mainGradient.append('stop')
        .attr('offset', '1')
        .attr('stop-color', "#550080");
    
    // Use the gradient to set the shape fill, via CSS.
    tooltipSvg.append('rect')
        .classed('filled', true)
        .attr('x', tooltipPadding)
        .attr('y', tooltipPadding)
        .attr('width', tooltipScaleWidth)
        .attr('height', tooltipScaleHeight);
        
    
    var costIndexGroup = tooltipSvg.append('g').attr('id', 'cost-index'); 

    costIndexGroup.append('rect')
        .attr('x', tooltipPadding)
        .attr('y', 0)
        .attr('width', 3)
        .attr('height', (tooltipScaleHeight + 2*tooltipPadding))
        .attr('fill', 'black')

    
    costIndexGroup.append('rect')
    .attr("class", "cost-value-bg")
    .attr('x', 0)
    .attr("y", (tooltipScaleHeight + 2*tooltipPadding)/2)
    .attr('width', 30)
    .attr('height', 15)
    .attr('transform', 'translate('+(-2*tooltipPadding)+', '+(-1.5*tooltipPadding)+')')
    .attr("fill", "black")
    .attr("opacity", "0.5")
    
    costIndexGroup.append('text').text('test')
    .attr("x", tooltipPadding)
    .attr("y", (tooltipScaleHeight + 2*tooltipPadding)/2)
    .attr("dominant-baseline", "central")
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .attr("font-size", "12")
    .attr("class", "cost-value");

    tooltipScale.append('span').attr('id', 'max-cost').html(parseFloat(maxCost).toFixed(2));

}

$(document).ready(function() {
    dataset = [{"Agency Name":"Department of the Treasury","Avg. Scedule Variance(%)":"-7.3542592592592593","Avg. Cost Variance(%)":"-21.3346296296296296","Projects Number":"54","Avg. Lifecycle Cost ($ M)":"11.8355956481481481","Avg. Project Cost ($ M)":"7.1274197592592593"},{"Agency Name":"Department of Health and Human Services","Avg. Scedule Variance(%)":"-7.6834905660377358","Avg. Cost Variance(%)":"-5.5777358490566038","Projects Number":"106","Avg. Lifecycle Cost ($ M)":"2.1199056603773585","Avg. Project Cost ($ M)":"1.4192547169811321"},{"Agency Name":"Department of Defense","Avg. Scedule Variance(%)":"-9.4443939393939394","Avg. Cost Variance(%)":"-45.8972727272727273","Projects Number":"66","Avg. Lifecycle Cost ($ M)":"77.6045000000000000","Avg. Project Cost ($ M)":"20.2586969696969697"},{"Agency Name":"Department of Labor","Avg. Scedule Variance(%)":"-43.1093589743589744","Avg. Cost Variance(%)":"-3.6369230769230769","Projects Number":"78","Avg. Lifecycle Cost ($ M)":"0.83889850000000000000","Avg. Project Cost ($ M)":"0.59469578205128205128"},{"Agency Name":"Department of Housing and Urban Development","Avg. Scedule Variance(%)":"-21.6216666666666667","Avg. Cost Variance(%)":"0.00000000000000000000","Projects Number":"6","Avg. Lifecycle Cost ($ M)":"8.8896186666666667","Avg. Project Cost ($ M)":"5.9428190000000000"},{"Agency Name":"Department of State","Avg. Scedule Variance(%)":"-1.2563829787234043","Avg. Cost Variance(%)":"-1.4346808510638298","Projects Number":"47","Avg. Lifecycle Cost ($ M)":"4617.2071305957446809","Avg. Project Cost ($ M)":"7.8287155106382979"},{"Agency Name":"Department of Agriculture","Avg. Scedule Variance(%)":"-35.4921666666666667","Avg. Cost Variance(%)":"2.5518333333333333","Projects Number":"60","Avg. Lifecycle Cost ($ M)":"33.2353252500000000","Avg. Project Cost ($ M)":"15.3949755000000000"},{"Agency Name":"Department of Transportation","Avg. Scedule Variance(%)":"-54.0367096774193548","Avg. Cost Variance(%)":"1.6158709677419355","Projects Number":"155","Avg. Lifecycle Cost ($ M)":"17.0386196774193548","Avg. Project Cost ($ M)":"8.0208655161290323"},{"Agency Name":"Department of Education","Avg. Scedule Variance(%)":"-0.80230769230769230769","Avg. Cost Variance(%)":"-38.8011538461538462","Projects Number":"26","Avg. Lifecycle Cost ($ M)":"7.3695092692307692","Avg. Project Cost ($ M)":"1.6296564230769231"},{"Agency Name":"Department of Veterans Affairs","Avg. Scedule Variance(%)":"-25.1517605633802817","Avg. Cost Variance(%)":"0.65992957746478873239","Projects Number":"142","Avg. Lifecycle Cost ($ M)":"21.6639594366197183","Avg. Project Cost ($ M)":"5.1199812464788732"},{"Agency Name":"Department of the Interior","Avg. Scedule Variance(%)":"-15.5929629629629630","Avg. Cost Variance(%)":"11.6729629629629630","Projects Number":"27","Avg. Lifecycle Cost ($ M)":"1889.5998500370370370","Avg. Project Cost ($ M)":"12.1350581481481481"},{"Agency Name":"Department of Commerce","Avg. Scedule Variance(%)":"-17.4043502824858757","Avg. Cost Variance(%)":"-6.5764406779661017","Projects Number":"177","Avg. Lifecycle Cost ($ M)":"14.1679013333333333","Avg. Project Cost ($ M)":"6.2207239661016949"},{"Agency Name":"Department of Homeland Security","Avg. Scedule Variance(%)":"-7.6106875000000000","Avg. Cost Variance(%)":"-1.9022500000000000","Projects Number":"160","Avg. Lifecycle Cost ($ M)":"31.8182687500000000","Avg. Project Cost ($ M)":"5.3145250000000000"},{"Agency Name":"Department of Justice","Avg. Scedule Variance(%)":"-2.8815789473684211","Avg. Cost Variance(%)":"2.5178947368421053","Projects Number":"19","Avg. Lifecycle Cost ($ M)":"7.6218081052631579","Avg. Project Cost ($ M)":"7.3080058947368421"},{"Agency Name":"Department of Energy","Avg. Scedule Variance(%)":"4.6423684210526316","Avg. Cost Variance(%)":"2.8492105263157895","Projects Number":"38","Avg. Lifecycle Cost ($ M)":"27.9439312368421053","Avg. Project Cost ($ M)":"27.7321418947368421"}]
    redrawSVG(dataset);
        
    $(window).resize( function() {
        redrawSVG(dataset);
    });
    $(document).ready(function() {
        var hashIndex = location.href.indexOf("#");
        var panelID = "";
        if (hashIndex > 0) {
            var panelID = location.href.substring(hashIndex + 1)
            $('.panel-collapse').collapse('hide')
            if ($('#'+panelID).length) {
                $('#'+panelID).collapse("show")
            }
            else {
                $('#description').collapse("show")
            }
        }
        else {
            $('#description').collapse("show")
        }
    });
});

