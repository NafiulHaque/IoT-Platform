import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

import { useThemeClasses, THEMES, useTheme } from '../context/ThemeContext';

// Reusable Gauge Component (NO BLINK - Persistent SVG)
const Gauge = ({ value, min, max, label, unit, delay = 0 }) => {
  
    const tc = useThemeClasses();
    const { theme } = useTheme()

   const colors = {
    [THEMES.dark]:       { temp: '#818cf8', hum: '#34d399', grid: '#334155', text: '#94a3b8', gaugeBorderMax: '#dc2626', gaugeBorderMid: '#eab308', gaugeBorderMin: '#16a34a' },
    [THEMES.enterprise]: { temp: '#3182ce', hum: '#38a169', grid: '#bee3f8', text: '#718096', gaugeBorderMax: '#ebf8ff', gaugeBorderMid: '#63b3ed', gaugeBorderMin: '#2c5282' },
    [THEMES.graphite]:   { temp: '#374151', hum: '#059669', grid: '#e4e4e7', text: '#9ca3af', gaugeBorderMax: '#4b5563', gaugeBorderMid: '#9ca3af', gaugeBorderMin: '#f2f2f2' },
  }[theme]

console.log('Gauge render with theme:', colors);
  

  const ref = useRef();
  const valueArcRef = useRef();
  const textRef = useRef();
  const scaleRef = useRef();
  const arcRef = useRef();
  const isFirstRender = useRef(true);
 

  // ===== INIT (run once) =====
    useEffect(() => {
    const width = 200;
    const height = 120;
    const radius = 70;

   
    // Prevent multiple SVGs
    const container=d3.select(ref.current);
    if(!container.select("svg").empty()) return; //already created

  // d3.select(ref.current).selectAll("*").remove(); // clear previous SVG if any

    const svg = container
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const centerX = width / 2;
    const centerY = height - 10;

    const scale = d3
      .scaleLinear()
      .domain([min, max])
      .range([-Math.PI / 2, Math.PI / 2]);

    scaleRef.current = scale;

    // ===== Border =====
    const segments = [
      { start: min, end: min + (max - min) * 0.33, color: colors.gaugeBorderMin },
      { start: min + (max - min) * 0.33, end: min + (max - min) * 0.66, color: colors.gaugeBorderMid },
      { start: min + (max - min) * 0.66, end: max, color: colors.gaugeBorderMax }
    ];

    const borderArc = d3
      .arc()
      .innerRadius(radius + 2)
      .outerRadius(radius + 8)
      .cornerRadius(10);


    segments.forEach(seg => {
      svg
        .append("path")
        .datum({
          startAngle: scale(seg.start),
          endAngle: scale(seg.end)
        })
        .attr("d", borderArc)
        .attr("transform", `translate(${centerX}, ${centerY})`)
        .attr("fill", seg.color);
    });

    // ===== Main Arc =====
    const arc = d3
      .arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .cornerRadius(6);
     

    arcRef.current = arc;

    // Background
    svg
      .append("path")
      .datum({ endAngle: Math.PI / 2 })
      .attr("d", arc)
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .attr("fill", colors.grid);

    // Value arc (store ref)
    valueArcRef.current = svg
      .append("path")
      .datum({ endAngle: -Math.PI / 2 })
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .attr("fill", colors.temp);

    // Text (store ref)
    textRef.current = svg
      .append("text")
      .attr("x", centerX)
      .attr("y", height - 5)
      .attr("text-anchor", "middle")
      .attr("fill", colors.text)
      .attr("font-size", "18px");

  }, [min, max, colors]);

  // ===== UPDATE (no re-create → no blinking) =====
  useEffect(() => {
    const scale = scaleRef.current;
    const arc = arcRef.current;

    if (!scale || !arc || !valueArcRef.current) return;

    const targetAngle = scale(value);

    valueArcRef.current.interrupt();

    if (isFirstRender.current) {
      // first load animation
      valueArcRef.current
        .transition()
        .delay(delay)
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attrTween("d", function (d) {
          const interpolate = d3.interpolate(d.endAngle, targetAngle);
          return function (t) {
            d.endAngle = interpolate(t);
            return arc(d);
          };
        });

      textRef.current
        .transition()
        .delay(delay)
        .duration(1000)
        .tween("text", function () {
          const interpolate = d3.interpolate(0, value);
          return function (t) {
            textRef.current.text(`${interpolate(t).toFixed(1)}${unit}`);
          };
        });

      isFirstRender.current = false;
    } else {
      // smooth micro update (NO blinking)
      valueArcRef.current
        .transition()
        .duration(300)
        .ease(d3.easeLinear)
        .attrTween("d", function (d) {
          const interpolate = d3.interpolate(d.endAngle, targetAngle);
          return function (t) {
            d.endAngle = interpolate(t);
            return arc(d);
          };
        });

        textRef.current
          .transition()
          .duration(300)
          .tween("text", function () {
            const interpolate = d3.interpolate(0, value);
            return function (t) {
              textRef.current.text(`${interpolate(t).toFixed(1)}${unit}`);
            };
          });

    }

  }, [value, unit, delay]);

  return (
    <div className="flex flex-col items-center">
        <div ref={ref}></div>
      <p className="text-gray-300 mt-2 text-sm">{label}</p>
    </div>
  );
};

export default function SensorGauges({ temp, hum }) {
  return (
    <div className="flex flex-wrap gap-6 justify-center">
        <Gauge value={temp} min={-10} max={50} label="Temperature" unit="°C" delay={0} />
        <Gauge value={hum} min={0} max={100} label="Humidity" unit="%" delay={500} />
     </div>     
    
  )
};


