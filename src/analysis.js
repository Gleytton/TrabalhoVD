// src/analysis.js

/**
 * Registra os arquivos .parquet lendo o buffer completo.
 * Este método é mais robusto contra erros de 'File Handle' e 'Too Small'.
 */
export async function registerFiles(db, files) {
    if (files.length === 0) {
        throw new Error("Nenhum arquivo selecionado.");
    }
    
    // Lista para armazenar o nome dos arquivos registrados
    const fileNames = [];

    // db é a instância do AsyncDuckDB
    for (const file of files) {
        // AÇÃO CRÍTICA: Ler o arquivo para ArrayBuffer
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);

        // Registrar o buffer de memória no DuckDB
        // O método correto para buffers é registerFileBuffer
        await db.registerFileBuffer(file.name, data);
        
        fileNames.push(file.name);
    }
    
    return fileNames; // Retorna a lista de nomes dos arquivos
}

/**
 * Executa todas as consultas de agregação e retorna os resultados como um objeto.
 */
export async function runAnalyses(conn, fileNames) {
    const fileListSQL = `[${fileNames.map(f => `'${f}'`).join(', ')}]`;
    const resultados = {};

    const executarConsulta = async (conn, query) => {
        let result = await conn.query(query);
        return result.toArray().map(row => row.toJSON());
    };

    // --- Consultas Agregadas (Integrante 1) ---

    // Consulta 1: Análise Diária (Temporal Base)
    resultados.analiseDiaria = await executarConsulta(conn, `
        SELECT
            DATE_TRUNC('day', tpep_pickup_datetime) AS dia_corrida,
            COUNT(*) AS total_corridas,
            AVG(fare_amount) AS tarifa_media
        FROM read_parquet(${fileListSQL})
        WHERE total_amount > 0 AND trip_distance > 0
        GROUP BY 1
        ORDER BY 1;
    `);

    // Consulta 2: Análise Horária e Semanal (Temporal Detalhada - Integrante 2)
    resultados.analiseHoraria = await executarConsulta(conn, `
        SELECT
            CAST(EXTRACT(HOUR FROM tpep_pickup_datetime) AS INTEGER) AS hora_do_dia,
            CAST(EXTRACT(DOW FROM tpep_pickup_datetime) AS INTEGER) AS dia_da_semana,
            COUNT(*) AS total_corridas,
            AVG(fare_amount) AS tarifa_media
        FROM read_parquet(${fileListSQL})
        WHERE total_amount > 0 AND trip_distance > 0
        GROUP BY 1, 2
        ORDER BY 1, 2;
    `);

    // Consulta 3: Análise Financeira e Composição (Integrante 3)
    resultados.analiseFinanceira = await executarConsulta(conn, `
        SELECT
            payment_type,
            COUNT(*) AS total_corridas,
            AVG(tip_amount) AS gorjeta_media,
            AVG(total_amount) AS total_medio_pago
        FROM read_parquet(${fileListSQL})
        WHERE total_amount > 0 AND trip_distance > 0
        GROUP BY 1
        ORDER BY 2 DESC;
    `);
    
    return resultados;
}