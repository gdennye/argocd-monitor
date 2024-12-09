// Função para atualizar o relógio
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const date = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const timeString = `${hours}:${minutes}:${seconds}`;
    const dateString = `${date}`;

    // Exibir a hora e data no elemento do relógio
    document.getElementById('time').textContent = timeString;
    document.getElementById('location').textContent = `${dateString}`;
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
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'monitor' && password === 'monitor') {
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

// Função para buscar e exibir as aplicações no Argo CD
async function fetchAppStatus() {
    const applications = [
        { name: 'helm-admin', alias: 'Admin' },
        { name: 'helm-cronjobs', alias: 'Cronjobs' },
        { name: 'helm-emails', alias: 'Emails' },
        { name: 'helm-regras-crud', alias: 'Regras Crud' },
        { name: 'helm-regras-processamento', alias: 'Regras Processamento' },
        { name: 'helm-reports', alias: 'Reports' },
        { name: 'helm-tickets', alias: 'Tickets' },
        { name: 'helm-tickets-background-tasks', alias: 'Tickets BT' },
        { name: 'helm-tickets-background-tasks-executor', alias: 'Tickets BT Executor' },
        { name: 'helm-tickets-consulting', alias: 'Tickets Consulting' },
        { name: 'helm-tickets-entrypoint', alias: 'Tickets Entrypoint' },
        { name: 'helm-tickets-processing', alias: 'Tickets Processing' }
        // Adicione mais aplicações conforme necessário
    ];

    // Buscar o status de cada aplicação e criar/atualizar os cards
    for (const app of applications) {
        const status = await getArgoStatus(app.name);
        createAppCard(app.alias, status); // Cria ou atualiza o card para a aplicação
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
        healthCircle.classList.add('status-circle', status.healthStatus);

        const statusText = document.createElement('span');
        statusText.classList.add('status-text');
        statusText.textContent = status.healthStatus.charAt(0).toUpperCase() + status.healthStatus.slice(1);

        statusContainer.appendChild(healthCircle);
        statusContainer.appendChild(statusText);

        appCard.appendChild(appNameElement);
        appCard.appendChild(statusContainer);

        container.appendChild(appCard); // Adiciona o novo card ao contêiner
        
    }

    // Atualiza o status da bolinha de saúde
    updateStatus(appName, status.healthStatus);

    // Alerta sonoro quando o status for diferente de 'healthy'
    if (status.healthStatus !== 'healthy') {
        // Toca o som de alerta quando o status não for "healthy"
        playAlertSound();
        appCard.classList.add('alert'); // Marca o card com a classe 'alert' para possíveis estilos adicionais
    } else {
        appCard.classList.remove('alert'); // Remove a classe 'alert' do card
    }
}

// Variável de controle de mute
let isMuted = false;

// Função para tocar o som de alerta
function playAlertSound() {
    if (!isMuted) { // Só toca o som se não estiver no modo mute
        const alertSound = document.getElementById('alert-sound');
        alertSound.play().catch(err => {
            console.error("Erro ao tentar tocar o som", err);
        });
    }
}

// Função para alternar o estado do mute
function toggleMute() {
    isMuted = !isMuted; // Alterna o estado do mute

    // Atualiza o ícone do botão de mute
    const muteButton = document.getElementById('mute-button');
    if (isMuted) {
        muteButton.textContent = "🔇"; // Ícone de mute
    } else {
        muteButton.textContent = "🔊"; // Ícone de som
    }
}

// Função para buscar o status da aplicação
async function getArgoStatus(appName) {
    const url = `https://argocd-dev.spekter.com.br/api/badge?name=${appName}&revision=true`;
    const response = await fetch(url);
    const badgeData = await response.text();

    // let healthStatus = 'unknown';

    if (badgeData.includes('Healthy')) healthStatus = 'healthy';
    else if (badgeData.includes('Progressing')) healthStatus = 'progressing';
    else if (badgeData.includes('Degraded')) healthStatus = 'degraded';
    else if (badgeData.includes('Suspended')) healthStatus = 'suspended';
    else if (badgeData.includes('Missing')) healthStatus = 'missing';
    else if (badgeData.includes('Unknown')) healthStatus = 'unknown';

    return { healthStatus };
}

// Chama a função de status das aplicações na primeira vez
fetchAppStatus();

// Configura o intervalo de 1 segundos para atualizar o status
setInterval(fetchAppStatus, 1000); // 1000 milissegundos = 1 segundos

// Verificar se o usuário está logado quando a página for carregada
checkSession();

// Atualizar o relógio, localização e clima
setInterval(updateClock, 1000);
updateClock();
getLocation();

// Solicitar permissão para som e localização
requestSoundPermission();
