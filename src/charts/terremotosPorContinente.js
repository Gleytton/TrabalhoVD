// src/charts/terremotosPorContinente.js
// Desenha gráfico de barras horizontais com D3
import * as d3 from 'd3';

export function renderTerremotosPorContinente(containerSelector, data) {
  const container = d3.select(containerSelector);
  if (container.empty()) {
    console.warn('Container não encontrado:', containerSelector);
    return;
  }

  // Remove conteúdo antigo
  container.selectAll('*').remove();

  if (!data || data.length === 0) {
    container.append('p').text('Sem dados para desenhar o gráfico.');
    return;
  }

  function draw() {
    container.selectAll('*').remove();

    const node = container.node();
    const bounding = node ? node.getBoundingClientRect() : { width: 900, height: 420 };
    const widthTotal = Math.max(480, bounding.width);
    // altura baseada na quantidade de categorias (ou um mínimo)
    const itemHeight = 44;
    const margin = { top: 30, right: 24, bottom: 30, left: 160 };
    const height = Math.max(data.length * itemHeight + 20, 260);

    const width = widthTotal - margin.left - margin.right;

    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('class', 'chart-svg')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // escalas
    const y = d3.scaleBand()
      .domain(data.map(d => d.continente))
      .range([0, height])
      .padding(0.18);

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total_terremotos)])
      .nice()
      .range([0, width]);

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.continente))
      .range(d3.schemeTableau10);

    // grid vertical leve
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,0)`)
      .call(d3.axisBottom(x)
        .ticks(5)
        .tickSize(-height)
        .tickFormat(''))
      .attr('transform', `translate(0,${height})`)
      .style('opacity', 0.08);

    // barras
    svg.selectAll('rect.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('y', d => y(d.continente))
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('width', d => x(d.total_terremotos))
      .attr('fill', d => color(d.continente))
      .attr('rx', 6);

    // labels de valor à direita da barra
    svg.selectAll('text.value')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'value')
      .attr('x', d => x(d.total_terremotos) + 8)
      .attr('y', d => y(d.continente) + y.bandwidth() / 2 + 5)
      .text(d => d.total_terremotos)
      .style('font-weight', '700')
      .style('font-size', '12px')
      .style('fill', '#fff');

    // eixo Y (categorias)
    const yAxisG = svg.append('g')
      .call(d3.axisLeft(y).tickSize(0));

    yAxisG.select('.domain').remove();
    yAxisG.selectAll('text')
      .style('font-size', '13px')
      .style('fill', '#fff');

    // eixo X na base
    const xAxisG = svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));
    xAxisG.selectAll('text').style('fill', '#cfd9e6');
    xAxisG.select('.domain').style('stroke', 'rgba(255,255,255,0.06)');

    // título dentro do gráfico (apenas se quiser)
    // svg.append('text')
    //   .attr('x', -margin.left)
    //   .attr('y', -10)
    //   .style('font-size', '16px')
    //   .style('fill', '#fff')
    //   .text('Terremotos por Continente');

    // tooltip simples (mostra valor ao passar o mouse)
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip bar-tooltip')
      .style('opacity', 0);

    svg.selectAll('rect.bar')
      .on('mouseover', (event, d) => {
        tooltip.transition().duration(120).style('opacity', 1);
        tooltip.html(`<strong>${d.continente}</strong><br/>${d.total_terremotos} eventos`)
          .style('left', (event.pageX + 12) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.pageX + 12) + 'px').style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(120).style('opacity', 0);
      });
  } // end draw

  draw();

  // redimensionar ao resize
  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => draw(), 120);
  }
  window.addEventListener('resize', onResize);

  // retorna cleanup
  return () => {
    window.removeEventListener('resize', onResize);
    d3.select(containerSelector).selectAll('*').remove();
    d3.selectAll('.bar-tooltip').remove();
  };
}