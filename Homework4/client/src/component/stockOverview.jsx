import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function StockLineChart({ selectedStock }) {
  const svgRef = useRef();
  const yAxisRef = useRef();
  const containerRef = useRef();
  const zoomRef = useRef();
  const [data, setData] = useState([]);

  const margin = { top: 5, right: 20, bottom: 40, left: 50 };
  const colorMap = { Open: 'blue', High: 'green', Low: 'red', Close: 'black' };
  const lineTypes = Object.keys(colorMap);

  useEffect(() => {
    if (!selectedStock) return;

    fetch(`http://localhost:8000/stock/${selectedStock}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch stock data");
        return res.json();
      })
      .then(json => {
        const processed = json.stock_series.map(d => ({
          ...d,
          Date: new Date(d.date)
        }));
        setData(processed);
      })
      .catch(err => {
        console.error("Error fetching stock data:", err);
        setData([]);
      });
  }, [selectedStock]);

  useEffect(() => {
    if (!data.length || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const yAxisSvg = d3.select(yAxisRef.current);
    yAxisSvg.selectAll("*").remove();

    const visibleWidth = containerRef.current.clientWidth;
    const height = 300;
    const totalWidth = visibleWidth * 3;

    const chartHeight = height - margin.top - margin.bottom;
    const chartWidth = totalWidth - margin.left - margin.right;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.Date))
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(data, d => Math.min(d.Open, d.High, d.Low, d.Close)),
        d3.max(data, d => Math.max(d.Open, d.High, d.Low, d.Close))
      ])
      .nice()
      .range([chartHeight, 0]);

    const xAxisGroup = g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale));

    const yAxisGroup = yAxisSvg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(yScale));

    yAxisSvg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .text("Price")
      .style("font-size", "0.8rem");

    g.append("text")
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight + 30)
      .attr("text-anchor", "middle")
      .text("Date")
      .style("font-size", "0.8rem");

    const chartBody = g.append("g").attr("class", "chart-body");

    lineTypes.forEach(type => {
      const line = d3.line()
        .x(d => xScale(d.Date))
        .y(d => yScale(d[type]));

      chartBody.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", colorMap[type])
        .attr("stroke-width", 1.5)
        .attr("class", `line-${type}`)
        .attr("d", line);
    });

    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [chartWidth, chartHeight]])
      .extent([[0, 0], [chartWidth, chartHeight]])
      .on("zoom", event => {
        const newX = event.transform.rescaleX(xScale);

        xAxisGroup.call(d3.axisBottom(newX));

        lineTypes.forEach(type => {
          const newLine = d3.line()
            .x(d => newX(d.Date))
            .y(d => yScale(d[type]));
          chartBody.select(`.line-${type}`).attr("d", newLine(data));
        });
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    svg.attr("width", totalWidth).attr("height", height);
  }, [data]);

  const handleZoom = (factor) => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomRef.current.scaleBy, factor);
  };

  const handleReset = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div ref={containerRef} className="relative w-full h-[340px] mb-6">
      <div className="absolute top-2 right-4 z-40 bg-white/95 shadow-md rounded-md px-4 py-2 text-sm">
  <h4 className="font-semibold text-gray-700 mb-2">Types</h4>
  <ul className="flex flex-wrap gap-x-4 gap-y-1">
    {lineTypes.map(type => (
      <li key={type} className="flex items-center space-x-2">
        <span
          className="inline-block w-3 h-3 rounded-full"
          style={{ backgroundColor: colorMap[type] }}
        ></span>
        <span className="capitalize text-gray-600 tracking-wide">{type}</span>
      </li>
    ))}
  </ul>
</div>

      <div className="absolute top-2 right-2 z-50 bg-white/90 backdrop-blur-sm flex items-center gap-2 p-1 rounded shadow-md">
      </div>

      <div className="flex w-full h-full">
        <svg ref={yAxisRef} width={margin.left} height="100%" />
        <div className="overflow-x-auto w-full h-full">
          <svg ref={svgRef} />
        </div>
      </div>
    </div>
  );
}
