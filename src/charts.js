// src/charts.js

import * as d3 from 'd3'; 

// Dimensões do gráfico padrão
const margin = { top: 50, right: 30, bottom: 60, left: 80 }; // Aumentei o top margin para títulos/legendas

// 🛑 AÇÃO para 'percorrer toda a página': Aumenta a largura base.
const BASE_WIDTH = 1200; // Define uma largura ampla
const width = BASE_WIDTH - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Formatador para criar rótulos de Mês-Ano
const monthYearFormat = d3.timeFormat("%Y-%m"); 


/**
 * Cria o Gráfico de Linha de Série Temporal (Tendência de Corridas Diárias)
 */
export function createTemporalLineChart(data, containerSelector) {
    
    // 1. Pré-processamento e Limpeza
    const cleanData = data.map(d => ({
        date: new Date(d.dia_corrida), 
        total_corridas: Number(String(d.total_corridas)) 
    }))
    .filter(d => d.date instanceof Date && !isNaN(d.date) && d.total_corridas > 0); 
    
    if (cleanData.length === 0) {
        d3.select(containerSelector).html("<h2>Não foi possível gerar a Série Temporal.</h2>");
        return;
    }

    d3.select(containerSelector).html(""); 

    const svgContainer = d3.select(containerSelector)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("display", "block")
        .style("margin", "0 auto");

    const svg = svgContainer.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 2. Definir Escalas
    const xScale = d3.scaleTime()
        .domain([new Date('2018-12-01'), new Date('2023-01-31')]) 
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(cleanData, d => d.total_corridas) * 1.05])
        .range([height, 0]);

    // 3. Desenhar Eixos
    // ... (Eixos X e Y sem alteração) ...
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

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Total de Corridas por Dia");

    // 4. Desenhar a Linha
    const lineColor = "#4682B4"; // Cor da linha
    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.total_corridas));

    svg.append("path")
        .datum(cleanData) 
        .attr("fill", "none")
        .attr("stroke", lineColor) 
        .attr("stroke-width", 2)
        .attr("d", line);

    // 5. Título Principal
    svgContainer.append("text")
        .attr("x", (width + margin.left + margin.right) / 2)
        .attr("y", margin.top / 2) // Posição do Título
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Análise Temporal: Volume Diário de Corridas (2019-2022)");

    // 6. 🛑 AÇÃO: Legenda Simples
    const legend = svgContainer.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top / 2 + 10})`); // Abaixo do título

    legend.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", lineColor);

    legend.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text("Corridas Diárias")
        .style("font-size", "12px");
}


/**
 * Cria o Gráfico de Barras para Variação Mensal (48 Meses).
 */
export function createMonthlyBarChart(data, containerSelector) {
    
    // 1. Pré-processamento e Agregação por Mês
    // ... (dados de agregação sem alteração) ...
    const cleanData = data.map(d => ({
        date: new Date(d.dia_corrida), 
        total_corridas: Number(String(d.total_corridas)) 
    })).filter(d => d.date instanceof Date && !isNaN(d.date) && d.total_corridas > 0); 

    const monthlyDataMap = d3.rollup(
        cleanData, 
        v => d3.sum(v, d => d.total_corridas), 
        d => monthYearFormat(d.date) 
    );

    const aggregatedData = Array.from(monthlyDataMap, ([key, value]) => ({
        month_label: key, 
        total_corridas: value
    })).sort((a, b) => a.month_label.localeCompare(b.month_label)); 

    d3.select(containerSelector).html(""); 

    const svgContainer = d3.select(containerSelector)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("display", "block")
        .style("margin", "0 auto");
        
    const svg = svgContainer.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 2. Definir Escalas
    // ... (escalas X e Y sem alteração) ...
    const xScale = d3.scaleBand()
        .domain(aggregatedData.map(d => d.month_label)) 
        .range([0, width])
        .padding(0.1); 

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(aggregatedData, d => d.total_corridas) * 1.05])
        .range([height, 0]);

    // 3. Desenhar Barras
    const barColor = "#FF8C00";
    svg.selectAll(".bar")
        .data(aggregatedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.month_label))
        .attr("y", d => yScale(d.total_corridas))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.total_corridas))
        .attr("fill", barColor)
        // 🛑 AÇÃO: Adiciona o tooltip <title> simples
        .append("title")
        .text(d => `${d.month_label}: ${d.total_corridas.toLocaleString()} corridas`);

    // 4. Desenhar Eixos
    // ... (eixos X e Y sem alteração) ...
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((d, i) => !(i % 6)))) 
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)"); 

    svg.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s"))); 

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Total de Corridas por Mês");

    // 5. Título Principal
    svgContainer.append("text")
        .attr("x", (width + margin.left + margin.right) / 2)
        .attr("y", margin.top / 2) // Posição do Título
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Variação Sazonal: Total de Corridas por Mês (48 Meses)");
        
    // 6. 🛑 AÇÃO: Legenda Simples
    const legend = svgContainer.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top / 2 + 10})`); // Abaixo do título

    legend.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", barColor);

    legend.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text("Total Mensal")
        .style("font-size", "12px");
}

/**
 * Cria o Gráfico de Heatmap (Hora do Dia vs. Dia da Semana)
 */
export function createHourlyHeatmap(data, containerSelector) {
    // 1. Limpeza e Mapeamento
    const dayOfWeekNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const hourLabels = d3.range(24).map(h => `${h}h`);

    const cleanData = data.map(d => ({
        dia_da_semana: Number(String(d.dia_da_semana)),
        hora_do_dia: Number(String(d.hora_do_dia)),
        total_corridas: Number(String(d.total_corridas))
    }));

    if (cleanData.length === 0) {
        document.querySelector(containerSelector).innerHTML = "Nenhum dado para o Heatmap.";
        return;
    }

    // 2. Setup do SVG
    // 🛑 AÇÃO: Ajuste de margem para legenda
    const heatmapMargin = { top: 50, right: 100, bottom: 40, left: 50 }; 
    const heatmapWidth = 900 - heatmapMargin.left - heatmapMargin.right;
    const heatmapHeight = 350 - heatmapMargin.top - heatmapMargin.bottom;

    d3.select(containerSelector).html(""); 

    const svgContainer = d3.select(containerSelector)
        .append("svg")
        .attr("width", heatmapWidth + heatmapMargin.left + heatmapMargin.right)
        .attr("height", heatmapHeight + heatmapMargin.top + heatmapMargin.bottom)
        .style("display", "block")
        .style("margin", "0 auto");

    const svg = svgContainer.append("g")
        .attr("transform", `translate(${heatmapMargin.left},${heatmapMargin.top})`);

    // 3. Definição das Escalas
    // ... (escalas X, Y, Color sem alteração) ...
    const xScale = d3.scaleBand()
        .range([0, heatmapWidth])
        .domain(hourLabels)
        .padding(0.05);

    const yScale = d3.scaleBand()
        .range([heatmapHeight, 0]) 
        .domain(dayOfWeekNames) 
        .padding(0.05);

    const maxCorridas = d3.max(cleanData, d => d.total_corridas);
    const colorScale = d3.scaleSequential(d3.interpolateInferno) 
        .domain([0, maxCorridas]);

    // 4. Desenhar os Eixos
    // ... (eixos X e Y sem alteração) ...
    svg.append("g")
        .attr("transform", `translate(0,${heatmapHeight})`)
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((d, i) => i % 2 === 0))) 
        .selectAll("text")
        .style("text-anchor", "middle");

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // 5. Desenhar os Retângulos (Células do Heatmap)
    svg.selectAll()
        .data(cleanData)
        .enter()
        .append("rect")
        .attr("x", d => xScale(`${d.hora_do_dia}h`))
        .attr("y", d => yScale(dayOfWeekNames[d.dia_da_semana]))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .style("fill", d => colorScale(d.total_corridas))
        // 🛑 AÇÃO: Adiciona o tooltip <title> simples
        .append("title") 
        .text(d => `${dayOfWeekNames[d.dia_da_semana]}, ${d.hora_do_dia}h: ${d.total_corridas.toLocaleString()} corridas`);

    // 6. Título do Gráfico
    svgContainer.append("text")
        .attr("x", (heatmapWidth + heatmapMargin.left + heatmapMargin.right) / 2)
        .attr("y", heatmapMargin.top / 2) // Posição do Título
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Volume de Corridas por Hora e Dia da Semana");

    // 7. 🛑 AÇÃO: Legenda de Cor (Gradiente)
    const legendHeight = 200;
    const legendWidth = 20;

    const defs = svgContainer.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "heatmap-gradient")
        .attr("x1", "0%").attr("y1", "100%") // De baixo
        .attr("x2", "0%").attr("y2", "0%");  // Para cima

    linearGradient.selectAll("stop")
        .data(colorScale.ticks(10).map((t, i, n) => ({ 
            offset: `${100*i/n.length}%`, 
            color: colorScale(t) 
        })))
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    const legend = svgContainer.append("g")
        .attr("transform", `translate(${heatmapWidth + heatmapMargin.left + 20}, ${heatmapMargin.top})`);

    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#heatmap-gradient)");

    const legendScale = d3.scaleLinear()
        .domain([0, maxCorridas])
        .range([legendHeight, 0]);

    legend.append("g")
        .attr("transform", `translate(${legendWidth}, 0)`)
        .call(d3.axisRight(legendScale).ticks(5).tickFormat(d3.format(".1s")));

    legend.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Corridas");
}

/**
 * Cria o Gráfico de Donut (Tipos de Pagamento)
 */
export function createPaymentTypeDonutChart(data, containerSelector) {
    // 1. Mapeamento de Dados
    const paymentTypeMap = {
        1: "Cartão de Crédito",
        2: "Dinheiro",
        3: "Não Pago",
        4: "Disputa",
        5: "Desconhecido",
        6: "Viagem Anulada"
    };

    const cleanData = data
        .map(d => ({
            payment_type_label: paymentTypeMap[d.payment_type] || `Outro (${d.payment_type})`, 
            total_corridas: Number(String(d.total_corridas))
        }))
        .filter(d => d.total_corridas > 0); 

    if (cleanData.length === 0) {
        document.querySelector(containerSelector).innerHTML = "Nenhum dado para o gráfico de pagamentos.";
        return;
    }

    // 2. Setup do SVG
    // 🛑 AÇÃO: Ajuste de tamanho e margem para legenda
    const donutWidth = 500; 
    const donutHeight = 450;
    const donutMargin = 50;
    const radius = Math.min(donutWidth, donutHeight) / 2 - donutMargin - 50; 

    d3.select(containerSelector).html(""); 

    const svgContainer = d3.select(containerSelector)
        .append("svg")
        .attr("width", donutWidth)
        .attr("height", donutHeight)
        .style("display", "block")
        .style("margin", "0 auto");
        
    // Grupo para o Donut (deslocado para a esquerda)
    const svg = svgContainer.append("g")
        .attr("transform", `translate(${donutWidth / 2 - 70}, ${donutHeight / 2})`); 

    // 3. Escala de Cor
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(cleanData.map(d => d.payment_type_label));

    // 4. Geradores de Pie e Arc
    const pie = d3.pie()
        .value(d => d.total_corridas)
        .sort(null); 

    const arc = d3.arc()
        .innerRadius(radius * 0.5) 
        .outerRadius(radius * 0.8);

    // 5. Desenhar as Fatias do Donut
    const arcs = svg.selectAll(".arc")
        .data(pie(cleanData))
        .enter()
        .append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => colorScale(d.data.payment_type_label))
        // 🛑 AÇÃO: Adiciona o tooltip <title> simples
        .append("title")
        .text(d => `${d.data.payment_type_label}: ${d.data.total_corridas.toLocaleString()} corridas`);

    // 6. Título do Gráfico
    svgContainer.append("text")
        .attr("x", donutWidth / 2) 
        .attr("y", donutMargin - 20) 
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Tipos de Pagamento");

    // 7. 🛑 AÇÃO: Legenda Categórica (Simples)
    const legend = svgContainer.append("g")
        .attr("transform", `translate(${donutWidth - 180}, ${donutMargin + 50})`); // Posição da legenda

    const legendItems = legend.selectAll(".legend-item")
        .data(cleanData)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 25})`); // Espaçamento vertical

    legendItems.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => colorScale(d.payment_type_label));

    legendItems.append("text")
        .attr("x", 20) 
        .attr("y", 12) 
        .text(d => d.payment_type_label)
        .style("font-size", "12px");
}