// src/analises.js
import { initDuckDB } from './config.js';

export async function buscarDadosIniciais() {
  // 1. Inicia o banco
  const db = await initDuckDB();
  const conn = await db.connect();

  try {
    // Carrega o CSV da pasta public (vite serve disponibiliza /Data/terremotos.csv)
    const csvUrl = '/Data/terremotos.csv';
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    // Registra o arquivo no DuckDB (nome arbitrário)
    await db.registerFileText('meus_dados.csv', csvText);

    // Query: tenta identificar o formato da data e extrair o ano.
    const result = await conn.query(`
      SELECT
        CAST(
          EXTRACT(
            year FROM (
              CASE
                WHEN "Date" LIKE '%T%' THEN CAST("Date" AS TIMESTAMP)
                WHEN "Date" LIKE '%/%/%,%:%:%' THEN strptime("Date", '%m/%d/%Y,%H:%M:%S')
                WHEN "Date" LIKE '%/%/%' THEN strptime("Date", '%m/%d/%Y')
                ELSE NULL
              END
            )
          ) AS INTEGER
        ) AS year,
        COUNT(*) AS count
      FROM 'meus_dados.csv'
      WHERE "Date" IS NOT NULL AND trim("Date") != ''
      GROUP BY year
      ORDER BY year
    `);

    const rows = result
      .toArray()
      .map((r) => r.toJSON())
      .map((row) => ({
        year: row.year === null ? null : Number(row.year),
        count: row.count === null ? 0 : Number(row.count),
      }))
      .filter((r) => r.year !== null);

    return rows;
  } finally {
    await conn.close();
  }
}

// Nova função: agrega por continente (adaptada do código do colega)
export async function buscarPorContinente() {
  const db = await initDuckDB();
  const conn = await db.connect();

  try {
    const csvUrl = '/Data/terremotos.csv';
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    await db.registerFileText('meus_dados.csv', csvText);

    // Macro para detectar continente (mantive a lógica do outro membro)
    await conn.query(`
      CREATE OR REPLACE MACRO detectar_continente(lat, lon) AS
      CASE
          WHEN lat IS NULL OR lon IS NULL THEN 'Desconhecido'
          WHEN lat > 0 AND lon < -25 AND lon > -170 THEN 'América do Norte'
          WHEN lat < 15 AND lon < -25 AND lon > -90 THEN 'América Central'
          WHEN lat < 0 AND lon < -25 AND lon > -80 THEN 'América do Sul'
          WHEN lat > 35 AND lon > -10 AND lon < 60 THEN 'Europa'
          WHEN lat > -40 AND lat < 35 AND lon > -20 AND lon < 55 THEN 'África'
          WHEN lat > 5 AND lon > 60 AND lon < 180 THEN 'Ásia'
          WHEN lat < 0 AND lon > 110 AND lon < 180 THEN 'Oceania'
          ELSE 'Desconhecido'
      END;
    `);

    const result = await conn.query(`
      SELECT
        count(*) AS total_terremotos,
        detectar_continente(Latitude, Longitude) AS continente
      FROM 'meus_dados.csv'
      GROUP BY continente
      ORDER BY total_terremotos DESC
    `);

    const dadosFormatados = result.toArray().map((row) => {
      const obj = row.toJSON();
      return {
        ...obj,
        total_terremotos: Number(obj.total_terremotos),
      };
    });

    return dadosFormatados;
  } finally {
    await conn.close();
  }
}