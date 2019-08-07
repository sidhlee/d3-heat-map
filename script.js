const url = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json'
d3.json(url)
  .then(callback)
  .catch((err) => console.log(err));

function callback(data) {
  console.log(`data: ${data}`)
  console.log(`datalength: ${data.monthlyVariance.length}`)

  const section = d3.select('body').append('section');
  const heading = section.append('heading');

  /* append heading */
  heading.append("h1")
    .attr('id', 'title')
    .text("Monthly Global Land-Surface Temperature");
  heading.append('h3')
    .attr('id', 'description')
    .html(`${data.monthlyVariance[0].year} - 
    ${data.monthlyVariance[data.monthlyVariance.length - 1].year}: 
    base temperature ${data.baseTemperature}&#8451;`);

  const em = 16;
  const cellWidth = 4, cellHeight = 33;
  const width = cellWidth * Math.ceil(data.monthlyVariance.length / 12);
  const height = cellHeight * 12;
  const padding = { left: 9 * em, right: 9 * em, top: 1 * em, bottom: 10 * em };

  /* tooltip with d3-tip */
  /* https://github.com/caged/d3-tip */
  const tip = d3.tip()
    .attr('class', ' d3-tip')
    .attr('id', 'tooltip')
    .direction('n')
    .offset([-10, 0])
    .html(d => { 
      tip.attr("data-year", d.year)
      let date = new Date(d.year, d.month);
      let str =
      `<span class="date">${d3.timeFormat("%Y - %B")(date)}</span><br />
      <span class="temperature">${d3.format(".1f")(data.baseTemperature + d.variance)}&#8451;</span><br />
      <span class="variance">${d3.format("+.1f")(d.variance)}&#8451;<span/>`; 
      return str;
    })
    

  const svg = section.append('svg')
    // d3 v4+ needs module(d3-selection-multi) to support attrs(obj)
    .attrs({
      width: width + padding.left + padding.right,
      height: height + padding.top + padding.bottom
    })
    .call(tip)


  /* y-axis */

  const yScaleBand = d3.scaleBand()
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) // month index
    .rangeRound([0, height]) // shorthand for range(range).interpolate(d3.interpolateRound)
    //d3.interpolateRound rounds results to integers
    .padding(0);
  const yAxis = d3.axisLeft(yScaleBand)
    .tickFormat(d => {
      let date = new Date(0);
      date.setUTCMonth(d);
      return d3.timeFormat('%B')(date);
    })

  svg.append('g')
    .classed('y-axis', true)
    .attr('id', 'y-axis')
    .attr('transform', `translate(${padding.left}, ${padding.top})`)
    .call(yAxis)
    .append('text')
    .text('Months')// inherits 'g's fill(none) and axis's font-size(tiny)
    .attrs({
      'fill': 'black', // needs reset, but easier to set the position agains the axis
      // (otherwise, you would need to calculate from the top-left of containing svg)
      'text-anchor': 'middle',
      'transform': `rotate(-90)translate(${-height / 2},${-5 * em})`,
      'class': 'label'
    })


  /* x-axis */

  const xScaleBand = d3.scaleBand()
    .domain(data.monthlyVariance.map(o => o.year))
    .rangeRound([0, width])
    .padding(0);

  const xAxis = d3.axisBottom(xScaleBand)
    .tickValues(xScaleBand.domain().filter(year => year % 10 === 0))

  svg.append('g')
    .attrs({
      'class': 'x-axis',
      'id': 'x-axis',
      'transform': `translate(${padding.left},${height + padding.top})`
    })
    .call(xAxis)
    .append('text')
    .attrs({
      'fill': 'black',
      'transform': `translate(${width / 2}, ${3 * em})`,
      'class': 'label'
    })
    .text("Year")

  /* color scale */
  const tempMax = d3.max(data.monthlyVariance, d => d.variance)
  const tempMin = d3.min(data.monthlyVariance, d => d.variance)
  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlBu) // 
    .domain([tempMax, tempMin])


  /* Legend */
  const numLegendTicks = 10,
    legendWidth = 600,
    legendHeight = 300 / numLegendTicks,
    numLegendCells = 50;
  let legendCells

  const legendX = d3.scaleLinear()
    .domain([tempMin, tempMax])
    .range([0, legendWidth])
  console.log(legendX(tempMin))

  // data array to iterate and fill the rect inside legend bar.
  // domain is evenly divided by legendNumCells(50)
  legendCells = (function (min, max, n) {
    let arr = [];
    let step = (max - min) / n;
    let base = min;
    for (let i = 0; i < n; i++) {
      arr.push(base + i * step);
    }
    return arr;
  })(tempMin, tempMax, numLegendCells)

  // will pass to tickValues of bottom-axis
  const ticksArray = (function (min, max, n) {
    let array = [];
    let step = (max - min) / n;
    let base = min;
    for (let i = 1; i < n; i++) {
      array.push(base + i * step);
    }
    return array;
  })(tempMin, tempMax, numLegendTicks);

  // set bottom-axis
  const legendXAxis = d3.axisBottom(legendX)
    .ticks(numLegendTicks) // increased the legend width from 400 to 600
    // .tickValues(ticksArray) // ticks() return too few or too many
    .tickFormat(d => {
      return d3.format(".1f")(data.baseTemperature + d)
    })

  // render legend (colour bar)  
  const legend = svg.append('g')
    .attrs({
      class: 'legend',
      id: 'legend',
      transform: `translate(${padding.left}, 
        ${padding.top + height + padding.bottom - 2 * legendHeight})`
    })
    .append('g');

  legend
    .selectAll('rect')
    .data(legendCells)
    .enter().append('rect')
    .attrs({
      x: d => legendX(d),
      y: 0,
      width: legendWidth / numLegendCells,
      height: legendHeight,
      fill: d => colorScale(d)
    });
  // add axis to the bottom of color bar
  legend.append('g')
    .attr('transform', `translate(0, ${legendHeight})`)
    .attr('id', 'legendAxis')
    .call(legendXAxis)

  legend.append('text')
    .html(`Legend: temperature in Celsius(&#8451;)`)
    .attr('transform', 'translate(0, -10)')

  /* map */
  svg.append('g')
    .attrs({
      class: 'map',
      transform: `translate(${padding.left}, ${padding.top})`
    })
    .selectAll('rect')
    .data(data.monthlyVariance)
    .enter().append('rect')
    .attrs({
      class: 'cell',
      'data-month': d => d.month - 1, // store as month index
      'data-year': d => d.year,
      'data-temp': d => d.baseTemperature + d.variance,
      x: d => xScaleBand(d.year),
      y: d => yScaleBand(d.month - 1), // d.month is not zero-based
      width: d => xScaleBand.step(),
      height: d => yScaleBand.step(),
      fill: d => colorScale(d.variance)
    })
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);
}