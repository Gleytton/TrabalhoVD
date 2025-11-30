
import { initDuckDB } from './config.js';

export async function buscarDadosIniciais() {
  // 1. Inicia o banco
  const db = await initDuckDB();
  const conn = await db.connect();


  const csvUrl = '/Data/terremotos.csv';
  const response = await fetch(csvUrl);
  const csvText = await response.text();
  
  await db.registerFileText('meus_dados.csv', csvText);

  // 3. Roda a Query
  const result = await conn.query(`
      SELECT count(*)  as linhas
      FROM 'meus_dados.csv' 
      LIMIT 1
  `);

  // 4. Fecha conexão e retorna JSON limpo
  await conn.close();
  return result.toArray().map((row) => row.toJSON());
}

