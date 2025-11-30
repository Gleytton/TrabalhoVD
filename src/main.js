import * as d3 from "d3";


// Função de detecção de continente por latitude/longitude

function detectarContinente(lat, lon) {
  if (lat === null || lon === null) return "Desconhecido";

  if (lat > 0 && lon < -25 && lon > -170) return "América do Norte";
  if (lat < 15 && lon < -25 && lon > -90) return "América Central";
  if (lat < 0 && lon < -25 && lon > -80) return "América do Sul";

  if (lat > 35 && lon > -10 && lon < 60) return "Europa";
  if (lat > -40 && lat < 35 && lon > -20 && lon < 55) return "África";

  if (lat > 5 && lon > 60 && lon < 180) return "Ásia";
  if (lat < 0 && lon > 110 && lon < 180) return "Oceania";

  return "Desconhecido";
}

// Carregar CSV e processar

d3.csv("/database.csv").then(data => {
  
  // Converter números
  data.forEach(d => {
    d.latitude  = +d.latitude;
    d.longitude = +d.longitude;
    
  });

  // Agrupar por continente
  const terremotosPorContinente = d3.rollups(
    data,
    v => v.length,
    d => detectarContinente(d.latitude, d.longitude)
  );

  // Ordenar
  terremotosPorContinente.sort((a,b) => d3.descending(a[1], b[1]));

  // Criar gráfico
  criarGrafico(terremotosPorContinente);
});


// Criar gráfico de barras horizontais

function criarGrafico(dataset) {
  const margin = { top: 40, right: 30, bottom: 40, left: 150 };
  const width  = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // Escalas
  const y = d3.scaleBand()
      .domain(dataset.map(d => d[0]))
      .range([0, height])
      .padding(0.2);

  const x = d3.scaleLinear()
      .domain([0, d3.max(dataset, d => d[1])])
      .range([0, width]);

  // Cores
  const color = d3.scaleOrdinal()
      .domain(dataset.map(d => d[0]))
      .range(d3.schemeTableau10);

  // Barras
  svg.selectAll("rect")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("y", d => y(d[0]))
      .attr("width", d => x(d[1]))
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d[0]));

  // Labels com quantidade
  svg.selectAll("text.value")
      .data(dataset)
      .enter()
      .append("text")
      .attr("class", "value")
      .attr("x", d => x(d[1]) + 5)
      .attr("y", d => y(d[0]) + y.bandwidth() / 2 + 4)
      .text(d => d[1]);

  // Eixo Y
  svg.append("g").call(d3.axisLeft(y));

  // Eixo X
  svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

  // Título
  svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .text("Número de Terremotos por Continente");
}
