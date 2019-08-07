# D3 Heat Map

### Learned: 
1. After d3.json(url), pass cb by name into .then(). Define cb deperately.
```javascript
d3.json(url)
  .then(callback)
  .catch((err) => console.log(err));

function callback(data) {
  console.log(`data: ${data}`)
  console.log(`datalength: ${data.monthlyVariance.length}`)
.
.
.
```
2. set "em" value to adjust margin/padding relative to the font-size. Create padding object containing all directions.
```javascript
  const em = 16;
  const cellWidth = 4, cellHeight = 33;
  const width = cellWidth * Math.ceil(data.monthlyVariance.length / 12);
  const height = cellHeight * 12;
  const padding = { left: 9 * em, right: 9 * em, top: 1 * em, bottom: 10 * em };
  ```
  
  3. When using `d3-tip` library for tooltip, you have access to data points only with `.html` method. You can set attribute inside there.
  ```javascript
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
    });
  ```
    
   
    
  4. Include `d3-selection-multi` module to pass obj with multiple attribute settings into `attrs`
    
  ```html
    <script src="https://d3js.org/d3-selection-multi.v1.min.js"></script>
  ```
    
  ```js
     const svg = section.append('svg')
    // d3 v4+ needs module(d3-selection-multi) to support attrs(obj)
    .attrs({
      width: width + padding.left + padding.right,
      height: height + padding.top + padding.bottom
    })
    .call(tip)
  ```
    
  5. When chain-appending text label into the axis, you need to re-set `'fill': 'black'`because chaining elements inherit container's attributes.
  ```js
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
  ```
  6. You can filter tick values with `.tickValues(band.domain().filter(tester))`
  ```js
  const xScaleBand = d3.scaleBand()
    .domain(data.monthlyVariance.map(o => o.year))
    .rangeRound([0, width])
    .padding(0);

  const xAxis = d3.axisBottom(xScaleBand)
    .tickValues(xScaleBand.domain().filter(year => year % 10 === 0))
  ```
  7. For mapping continous domain into gradient color bar, use `d3.scaleSequential()`
  ```js
   /* color scale */
  const tempMax = d3.max(data.monthlyVariance, d => d.variance)
  const tempMin = d3.min(data.monthlyVariance, d => d.variance)
  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlBu) // 
    .domain([tempMax, tempMin])
  ```
  8. IIFE(Immediately Invoked Function Expression) comes in handy when creating an array of values.
  ```js
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
  ```
  9. `axis.ticks(numTicks)` doesn't give you the exact number of ticks requested. Instead, it'll usually give 1 or 2 more so that tick values rounds up nicely.
  ```js
  const legendXAxis = d3.axisBottom(legendX)
    .ticks(numLegendTicks) // increased the legend width from 400 to 600
    // .tickValues(ticksArray) // ticks() return too few or too many
    .tickFormat(d => {
      return d3.format(".1f")(data.baseTemperature + d)
    })
  ```
  

    
