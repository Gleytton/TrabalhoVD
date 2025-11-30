import * as d3 from "d3";
import * as duckdb from '@duckdb/duckdb-wasm'; // Importar o DuckDB

// ----------------------------------------------------------------------
// 1. Configuração do DuckDB
// ----------------------------------------------------------------------

// Função utilitária para inicializar o DuckDB
async function setupDuckDB() {
    // Escolha um bundler (por exemplo, o default)
    const JSDELIVR_BUNDLES = duckdb.get=Bundles();
    
    // Configuração para o DuckDB-WASM
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    
    return db;
}

// ----------------------------------------------------------------------
// 2. Função melhorada de detecção de continente (em JavaScript)
//    Esta função permanecerá a mesma, mas a lógica de agrupamento será feita pelo SQL.
// ----------------------------------------------------------------------
function detectarContinente(lat, lon) {
    if (lat === null || lon === null) return "Desconhecido";

    // ... (Sua lógica de detecção de continente permanece a mesma)
    if (lat > 0 && lon < -25 && lon > -170) return "América do Norte";
    if (lat < 15 && lon < -25 && lon > -90) return "América Central";
    if (lat < 0 && lon < -25 && lon > -80) return "América do Sul";

    if (lat > 35 && lon > -10 && lon < 60) return "Europa";
    if (lat > -40 && lat < 35 && lon > -20 && lon < 55) return "África";

    if (lat > 5 && lon > 60 && lon < 180) return "Ásia";
    if (lat < 0 && lon > 110 && lon < 180) return "Oceania";

    return "Desconhecido";
}

// ----------------------------------------------------------------------
// 3. Função Principal: Carregar CSV, Processar com DuckDB e Chamar o Gráfico
// ----------------------------------------------------------------------
async function processarDados() {
    const db = await setupDuckDB();
    const conn = await db.connect();

    // 3.1. Carregar o arquivo CSV no DuckDB
    // Nota: O DuckDB pode ler diretamente o CSV do caminho.
    // É recomendado usar uma URL completa ou um buffer para produção.
    const csvPath = '/database.csv'; 

    // O DuckDB precisa de uma função SQL para mapear a lat/lon para continente.
    // Usaremos a função detectarContinente registrada como uma função escalar (UDF).
    await conn.register('detectarContinenteJS', detectarContinente);

    // 3.2. Consulta SQL para Agrupar e Contar
    const sqlQuery = `
        SELECT 
            detectarContinenteJS(latitude, longitude) AS continente,
            COUNT(*) AS contagem
        FROM 
            '${csvPath}'
        GROUP BY 
            continente
        ORDER BY 
            contagem DESC;
    `;

    // 3.3. Executar a consulta e obter os resultados
    const result = await conn.query(sqlQuery);

    // O resultado é uma tabela DuckDB. Convertemos para o formato que o D3 espera: Array de arrays [[Continente, Contagem], ...]
    const terremotosPorContinente = result.toArray().map(row => [
        row.continente, 
        row.contagem
    ]);

    // Fechar a conexão
    await conn.close();
    await db.close();

    // 3.4. Chamar a função de criação do gráfico
    criarGrafico(terremotosPorContinente);
}

// Chamar a função principal
processarDados().catch(console.error);

// ----------------------------------------------------------------------
// 4. Criar gráfico de barras horizontais (função D3.js)
//    Esta função permanece exatamente a mesma, pois o formato de dados final é idêntico.
// ----------------------------------------------------------------------
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