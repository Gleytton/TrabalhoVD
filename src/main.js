import * as d3 from "d3";
import { buscarDadosIniciais } from './analises.js';

// 1. Busca e Renderiza
buscarDadosIniciais().then(data => {
  // Filtra locais sem continente definido para limpar o gráfico
  const dadosLimpos = data.filter(d => d.continente !== 'Desconhecido');
  criarGrafico(dadosLimpos);
});

// 2. Função de Desenho
function criarGrafico(dataset) {
  const margin = { top: 60, right: 30, bottom: 50, left: 160 };
  const width  = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Limpa SVG antigo
  d3.select("#chart").selectAll("*").remove();

  const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .style("font-family", "sans-serif"); // Fonte moderna

  // Escalas
  const y = d3.scaleBand()
      .domain(dataset.map(d => d.continente))
      .range([0, height])
      .padding(0.2);

  const x = d3.scaleLinear()
      .domain([0, d3.max(dataset, d => d.total_terremotos)])
      .range([0, width]);

  const color = d3.scaleOrdinal()
      .domain(dataset.map(d => d.continente))
      .range(d3.schemeTableau10);

  // --- Gridlines (Linhas verticais de fundo) ---
  svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
          .ticks(5)
          .tickSize(-height)
          .tickFormat("")
      )
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.1);

  // --- Barras ---
  svg.selectAll("rect")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("y", d => y(d.continente))
      .attr("width", d => x(d.total_terremotos))
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.continente))
      .attr("rx", 3); // Ponta levemente arredondada

  // --- Labels de Valor ---
  svg.selectAll("text.value")
      .data(dataset)
      .enter()
      .append("text")
      .attr("x", d => x(d.total_terremotos) + 8)
      .attr("y", d => y(d.continente) + y.bandwidth() / 2 + 5)
      .text(d => d.total_terremotos)
      .style("font-weight", "bold")
      .style("font-size", "12px")
      .style("fill", "#333");

  // --- Eixo Y (Continentes) ---
  const yAxis = svg.append("g").call(d3.axisLeft(y).tickSize(0));
  yAxis.select(".domain").remove(); // Remove linha preta vertical
  yAxis.selectAll("text").style("font-size", "13px").style("fill", "#333");

  // --- Eixo X (Números) ---
  const xAxis = svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));
  xAxis.selectAll("text").style("fill", "#666");
  xAxis.select(".domain").style("stroke", "#ccc");

  // --- Título ---
  svg.append("text")
      .attr("x", -margin.left)
      .attr("y", -30)
      .style("font-size", "22px")
      .style("font-weight", "bold")
      .style("fill", "#222")
      .text("Terremotos por Continente");

  svg.append("text")
      .attr("x", -margin.left)
      .attr("y", -10)
      .style("font-size", "14px")
      .style("fill", "#777")
      .text("Eventos registrados entre 1965 e 2016");
}