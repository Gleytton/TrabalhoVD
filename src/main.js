// src/main.js

import { loadDb } from "./config";
import { registerFiles, runAnalyses } from "./analysis";
// Importamos AMBOS os gráficos
import { createTemporalLineChart, 
        createHourlyHeatmap,
        createPaymentTypeDonutChart ,
         createMonthlyBarChart } from "./charts"; 

// Função simples para exibir resultados
function appendResults(title, data, targetId = "#results") {
    const tableDiv = document.querySelector(targetId);
    let tableHTML = `<h2>${title} (Amostra de ${data.length} linhas)</h2>`;
    
    if (data.length === 0) {
        tableDiv.innerHTML += `${tableHTML} <p>Nenhum dado encontrado para esta análise.</p>`;
        return;
    }

    // Cria a tabela
    tableHTML += '<table border="1"><tr>';
    Object.keys(data[0]).forEach(key => { tableHTML += `<th>${key}</th>`; });
    tableHTML += '</tr>';

    data.forEach( (item) => {
        tableHTML += '<tr>';
        Object.values(item).forEach(value => { tableHTML += `<td>${value}</td>`; });
        tableHTML += '</tr>';
    });
    tableHTML += '</table>';

    if(tableDiv) {
        tableDiv.innerHTML += tableHTML;
    }
}

window.onload = async () => {
    const input = document.getElementById('parquet-files-input');
    const button = document.getElementById('process-button');
    const outputDiv = document.getElementById('output');
    const resultsDiv = document.getElementById('results');
    
    // Novas constantes para os contêineres de gráfico
    const lineChartContainer = document.getElementById('temporal-chart-container');
    const barChartContainer = document.getElementById('monthly-bar-chart-container');

    // Inicializa o Listener do Botão
    input.addEventListener('change', () => {
        button.disabled = input.files.length === 0;
        outputDiv.textContent = '';
        resultsDiv.innerHTML = '';
        lineChartContainer.innerHTML = ''; // Limpa o contêiner 1
        barChartContainer.innerHTML = ''; // Limpa o contêiner 2
    });

    button.addEventListener('click', async () => {
        const files = Array.from(input.files);
        if (files.length === 0) return;
        
        outputDiv.textContent = 'Iniciando o DB e Processando...';
        resultsDiv.innerHTML = '';
        lineChartContainer.innerHTML = ''; 
        barChartContainer.innerHTML = ''; 
        button.disabled = true;

        let db = null;
        let conn = null;

        try {
            // 1. INICIALIZA O BANCO DE DADOS
            db = await loadDb();
            conn = await db.connect();
            outputDiv.textContent = 'DB inicializado. Registrando arquivos...';

            // 2. REGISTRA E RODA AS ANÁLISES
            const fileNames = await registerFiles(db, files);
            outputDiv.textContent = `Arquivos registrados. Executando ${fileNames.length} consultas...`;
            
            const results = await runAnalyses(conn, fileNames);

            // 3. 📈 VISUALIZAÇÃO D3.JS (CHAMANDO AMBOS OS GRÁFICOS)
            
            // A. Gráfico de Linha (Temporal Contínuo)
            createTemporalLineChart(
                results.analiseDiaria, 
                "#temporal-chart-container" 
            );

            // B. Gráfico de Barras Mensais (Sazonalidade)
            createMonthlyBarChart(
                results.analiseDiaria, 
                "#monthly-bar-chart-container" // Usa o segundo contêiner
            );

            // C. Heatmap de Horário
            createHourlyHeatmap(
                results.analiseHoraria,
                "#heatmap-chart-container"
            );

            // D. Gráfico de Rosca (Pagamentos)
            createPaymentTypeDonutChart(
                results.analiseFinanceira,
                "#donut-chart-container"
            );

            outputDiv.textContent = '✅ Sucesso! Gráficos e resultados exibidos abaixo.';

        } catch (error) {
            outputDiv.textContent = `❌ Erro Fatal no Processamento. Verifique o console.`;
            resultsDiv.innerHTML = `<h2>Erro:</h2><pre>${error.message}</pre>`;
            console.error(error);
        } finally {
            if (conn) await conn.close();
            if (db) await db.terminate();
            button.disabled = false;
        }
    });
};