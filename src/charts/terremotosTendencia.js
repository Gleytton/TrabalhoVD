// src/charts/terremotosTendencia.js
// Responsável por desenhar o gráfico de tendência de terremotos por ano.
// Exporta renderTerremotosTendencia(containerSelector, data)

import * as d3 from 'd3';

export function renderTerremotosTendencia(containerSelector, data) {
  const container = d3.select(containerSelector);
  if (container.empty()) {
    console.warn('Container não encontrado:', containerSelector);
    return;
  }

  // Remove conteúdo antigo e tooltip específico (evita duplicar)
  container.selectAll('*').remove();
  d3.select('body').selectAll('.tooltip-terremotos').remove();

  if (!data || data.length === 0) {
    container.append('p').text('Sem dados para desenhar o gráfico.');
    return;
  }

  // Função que (re)desenha com base no tamanho atual
  function draw() {
    container.selectAll('*').remove();

    // Configurações responsivas
    const containerNode = container.node();
    const boundingWidth = containerNode ? containerNode.getBoundingClientRect().width : Math.min(1200, window.innerWidth - 80);

    // Reduzi as margens esquerda/direita para "esticar" mais o gráfico horizontalmente
    const margin = { top: 24, right: 18, bottom: 64, left: 46 };
    const width = Math.max(480, boundingWidth) - margin.left - margin.right;
    const height = Math.max(300, containerNode ? containerNode.getBoundingClientRect().height : 420) - margin.top - margin.bottom;

    const svg = container
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('class', 'chart-svg')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X: anos (linear inteiro)
    const x = d3.scaleLinear()
      .domain([d3.min(data, d => d.year), d3.max(data, d => d.year)])
      .range([0, width]);

    // Y: contagem
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) * 1.12]) // leve aumento para folga superior
      .nice()
      .range([height, 0]);

    // Eixos
    const xAxis = d3.axisBottom(x)
      .tickFormat(d3.format('d'))
      .ticks(Math.min(20, data.length));

    const yAxis = d3.axisLeft(y).ticks(6);

    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "translate(0,8)")
      .style("text-anchor", "middle");

    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis);

    // Defs gradiente
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'grad-terremotos')
      .attr('x1', '0%').attr('x2', '100%')
      .attr('y1', '0%').attr('y2', '0%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#66b3ff');
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#6f8cff');

    // Linha
    const line = d3.line()
      .defined(d => d.count != null)
      .x(d => x(d.year))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('class', 'line-path')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke-width', 2.6)
      .attr('stroke', 'url(#grad-terremotos)');

    // Pontos
    svg.selectAll('.point')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.count))
      .attr('r', 3.8)
      .attr('fill', '#fff')
      .attr('stroke', '#6f8cff')
      .attr('stroke-width', 1.5);

    // Axis labels
    svg.append('text')
      .attr('class', 'x label')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 20)
      .style('text-anchor', 'middle')
      .text('Ano');

    svg.append('text')
      .attr('class', 'y label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 14)
      .style('text-anchor', 'middle')
      .text('Número de terremotos');

    // Tooltip específico
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip-terremotos tooltip')
      .style('opacity', 0);

    svg.selectAll('.point')
      .on('mouseover', (event, d) => {
        tooltip.transition().duration(120).style('opacity', 1);
        tooltip.html(`<strong>Ano:</strong> ${d.year}<br/><strong>Eventos:</strong> ${d.count}`)
          .style('left', (event.pageX + 12) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.pageX + 12) + 'px')
               .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(160).style('opacity', 0);
      });
  } // end draw

  // Desenha inicialmente
  draw();

  // Responsividade: redesenhar no resize
  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      draw();
    }, 120);
  }
  window.addEventListener('resize', onResize);

  // Retorna uma função de cleanup caso queira remover o gráfico depois
  return () => {
    window.removeEventListener('resize', onResize);
    d3.select(containerSelector).selectAll('*').remove();
    d3.select('body').selectAll('.tooltip-terremotos').remove();
  };
}