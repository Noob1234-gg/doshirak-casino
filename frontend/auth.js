// ======================
// АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ
// ======================

const API_URL = 'https://your-username.github.io/doshirak-casino/api'; // ЗАМЕНИТЕ НА ВАШ URL
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Проверка авторизации при загрузке
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupAuthListeners();
});

// Настройка слушателей
function setupAuthListeners() {
    // Переключение между формами
    document.getElementById('showRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthForm('register');
    });
    
    document.getElementById('showLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthForm('login');
    });
    
    // Отправка форм
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // Закрытие модального окна
    document.querySelector('.auth-modal .close')?.addEventListener('click', hideAuthModal);
}

// Показать форму авторизации
function showAuthForm(type) {
    const modal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const modalTitle = document.getElementById('authModalTitle');
    
    if (type === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        modalTitle.textContent = 'Вход в аккаунт';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        modalTitle.textContent = 'Регистрация';
    }
    
    modal.style.display = 'flex';
}

// Скрыть модальное окно
function hideAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

// Проверка авторизации
async function checkAuth() {
    if (!authToken) {
        showAuthForm('login');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUIForAuth();
        } else {
            // Токен недействителен
            localStorage.removeItem('authToken');
            showAuthForm('login');
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        showAuthForm('login');
    }
}

// Обработка входа
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('username', username);
            
            hideAuthModal();
            updateUIForAuth();
            showNotification('Вход выполнен успешно!', 'success');
            
            // Загружаем данные пользователя
            loadUserData(username);
        } else {
            showNotification(data.message || 'Ошибка входа', 'error');
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        showNotification('Ошибка соединения с сервером', 'error');
    }
}

// Обработка регистрации
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Валидация
    if (password !== confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Пароль должен быть не менее 6 символов', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username, 
                email, 
                password 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Регистрация успешна! Теперь войдите в аккаунт.', 'success');
            showAuthForm('login');
        } else {
            showNotification(data.message || 'Ошибка регистрации', 'error');
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showNotification('Ошибка соединения с сервером', 'error');
    }
}

// Обработка выхода
async function handleLogout() {
    if (authToken) {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    authToken = null;
    currentUser = null;
    
    updateUIForLogout();
    showAuthForm('login');
    showNotification('Вы вышли из аккаунта', 'info');
}

// Обновление интерфейса после авторизации
function updateUIForAuth() {
    const username = localStorage.getItem('username');
    
    document.querySelector('.auth-buttons').style.display = 'none';
    document.querySelector('.user-info').style.display = 'flex';
    document.getElementById('usernameDisplay').textContent = username;
    
    // Показываем онлайн-секцию
    document.querySelector('.online-section').style.display = 'block';
    
    // Включаем онлайн-режим автоматически
    if (typeof toggleOnlineMode === 'function' && !onlineMode) {
        setTimeout(() => toggleOnlineMode(), 1000);
    }
}

// Обновление интерфейса после выхода
function updateUIForLogout() {
    document.querySelector('.auth-buttons').style.display = 'flex';
    document.querySelector('.user-info').style.display = 'none';
    document.querySelector('.online-section').style.display = 'none';
    
    // Выключаем онлайн-режим
    if (typeof onlineMode !== 'undefined' && onlineMode) {
        toggleOnlineMode();
    }
}

// Загрузка данных пользователя
async function loadUserData(username) {
    try {
        const response = await fetch(`${API_URL}/user/${username}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            
            // Загружаем данные в игру
            if (userData.balance) {
                balance = userData.balance;
                updateBalance();
            }
            
            if (userData.profile) {
                playerProfile = userData.profile;
                loadProfile();
            }
            
            if (userData.stats) {
                playerStats = userData.stats;
                updateStats();
            }
            
            showNotification('Данные загружены с сервера', 'success');
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Сохранение данных пользователя
async function saveUserData() {
    if (!authToken || !onlineMode) return;
    
    try {
        const response = await fetch(`${API_URL}/user/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                balance: balance,
                profile: playerProfile,
                stats: playerStats,
                gameHistory: gameHistory
            })
        });
        
        if (response.ok) {
            console.log('Данные сохранены на сервере');
        }
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
    }
}