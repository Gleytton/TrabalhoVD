
import { initDuckDB } from './config.js';

export async function buscarDadosIniciais() {
  // 1. Inicia o banco
  const db = await initDuckDB();
  const conn = await db.connect();


  const csvUrl = '/Data/terremotos.csv';
  const response = await fetch(csvUrl);
  const csvText = await response.text();
  
  await db.registerFileText('meus_dados.csv', csvText);

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
  // 3. Roda a Query
  const result = await conn.query(`
      SELECT count(*)  as total_terremotos,
      detectar_continente(Latitude, Longitude) as continente
      FROM 'meus_dados.csv' 
      GROUP BY continente
      ORDER BY total_terremotos DESC
  `);

    const dadosFormatados = result.toArray().map((row) => {
      const obj = row.toJSON();
      return {
        ...obj,
        // Converte o BigInt do DuckDB para Number do JS para o D3 não travar
        total_terremotos: Number(obj.total_terremotos) 
      };
    });
  // 4. Fecha conexão e retorna JSON limpo
  await conn.close();
  return dadosFormatados;
}

