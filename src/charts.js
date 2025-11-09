// src/charts.js

import * as d3 from 'd3'; 

// Dimensões do gráfico padrão
const margin = { top: 30, right: 30, bottom: 60, left: 80 };

// 🛑 AÇÃO para 'percorrer toda a página': Aumenta a largura base.
const BASE_WIDTH = 1200; // Define uma largura ampla
const width = BASE_WIDTH - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Formatador para criar rótulos de Mês-Ano
const monthYearFormat = d3.timeFormat("%Y-%m"); 


/**
 * Cria o Gráfico de Linha de Série Temporal (Tendência de Corridas Diárias)
 * Mantido para comparação, usa o mesmo setup de largura.
 */
export function createTemporalLineChart(data, containerSelector) {
    
    // 1. Pré-processamento e Limpeza (Correção do BigInt e Validação da Data)
    const cleanData = data.map(d => {
        return {
            date: new Date(d.dia_corrida), 
            total_corridas: Number(String(d.total_corridas)) 
        };
    })
    .filter(d => d.date instanceof Date && !isNaN(d.date) && d.total_corridas > 0); 
    
    if (cleanData.length === 0) {
        d3.select(containerSelector).html("<h2>Não foi possível gerar a Série Temporal.</h2>");
        return;
    }

    d3.select(containerSelector).html(""); 

    const svg = d3.select(containerSelector)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 2. Definir Escalas
    const xScale = d3.scaleTime()
        .domain([
            new Date('2018-12-01'), 
            new Date('2023-01-31')  
        ]) 
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(cleanData, d => d.total_corridas) * 1.05])
        .range([height, 0]);

    // 3. Desenhar Eixos
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat("%Y")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(".2s"))); 

    // Eixo Y Label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Total de Corridas por Dia");

    // 4. Desenhar a Linha
    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.total_corridas));

    svg.append("path")
        .datum(cleanData) 
        .attr("fill", "none")
        .attr("stroke", "#4682B4") 
        .attr("stroke-width", 2)
        .attr("d", line);

    // 5. Adicionar Título Principal
    d3.select(containerSelector).append("h2")
        .style("text-align", "center")
        .text("Análise Temporal: Volume Diário de Corridas (2019-2022)");
}


/**
 * Cria o Gráfico de Barras para Variação Mensal (48 Meses).
 * @param {Array<Object>} data Dados (analiseDiaria) com dia_corrida e total_corridas.
 * @param {string} containerSelector O seletor CSS onde o SVG será anexado.
 */
export function createMonthlyBarChart(data, containerSelector) {
    
    // 1. Pré-processamento e Agregação por Mês
    const cleanData = data.map(d => ({
        date: new Date(d.dia_corrida), 
        total_corridas: Number(String(d.total_corridas)) 
    })).filter(d => d.date instanceof Date && !isNaN(d.date) && d.total_corridas > 0); 

    // Agrupa dados diários por Mês/Ano e soma o total de corridas
    const monthlyDataMap = d3.rollup(
        cleanData, 
        v => d3.sum(v, d => d.total_corridas), // Calcula o total mensal
        d => monthYearFormat(d.date)           // Chave: '2019-01', '2019-02', etc.
    );

    const aggregatedData = Array.from(monthlyDataMap, ([key, value]) => ({
        month_label: key, // Ex: "2019-01"
        total_corridas: value
    })).sort((a, b) => a.month_label.localeCompare(b.month_label)); // Ordena cronologicamente

    // Limpa o contêiner
    d3.select(containerSelector).html(""); 

    const svg = d3.select(containerSelector)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 2. Definir Escalas
    
    const xScale = d3.scaleBand()
        .domain(aggregatedData.map(d => d.month_label)) 
        .range([0, width])
        .padding(0.1); 

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(aggregatedData, d => d.total_corridas) * 1.05])
        .range([height, 0]);

    // 3. Desenhar Barras
    svg.selectAll(".bar")
        .data(aggregatedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.month_label))
        .attr("y", d => yScale(d.total_corridas))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.total_corridas))
        .attr("fill", "#FF8C00"); // Laranja para variação

    // 4. Desenhar Eixos
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        // Exibe apenas a cada 6 meses (6 ticks por ano) para evitar superlotação
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((d, i) => !(i % 6)))) 
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)"); // Rotação para rótulos longos

    svg.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s"))); 

    // Eixo Y Label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Total de Corridas por Mês");

    // Adicionar Título Principal
    d3.select(containerSelector).append("h2")
        .style("text-align", "center")
        .text("Variação Sazonal: Total de Corridas por Mês (48 Meses)");
}