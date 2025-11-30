import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

const MANUAL_BUNDLES = {
    mvp: {
        mainModule: duckdb_wasm,
        mainWorker: mvp_worker,
    },
    eh: {
        mainModule: duckdb_eh,
        mainWorker: eh_worker,
    },
};

// Singleton para não reinicializar o DB múltiplas vezes
let dbInstance = null;

export async function initDuckDB() {
    if (dbInstance) return dbInstance;

    // 1. Seleciona o bundle correto (MVP ou EH dependendo do suporte do navegador)
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

    // 2. Instancia o worker
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();
    
    // 3. Inicializa o banco de dados
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule);
    
    dbInstance = db;
    return db;
}