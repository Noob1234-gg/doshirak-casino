// ======================
// НАСТРОЙКИ СЕРВЕРА
// ======================
const SERVER_URL = 'https://noob1234-gg.github.io/-Doshirak/'; // ЗАМЕНИТЕ НА ВАШ URL
let onlineMode = false;
let playerId = localStorage.getItem('doshirakPlayerId') || generatePlayerId();
let syncInterval = null;

// ======================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ======================

// Генерация ID игрока
function generatePlayerId() {
    const id = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('doshirakPlayerId', id);
    return id;
}

// Включение/выключение онлайн-режима
function toggleOnlineMode() {
    onlineMode = !onlineMode;
    const toggleBtn = document.getElementById('toggleOnline');
    const statusOffline = document.querySelector('.status-offline');
    const statusOnline = document.querySelector('.status-online');
    const playerIdDisplay = document.getElementById('playerIdDisplay');
    const playerIdSpan = document.getElementById('playerId');
    
    if (onlineMode) {
        // Включаем онлайн
        toggleBtn.textContent = 'Выключить онлайн-режим';
        toggleBtn.classList.add('online');
        statusOffline.style.display = 'none';
        statusOnline.style.display = 'inline';
        playerIdDisplay.style.display = 'block';
        playerIdSpan.textContent = playerId;
        
        // Начинаем синхронизацию
        startSyncing();
        updateOnlineLeaderboard();
        
        // Показываем уведомление
        showNotification('Онлайн-режим включен! Ваши данные синхронизируются с сервером.');
    } else {
        // Выключаем онлайн
        toggleBtn.textContent = 'Включить онлайн-режим';
        toggleBtn.classList.remove('online');
        statusOffline.style.display = 'inline';
        statusOnline.style.display = 'none';
        playerIdDisplay.style.display = 'none';
        
        // Останавливаем синхронизацию
        stopSyncing();
        
        // Показываем локальный лидерборд
        displayLeaderboard();
    }
}

// Копирование ID
function copyPlayerId() {
    navigator.clipboard.writeText(playerId).then(() => {
        showNotification('ID скопирован! Отправьте другу, чтобы он мог найти вас.');
    }).catch(() => {
        // Fallback для старых браузеров
        const tempInput = document.createElement('input');
        tempInput.value = playerId;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showNotification('ID скопирован!');
    });
}

// Уведомления
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #4cd964; color: white; padding: 15px; border-radius: 8px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
            ${message}
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// ======================
// РАБОТА С СЕРВЕРОМ
// ======================

// Начать синхронизацию
function startSyncing() {
    syncInterval = setInterval(() => {
        syncWithServer();
        updateOnlineLeaderboard();
    }, 30000); // Каждые 30 секунд
    
    // Первая синхронизация
    syncWithServer();
}

// Остановить синхронизацию
function stopSyncing() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
}

// Синхронизация с сервером
async function syncWithServer() {
    if (!onlineMode) return;
    
    try {
        const response = await fetch(`${SERVER_URL}/api/update-player`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: playerId,
                name: playerProfile.name,
                avatar: playerProfile.avatar,
                balance: balance,
                stats: playerStats
            })
        });
        
        if (response.ok) {
            console.log('✅ Данные синхронизированы');
        }
    } catch (error) {
        console.error('❌ Ошибка синхронизации:', error);
    }
}

// Получить онлайн-лидерборд
async function updateOnlineLeaderboard() {
    if (!onlineMode) return;
    
    try {
        const response = await fetch(`${SERVER_URL}/api/leaderboard`);
        const onlinePlayers = await response.json();
        displayOnlineLeaderboard(onlinePlayers);
    } catch (error) {
        console.error('❌ Ошибка загрузки лидерборда:', error);
    }
}

// Показать онлайн-лидерборд
function displayOnlineLeaderboard(onlinePlayers) {
    leaderboardBody.innerHTML = '';
    
    onlinePlayers.forEach((player, index) => {
        const row = document.createElement('tr');
        
        // Ранг
        let rankClass = '';
        if (index === 0) rankClass = 'rank-1';
        else if (index === 1) rankClass = 'rank-2';
        else if (index === 2) rankClass = 'rank-3';
        
        // Уровень
        let level = 'Новичок';
        if (player.balance >= 10000) level = 'Легенда';
        else if (player.balance >= 5000) level = 'Мастер';
        else if (player.balance >= 2000) level = 'Опытный';
        else if (player.balance >= 500) level = 'Игрок';
        
        // Это текущий игрок?
        const isCurrentPlayer = player.id === playerId;
        const playerStyle = isCurrentPlayer ? 'style="color: #ff9a3c; font-weight: bold;"' : '';
        
        // Онлайн индикатор
        const onlineIndicator = player.online ? ' <span class="online-indicator" title="Онлайн">●</span>' : '';
        
        row.innerHTML = `
            <td class="${rankClass}">${index + 1}</td>
            <td ${playerStyle}>
                <div class="player-cell">
                    <span style="font-size: 1.5rem;">${player.avatar}</span>
                    ${player.name} ${isCurrentPlayer ? '(Вы)' : ''}${onlineIndicator}
                </div>
            </td>
            <td ${playerStyle}>${player.balance}</td>
            <td>${level}</td>
        `;
        
        leaderboardBody.appendChild(row);
    });
}

// Обновить функцию сохранения профиля
function saveProfile() {
    const newName = playerNameInput.value.trim() || "Игрок";
    const newAvatar = playerAvatarSelect.value;
    
    // Чит-коды
    if (newName.toLowerCase() === "богдошираков") {
        balance += 10000;
        showNotification('Чит-код активирован! +10000 дошираков!');
    } else if (newName.toLowerCase() === "топ1") {
        balance += 50000;
        showNotification('Мега-чит активирован! +50000 дошираков!');
    }
    
    playerProfile.name = newName;
    playerProfile.avatar = newAvatar;
    localStorage.setItem('playerProfile', JSON.stringify(playerProfile));
    updatePlayerInLeaderboard();
    
    // Синхронизация с сервером
    if (onlineMode) {
        syncWithServer();
    }
    
    slotResultElement.innerHTML = `<span class="win">Профиль сохранен!</span>`;
    slotResultElement.className = 'result win';
    
    setTimeout(() => switchTab('games'), 1500);
}

// Обновить функцию displayLeaderboard
function displayLeaderboard() {
    if (onlineMode) {
        updateOnlineLeaderboard();
    } else {
        // Локальный лидерборд
        const top10 = leaderboard.slice(0, 10);
        leaderboardBody.innerHTML = '';
        
        top10.forEach((player, index) => {
            const row = document.createElement('tr');
            
            let rankClass = '';
            if (index === 0) rankClass = 'rank-1';
            if (index === 1) rankClass = 'rank-2';
            if (index === 2) rankClass = 'rank-3';
            
            let level = 'Новичок';
            if (player.balance >= 10000) level = 'Легенда';
            else if (player.balance >= 5000) level = 'Мастер';
            else if (player.balance >= 2000) level = 'Опытный';
            else if (player.balance >= 500) level = 'Игрок';
            
            const isCurrentPlayer = player.name === playerProfile.name;
            const playerStyle = isCurrentPlayer ? 'style="color: #ff9a3c; font-weight: bold;"' : '';
            
            row.innerHTML = `
                <td class="${rankClass}">${index + 1}</td>
                <td ${playerStyle}>
                    <div class="player-cell">
                        <span style="font-size: 1.5rem;">${player.avatar}</span>
                        ${player.name} ${isCurrentPlayer ? '(Вы)' : ''}
                    </div>
                </td>
                <td ${playerStyle}>${player.balance}</td>
                <td>${level}</td>
            `;
            
            leaderboardBody.appendChild(row);
        });
    }
}

// Добавить в setupEventListeners
function setupEventListeners() {
    // ... существующие слушатели ...
    
    // Онлайн-режим
    document.getElementById('toggleOnline')?.addEventListener('click', toggleOnlineMode);
}









// Игровые переменные
let balance = parseInt(localStorage.getItem('doshirakBalance')) || 100;
let lastBonusDate = localStorage.getItem('lastBonusDate') || '';
let today = new Date().toDateString();
let gameHistory = JSON.parse(localStorage.getItem('gameHistory')) || [];
let playerStats = JSON.parse(localStorage.getItem('playerStats')) || {
    totalGames: 0,
    gamesWon: 0,
    gamesLost: 0
};

// Добавляем в начало файла script.js, после объявления других переменных:
let usedPromoCodes = JSON.parse(localStorage.getItem('usedPromoCodes')) || [];

// Добавляем после объявления DOM элементов:
let promoCodeInput, activatePromoBtn;

// В функции cacheDOMElements() добавляем:
promoCodeInput = document.getElementById('promoCode');
activatePromoBtn = document.getElementById('activatePromo');

// В функции setupEventListeners() добавляем:
activatePromoBtn.addEventListener('click', activatePromoCode);
promoCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        activatePromoCode();
    }
});

// Новая функция для активации промокодов:
function activatePromoCode() {
    const code = promoCodeInput.value.trim().toUpperCase();
    
    if (!code) {
        showNotification('Введите промокод!', 'error');
        return;
    }
    
    // Проверяем, не использовался ли уже промокод
    if (usedPromoCodes.includes(code)) {
        showNotification('Этот промокод уже был использован!', 'error');
        promoCodeInput.value = '';
        return;
    }
    
    // Определяем награду по промокоду
    const promoRewards = {
        'DOSHIRAK500': 500,
        'NOODLE750': 750,
        'RAMEN888': 888,
        'BONUS1000': 1000,
        'LUCKY900': 900
    };
    
    const reward = promoRewards[code];
    
    if (reward) {
        // Активируем промокод
        balance += reward;
        updateBalance();
        
        // Добавляем в использованные
        usedPromoCodes.push(code);
        localStorage.setItem('usedPromoCodes', JSON.stringify(usedPromoCodes));
        
        // Показываем уведомление
        showNotification(`Промокод активирован! +${reward} дошираков`, 'info');
        
        // Добавляем в историю
        addToHistory('Промокод', `+${reward}`, true);
        
        // Показываем результат
        document.querySelector('#profile-tab .result')?.remove();
        
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result win';
        resultDiv.innerHTML = `Промокод "${code}" активирован! <span class="win">+${reward} дошираков!</span>`;
        resultDiv.style.marginTop = '20px';
        resultDiv.style.marginBottom = '30px';
        
        const profileContent = document.querySelector('.profile-content');
        const saveBtn = document.getElementById('saveProfile');
        profileContent.insertBefore(resultDiv, saveBtn.nextSibling);
        
        // Воспроизводим звук
        playSound('win');
        
        // Удаляем сообщение через 5 секунд
        setTimeout(() => {
            if (resultDiv.parentNode) {
                resultDiv.style.opacity = '0';
                resultDiv.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    if (resultDiv.parentNode) {
                        resultDiv.parentNode.removeChild(resultDiv);
                    }
                }, 500);
            }
        }, 5000);
        
    } else {
        showNotification('Неверный промокод!', 'error');
    }
    
    promoCodeInput.value = '';
}

// Для режима разработчика можно добавить функцию для генерации промокодов
// Добавляем в initDeveloperMode() новую кнопку:
/*
const generatePromoBtn = document.createElement('button');
generatePromoBtn.className = 'dev-btn';
generatePromoBtn.textContent = 'Сгенерировать промокод';
generatePromoBtn.addEventListener('click', generatePromoCode);
document.querySelector('.dev-section:nth-child(2) .dev-buttons').appendChild(generatePromoBtn);
*/

// Функция генерации промокода для разработчика
function generatePromoCode() {
    if (!isDeveloperMode) return;
    
    const prefix = ['DOSH', 'NOOD', 'RAME', 'BONU', 'LUCK', 'GIFT', 'WINS', 'PLAY', 'GAME'];
    const suffix = ['100', '250', '500', '750', '888', '999', '1000'];
    
    const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
    const randomSuffix = suffix[Math.floor(Math.random() * suffix.length)];
    const newCode = randomPrefix + randomSuffix;
    
    // Показываем промокод
    showDeveloperMessage(`Новый промокод: ${newCode} (${randomSuffix} дошираков)`);
    
    // Можно скопировать в буфер обмена
    navigator.clipboard.writeText(newCode).then(() => {
        showNotification(`Промокод ${newCode} скопирован!`, 'info');
    });
}

// Профиль игрока
let playerProfile = JSON.parse(localStorage.getItem('playerProfile')) || {
    name: "Игрок",
    avatar: "👨‍💼",
    joinedDate: new Date().toLocaleDateString('ru-RU')
};

// Время последнего обновления топа
let lastLeaderboardUpdate = localStorage.getItem('lastLeaderboardUpdate') || 0;

// Лидерборд
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || generateInitialLeaderboard();

// Режим разработчика
const DEVELOPER_PASSWORD = "DS9O-21K1-N8WW-5LU0";
let isDeveloperMode = false;

// DOM элементы
let balanceElement, dailyBonusButton, slotBetElement, guessBetElement, blackjackBetElement, rouletteBetElement, raceBetElement;
let slotResultElement, guessResultElement, blackjackResultElement, rouletteResultElement, raceResultElement, historyItemsElement;
let playerNameInput, playerAvatarSelect, leaderboardBody, leaderboardUpdateElement;
let totalGamesElement, gamesWonElement, gamesLostElement, winRateElement;
let shareBtn, shareLinks, copyLinkBtn, notification;

// Переменные для игр
let blackjackGameActive = false;
let blackjackDealerCards = [];
let blackjackPlayerCards = [];
let rouletteCurrentBet = null;
let raceSelectedRacer = null;
let raceInProgress = false;

// Элементы режима разработчика
let devModal, devPasswordInput, devControls, devMessage;
let devAccessBtn, closeDevModal, submitDevPassword, exitDevMode;
let setBalanceBtn, addBalanceBtn, resetBalanceBtn;
let clearHistoryBtn, clearAllDataBtn;
let testWinSlotsBtn, testWinGuessBtn, testWinBlackjackBtn, testWinRouletteBtn;

// Генерация начального лидерборда
function generateInitialLeaderboard() {
    const randomNames = [
        "ДоширакоМан", "НиндзяЛапши", "Суперазиат", "ЛапшаУдача", 
        "ВокМастер", "БоссДоширак", "РаменКороль", "МистерЛапша",
        "ЛапшаКинг", "ДоширакПро"
    ];
    
    const randomAvatars = ["🦸", "🥷", "🧙", "👨‍🍳", "👨‍🚀", "👨‍💼", "👑", "🍜", "🤴", "🦊"];
    
    return [
        {name: playerProfile.name, balance: balance, avatar: playerProfile.avatar},
        ...randomNames.map((name, index) => ({
            name: name,
            balance: Math.floor(Math.random() * 10000) + 1000,
            avatar: randomAvatars[index % randomAvatars.length]
        }))
    ].sort((a, b) => b.balance - a.balance).slice(0, 10);
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Кэшируем DOM элементы для производительности
    cacheDOMElements();
    
    // Инициализация приложения
    initApp();
    
    // Настройка слушателей событий
    setupEventListeners();
    
    // Инициализация режима разработчика
    initDeveloperMode();
    
    // Инициализация игр
    initNewGames();
});

// Кэширование DOM элементов
function cacheDOMElements() {
    balanceElement = document.getElementById('balance');
    dailyBonusButton = document.getElementById('dailyBonus');
    slotBetElement = document.getElementById('slotBet');
    guessBetElement = document.getElementById('guessBet');
    blackjackBetElement = document.getElementById('blackjackBet');
    rouletteBetElement = document.getElementById('rouletteBet');
    raceBetElement = document.getElementById('raceBet');
    
    slotResultElement = document.getElementById('slotResult');
    guessResultElement = document.getElementById('guessResult');
    blackjackResultElement = document.getElementById('blackjackResult');
    rouletteResultElement = document.getElementById('rouletteResult');
    raceResultElement = document.getElementById('raceResult');
    
    historyItemsElement = document.getElementById('historyItems');
    playerNameInput = document.getElementById('playerName');
    playerAvatarSelect = document.getElementById('playerAvatar');
    leaderboardBody = document.getElementById('leaderboardBody');
    leaderboardUpdateElement = document.getElementById('leaderboardUpdate');
    
    // Элементы статистики
    totalGamesElement = document.getElementById('totalGames');
    gamesWonElement = document.getElementById('gamesWon');
    gamesLostElement = document.getElementById('gamesLost');
    winRateElement = document.getElementById('winRate');
    
    // Элементы для общего доступа
    shareBtn = document.getElementById('shareBtn');
    shareLinks = document.getElementById('shareLinks');
    copyLinkBtn = document.getElementById('copyLinkBtn');
    
    // Уведомления
    notification = document.getElementById('notification');
}

// Инициализация новых игр
function initNewGames() {
    // Инициализация блэкджека
    initBlackjack();
    
    // Инициализация рулетки
    initRoulette();
    
    // Инициализация гонок
    initRace();
}

// Инициализация режима разработчика
function initDeveloperMode() {
    // Элементы режима разработчика
    devModal = document.getElementById('devModal');
    devPasswordInput = document.getElementById('devPassword');
    devControls = document.querySelector('.dev-controls');
    devMessage = document.getElementById('devMessage');
    devAccessBtn = document.getElementById('devAccessBtn');
    closeDevModal = document.getElementById('closeDevModal');
    submitDevPassword = document.getElementById('submitDevPassword');
    exitDevMode = document.getElementById('exitDevMode');
    
    // Кнопки управления
    setBalanceBtn = document.getElementById('setBalance');
    addBalanceBtn = document.getElementById('addBalance');
    resetBalanceBtn = document.getElementById('resetBalance');
    clearHistoryBtn = document.getElementById('clearHistory');
    clearAllDataBtn = document.getElementById('clearAllData');
    testWinSlotsBtn = document.getElementById('testWinSlots');
    testWinGuessBtn = document.getElementById('testWinGuess');
    testWinBlackjackBtn = document.getElementById('testWinBlackjack');
    testWinRouletteBtn = document.getElementById('testWinRoulette');
    
    // Настройка обработчиков событий
    setupDeveloperEventListeners();
}

// Настройка обработчиков событий для режима разработчика
function setupDeveloperEventListeners() {
    // Открытие модального окна
    devAccessBtn.addEventListener('click', () => {
        devModal.style.display = 'flex';
        devPasswordInput.focus();
    });
    
    // Закрытие модального окна
    closeDevModal.addEventListener('click', closeDeveloperModal);
    
    // Ввод пароля
    submitDevPassword.addEventListener('click', checkDeveloperPassword);
    
    // Выход из режима разработчика
    exitDevMode.addEventListener('click', exitDeveloperMode);
    
    // Управление балансом
    setBalanceBtn.addEventListener('click', () => {
        const newBalance = parseInt(document.getElementById('devBalance').value);
        if (!isNaN(newBalance) && newBalance >= 0) {
            balance = newBalance;
            updateBalance();
            showDeveloperMessage(`Баланс установлен: ${newBalance} дошираков`);
        }
    });
    
    addBalanceBtn.addEventListener('click', () => {
        balance += 1000;
        updateBalance();
        showDeveloperMessage(`Добавлено 1000 дошираков. Новый баланс: ${balance}`);
    });
    
    resetBalanceBtn.addEventListener('click', () => {
        balance = 100;
        updateBalance();
        showDeveloperMessage('Баланс сброшен к начальному значению: 100 дошираков');
    });
    
    // Очистка данных
    clearHistoryBtn.addEventListener('click', () => {
        gameHistory = [];
        localStorage.removeItem('gameHistory');
        updateGameHistory();
        showDeveloperMessage('История игр очищена');
    });
    
    clearAllDataBtn.addEventListener('click', () => {
        if (confirm('Вы уверены? Это удалит все данные игры.')) {
            localStorage.clear();
            location.reload();
        }
    });
    
    // Тестирование игр
    testWinSlotsBtn.addEventListener('click', () => {
        // Имитация выигрыша в слотах
        const bet = 10;
        const winAmount = bet * 5;
        balance += winAmount;
        updateBalance();
        
        slotResultElement.innerHTML = `ТЕСТ: ПОБЕДА! 3 символа 🍜! <span class="win">+${winAmount} дошираков!</span>`;
        slotResultElement.className = 'result win';
        
        addToHistory('Тест: Слоты', `+${winAmount}`, true);
        showDeveloperMessage(`Тест победы в слотах выполнен. +${winAmount} дошираков`);
    });
    
    testWinGuessBtn.addEventListener('click', () => {
        // Имитация выигрыша в угадайке
        const bet = 10;
        const winAmount = bet * 5;
        balance += winAmount;
        updateBalance();
        
        guessResultElement.innerHTML = `ТЕСТ: ПОБЕДА! Вы угадали число! <span class="win">+${winAmount} дошираков!</span>`;
        guessResultElement.className = 'result win';
        
        addToHistory('Тест: Угадай число', `+${winAmount}`, true);
        showDeveloperMessage(`Тест победы в угадайке выполнен. +${winAmount} дошираков`);
    });
    
    testWinBlackjackBtn.addEventListener('click', () => {
        // Имитация выигрыша в блэкджеке
        const bet = 10;
        const winAmount = bet * 2;
        balance += winAmount;
        updateBalance();
        
        blackjackResultElement.innerHTML = `ТЕСТ: ПОБЕДА в блэкджеке! <span class="win">+${winAmount} дошираков!</span>`;
        blackjackResultElement.className = 'result win';
        
        addToHistory('Тест: Блэкджек', `+${winAmount}`, true);
        showDeveloperMessage(`Тест победы в блэкджеке выполнен. +${winAmount} дошираков`);
    });
    
    testWinRouletteBtn.addEventListener('click', () => {
        // Имитация выигрыша в рулетке
        const bet = 10;
        const winAmount = bet * 36;
        balance += winAmount;
        updateBalance();
        
        rouletteResultElement.innerHTML = `ТЕСТ: ПОБЕДА в рулетке! <span class="win">+${winAmount} дошираков!</span>`;
        rouletteResultElement.className = 'result win';
        
        addToHistory('Тест: Рулетка', `+${winAmount}`, true);
        showDeveloperMessage(`Тест победы в рулетке выполнен. +${winAmount} дошираков`);
    });
    
    // Закрытие по клику вне модального окна
    devModal.addEventListener('click', (e) => {
        if (e.target === devModal) {
            closeDeveloperModal();
        }
    });
    
    // Ввод пароля по Enter
    devPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkDeveloperPassword();
        }
    });
}

// Проверка пароля разработчика
function checkDeveloperPassword() {
    const password = devPasswordInput.value.trim();
    
    if (password === DEVELOPER_PASSWORD) {
        isDeveloperMode = true;
        devControls.style.display = 'block';
        submitDevPassword.style.display = 'none';
        exitDevMode.style.display = 'inline-block';
        devPasswordInput.style.display = 'none';
        showDeveloperMessage('Режим разработчика активирован');
        playSound('win');
    } else {
        showDeveloperMessage('Неверный пароль', true);
        devPasswordInput.value = '';
        devPasswordInput.focus();
        playSound('lose');
    }
}

// Закрытие модального окна разработчика
function closeDeveloperModal() {
    devModal.style.display = 'none';
    resetDeveloperModal();
}

// Сброс модального окна разработчика
function resetDeveloperModal() {
    devPasswordInput.value = '';
    devPasswordInput.style.display = 'block';
    devControls.style.display = 'none';
    submitDevPassword.style.display = 'inline-block';
    exitDevMode.style.display = 'none';
    devMessage.textContent = '';
    isDeveloperMode = false;
}

// Выход из режима разработчика
function exitDeveloperMode() {
    resetDeveloperModal();
    closeDeveloperModal();
    showNotification('Режим разработчика деактивирован', 'info');
}

// Показать сообщение в режиме разработчика
function showDeveloperMessage(message, isError = false) {
    devMessage.textContent = message;
    devMessage.style.color = isError ? '#ff3b30' : '#4cd964';
    devMessage.style.display = 'block';
    
    if (!isError) {
        setTimeout(() => {
            devMessage.style.display = 'none';
        }, 3000);
    }
}

// Инициализация приложения
function initApp() {
    updateBalance();
    checkDailyBonus();
    updateGameHistory();
    loadProfile();
    updateStats();
    checkLeaderboardUpdate();
    setupTabs();
}

// Настройка слушателей событий
function setupEventListeners() {
    // Настройка кнопок изменения ставок
    document.querySelectorAll('.bet-btn').forEach(button => {
        button.addEventListener('click', handleBetChange);
    });
    
    // Игры
    document.getElementById('playSlots').addEventListener('click', playSlots);
    document.getElementById('playGuess').addEventListener('click', playGuess);
    
    // Ежедневный бонус
    dailyBonusButton.addEventListener('click', claimDailyBonus);
    
    // Сохранение профиля
    document.getElementById('saveProfile').addEventListener('click', saveProfile);
    
    // Общий доступ
    shareBtn.addEventListener('click', toggleShareLinks);
    copyLinkBtn.addEventListener('click', copyGameLink);
    
    // Настройка ссылок для общего доступа
    document.querySelectorAll('.share-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            shareOnPlatform(this.getAttribute('data-platform'));
        });
    });
    
    // Быстрые ссылки в футере
    document.querySelectorAll('.footer-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

// Обработка изменения ставки
function handleBetChange() {
    const change = parseInt(this.getAttribute('data-change'));
    const betElement = this.closest('.game-card').querySelector('.bet-amount');
    const currentBet = parseInt(betElement.textContent);
    const newBet = currentBet + change;
    
    // Минимальная ставка 5, максимальная 1000000
    if (newBet >= 5 && newBet <= 1000000) {
        betElement.textContent = newBet;
        playSound('click');
    }
}

// Настройка вкладок
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
            playSound('click');
        });
    });
}

// Переключение вкладок
function switchTab(tabId) {
    // Убираем активный класс у всех вкладок
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Активируем выбранную вкладку
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`${tabId}-tab`).classList.add('active');
    
    // Обновляем лидерборд при переключении на его вкладку
    if (tabId === 'leaderboard') {
        checkLeaderboardUpdate();
    }
}

// Обновление баланса
function updateBalance() {
    balanceElement.textContent = balance;
    localStorage.setItem('doshirakBalance', balance);
    
    // Обновляем профиль в лидерборде
    updatePlayerInLeaderboard();
}

// Обновление игрока в лидерборде
function updatePlayerInLeaderboard() {
    const playerIndex = leaderboard.findIndex(player => player.name === playerProfile.name);
    
    if (playerIndex !== -1) {
        leaderboard[playerIndex].balance = balance;
        leaderboard[playerIndex].avatar = playerProfile.avatar;
    } else {
        leaderboard.push({
            name: playerProfile.name,
            balance: balance,
            avatar: playerProfile.avatar
        });
    }
    
    // Сортируем лидерборд
    leaderboard.sort((a, b) => b.balance - a.balance);
    
    // Ограничиваем топ-10
    if (leaderboard.length > 10) {
        leaderboard = leaderboard.slice(0, 10);
    }
    
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Проверка необходимости обновления лидерборда
function checkLeaderboardUpdate() {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    // Если с последнего обновления прошло больше 5 минут
    if (now - lastLeaderboardUpdate > fiveMinutes) {
        updateLeaderboardWithCurrentData();
        lastLeaderboardUpdate = now;
        localStorage.setItem('lastLeaderboardUpdate', lastLeaderboardUpdate);
        
        // Обновляем время последнего обновления
        const updateTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        leaderboardUpdateElement.textContent = `Обновлено в ${updateTime}`;
    } else {
        // Показываем, когда было обновлено
        const lastUpdateTime = new Date(parseInt(lastLeaderboardUpdate)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        leaderboardUpdateElement.textContent = `Обновлено в ${lastUpdateTime}`;
    }
    
    // Всегда показываем актуальные данные при открытии вкладки
    displayLeaderboard();
}

// Обновление лидерборда текущими данными
function updateLeaderboardWithCurrentData() {
    // Обновляем текущего игрока в лидерборде
    updatePlayerInLeaderboard();
    
    // Добавляем немного случайности к балансам других игроков для реалистичности
    leaderboard.forEach((player) => {
        if (player.name !== playerProfile.name) {
            // Изменяем баланс случайным образом (+/- до 15%)
            const changePercent = (Math.random() * 0.3) - 0.15;
            const change = Math.round(player.balance * changePercent);
            player.balance += change;
            
            // Гарантируем, что баланс не станет отрицательным и не будет слишком большим
            if (player.balance < 100) player.balance = 100 + Math.floor(Math.random() * 1000);
            if (player.balance > 50000) player.balance = 50000;
        }
    });
    
    // Сортируем по балансу
    leaderboard.sort((a, b) => b.balance - a.balance);
    
    // Сохраняем обновленный лидерборд
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Проверка ежедневного бонуса
function checkDailyBonus() {
    if (lastBonusDate === today) {
        dailyBonusButton.disabled = true;
        dailyBonusButton.innerHTML = '<i class="fas fa-check"></i> Бонус уже получен сегодня';
    } else {
        dailyBonusButton.disabled = false;
    }
}

// Получение ежедневного бонуса
function claimDailyBonus() {
    const bonusAmount = 50;
    balance += bonusAmount;
    lastBonusDate = today;
    
    localStorage.setItem('lastBonusDate', lastBonusDate);
    updateBalance();
    checkDailyBonus();
    
    // Добавляем запись в историю
    addToHistory('Ежедневный бонус', `+${bonusAmount}`, true);
    
    // Показываем сообщение
    slotResultElement.innerHTML = `Вы получили ежедневный бонус: <span class="win">+${bonusAmount} дошираков!</span>`;
    slotResultElement.className = 'result win';
    
    // Воспроизводим звук
    playSound('win');
    
    // Показываем уведомление
    showNotification(`Получен ежедневный бонус: +${bonusAmount} дошираков!`, 'info');
    
    // Обновляем статистику
    updateStats();
}

// Игра в слоты (оставлена без изменений, так как она уже есть)
function playSlots() {
    const bet = parseInt(slotBetElement.textContent);
    const playButton = document.getElementById('playSlots');
    
    if (bet > balance) {
        slotResultElement.innerHTML = 'Недостаточно дошираков для ставки!';
        slotResultElement.className = 'result lose';
        showNotification('Недостаточно дошираков!', 'error');
        return;
    }
    
    playButton.disabled = true;
    playButton.textContent = 'Вращение...';
    
    balance -= bet;
    updateBalance();
    
    const slots = [
        document.getElementById('slot1'),
        document.getElementById('slot2'),
        document.getElementById('slot3')
    ];
    
    const allSymbols = ['🍜', '🥤', '🍥', '🎲', '💰'];
    let firstSymbol = null;
    let secondSymbol = null;
    
    // Массивы для каждого слота
    const slot1Symbols = ['🍜', '🥤', '🍥', '🎲', '💰'];
    const slot2Symbols = ['n', '🍜', 'n', '🥤', 'n', '🍥', 'n', '🎲', 'n', '💰'];
    const slot3Symbols = ['n', '🍜', 'n', '🥤', 'n', '🍥', 'n', '🎲', 'n', '💰'];
    
    // Воспроизводим звук вращения
    playSound('spin');
    
    // Запускаем вращение всех слотов одновременно
    let spinInterval = setInterval(() => {
        slots.forEach(slot => {
            if (!slot.classList.contains('stopped')) {
                const randomSymbol = allSymbols[Math.floor(Math.random() * allSymbols.length)];
                slot.textContent = randomSymbol;
                slot.classList.add('spinning');
            }
        });
    }, 100);
    
    // Останавливаем слоты по очереди
    setTimeout(() => {
        clearInterval(spinInterval);
        
        // Первый слот
        const slot1 = slots[0];
        firstSymbol = slot1Symbols[Math.floor(Math.random() * slot1Symbols.length)];
        slot1.textContent = firstSymbol;
        slot1.classList.remove('spinning');
        slot1.classList.add('stopped');
        
        // Запускаем вращение оставшихся слотов
        spinInterval = setInterval(() => {
            slots.slice(1).forEach(slot => {
                if (!slot.classList.contains('stopped')) {
                    const randomSymbol = allSymbols[Math.floor(Math.random() * allSymbols.length)];
                    slot.textContent = randomSymbol;
                    slot.classList.add('spinning');
                }
            });
        }, 100);
        
        // Второй слот через 1 секунду
        setTimeout(() => {
            clearInterval(spinInterval);
            
            const slot2 = slots[1];
            const slot2Options = slot2Symbols.map(symbol => symbol === 'n' ? firstSymbol : symbol);
            secondSymbol = slot2Options[Math.floor(Math.random() * slot2Options.length)];
            slot2.textContent = secondSymbol;
            slot2.classList.remove('spinning');
            slot2.classList.add('stopped');
            
            // Запускаем вращение последнего слота
            spinInterval = setInterval(() => {
                const slot3 = slots[2];
                if (!slot3.classList.contains('stopped')) {
                    const randomSymbol = allSymbols[Math.floor(Math.random() * allSymbols.length)];
                    slot3.textContent = randomSymbol;
                    slot3.classList.add('spinning');
                }
            }, 100);
            
            // Третий слот через еще 1 секунду
            setTimeout(() => {
                clearInterval(spinInterval);
                
                const slot3 = slots[2];
                const slot3Options = slot3Symbols.map(symbol => symbol === 'n' ? firstSymbol : symbol);
                const thirdSymbol = slot3Options[Math.floor(Math.random() * slot3Options.length)];
                slot3.textContent = thirdSymbol;
                slot3.classList.remove('spinning');
                slot3.classList.add('stopped');
                
                // Проверяем результат через 0.5 секунды
                setTimeout(() => {
                    checkSlotResult(slots, [firstSymbol, secondSymbol, thirdSymbol], bet);
                    
                    // Сбрасываем состояние слотов
                    setTimeout(() => {
                        slots.forEach(slot => {
                            slot.classList.remove('stopped', 'spinning', 'winning');
                        });
                        playButton.disabled = false;
                        playButton.textContent = 'Вращать слоты';
                    }, 3000);
                }, 500);
                
            }, 1000);
            
        }, 1000);
        
    }, 1000);
    
    playerStats.totalGames += 1;
    updateStats();
}

// Проверка результата слотов (оставлена без изменений)
function checkSlotResult(slots, results, bet) {
    const allEqual = results[0] === results[1] && results[1] === results[2];
    
    if (allEqual) {
        const winAmount = bet * 5;
        balance += winAmount;
        updateBalance();
        
        // Анимация выигрыша
        slots.forEach(slot => {
            slot.classList.add('winning');
        });
        
        slotResultElement.innerHTML = `ПОБЕДА! 3 символа ${results[0]}! <span class="win">+${winAmount} дошираков!</span>`;
        slotResultElement.className = 'result win';
        
        addToHistory('Слоты', `+${winAmount}`, true);
        playerStats.gamesWon += 1;
        
        // Воспроизводим звук победы
        playSound('win');
        
        // Показываем уведомление
        showNotification(`Выигрыш: +${winAmount} дошираков!`, 'info');
    } else {
        slotResultElement.innerHTML = `Повезет в следующий раз! <span class="lose">-${bet} дошираков</span>`;
        slotResultElement.className = 'result lose';
        
        addToHistory('Слоты', `-${bet}`, false);
        playerStats.gamesLost += 1;
        
        // Воспроизводим звук поражения
        playSound('lose');
    }
    
    updateStats();
}
if (onlineMode && authToken) {
    saveUserData();
}

// Игра "Угадай число" (оставлена без изменений, так как она уже есть)
function playGuess() {
    const bet = parseInt(guessBetElement.textContent);
    const userGuess = parseInt(document.getElementById('numberGuess').value);
    
    // Проверяем ввод
    if (userGuess < 1 || userGuess > 10) {
        guessResultElement.innerHTML = 'Пожалуйста, введите число от 1 до 10!';
        guessResultElement.className = 'result lose';
        showNotification('Введите число от 1 до 10!', 'error');
        return;
    }
    
    // Проверяем, хватает ли денег
    if (bet > balance) {
        guessResultElement.innerHTML = 'Недостаточно дошираков для ставки!';
        guessResultElement.className = 'result lose';
        showNotification('Недостаточно дошираков!', 'error');
        return;
    }
    
    // Воспроизводим звук ставки
    playSound('click');
    
    // Снимаем ставку
    balance -= bet;
    updateBalance();
    
    // Генерируем случайное число
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    
    // Проверяем угадал ли игрок
    if (userGuess === randomNumber) {
        const winAmount = bet * 5;
        balance += winAmount;
        updateBalance();
        
        guessResultElement.innerHTML = `ПОБЕДА! Вы угадали число ${randomNumber}! <span class="win">+${winAmount} дошираков!</span>`;
        guessResultElement.className = 'result win';
        
        addToHistory('Угадай число', `+${winAmount}`, true);
        playerStats.gamesWon += 1;
        
        // Воспроизводим звук победы
        playSound('win');
        
        // Показываем уведомление
        showNotification(`Победа! +${winAmount} дошираков!`, 'info');
    } else {
        guessResultElement.innerHTML = `Неудача! Загаданное число было ${randomNumber}. <span class="lose">-${bet} дошираков</span>`;
        guessResultElement.className = 'result lose';
        
        addToHistory('Угадай число', `-${bet}`, false);
        playerStats.gamesLost += 1;
        
        // Воспроизводим звук поражения
        playSound('lose');
    }
    
    playerStats.totalGames += 1;
    updateStats();
}
if (onlineMode && authToken) {
    saveUserData();
}

// === НОВЫЕ ИГРЫ ===

// 1. БЛЭКДЖЕК
function initBlackjack() {
    const hitBtn = document.getElementById('blackjackHit');
    const standBtn = document.getElementById('blackjackStand');
    const doubleBtn = document.getElementById('blackjackDouble');
    const restartBtn = document.getElementById('blackjackRestart');
    
    hitBtn.addEventListener('click', blackjackHit);
    standBtn.addEventListener('click', blackjackStand);
    doubleBtn.addEventListener('click', blackjackDouble);
    restartBtn.addEventListener('click', startBlackjack);
    
    // Начинаем новую игру при инициализации
    blackjackResultElement.innerHTML = 'Сделайте ставку и начните игру!';
    updateBlackjackControls(false);
}

function startBlackjack() {
    const bet = parseInt(blackjackBetElement.textContent);
    
    if (bet > balance) {
        blackjackResultElement.innerHTML = 'Недостаточно дошираков для ставки!';
        blackjackResultElement.className = 'result lose';
        showNotification('Недостаточно дошираков!', 'error');
        return;
    }
    
    if (bet < 5) {
        blackjackResultElement.innerHTML = 'Минимальная ставка - 5 дошираков!';
        blackjackResultElement.className = 'result lose';
        showNotification('Минимальная ставка - 5 дошираков!', 'error');
        return;
    }
    
    // Снимаем ставку
    balance -= bet;
    updateBalance();
    
    // Сбрасываем игру
    blackjackDealerCards = [];
    blackjackPlayerCards = [];
    blackjackGameActive = true;
    
    // Раздаем начальные карты
    blackjackDealerCards.push(drawCard());
    blackjackPlayerCards.push(drawCard());
    blackjackPlayerCards.push(drawCard());
    
    // Показываем карты
    updateBlackjackDisplay();
    
    // Проверяем блэкджек сразу
    if (calculateScore(blackjackPlayerCards) === 21) {
        // У игрока блэкджек
        blackjackGameActive = false;
        endBlackjackGame(bet, true);
        return;
    }
    
    updateBlackjackControls(true);
    blackjackResultElement.innerHTML = 'Ваш ход. Возьмите карту или остановитесь.';
    blackjackResultElement.className = 'result';
    
    playerStats.totalGames += 1;
    updateStats();
}

function drawCard() {
    const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    return cards[Math.floor(Math.random() * cards.length)];
}

function calculateScore(cards) {
    let score = 0;
    let aces = 0;
    
    for (const card of cards) {
        if (card === 'A') {
            aces++;
            score += 11;
        } else if (['K', 'Q', 'J'].includes(card)) {
            score += 10;
        } else {
            score += parseInt(card);
        }
    }
    
    // Корректируем тузы, если перебор
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    
    return score;
}

function updateBlackjackDisplay() {
    const dealerCardsElement = document.getElementById('dealerCards');
    const playerCardsElement = document.getElementById('playerCards');
    const dealerScoreElement = document.getElementById('dealerScore');
    const playerScoreElement = document.getElementById('playerScore');
    
    // Карты дилера
    dealerCardsElement.innerHTML = '';
    if (blackjackGameActive) {
        // Показываем только первую карту дилера
        dealerCardsElement.innerHTML += `<div class="card">${blackjackDealerCards[0]}</div>`;
        dealerCardsElement.innerHTML += `<div class="card">?</div>`;
        dealerScoreElement.textContent = 'Очки: ?';
    } else {
        // Показываем все карты дилера
        blackjackDealerCards.forEach(card => {
            dealerCardsElement.innerHTML += `<div class="card">${card}</div>`;
        });
        dealerScoreElement.textContent = `Очки: ${calculateScore(blackjackDealerCards)}`;
    }
    
    // Карты игрока
    playerCardsElement.innerHTML = '';
    blackjackPlayerCards.forEach(card => {
        playerCardsElement.innerHTML += `<div class="card">${card}</div>`;
    });
    playerScoreElement.textContent = `Очки: ${calculateScore(blackjackPlayerCards)}`;
}

function updateBlackjackControls(enable) {
    document.getElementById('blackjackHit').disabled = !enable;
    document.getElementById('blackjackStand').disabled = !enable;
    document.getElementById('blackjackDouble').disabled = !enable || blackjackPlayerCards.length > 2;
}

function blackjackHit() {
    if (!blackjackGameActive) return;
    
    blackjackPlayerCards.push(drawCard());
    updateBlackjackDisplay();
    
    const playerScore = calculateScore(blackjackPlayerCards);
    
    if (playerScore > 21) {
        // Перебор
        blackjackGameActive = false;
        endBlackjackGame(parseInt(blackjackBetElement.textContent), false);
    } else if (playerScore === 21) {
        // 21 очков
        blackjackStand();
    }
}

function blackjackStand() {
    if (!blackjackGameActive) return;
    
    blackjackGameActive = false;
    
    // Дилер берет карты
    while (calculateScore(blackjackDealerCards) < 17) {
        blackjackDealerCards.push(drawCard());
    }
    
    updateBlackjackDisplay();
    endBlackjackGame(parseInt(blackjackBetElement.textContent), false);
}

function blackjackDouble() {
    if (!blackjackGameActive || blackjackPlayerCards.length > 2) return;
    
    const bet = parseInt(blackjackBetElement.textContent);
    
    if (bet * 2 > balance) {
        showNotification('Недостаточно дошираков для удвоения!', 'error');
        return;
    }
    
    // Удваиваем ставку
    balance -= bet;
    updateBalance();
    
    blackjackPlayerCards.push(drawCard());
    updateBlackjackDisplay();
    
    const playerScore = calculateScore(blackjackPlayerCards);
    
    if (playerScore > 21) {
        // Перебор
        blackjackGameActive = false;
        endBlackjackGame(bet * 2, false, true); // Проиграли удвоенную ставку
    } else {
        // Останавливаемся после удвоения
        blackjackStand();
    }
}

function endBlackjackGame(bet, isBlackjack = false, isDouble = false) {
    updateBlackjackControls(false);
    
    const playerScore = calculateScore(blackjackPlayerCards);
    const dealerScore = calculateScore(blackjackDealerCards);
    
    let result = '';
    let winAmount = 0;
    let isWin = false;
    
    if (isBlackjack) {
        // Блэкджек (2.5x ставки)
        winAmount = Math.floor(bet * 2.5);
        balance += winAmount;
        result = `БЛЭКДЖЕК! Вы выиграли <span class="win">${winAmount} дошираков!</span>`;
        isWin = true;
        playerStats.gamesWon += 1;
        playSound('win');
    } else if (playerScore > 21) {
        // Перебор игрока
        result = `Перебор! Вы проиграли <span class="lose">${isDouble ? bet * 2 : bet} дошираков</span>`;
        playerStats.gamesLost += 1;
        playSound('lose');
    } else if (dealerScore > 21) {
        // Перебор дилера (2x ставки)
        winAmount = isDouble ? bet * 4 : bet * 2;
        balance += winAmount;
        result = `Дилер перебрал! Вы выиграли <span class="win">${winAmount} дошираков!</span>`;
        isWin = true;
        playerStats.gamesWon += 1;
        playSound('win');
    } else if (playerScore > dealerScore) {
        // Игрок выиграл (2x ставки)
        winAmount = isDouble ? bet * 4 : bet * 2;
        balance += winAmount;
        result = `Вы победили! Вы выиграли <span class="win">${winAmount} дошираков!</span>`;
        isWin = true;
        playerStats.gamesWon += 1;
        playSound('win');
    } else if (playerScore < dealerScore) {
        // Дилер выиграл
        result = `Дилер победил! Вы проиграли <span class="lose">${isDouble ? bet * 2 : bet} дошираков</span>`;
        playerStats.gamesLost += 1;
        playSound('lose');
    } else {
        // Ничья, возвращаем ставку
        balance += isDouble ? bet * 2 : bet;
        result = `Ничья! Ставка возвращена`;
        playSound('click');
    }
    
    updateBalance();
    blackjackResultElement.innerHTML = result;
    blackjackResultElement.className = 'result ' + (isWin ? 'win' : 'lose');
    
    // Добавляем в историю
    addToHistory('Блэкджек', isWin ? `+${winAmount}` : `-${isDouble ? bet * 2 : bet}`, isWin);
    
    // Показываем уведомление
    if (isWin) {
        showNotification(`Победа в блэкджеке! +${winAmount} дошираков`, 'info');
    }
    
    updateStats();
}
if (onlineMode && authToken) {
    saveUserData();
}

// 2. РУЛЕТКА
function initRoulette() {
    const playBtn = document.getElementById('playRoulette');
    const numberBtn = document.getElementById('betOnNumber');
    const betButtons = document.querySelectorAll('.roulette-bet-btn');
    
    playBtn.addEventListener('click', playRoulette);
    numberBtn.addEventListener('click', () => {
        const number = parseInt(document.getElementById('rouletteNumber').value);
        if (number >= 0 && number <= 36) {
            rouletteCurrentBet = { type: 'number', value: number, multiplier: 36 };
            updateRouletteSelection();
        } else {
            showNotification('Введите число от 0 до 36!', 'error');
        }
    });
    
    betButtons.forEach(btn => {
        if (btn.id !== 'betOnNumber') {
            btn.addEventListener('click', function() {
                const betType = this.getAttribute('data-bet');
                const multiplier = parseInt(this.getAttribute('data-multiplier'));
                rouletteCurrentBet = { type: betType, value: betType, multiplier: multiplier };
                updateRouletteSelection();
            });
        }
    });
}

function updateRouletteSelection() {
    if (!rouletteCurrentBet) return;
    
    const betButtons = document.querySelectorAll('.roulette-bet-btn');
    betButtons.forEach(btn => {
        const betType = btn.getAttribute('data-bet');
        if (betType === rouletteCurrentBet.value) {
            btn.style.backgroundColor = '#e94560';
        } else {
            btn.style.backgroundColor = '#0f3460';
        }
    });
    
    if (rouletteCurrentBet.type === 'number') {
        document.getElementById('rouletteNumber').style.borderColor = '#e94560';
        rouletteResultElement.innerHTML = `Выбрана ставка на число ${rouletteCurrentBet.value} (${rouletteCurrentBet.multiplier}x)`;
    } else {
        document.getElementById('rouletteNumber').style.borderColor = '#0f3460';
        const betNames = {
            'red': 'Красное',
            'black': 'Черное',
            'even': 'Четное',
            'odd': 'Нечетное'
        };
        rouletteResultElement.innerHTML = `Выбрана ставка: ${betNames[rouletteCurrentBet.value]} (${rouletteCurrentBet.multiplier}x)`;
    }
}

function playRoulette() {
    if (!rouletteCurrentBet) {
        rouletteResultElement.innerHTML = 'Сначала выберите тип ставки!';
        rouletteResultElement.className = 'result lose';
        return;
    }
    
    const bet = parseInt(rouletteBetElement.textContent);
    
    if (bet > balance) {
        rouletteResultElement.innerHTML = 'Недостаточно дошираков для ставки!';
        rouletteResultElement.className = 'result lose';
        showNotification('Недостаточно дошираков!', 'error');
        return;
    }
    
    if (bet < 5) {
        rouletteResultElement.innerHTML = 'Минимальная ставка - 5 дошираков!';
        rouletteResultElement.className = 'result lose';
        showNotification('Минимальная ставка - 5 дошираков!', 'error');
        return;
    }
    
    // Снимаем ставку
    balance -= bet;
    updateBalance();
    
    playerStats.totalGames += 1;
    
    // Генерируем случайное число от 0 до 36
    const winningNumber = Math.floor(Math.random() * 37);
    const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber);
    const isBlack = !isRed && winningNumber !== 0;
    const isEven = winningNumber % 2 === 0 && winningNumber !== 0;
    const isOdd = winningNumber % 2 === 1;
    
    // Анимация рулетки
    const wheel = document.getElementById('rouletteWheel');
    const ball = wheel.querySelector('.roulette-ball');
    
    wheel.style.animation = 'spin 3s cubic-bezier(0.1, 0.7, 0.1, 1)';
    ball.style.animation = 'ballSpin 3s linear';
    
    // Отключаем кнопку на время анимации
    const playBtn = document.getElementById('playRoulette');
    playBtn.disabled = true;
    playBtn.textContent = 'Крутится...';
    
    // Воспроизводим звук
    playSound('spin');
    
    // Проверяем результат через 3 секунды
    setTimeout(() => {
        wheel.style.animation = '';
        ball.style.animation = '';
        
        let isWin = false;
        let winAmount = 0;
        
        // Проверяем выигрыш
        if (rouletteCurrentBet.type === 'number') {
            if (rouletteCurrentBet.value === winningNumber) {
                isWin = true;
                winAmount = bet * rouletteCurrentBet.multiplier;
            }
        } else {
            switch(rouletteCurrentBet.value) {
                case 'red':
                    if (isRed) {
                        isWin = true;
                        winAmount = bet * rouletteCurrentBet.multiplier;
                    }
                    break;
                case 'black':
                    if (isBlack) {
                        isWin = true;
                        winAmount = bet * rouletteCurrentBet.multiplier;
                    }
                    break;
                case 'even':
                    if (isEven) {
                        isWin = true;
                        winAmount = bet * rouletteCurrentBet.multiplier;
                    }
                    break;
                case 'odd':
                    if (isOdd) {
                        isWin = true;
                        winAmount = bet * rouletteCurrentBet.multiplier;
                    }
                    break;
            }
        }
        
        // Обновляем баланс
        if (isWin) {
            balance += winAmount;
            playerStats.gamesWon += 1;
            playSound('win');
            showNotification(`Выигрыш в рулетке! +${winAmount} дошираков`, 'info');
        } else {
            playerStats.gamesLost += 1;
            playSound('lose');
        }
        
        updateBalance();
        
        // Показываем результат
        const numberColor = winningNumber === 0 ? 'зеленый' : isRed ? 'красный' : 'черный';
        const numberType = winningNumber === 0 ? 'ноль' : isEven ? 'четное' : 'нечетное';
        
        if (isWin) {
            rouletteResultElement.innerHTML = `
                Выигрышное число: ${winningNumber} (${numberColor}, ${numberType})<br>
                <span class="win">ПОБЕДА! +${winAmount} дошираков!</span>
            `;
            rouletteResultElement.className = 'result win';
        } else {
            rouletteResultElement.innerHTML = `
                Выигрышное число: ${winningNumber} (${numberColor}, ${numberType})<br>
                <span class="lose">Вы проиграли ${bet} дошираков</span>
            `;
            rouletteResultElement.className = 'result lose';
        }
        
        // Добавляем в историю
        addToHistory('Рулетка', isWin ? `+${winAmount}` : `-${bet}`, isWin);
        
        // Включаем кнопку
        playBtn.disabled = false;
        playBtn.textContent = 'Крутить рулетку';
        
        updateStats();
    }, 3000);
}
if (onlineMode && authToken) {
    saveUserData();
}

// 3. ГОНКИ
function initRace() {
    const startBtn = document.getElementById('startRace');
    const racerBtns = document.querySelectorAll('.racer-btn');
    
    startBtn.addEventListener('click', startRace);
    
    racerBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const racerId = this.getAttribute('data-racer');
            selectRacer(parseInt(racerId));
        });
    });
}

function selectRacer(racerId) {
    raceSelectedRacer = racerId;
    
    const racerBtns = document.querySelectorAll('.racer-btn');
    racerBtns.forEach(btn => {
        if (btn.getAttribute('data-racer') == racerId) {
            btn.style.backgroundColor = '#e94560';
        } else {
            btn.style.backgroundColor = '#0f3460';
        }
    });
    
    const racerNames = {
        1: '🍜 Лапша-1',
        2: '🥤 Напиток',
        3: '🍥 Вафля',
        4: '🎲 Удача'
    };
    
    document.getElementById('selectedRacer').innerHTML = 
        `Выбран гонщик: <strong>${racerNames[racerId]}</strong>`;
}

function startRace() {
    if (!raceSelectedRacer) {
        raceResultElement.innerHTML = 'Сначала выберите гонщика!';
        raceResultElement.className = 'result lose';
        return;
    }
    
    const bet = parseInt(raceBetElement.textContent);
    
    if (bet > balance) {
        raceResultElement.innerHTML = 'Недостаточно дошираков для ставки!';
        raceResultElement.className = 'result lose';
        showNotification('Недостаточно дошираков!', 'error');
        return;
    }
    
    if (bet < 5) {
        raceResultElement.innerHTML = 'Минимальная ставка - 5 дошираков!';
        raceResultElement.className = 'result lose';
        showNotification('Минимальная ставка - 5 дошираков!', 'error');
        return;
    }
    
    if (raceInProgress) return;
    
    // Снимаем ставку
    balance -= bet;
    updateBalance();
    
    raceInProgress = true;
    playerStats.totalGames += 1;
    
    const startBtn = document.getElementById('startRace');
    startBtn.disabled = true;
    startBtn.textContent = 'Гонка началась!';
    
    raceResultElement.innerHTML = 'Гонка началась!';
    raceResultElement.className = 'result';
    
    // Сброс позиций гонщиков
    for (let i = 1; i <= 4; i++) {
        const racer = document.getElementById(`racer${i}`);
        racer.style.left = '0px';
    }
    
    // Запускаем гонку
    const finishLine = 280; // пикселей
    const racers = [1, 2, 3, 4];
    const speeds = racers.map(() => Math.random() * 3 + 2); // Случайные скорости
    
    let positions = [0, 0, 0, 0];
    let winner = null;
    
    // Воспроизводим звук гонки
    playSound('spin');
    
    const raceInterval = setInterval(() => {
        // Двигаем каждого гонщика
        for (let i = 0; i < 4; i++) {
            positions[i] += speeds[i] + Math.random() * 2;
            const racer = document.getElementById(`racer${i + 1}`);
            racer.style.left = `${Math.min(positions[i], finishLine)}px`;
            
            // Проверяем, достиг ли финиша
            if (positions[i] >= finishLine && winner === null) {
                winner = i + 1;
            }
        }
        
        // Если есть победитель, заканчиваем гонку
        if (winner !== null) {
            clearInterval(raceInterval);
            endRace(winner, bet);
        }
    }, 50);
}
if (onlineMode && authToken) {
    saveUserData();
}

function endRace(winner, bet) {
    raceInProgress = false;
    
    const startBtn = document.getElementById('startRace');
    startBtn.disabled = false;
    startBtn.textContent = 'Начать гонку';
    
    // Подсвечиваем победителя
    const winnerRacer = document.getElementById(`racer${winner}`);
    winnerRacer.classList.add('winning');
    
    const isWin = winner === raceSelectedRacer;
    
    if (isWin) {
        const winAmount = bet * 3;
        balance += winAmount;
        updateBalance();
        
        raceResultElement.innerHTML = `
            Победил гонщик №${winner}!<br>
            <span class="win">ПОБЕДА! Ваш гонщик выиграл! +${winAmount} дошираков!</span>
        `;
        raceResultElement.className = 'result win';
        
        playerStats.gamesWon += 1;
        playSound('win');
        showNotification(`Победа в гонках! +${winAmount} дошираков`, 'info');
        
        addToHistory('Гонки', `+${winAmount}`, true);
    } else {
        raceResultElement.innerHTML = `
            Победил гонщик №${winner}!<br>
            <span class="lose">Вы проиграли ${bet} дошираков</span>
        `;
        raceResultElement.className = 'result lose';
        
        playerStats.gamesLost += 1;
        playSound('lose');
        
        addToHistory('Гонки', `-${bet}`, false);
    }
    
    updateStats();
    
    // Сбрасываем подсветку через 3 секунды
    setTimeout(() => {
        winnerRacer.classList.remove('winning');
    }, 3000);
}
if (onlineMode && authToken) {
    saveUserData();
}


// === ОБЩИЕ ФУНКЦИИ (оставлены без изменений) ===

function loadProfile() {
    playerNameInput.value = playerProfile.name;
    playerAvatarSelect.value = playerProfile.avatar;
}

function saveProfile() {
    const newName = playerNameInput.value.trim() || "Игрок";
    const newAvatar = playerAvatarSelect.value;
    
    playerProfile.name = newName;
    playerProfile.avatar = newAvatar;
    
    localStorage.setItem('playerProfile', JSON.stringify(playerProfile));
    
    // Обновляем игрока в лидерборде
    updatePlayerInLeaderboard();
    
    // Показываем сообщение об успешном сохранении
    slotResultElement.innerHTML = `<span class="win">Профиль успешно сохранен!</span>`;
    slotResultElement.className = 'result win';
    
    // Воспроизводим звук
    playSound('click');
    
    // Переключаемся на вкладку игр
    setTimeout(() => switchTab('games'), 1500);
}

function updateStats() {
    totalGamesElement.textContent = playerStats.totalGames;
    gamesWonElement.textContent = playerStats.gamesWon;
    gamesLostElement.textContent = playerStats.gamesLost;
    
    const winRate = playerStats.totalGames > 0 
        ? Math.round((playerStats.gamesWon / playerStats.totalGames) * 100) 
        : 0;
    winRateElement.textContent = `${winRate}%`;
    
    localStorage.setItem('playerStats', JSON.stringify(playerStats));
}

function displayLeaderboard() {
    // Берем топ-10 из лидерборда
    const top10 = leaderboard.slice(0, 10);
    
    // Заполняем таблицу
    leaderboardBody.innerHTML = '';
    top10.forEach((player, index) => {
        const row = document.createElement('tr');
        
        // Определяем класс для первых трех мест
        let rankClass = '';
        if (index === 0) rankClass = 'rank-1';
        if (index === 1) rankClass = 'rank-2';
        if (index === 2) rankClass = 'rank-3';
        
        // Определяем уровень игрока
        let level = 'Новичок';
        if (player.balance >= 10000) level = 'Легенда';
        else if (player.balance >= 5000) level = 'Мастер';
        else if (player.balance >= 2000) level = 'Опытный';
        else if (player.balance >= 500) level = 'Игрок';
        
        // Подсвечиваем текущего игрока
        const isCurrentPlayer = player.name === playerProfile.name;
        const playerStyle = isCurrentPlayer ? 'style="color: #ff9a3c; font-weight: bold;"' : '';
        
        row.innerHTML = `
            <td class="${rankClass}">${index + 1}</td>
            <td ${playerStyle}>
                <div class="player-cell">
                    <span style="font-size: 1.5rem;">${player.avatar}</span>
                    ${player.name} ${isCurrentPlayer ? '(Вы)' : ''}
                </div>
            </td>
            <td ${playerStyle}>${player.balance}</td>
            <td>${level}</td>
        `;
        
        leaderboardBody.appendChild(row);
    });
}

function addToHistory(game, result, isWin) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const historyItem = {
        game,
        result,
        isWin,
        time: timeString
    };
    
    gameHistory.unshift(historyItem);
    
    // Ограничиваем историю последними 10 записями
    if (gameHistory.length > 10) {
        gameHistory = gameHistory.slice(0, 10);
    }
    
    localStorage.setItem('gameHistory', JSON.stringify(gameHistory));
    updateGameHistory();
}

function updateGameHistory() {
    historyItemsElement.innerHTML = '';
    
    if (gameHistory.length === 0) {
        historyItemsElement.innerHTML = '<div class="history-item">История игр пуста</div>';
        return;
    }
    
    gameHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        historyItem.innerHTML = `
            <div>
                <span class="history-game">${item.game}</span>
                <span> (${item.time})</span>
            </div>
            <div class="history-result ${item.isWin ? 'win' : 'lose'}">${item.result}</div>
        `;
        
        historyItemsElement.appendChild(historyItem);
    });
}

function toggleShareLinks() {
    shareLinks.classList.toggle('show');
    playSound('click');
}

function copyGameLink() {
    const gameUrl = window.location.href;
    
    // Используем современный Clipboard API
    navigator.clipboard.writeText(gameUrl).then(() => {
        showNotification('Ссылка скопирована в буфер обмена!', 'info');
        playSound('click');
    }).catch(err => {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = gameUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Ссылка скопирована в буфер обмена!', 'info');
        playSound('click');
    });
}

function shareOnPlatform(platform) {
    const gameUrl = window.location.href;
    const gameTitle = 'Доширак-Лэнд | Виртуальное казино';
    const gameDescription = 'Играйте в слоты и угадывайте числа, зарабатывайте дошираки!';
    
    let shareUrl = '';
    
    switch(platform) {
        case 'vk':
            shareUrl = `https://vk.com/share.php?url=${encodeURIComponent(gameUrl)}&title=${encodeURIComponent(gameTitle)}&description=${encodeURIComponent(gameDescription)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(gameTitle + ' - ' + gameDescription)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(gameTitle + ' - ' + gameDescription + ' ' + gameUrl)}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
        showNotification('Открывается окно для публикации...', 'info');
    }
    
    playSound('click');
}

function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = 'notification ' + type;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function playSound(type) {
    // Создаем звуки через Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        let frequency = 440;
        let duration = 0.1;
        
        switch(type) {
            case 'click':
                frequency = 800;
                duration = 0.05;
                break;
            case 'win':
                frequency = 880;
                duration = 0.3;
                break;
            case 'lose':
                frequency = 220;
                duration = 0.2;
                break;
            case 'spin':
                frequency = 600;
                duration = 0.1;
                break;
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
    } catch (e) {
        // Web Audio API не поддерживается - ничего не делаем
    }
}