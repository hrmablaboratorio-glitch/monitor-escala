// 🔴 🔴 🔴 SUBSTITUA O LINK ABAIXO PELO SEU! 🔴 🔴 🔴
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSg26B11MR9K9OnzmZOYVZS0fMlDx7Qz0LFJvy3xlbQ-uXW7zKZarB4OAVlDIxwDopBdzwsvFCRMkLQ/pub?output=csv";

const container = document.getElementById("escala-container");
const horaAtualDiv = document.getElementById("hora-atual");

// Ordem de exibição
const cargos = ["Médico", "Anestesista", "Enfermeiro", "Técnico Enfermagem"];

function parseHora(horaStr) {
  const [h, m] = horaStr.split(':').map(Number);
  return { hours: h, minutes: m };
}

function estaEmTurno(inicio, fim, agora) {
  const inicioObj = parseHora(inicio);
  const fimObj = parseHora(fim);
  const agoraObj = { hours: agora.getHours(), minutes: agora.getMinutes() };

  let agoraMinutos = agoraObj.hours * 60 + agoraObj.minutes;
  let inicioMinutos = inicioObj.hours * 60 + inicioObj.minutes;
  let fimMinutos = fimObj.hours * 60 + fimObj.minutes;

  // Trata turno noturno (ex: 19:00 → 07:00)
  if (fimMinutos <= inicioMinutos) {
    fimMinutos += 24 * 60;
    if (agoraMinutos < inicioMinutos) {
      agoraMinutos += 24 * 60;
    }
  }

  return agoraMinutos >= inicioMinutos && agoraMinutos <= fimMinutos;
}

function atualizarHoraAtual() {
  const agora = new Date();
  const opcoes = { 
    timeZone: 'America/Fortaleza',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  };
  const horaBR = new Intl.DateTimeFormat('pt-BR', opcoes).format(agora);
  horaAtualDiv.textContent = `Hora atual: ${horaBR}`;
  return agora;
}

async function carregarEscala() {
  try {
    const resposta = await fetch(SHEET_URL);
    const texto = await resposta.text();

    const linhas = texto.split("\n").slice(1);
    const dados = [];

    linhas.forEach(linha => {
      if (!linha.trim()) return;
      // Lida com vírgulas em nomes (ex: "Silva, Ana")
      const colunas = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g, "").trim());
      if (colunas.length >= 6) {
        dados.push({
          cargo: colunas[0],
          nome: colunas[1],
          especialidade: colunas[2],
          turno: colunas[3],
          inicio: colunas[4],
          fim: colunas[5]
        });
      }
    });

    const agora = atualizarHoraAtual();
    container.innerHTML = "";

    cargos.forEach(cargo => {
      const profissionais = dados.filter(p => p.cargo === cargo);
      profissionais.forEach(p => {
        const emTurno = estaEmTurno(p.inicio, p.fim, agora);
        const card = document.createElement("div");
        card.className = `funcionario-card ${emTurno ? 'ativo' : ''}`;
        card.innerHTML = `
          <h3>${p.cargo}</h3>
          <div class="nome">${p.nome}</div>
          <div class="especialidade">${p.especialidade}</div>
          <div class="turno">Turno: ${p.turno}</div>
          <div class="horario">${p.inicio} – ${p.fim}</div>
        `;
        container.appendChild(card);
      });
    });

  } catch (erro) {
    container.innerHTML = `<p style="color:red;text-align:center;padding:20px;">⚠️ Erro ao carregar a escala.<br>Verifique a conexão e o link da planilha.</p>`;
    console.error("Erro ao buscar escala:", erro);
  }
}

// Carrega imediatamente e atualiza a cada 30 segundos
carregarEscala();
setInterval(carregarEscala, 30000);
