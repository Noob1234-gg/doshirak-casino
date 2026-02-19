const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'doshirak-casino-secret-key-2026';

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

// Файлы для хранения данных
const USERS_FILE = path.join(__dirname, 'users.json');
const PLAYERS_FILE = path.join(__dirname, 'players.json');

// Инициализация файлов данных
function initDataFiles() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(PLAYERS_FILE)) {
        fs.writeFileSync(PLAYERS_FILE, JSON.stringify([]));
    }
}
initDataFiles();

// ======================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ======================

function loadUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        return [];
    }
}

function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения пользователей:', error);
        return false;
    }
}

function loadPlayers() {
    try {
        const data = fs.readFileSync(PLAYERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка загрузки игроков:', error);
        return [];
    }
}

function savePlayers(players) {
    try {
        fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения игроков:', error);
        return false;
    }
}

// Middleware для проверки токена
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Требуется авторизация' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
}

// ======================
// МАРШРУТЫ АВТОРИЗАЦИИ
// ======================

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    // Валидация
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Все поля обязательны' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ message: 'Пароль должен быть не менее 6 символов' });
    }
    
    const users = loadUsers();
    
    // Проверка уникальности
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'Имя пользователя уже занято' });
    }
    
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'Email уже зарегистрирован' });
    }
    
    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        username,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        lastLogin: null
    };
    
    users.push(newUser);
    
    if (saveUsers(users)) {
        // Создаем запись игрока
        const players = loadPlayers();
        players.push({
            id: newUser.id,
            username,
            name: username,
            avatar: '👨‍💼',
            balance: 100,
            stats: { totalGames: 0, gamesWon: 0, gamesLost: 0 },
            joinedDate: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
        });
        savePlayers(players);
        
        res.status(201).json({ 
            message: 'Регистрация успешна',
            userId: newUser.id 
        });
    } else {
        res.status(500).json({ message: 'Ошибка сохранения данных' });
    }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: 'Введите имя пользователя и пароль' });
    }
    
    const users = loadUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
        return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
        return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
    }
    
    // Обновляем время последнего входа
    user.lastLogin = new Date().toISOString();
    saveUsers(users);
    
    // Создаем токен
    const token = jwt.sign(
        { 
            id: user.id, 
            username: user.username,
            email: user.email 
        }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
    );
    
    // Получаем данные игрока
    const players = loadPlayers();
    const player = players.find(p => p.id === user.id) || {
        balance: 100,
        stats: { totalGames: 0, gamesWon: 0, gamesLost: 0 }
    };
    
    res.json({
        message: 'Вход выполнен успешно',
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            balance: player.balance,
            stats: player.stats
        }
    });
});

// Проверка токена
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    const players = loadPlayers();
    const player = players.find(p => p.id === req.user.id) || {
        balance: 100,
        stats: { totalGames: 0, gamesWon: 0, gamesLost: 0 }
    };
    
    res.json({
        user: {
            ...req.user,
            balance: player.balance,
            stats: player.stats
        }
    });
});

// Выход
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    // На стороне клиента токен удаляется
    res.json({ message: 'Выход выполнен успешно' });
});

// ======================
// МАРШРУТЫ ДЛЯ РАБОТЫ С ДАННЫМИ ИГРОКОВ
// ======================

// Получить данные пользователя
app.get('/api/user/:username', authenticateToken, (req, res) => {
    const username = req.params.username;
    
    // Проверяем, что пользователь запрашивает свои данные
    if (username !== req.user.username) {
        return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const players = loadPlayers();
    const player = players.find(p => p.id === req.user.id);
    
    if (player) {
        res.json(player);
    } else {
        // Создаем нового игрока, если нет
        const newPlayer = {
            id: req.user.id,
            username: req.user.username,
            name: req.user.username,
            avatar: '👨‍💼',
            balance: 100,
            stats: { totalGames: 0, gamesWon: 0, gamesLost: 0 },
            gameHistory: [],
            joinedDate: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
        };
        players.push(newPlayer);
        savePlayers(players);
        res.json(newPlayer);
    }
});

// Обновить данные пользователя
app.post('/api/user/update', authenticateToken, (req, res) => {
    const { balance, profile, stats, gameHistory } = req.body;
    
    let players = loadPlayers();
    const playerIndex = players.findIndex(p => p.id === req.user.id);
    
    if (playerIndex >= 0) {
        players[playerIndex] = {
            ...players[playerIndex],
            balance: balance || players[playerIndex].balance,
            name: profile?.name || players[playerIndex].name,
            avatar: profile?.avatar || players[playerIndex].avatar,
            stats: stats || players[playerIndex].stats,
            gameHistory: gameHistory || players[playerIndex].gameHistory,
            lastUpdate: new Date().toISOString()
        };
        
        if (savePlayers(players)) {
            res.json({ 
                success: true, 
                message: 'Данные обновлены',
                player: players[playerIndex]
            });
        } else {
            res.status(500).json({ success: false, message: 'Ошибка сохранения' });
        }
    } else {
        res.status(404).json({ success: false, message: 'Игрок не найден' });
    }
});

// Получить всех игроков
app.get('/api/players', (req, res) => {
    const players = loadPlayers();
    res.json(players);
});

// Обновить/добавить игрока (старый endpoint для совместимости)
app.post('/api/update-player', (req, res) => {
    const { playerId, name, avatar, balance, stats } = req.body;
    
    let players = loadPlayers();
    const existingIndex = players.findIndex(p => p.id === playerId);
    
    const playerData = {
        id: playerId,
        name: name || 'Игрок',
        avatar: avatar || '👨‍💼',
        balance: balance || 100,
        stats: stats || { totalGames: 0, gamesWon: 0, gamesLost: 0 },
        lastUpdate: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
        players[existingIndex] = { ...players[existingIndex], ...playerData };
    } else {
        playerData.joinedDate = new Date().toISOString();
        players.push(playerData);
    }
    
    if (savePlayers(players)) {
        res.json({ success: true, message: 'Данные сохранены' });
    } else {
        res.status(500).json({ success: false, message: 'Ошибка сохранения' });
    }
});

// Получить лидерборд (топ-10)
app.get('/api/leaderboard', (req, res) => {
    const players = loadPlayers();
    const sorted = players.sort((a, b) => b.balance - a.balance);
    const leaderboard = sorted.slice(0, 10).map((player, index) => ({
        rank: index + 1,
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        balance: player.balance,
        stats: player.stats
    }));
    res.json(leaderboard);
});

// Статус сервера
app.get('/api/status', (req, res) => {
    const players = loadPlayers();
    res.json({
        status: 'online',
        playersCount: players.length,
        serverTime: new Date().toISOString(),
        version: '2.0.0'
    });
});

// Статический контент
app.use(express.static(path.join(__dirname, '../frontend')));

// Запуск сервера
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log(`📊 API endpoints:`);
    console.log(`   POST /api/auth/register - регистрация`);
    console.log(`   POST /api/auth/login - вход`);
    console.log(`   GET  /api/auth/verify - проверка токена`);
    console.log(`   GET  /api/user/:username - данные пользователя`);
    console.log(`   POST /api/user/update - обновить данные`);
    console.log(`   GET  /api/players - все игроки`);
    console.log(`   GET  /api/leaderboard - топ-10 игроков`);
    console.log(`   GET  /api/status - статус сервера`);
    console.log('='.repeat(50));
});