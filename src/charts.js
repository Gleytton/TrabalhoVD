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
export function createHourlyHeatmap(data, containerSelector) {
    // 1. Limpeza e Mapeamento de Dados
    // Mapeia os números DOW (Day of Week) do SQL (0=Domingo, 1=Segunda...) para nomes
    const dayOfWeekNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    // Mapeia as horas (0-23) para labels
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
    // 🛑 AÇÃO: Ajuste na margem inferior para os rótulos de hora
    const heatmapMargin = { top: 30, right: 30, bottom: 40, left: 50 }; 
    const heatmapWidth = 900 - heatmapMargin.left - heatmapMargin.right;
    const heatmapHeight = 350 - heatmapMargin.top - heatmapMargin.bottom;

    const svg = d3.select(containerSelector)
        .append("svg")
        .attr("width", heatmapWidth + heatmapMargin.left + heatmapMargin.right)
        .attr("height", heatmapHeight + heatmapMargin.top + heatmapMargin.bottom)
        .append("g")
        .attr("transform", `translate(${heatmapMargin.left},${heatmapMargin.top})`);

    // 3. Definição das Escalas
    // Eixo X (Horas)
    const xScale = d3.scaleBand()
        .range([0, heatmapWidth])
        .domain(hourLabels)
        .padding(0.05);

    // Eixo Y (Dias da Semana)
    const yScale = d3.scaleBand()
        .range([heatmapHeight, 0]) // Invertido para Dom (0) ficar no topo
        .domain(dayOfWeekNames) 
        .padding(0.05);

    // Escala de Cor
    const maxCorridas = d3.max(cleanData, d => d.total_corridas);
    const colorScale = d3.scaleSequential(d3.interpolateInferno) // Experimente: interpolateViridis, interpolatePlasma
        .domain([0, maxCorridas]);

    // 4. Desenhar os Eixos
    svg.append("g")
        .attr("transform", `translate(0,${heatmapHeight})`)
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((d, i) => i % 2 === 0))) // Mostra a cada 2 horas
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
        .append("title") // Tooltip simples
        .text(d => `${dayOfWeekNames[d.dia_da_semana]}, ${d.hora_do_dia}h: ${d.total_corridas.toLocaleString()} corridas`);

    // 6. Título do Gráfico
    svg.append("text")
        .attr("x", heatmapWidth / 2)
        .attr("y", 0 - (heatmapMargin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Volume de Corridas por Hora e Dia da Semana");
}

export function createPaymentTypeDonutChart(data, containerSelector) {
    // 1. Mapeamento de Dados
    // Os dados de táxi usam IDs: 1=Cartão, 2=Dinheiro, 3=Não pago, 4=Disputa, etc.
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
            // Mapeia o ID para um nome legível
            payment_type_label: paymentTypeMap[d.payment_type] || `Outro (${d.payment_type})`, 
            total_corridas: Number(String(d.total_corridas))
        }))
        .filter(d => d.total_corridas > 0); // Filtra tipos sem corridas

    if (cleanData.length === 0) {
        document.querySelector(containerSelector).innerHTML = "Nenhum dado para o gráfico de pagamentos.";
        return;
    }

    // 2. Setup do SVG
    const donutWidth = 450;
    const donutHeight = 450;
    const donutMargin = 40;
    const radius = Math.min(donutWidth, donutHeight) / 2 - donutMargin;

    const svg = d3.select(containerSelector)
        .append("svg")
        .attr("width", donutWidth)
        .attr("height", donutHeight)
        .append("g")
        .attr("transform", `translate(${donutWidth / 2},${donutHeight / 2})`);

    // 3. Escala de Cor
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(cleanData.map(d => d.payment_type_label));

    // 4. Geradores de Pie e Arc
    // Gera os ângulos para cada fatia
    const pie = d3.pie()
        .value(d => d.total_corridas)
        .sort(null); // Mantém a ordem dos dados (que já vêm ordenados por total_corridas)

    // Define o raio interno e externo (para criar o "buraco" do donut)
    const arc = d3.arc()
        .innerRadius(radius * 0.5) // Raio interno (aumente para um buraco maior)
        .outerRadius(radius * 0.8);

    const outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

    // 5. Desenhar as Fatias do Donut
    const arcs = svg.selectAll(".arc")
        .data(pie(cleanData))
        .enter()
        .append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => colorScale(d.data.payment_type_label))
        .append("title")
        .text(d => `${d.data.payment_type_label}: ${d.data.total_corridas.toLocaleString()} corridas`);

    // 6. Adicionar Rótulos (Opcional, mas recomendado)
    // ... (Código para adicionar rótulos e linhas de legenda pode ser complexo,
    // por simplicidade, estamos usando o <title> para tooltip)
    // Vamos adicionar um título central
    svg.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Tipos de Pagamento");
}