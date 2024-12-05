const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

// Variáveis de ambiente
const argoUrl = process.env.ARGO_URL || 'https://argocd.example.com';  // URL do ArgoCD
const applications = JSON.parse(process.env.APPLICATIONS_LIST || '[]'); // Lista de aplicações do ConfigMap
const username = process.env.USERNAME; // A variável de ambiente do usuário
const password = process.env.PASSWORD; // A variável de ambiente da senha

// Função para buscar o status da aplicação no Argo CD
async function getArgoStatus(appName) {
    const url = `${argoUrl}/api/badge?name=${appName}&revision=true`;
    const response = await fetch(url);
    const badgeData = await response.text();

    let healthStatus = 'unknown';

    if (badgeData.includes('Healthy')) healthStatus = 'healthy';
    else if (badgeData.includes('Progressing')) healthStatus = 'progressing';
    else if (badgeData.includes('Degraded')) healthStatus = 'degraded';
    else if (badgeData.includes('Suspended')) healthStatus = 'suspended';
    else if (badgeData.includes('Missing')) healthStatus = 'missing';

    return { healthStatus };
}

// Função para buscar e exibir as aplicações no Argo CD
async function fetchAppStatus() {
    const statusList = [];

    // Buscar o status de cada aplicação e criar/atualizar os cards
    for (const app of applications) {
        const status = await getArgoStatus(app.name);  // Obter o status da aplicação via API
        statusList.push({ app: app.name, status: status.healthStatus });
    }

    return statusList;
}

// Endpoint para obter o status das aplicações
app.get('/status', async (req, res) => {
    try {
        const status = await fetchAppStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar o status das aplicações', error: error.message });
    }
});

// Função para verificar login e manter sessão
function checkSession() {
    const session = localStorage.getItem('userLoggedIn');
    if (session === 'true') {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('main-container').style.display = 'flex';
        fetchAppStatus();
    } else {
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('main-container').style.display = 'none';
    }
}

// Função para realizar login
function login() {
    const inputUsername = document.getElementById('username').value;
    const inputPassword = document.getElementById('password').value;

    if (inputUsername === username && inputPassword === password) {
        localStorage.setItem('userLoggedIn', 'true');
        checkSession();
    } else {
        alert('Usuário ou senha incorretos!');
    }
}

// Função para realizar logout
function logout() {
    localStorage.removeItem('userLoggedIn');
    checkSession();
}

// // Função para atualizar o relógio
// function updateClock() {
//     const now = new Date();
//     const hours = now.getHours().toString().padStart(2, '0');
//     const minutes = now.getMinutes().toString().padStart(2, '0');
//     const seconds = now.getSeconds().toString().padStart(2, '0');
//     const date = now.toLocaleDateString('pt-BR', {
//         weekday: 'long',
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//     });

//     const timeString = `${hours}:${minutes}:${seconds}`;
//     const dateString = `${date}`;

//     // Exibir a hora e data no elemento do relógio
//     document.getElementById('time').textContent = timeString;
//     document.getElementById('location').textContent = `${dateString}`;
// }

// Função para tocar o som
function playAlertSound() {
    const alertSound = document.getElementById('alert-sound');
    alertSound.play().catch(err => {
        console.error("Erro ao tentar tocar o som", err);
    });
}

// Função para solicitar permissão para usar o som
function requestSoundPermission() {
    // Perguntar permissão para o som
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Permissão para som concedida.");
            }
        });
    }
}

// Função para atualizar a cor da bolinha de status e a legenda
function updateStatus(appAlias, healthStatus) {
    const statusCircle = document.querySelector(`.app-card[data-app="${appAlias}"] .status-circle`);
    const statusText = document.querySelector(`.app-card[data-app="${appAlias}"] .status-text`);
    
    if (statusCircle && statusText) {
        // Remover todas as classes de status anteriores da bolinha
        statusCircle.classList.remove('healthy', 'progressing', 'degraded', 'suspended', 'missing', 'unknown');
        // Adicionar a nova classe de status
        statusCircle.classList.add(healthStatus);

        // Atualizar o texto da legenda
        statusText.textContent = healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1);
    }
}

// Função para criar os cards das aplicações
function createAppCard(appName, status) {
    const container = document.getElementById('app-cards');

    // Verifica se o card já existe, se sim, apenas atualiza o status
    let appCard = document.querySelector(`.app-card[data-app="${appName}"]`);
    if (!appCard) {
        // Cria um novo card se não existir
        appCard = document.createElement('div');
        appCard.classList.add('app-card');
        appCard.setAttribute('data-app', appName); // Adiciona o identificador da aplicação

        const appNameElement = document.createElement('h3');
        appNameElement.classList.add('app-name');
        appNameElement.textContent = appName;

        const statusContainer = document.createElement('div');
        statusContainer.classList.add('status-container');

        const healthCircle = document.createElement('span');
        healthCircle.classList.add('status-circle', status);

        const statusText = document.createElement('span');
        statusText.classList.add('status-text');
        statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);

        statusContainer.appendChild(healthCircle);
        statusContainer.appendChild(statusText);

        appCard.appendChild(appNameElement);
        appCard.appendChild(statusContainer);

        container.appendChild(appCard); // Adiciona o novo card ao contêiner
    }

    // Atualiza o status da bolinha de saúde
    updateStatus(appName, status);
}

// Chama a função de status das aplicações na primeira vez
fetchAppStatus();

// // Atualizar o relógio a cada segundo
// setInterval(updateClock, 1000);
// updateClock();

// Solicitar permissão para som
requestSoundPermission();

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
