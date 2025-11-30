// src/main.js
import './style.css';
import * as d3 from 'd3';
// Importamos a função de análise do novo arquivo
import { buscarDadosIniciais } from './analises'; 

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Dashboard DuckDB</h1>
    <div id="loading">Carregando dados...</div>
    <div id="resultado"></div>
    <div id="chart"></div>
  </div>
`;

async function iniciarApp() {
  try {
    console.log("Iniciando análise...");

    // CHAMA A LÓGICA SEPARADA AQUI
    const dados = await buscarDadosIniciais();

    // Sumir com o loading
    document.getElementById('loading').style.display = 'none';

    // Mostrar no Console
    console.table(dados);

    // Mostrar na tela (HTML simples já que é só 1 linha)
    mostrarDadosNaTela(dados);


  } catch (err) {
    console.error(err);
    document.getElementById('loading').innerText = "Erro: " + err.message;
  }
}

// Função auxiliar apenas para imprimir JSON na tela
function mostrarDadosNaTela(dados) {
  const div = document.getElementById('resultado');

    const total = dados[0].linhas.toString();

  const jsonTexto = JSON.stringify(dados, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  , 2);

  div.innerHTML = `
    <h3>Sucesso! Veja a primeira linha:</h3>
    <pre style="background: #000000ff; padding: 10px; border-radius: 5px; overflow: auto; text-align: left;">${total}</pre>
  `;
    d3.select("body")
    .append("p")
    .text("New paragraph!");
}

iniciarApp();