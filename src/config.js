// src/config.js
import * as duckdb from '@duckdb/duckdb-wasm';
// Estes imports são TRUQUES do Vite para obter o caminho local (URL) dos arquivos:
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

const MANUAL_BUNDLES = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: mvp_worker,
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: eh_worker,
  },
};

/**
 * Inicializa a instância assíncrona do DuckDB.
 */
export async function loadDb() {
  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

  // Instanciação: Usa o Worker e o Módulo com paths locais fornecidos pelo Vite
  const worker = new Worker(bundle.mainWorker);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  
  // O await garante que o WASM principal seja carregado.
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  return db;
}