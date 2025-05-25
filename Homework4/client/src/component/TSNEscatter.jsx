import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const colorMap = {
  Energy: "darkcyan",
  Industries: "goldenrod",
  Consumer: "forestgreen",
  Healthcare: "indianred",
  Finance: "slateblue",
  Technology: "darkmagenta"
};

export default function TSNEScatterPlot({ selectedStock }) {
  const svgRef = useRef();
  const zoomRef = useRef();
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/tsne/")
      .then(res => res.json())
      .then(json => {
        const filtered = json.filter(d =>
          typeof d.x === "number" &&
          typeof d.y === "number" &&
          d.Stock &&
          d.sector
        );
        setData(filtered);
      })
      .catch(err => console.error("Error loading t-SNE data:", err));
  }, []);

  useEffect(() => {
    if (!data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 650;
    const height = 400;
    const margin = { top: 30, right: 20, bottom: 40, left: 100 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.append("defs")
      .append("clipPath")
      .attr("id", "clip-region")
      .append("rect")
      .attr("x", -20)
      .attr("y", -40)
      .attr("width", chartWidth + 40)
      .attr("height", chartHeight + 60);

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x))
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.y))
      .range([chartHeight, 0]);

    const xAxis = g.append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale));

    const yAxis = g.append("g")
      .call(d3.axisLeft(yScale));

    g.append("text")
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight + 30)
      .attr("text-anchor", "middle")
      .text("X (t-SNE)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -chartHeight / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .text("Y (t-SNE)");

    const chartBody = g.append("g")
      .attr("clip-path", "url(#clip-region)");

    chartBody.selectAll("circle.base")
      .data(data)
      .join("circle")
      .attr("class", "base")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 3)
      .attr("fill", d => colorMap[d.sector] || "black");

    const selected = data.find(d => d.Stock === selectedStock);

    if (selected) {
      chartBody.append("circle")
        .attr("class", "highlighted")
        .attr("cx", xScale(selected.x))
        .attr("cy", yScale(selected.y))
        .attr("r", 8)
        .attr("fill", colorMap[selected.sector] || "black")
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5);

      chartBody.append("text")
        .attr("x", xScale(selected.x) + 10)
        .attr("y", yScale(selected.y) - 10)
        .text(selected.Stock)
        .attr("font-size", "0.85rem")
        .attr("font-weight", "bold")
        .attr("fill", "#000");
    }

    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .on("zoom", (event) => {
        const newX = event.transform.rescaleX(xScale);
        const newY = event.transform.rescaleY(yScale);

        xAxis.call(d3.axisBottom(newX));
        yAxis.call(d3.axisLeft(newY));

        chartBody.selectAll("circle.base")
          .attr("cx", d => newX(d.x))
          .attr("cy", d => newY(d.y));

        chartBody.selectAll("circle.highlighted")
          .attr("cx", d => newX(selected?.x))
          .attr("cy", d => newY(selected?.y));

        chartBody.selectAll("text")
          .attr("x", d => newX(selected?.x) + 10)
          .attr("y", d => newY(selected?.y) - 10);
      });

    svg.call(zoom);
    zoomRef.current = zoom;
  }, [data, selectedStock]);

  return (
    <div className="relative w-full h-[500px]">
      <div className="absolute top-4 left-4 z-10 bg-white/95 rounded-md shadow p-3">
        <div className="font-medium mb-1 text-sm tracking-wide text-gray-700">Sector Key</div>
        <ul className="space-y-1">
          {Object.entries(colorMap).map(([sector, color]) => (
            <li key={sector} className="flex items-center gap-2">
              <div
                className="h-2.5 w-6 rounded-sm border"
                style={{ backgroundColor: color, borderColor: color }}
              />
              <span className="text-xs text-gray-800 font-medium">{sector}</span>
            </li>
          ))}
        </ul>
      </div>

      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox="0 0 600 400"
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
}
