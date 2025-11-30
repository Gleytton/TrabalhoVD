// src/main.js
import './style.css';
import { buscarDadosIniciais, buscarPorContinente } from './analises';
import { renderTerremotosTendencia } from './charts/terremotosTendencia';
import { renderTerremotosPorContinente } from './charts/terremotosPorContinente';

// Layout da dashboard - trend chart ocupando topo full-width, outros gráficos empilhados abaixo
document.querySelector('#app').innerHTML = `
  <header class="app-header">
    <div class="brand">
      <h1>Visualização de Terremotos</h1>
      <p class="subtitle">Dashboard com DuckDB + D3</p>
    </div>
    <div class="meta">
      <span id="status">Carregando...</span>
    </div>
  </header>

  <main class="dashboard">
    <section class="content">
      <div class="cards-stack">
        <!-- Card principal: ocupa toda a largura e maior altura -->
        <div class="card card-trend">
          <div class="card-header">
            <h2>Tendência de terremotos por ano</h2>
            <small>Contagem anual (todos os locais)</small>
          </div>
          <div id="chart-terremotos" class="chart-area chart-full"></div>
        </div>

        <!-- Gráfico 2: Terremotos por continente (adaptado do colega) -->
        <div class="card">
          <div class="card-header">
            <h2>Terremotos por continente</h2>
            <small>Total de eventos por continente</small>
          </div>
          <div id="chart-2" class="chart-area chart-full"></div>
        </div>

        <!-- Placeholder para gráficos adicionais -->
        <div class="card">
          <div class="card-header">
            <h2>Gráfico futuro 2</h2>
            <small>Aguardando implementação</small>
          </div>
          <div id="chart-3" class="chart-area placeholder">Em breve</div>
        </div>
      </div>
    </section>
  </main>

  <footer class="app-footer">
    <small>Feito com DuckDB e D3 — sua dashboard local</small>
  </footer>
`;

async function iniciarApp() {
  try {
    const status = document.getElementById('status');
    status.innerText = 'Carregando dados...';

    // dados de tendência (ano)
    const dados = await buscarDadosIniciais();
    status.innerText = 'Dados carregados';
    const totalRegistros = dados.reduce((s, d) => s + d.count, 0);
    document.querySelector('.meta #status').innerText = `Registros: ${totalRegistros}`;

    // Renderiza o gráfico de tendência
    renderTerremotosTendencia('#chart-terremotos', dados);

    // Agora carrega os dados por continente e renderiza o gráfico 2
    const dadosContinentes = await buscarPorContinente();
    // remover continentes "Desconhecido" se quiser
    const dadosLimpos = dadosContinentes.filter(d => d.continente !== 'Desconhecido');
    renderTerremotosPorContinente('#chart-2', dadosLimpos);

  } catch (err) {
    console.error(err);
    document.querySelector('.meta #status').innerText = 'Erro ao carregar dados';
    const chart = document.querySelector('#chart-terremotos');
    if (chart) chart.innerText = 'Erro: ' + err.message;
  }
}

iniciarApp();