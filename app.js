/* ============================================
   BabyDream - Baby Sleep Tracker
   Main Application Logic
   ============================================ */

(function () {
    'use strict';

    // ========================================
    // Data Store
    // ========================================
    const STORAGE_KEY = 'babydream_data';

    const defaultData = {
        baby: { name: '', dob: '' },
        sleepEntries: [],
        feedEntries: [],
        diaperEntries: [],
        currentSleep: null // { startTime: ISO string }
    };

    function loadData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return { ...defaultData, ...parsed };
            }
        } catch (e) {
            console.error('Error loading data:', e);
        }
        return { ...defaultData };
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
        } catch (e) {
            console.error('Error saving data:', e);
        }
    }

    let appData = loadData();

    // ========================================
    // Utility Functions
    // ========================================
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function formatTime(date) {
        return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    function formatDate(date) {
        return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    function formatDuration(ms) {
        const totalMinutes = Math.floor(ms / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    function formatTimerDisplay(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function isToday(dateStr) {
        const d = new Date(dateStr);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate();
    }

    function getDayStart(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function getDaysAgo(n) {
        const d = new Date();
        d.setDate(d.getDate() - n);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function feedTypeLabel(type) {
        const labels = {
            'breast-left': 'Pecho Izq.',
            'breast-right': 'Pecho Der.',
            'bottle': 'Biberon',
            'solids': 'Solidos'
        };
        return labels[type] || type;
    }

    function diaperTypeLabel(type) {
        const labels = {
            'wet': 'Mojado',
            'dirty': 'Sucio',
            'both': 'Ambos',
            'dry': 'Seco'
        };
        return labels[type] || type;
    }

    // ========================================
    // Navigation
    // ========================================
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabs = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            navBtns.forEach(b => b.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + tabId).classList.add('active');

            if (tabId === 'dashboard') refreshDashboard();
            if (tabId === 'stats') refreshStats();
            if (tabId === 'tracker') refreshHistory();
        });
    });

    // ========================================
    // Sleep Tracking
    // ========================================
    let sleepTimerInterval = null;

    function startSleep() {
        appData.currentSleep = { startTime: new Date().toISOString() };
        saveData();
        updateSleepUI();
    }

    function stopSleep() {
        if (!appData.currentSleep) return;
        const start = new Date(appData.currentSleep.startTime);
        const end = new Date();
        const duration = end - start;
        const hour = start.getHours();
        const type = (hour >= 19 || hour < 7) ? 'night' : 'nap';

        appData.sleepEntries.push({
            id: generateId(),
            start: start.toISOString(),
            end: end.toISOString(),
            duration: duration,
            type: type
        });
        appData.currentSleep = null;
        saveData();
        updateSleepUI();
        refreshDashboard();
    }

    function updateSleepUI() {
        const statusEl = document.getElementById('sleep-status');
        const timerEl = document.getElementById('sleep-timer');
        const btnTextEl = document.getElementById('sleep-btn-text');
        const toggleBtn = document.getElementById('toggle-sleep-btn');
        const quickSleepBtn = document.getElementById('quick-sleep-btn');

        if (sleepTimerInterval) {
            clearInterval(sleepTimerInterval);
            sleepTimerInterval = null;
        }

        if (appData.currentSleep) {
            statusEl.textContent = 'Durmiendo...';
            statusEl.classList.add('sleeping');
            btnTextEl.textContent = 'Detener Sueno';
            toggleBtn.classList.add('is-sleeping');
            quickSleepBtn.classList.add('active-sleep');
            quickSleepBtn.querySelector('span:last-child').textContent = 'Detener Sueno';

            sleepTimerInterval = setInterval(() => {
                const elapsed = Date.now() - new Date(appData.currentSleep.startTime).getTime();
                timerEl.textContent = formatTimerDisplay(elapsed);
            }, 1000);
            // Immediate update
            const elapsed = Date.now() - new Date(appData.currentSleep.startTime).getTime();
            timerEl.textContent = formatTimerDisplay(elapsed);
        } else {
            statusEl.textContent = 'Despierto';
            statusEl.classList.remove('sleeping');
            timerEl.textContent = '00:00:00';
            btnTextEl.textContent = 'Iniciar Sueno';
            toggleBtn.classList.remove('is-sleeping');
            quickSleepBtn.classList.remove('active-sleep');
            quickSleepBtn.querySelector('span:last-child').textContent = 'Iniciar Sueno';
        }
    }

    // Toggle sleep button
    document.getElementById('toggle-sleep-btn').addEventListener('click', () => {
        if (appData.currentSleep) stopSleep();
        else startSleep();
    });

    document.getElementById('quick-sleep-btn').addEventListener('click', () => {
        if (appData.currentSleep) stopSleep();
        else startSleep();
    });

    // Manual sleep entry
    document.getElementById('save-manual-sleep').addEventListener('click', () => {
        const startInput = document.getElementById('manual-sleep-start');
        const endInput = document.getElementById('manual-sleep-end');
        const typeInput = document.getElementById('manual-sleep-type');

        if (!startInput.value || !endInput.value) {
            alert('Por favor, completa las fechas de inicio y fin.');
            return;
        }

        const start = new Date(startInput.value);
        const end = new Date(endInput.value);

        if (end <= start) {
            alert('La fecha de fin debe ser posterior a la de inicio.');
            return;
        }

        appData.sleepEntries.push({
            id: generateId(),
            start: start.toISOString(),
            end: end.toISOString(),
            duration: end - start,
            type: typeInput.value
        });
        saveData();

        startInput.value = '';
        endInput.value = '';
        refreshDashboard();
        refreshHistory();
        alert('Sueno registrado correctamente.');
    });

    // ========================================
    // Feeding Tracking
    // ========================================
    document.getElementById('save-feed').addEventListener('click', () => {
        const type = document.getElementById('feed-type').value;
        const amount = document.getElementById('feed-amount').value;
        const duration = document.getElementById('feed-duration').value;
        const notes = document.getElementById('feed-notes').value;

        appData.feedEntries.push({
            id: generateId(),
            time: new Date().toISOString(),
            type: type,
            amount: amount ? parseInt(amount) : null,
            duration: duration ? parseInt(duration) : null,
            notes: notes
        });
        saveData();

        document.getElementById('feed-amount').value = '';
        document.getElementById('feed-duration').value = '';
        document.getElementById('feed-notes').value = '';

        refreshDashboard();
        refreshHistory();
        alert('Toma registrada.');
    });

    // Quick feed from dashboard
    document.getElementById('quick-feed-btn').addEventListener('click', () => {
        document.getElementById('feed-modal').classList.remove('hidden');
    });

    document.getElementById('save-quick-feed').addEventListener('click', () => {
        const type = document.getElementById('quick-feed-type').value;
        const amount = document.getElementById('quick-feed-amount').value;

        appData.feedEntries.push({
            id: generateId(),
            time: new Date().toISOString(),
            type: type,
            amount: amount ? parseInt(amount) : null,
            duration: null,
            notes: ''
        });
        saveData();

        document.getElementById('quick-feed-amount').value = '';
        document.getElementById('feed-modal').classList.add('hidden');
        refreshDashboard();
    });

    // Close feed modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('feed-modal').classList.add('hidden');
        });
    });

    // ========================================
    // Diaper Tracking
    // ========================================
    let selectedDiaperType = 'wet';

    document.querySelectorAll('[data-diaper]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-diaper]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDiaperType = btn.dataset.diaper;
        });
    });

    document.getElementById('save-diaper').addEventListener('click', () => {
        const notes = document.getElementById('diaper-notes').value;

        appData.diaperEntries.push({
            id: generateId(),
            time: new Date().toISOString(),
            type: selectedDiaperType,
            notes: notes
        });
        saveData();

        document.getElementById('diaper-notes').value = '';
        refreshDashboard();
        refreshHistory();
        alert('Panal registrado.');
    });

    document.getElementById('quick-diaper-btn').addEventListener('click', () => {
        appData.diaperEntries.push({
            id: generateId(),
            time: new Date().toISOString(),
            type: 'wet',
            notes: ''
        });
        saveData();
        refreshDashboard();
    });

    // ========================================
    // History / Filter
    // ========================================
    let currentFilter = 'all';

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            refreshHistory();
        });
    });

    function getAllTodayEntries() {
        const entries = [];

        appData.sleepEntries.filter(e => isToday(e.start)).forEach(e => {
            entries.push({
                type: 'sleep',
                time: e.start,
                data: e
            });
        });

        appData.feedEntries.filter(e => isToday(e.time)).forEach(e => {
            entries.push({
                type: 'feed',
                time: e.time,
                data: e
            });
        });

        appData.diaperEntries.filter(e => isToday(e.time)).forEach(e => {
            entries.push({
                type: 'diaper',
                time: e.time,
                data: e
            });
        });

        entries.sort((a, b) => new Date(b.time) - new Date(a.time));
        return entries;
    }

    function renderActivityItem(entry) {
        const item = document.createElement('div');
        item.className = 'activity-item';

        let icon, iconClass, title, subtitle, time;

        if (entry.type === 'sleep') {
            icon = '\u{1F634}';
            iconClass = 'sleep-icon';
            title = entry.data.type === 'night' ? 'Sueno nocturno' : 'Siesta';
            subtitle = formatDuration(entry.data.duration);
            time = formatTime(entry.data.start);
        } else if (entry.type === 'feed') {
            icon = '\u{1F37C}';
            iconClass = 'feed-icon';
            title = feedTypeLabel(entry.data.type);
            const parts = [];
            if (entry.data.amount) parts.push(entry.data.amount + ' ml');
            if (entry.data.duration) parts.push(entry.data.duration + ' min');
            if (entry.data.notes) parts.push(entry.data.notes);
            subtitle = parts.join(' - ') || '';
            time = formatTime(entry.data.time);
        } else if (entry.type === 'diaper') {
            icon = '\u{1F9F7}';
            iconClass = 'diaper-icon';
            title = 'Panal: ' + diaperTypeLabel(entry.data.type);
            subtitle = entry.data.notes || '';
            time = formatTime(entry.data.time);
        }

        item.innerHTML = `
            <div class="item-icon ${iconClass}">${icon}</div>
            <div class="item-details">
                <div class="item-title">${title}</div>
                <div class="item-subtitle">${subtitle}</div>
            </div>
            <span class="item-time">${time}</span>
            <button class="delete-entry" data-type="${entry.type}" data-id="${entry.data.id}" title="Eliminar">&times;</button>
        `;

        return item;
    }

    function refreshHistory() {
        const listEl = document.getElementById('history-list');
        let entries = getAllTodayEntries();

        if (currentFilter !== 'all') {
            entries = entries.filter(e => e.type === currentFilter);
        }

        if (entries.length === 0) {
            listEl.innerHTML = '<p class="empty-state">No hay registros hoy</p>';
            return;
        }

        listEl.innerHTML = '';
        entries.forEach(entry => {
            listEl.appendChild(renderActivityItem(entry));
        });

        // Delete handlers
        listEl.querySelectorAll('.delete-entry').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const id = btn.dataset.id;
                if (!confirm('Eliminar este registro?')) return;

                if (type === 'sleep') {
                    appData.sleepEntries = appData.sleepEntries.filter(e => e.id !== id);
                } else if (type === 'feed') {
                    appData.feedEntries = appData.feedEntries.filter(e => e.id !== id);
                } else if (type === 'diaper') {
                    appData.diaperEntries = appData.diaperEntries.filter(e => e.id !== id);
                }
                saveData();
                refreshHistory();
                refreshDashboard();
            });
        });
    }

    // ========================================
    // Dashboard
    // ========================================
    function refreshDashboard() {
        // Total sleep today
        const todaySleep = appData.sleepEntries
            .filter(e => isToday(e.start))
            .reduce((sum, e) => sum + e.duration, 0);
        document.getElementById('total-sleep-today').textContent = formatDuration(todaySleep);

        // Awake since
        const lastSleepEnd = appData.sleepEntries
            .filter(e => e.end)
            .sort((a, b) => new Date(b.end) - new Date(a.end))[0];

        if (appData.currentSleep) {
            document.getElementById('awake-since').textContent = 'Durmiendo';
        } else if (lastSleepEnd) {
            const awakeMs = Date.now() - new Date(lastSleepEnd.end).getTime();
            document.getElementById('awake-since').textContent = formatDuration(awakeMs);
        } else {
            document.getElementById('awake-since').textContent = '--';
        }

        // Feedings today
        const feedsToday = appData.feedEntries.filter(e => isToday(e.time)).length;
        document.getElementById('feedings-today').textContent = feedsToday;

        // Diapers today
        const diapersToday = appData.diaperEntries.filter(e => isToday(e.time)).length;
        document.getElementById('diapers-today').textContent = diapersToday;

        // Recent activity (last 5)
        const recentList = document.getElementById('recent-list');
        const allEntries = getAllTodayEntries().slice(0, 5);

        if (allEntries.length === 0) {
            recentList.innerHTML = '<p class="empty-state">No hay actividad registrada todavia</p>';
        } else {
            recentList.innerHTML = '';
            allEntries.forEach(entry => {
                recentList.appendChild(renderActivityItem(entry));
            });
        }

        // Draw clock
        drawClock();
    }

    // ========================================
    // 24-Hour Circular Clock
    // ========================================
    function drawClock() {
        const canvas = document.getElementById('clock-canvas');
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const center = size / 2;
        const radius = center - 20;

        ctx.clearRect(0, 0, size, size);

        // Background circle
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#F8F7FF';
        ctx.fill();
        ctx.strokeStyle = '#E8E6FF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner circle
        ctx.beginPath();
        ctx.arc(center, center, radius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = '#E8E6FF';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Hour markers
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
            const innerR = radius * 0.88;
            const outerR = radius * 0.95;
            const x1 = center + Math.cos(angle) * innerR;
            const y1 = center + Math.sin(angle) * innerR;
            const x2 = center + Math.cos(angle) * outerR;
            const y2 = center + Math.sin(angle) * outerR;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = (i % 6 === 0) ? '#7B78AA' : '#D0CEE8';
            ctx.lineWidth = (i % 6 === 0) ? 2 : 1;
            ctx.stroke();

            // Hour labels for every 3 hours
            if (i % 3 === 0) {
                const labelR = radius * 1.06;
                const lx = center + Math.cos(angle) * labelR;
                const ly = center + Math.sin(angle) * labelR;
                ctx.fillStyle = '#7B78AA';
                ctx.font = '11px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(i).padStart(2, '0'), lx, ly);
            }
        }

        // Draw sleep arcs for today
        const todaySleep = appData.sleepEntries.filter(e => isToday(e.start));
        todaySleep.forEach(entry => {
            drawArc(ctx, center, radius, entry.start, entry.end, '#6C63FF', 0.82);
        });

        // Current sleep
        if (appData.currentSleep) {
            drawArc(ctx, center, radius, appData.currentSleep.startTime, new Date().toISOString(), '#6C63FF', 0.82);
        }

        // Draw feed markers
        const todayFeeds = appData.feedEntries.filter(e => isToday(e.time));
        todayFeeds.forEach(entry => {
            drawMarker(ctx, center, radius, entry.time, '#FF6B9D', 0.72);
        });

        // Draw diaper markers
        const todayDiapers = appData.diaperEntries.filter(e => isToday(e.time));
        todayDiapers.forEach(entry => {
            drawMarker(ctx, center, radius, entry.time, '#4ECDC4', 0.65);
        });

        // Current time hand
        const now = new Date();
        const currentHour = now.getHours() + now.getMinutes() / 60;
        const currentAngle = (currentHour / 24) * Math.PI * 2 - Math.PI / 2;
        const handLength = radius * 0.55;

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(
            center + Math.cos(currentAngle) * handLength,
            center + Math.sin(currentAngle) * handLength
        );
        ctx.strokeStyle = '#2D2B55';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(center, center, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#2D2B55';
        ctx.fill();
    }

    function drawArc(ctx, center, radius, startTime, endTime, color, radiusFactor) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const startHour = start.getHours() + start.getMinutes() / 60;
        const endHour = end.getHours() + end.getMinutes() / 60;

        const startAngle = (startHour / 24) * Math.PI * 2 - Math.PI / 2;
        const endAngle = (endHour / 24) * Math.PI * 2 - Math.PI / 2;

        const innerR = radius * (radiusFactor - 0.08);
        const outerR = radius * radiusFactor;

        ctx.beginPath();
        ctx.arc(center, center, outerR, startAngle, endAngle);
        ctx.arc(center, center, innerR, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = color + '80';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function drawMarker(ctx, center, radius, time, color, radiusFactor) {
        const d = new Date(time);
        const hour = d.getHours() + d.getMinutes() / 60;
        const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
        const r = radius * radiusFactor;

        const x = center + Math.cos(angle) * r;
        const y = center + Math.sin(angle) * r;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    // ========================================
    // Sound Player (Web Audio API)
    // ========================================
    let audioContext = null;
    let currentSoundNode = null;
    let currentSoundName = null;
    let soundTimerTimeout = null;
    let soundTimerMinutes = 0;

    const soundConfigs = {
        'white-noise': { name: 'Ruido Blanco', generator: generateWhiteNoise },
        'rain': { name: 'Lluvia', generator: generateRain },
        'ocean': { name: 'Oceano', generator: generateOcean },
        'heartbeat': { name: 'Latido', generator: generateHeartbeat },
        'shush': { name: 'Shh Shh', generator: generateShush },
        'lullaby': { name: 'Nana', generator: generateLullaby },
        'fan': { name: 'Ventilador', generator: generateFan },
        'birds': { name: 'Pajaros', generator: generateBirds },
        'womb': { name: 'Utero', generator: generateWomb }
    };

    function getAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        return audioContext;
    }

    function stopCurrentSound() {
        if (currentSoundNode) {
            try {
                currentSoundNode.stop();
            } catch (e) {
                // Some nodes don't have stop
            }
            currentSoundNode.disconnect();
            currentSoundNode = null;
        }
        currentSoundName = null;
        if (soundTimerTimeout) {
            clearTimeout(soundTimerTimeout);
            soundTimerTimeout = null;
        }
        document.getElementById('now-playing').classList.add('hidden');
        document.querySelectorAll('.sound-card').forEach(c => c.classList.remove('playing'));
    }

    function playSound(soundKey) {
        stopCurrentSound();

        const config = soundConfigs[soundKey];
        if (!config) return;

        const ctx = getAudioContext();
        const gainNode = ctx.createGain();
        const volume = document.getElementById('volume-slider').value / 100;
        gainNode.gain.value = volume;
        gainNode.connect(ctx.destination);

        currentSoundNode = config.generator(ctx, gainNode);
        currentSoundName = soundKey;

        document.getElementById('now-playing').classList.remove('hidden');
        document.getElementById('now-playing-name').textContent = config.name;
        document.querySelector(`.sound-card[data-sound="${soundKey}"]`).classList.add('playing');

        // Set timer if configured
        if (soundTimerMinutes > 0) {
            soundTimerTimeout = setTimeout(() => {
                stopCurrentSound();
            }, soundTimerMinutes * 60 * 1000);
        }
    }

    // Sound generators using Web Audio API
    function generateWhiteNoise(ctx, destination) {
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Slight lowpass for softer sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 4000;

        source.connect(filter);
        filter.connect(destination);
        source.start();
        return source;
    }

    function generateRain(ctx, destination) {
        // Brown noise (rain-like)
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 0.5;

        source.connect(filter);
        filter.connect(destination);
        source.start();
        return source;
    }

    function generateOcean(ctx, destination) {
        // Modulated noise for ocean waves
        const bufferSize = 4 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const t = i / ctx.sampleRate;
            const wave = Math.sin(2 * Math.PI * 0.1 * t) * 0.5 + 0.5;
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = data[i];
            data[i] *= wave * 4;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        source.connect(filter);
        filter.connect(destination);
        source.start();
        return source;
    }

    function generateHeartbeat(ctx, destination) {
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        const bpm = 70;
        const beatInterval = (60 / bpm) * ctx.sampleRate;

        for (let i = 0; i < bufferSize; i++) {
            const posInBeat = i % beatInterval;
            const t = posInBeat / ctx.sampleRate;

            // Two-thump heartbeat
            let val = 0;
            if (t < 0.08) {
                val = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 30);
            } else if (t > 0.15 && t < 0.23) {
                const t2 = t - 0.15;
                val = Math.sin(2 * Math.PI * 50 * t2) * Math.exp(-t2 * 25) * 0.7;
            }
            data[i] = val;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(destination);
        source.start();
        return source;
    }

    function generateShush(ctx, destination) {
        const bufferSize = 3 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / ctx.sampleRate;
            const cycle = t % 1.5;
            let envelope = 0;
            if (cycle < 0.8) {
                envelope = Math.sin(Math.PI * cycle / 0.8);
            }
            data[i] = (Math.random() * 2 - 1) * envelope * 0.5;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.Q.value = 1;

        source.connect(filter);
        filter.connect(destination);
        source.start();
        return source;
    }

    function generateLullaby(ctx, destination) {
        // Simple melodic tones
        const notes = [262, 294, 330, 349, 330, 294, 262, 247, 262, 294, 330, 294, 262, 247, 220];
        const noteLength = 0.6;
        const bufferSize = Math.ceil(notes.length * noteLength * ctx.sampleRate);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let n = 0; n < notes.length; n++) {
            const freq = notes[n];
            const start = Math.floor(n * noteLength * ctx.sampleRate);
            const len = Math.floor(noteLength * ctx.sampleRate);
            for (let i = 0; i < len; i++) {
                const t = i / ctx.sampleRate;
                const envelope = Math.exp(-t * 2.5);
                data[start + i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
            }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(destination);
        source.start();
        return source;
    }

    function generateFan(ctx, destination) {
        // Pink noise (fan-like)
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        source.connect(filter);
        filter.connect(destination);
        source.start();
        return source;
    }

    function generateBirds(ctx, destination) {
        const bufferSize = 6 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Bird chirps at random intervals
        for (let chirp = 0; chirp < 15; chirp++) {
            const chirpStart = Math.floor(Math.random() * (bufferSize - ctx.sampleRate * 0.3));
            const freq = 2000 + Math.random() * 3000;
            const chirpLen = Math.floor((0.05 + Math.random() * 0.15) * ctx.sampleRate);
            for (let i = 0; i < chirpLen && (chirpStart + i) < bufferSize; i++) {
                const t = i / ctx.sampleRate;
                const envelope = Math.sin(Math.PI * i / chirpLen);
                const freqMod = freq + Math.sin(2 * Math.PI * 20 * t) * 500;
                data[chirpStart + i] += Math.sin(2 * Math.PI * freqMod * t) * envelope * 0.15;
            }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(destination);
        source.start();
        return source;
    }

    function generateWomb(ctx, destination) {
        // Low rumble + muffled heartbeat
        const bufferSize = 4 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;

        const bpm = 75;
        const beatInterval = (60 / bpm) * ctx.sampleRate;

        for (let i = 0; i < bufferSize; i++) {
            // Low rumble
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + 0.01 * white) / 1.01;
            lastOut = data[i];
            data[i] *= 5;

            // Heartbeat overlay
            const posInBeat = i % beatInterval;
            const t = posInBeat / ctx.sampleRate;
            if (t < 0.07) {
                data[i] += Math.sin(2 * Math.PI * 40 * t) * Math.exp(-t * 35) * 0.3;
            } else if (t > 0.12 && t < 0.19) {
                const t2 = t - 0.12;
                data[i] += Math.sin(2 * Math.PI * 35 * t2) * Math.exp(-t2 * 30) * 0.2;
            }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;

        source.connect(filter);
        filter.connect(destination);
        source.start();
        return source;
    }

    // Sound card click handlers
    document.querySelectorAll('.sound-card').forEach(card => {
        card.addEventListener('click', () => {
            const soundKey = card.dataset.sound;
            if (currentSoundName === soundKey) {
                stopCurrentSound();
            } else {
                playSound(soundKey);
            }
        });
    });

    // Stop button
    document.getElementById('stop-sound').addEventListener('click', stopCurrentSound);

    // Volume slider
    document.getElementById('volume-slider').addEventListener('input', (e) => {
        if (audioContext && currentSoundNode) {
            // Find gain node in the chain
            const nodes = audioContext.destination;
            // We'll reconnect with new gain
        }
    });

    // Timer options
    document.querySelectorAll('.timer-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.timer-opt-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            soundTimerMinutes = parseInt(btn.dataset.minutes);
        });
    });

    // ========================================
    // Statistics
    // ========================================
    let statsPeriod = 'week';

    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            statsPeriod = btn.dataset.period;
            refreshStats();
        });
    });

    function refreshStats() {
        const days = statsPeriod === 'week' ? 7 : 30;
        const since = getDaysAgo(days);

        // Sleep stats
        const periodSleep = appData.sleepEntries.filter(e => new Date(e.start) >= since);
        const totalSleepMs = periodSleep.reduce((sum, e) => sum + e.duration, 0);
        const avgSleepMs = days > 0 ? totalSleepMs / days : 0;

        document.getElementById('avg-sleep').textContent = formatDuration(avgSleepMs);

        const naps = periodSleep.filter(e => e.type === 'nap');
        const avgNaps = days > 0 ? (naps.length / days).toFixed(1) : 0;
        document.getElementById('avg-naps').textContent = avgNaps;

        const longestSleep = periodSleep.length > 0
            ? Math.max(...periodSleep.map(e => e.duration))
            : 0;
        document.getElementById('longest-sleep').textContent = longestSleep > 0 ? formatDuration(longestSleep) : '--';

        const nightWakings = periodSleep.filter(e => e.type === 'night').length;
        const avgWakings = days > 0 ? (nightWakings / days).toFixed(1) : 0;
        document.getElementById('night-wakings').textContent = avgWakings;

        // Feed stats
        const periodFeeds = appData.feedEntries.filter(e => new Date(e.time) >= since);
        const avgFeeds = days > 0 ? (periodFeeds.length / days).toFixed(1) : 0;
        document.getElementById('avg-feeds').textContent = avgFeeds;

        const feedsWithAmount = periodFeeds.filter(e => e.amount);
        const avgAmount = feedsWithAmount.length > 0
            ? Math.round(feedsWithAmount.reduce((s, e) => s + e.amount, 0) / feedsWithAmount.length)
            : 0;
        document.getElementById('avg-feed-amount').textContent = avgAmount > 0 ? avgAmount + ' ml' : '--';

        // Diaper stats
        const periodDiapers = appData.diaperEntries.filter(e => new Date(e.time) >= since);
        const avgDiapers = days > 0 ? (periodDiapers.length / days).toFixed(1) : 0;
        document.getElementById('avg-diapers').textContent = avgDiapers;

        const wetCount = periodDiapers.filter(e => e.type === 'wet' || e.type === 'both').length;
        const dirtyCount = periodDiapers.filter(e => e.type === 'dirty' || e.type === 'both').length;
        document.getElementById('diaper-breakdown').textContent = `${wetCount} / ${dirtyCount}`;

        // Draw charts
        drawSleepChart(days);
        drawPatternChart();
    }

    function drawSleepChart(days) {
        const canvas = document.getElementById('sleep-chart');
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const displayDays = Math.min(days, 7);
        const barWidth = (w - 60) / displayDays;
        const maxHours = 18;

        // Collect data
        const dailyData = [];
        for (let i = displayDays - 1; i >= 0; i--) {
            const dayStart = getDaysAgo(i);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const daySleep = appData.sleepEntries.filter(e => {
                const d = new Date(e.start);
                return d >= dayStart && d < dayEnd;
            });

            const totalHours = daySleep.reduce((s, e) => s + e.duration, 0) / 3600000;
            const label = dayStart.toLocaleDateString('es-ES', { weekday: 'short' });
            dailyData.push({ hours: totalHours, label });
        }

        // Y axis
        ctx.strokeStyle = '#E8E6FF';
        ctx.lineWidth = 1;
        for (let h2 = 0; h2 <= maxHours; h2 += 6) {
            const y = h - 30 - (h2 / maxHours) * (h - 50);
            ctx.beginPath();
            ctx.moveTo(40, y);
            ctx.lineTo(w - 10, y);
            ctx.stroke();

            ctx.fillStyle = '#7B78AA';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(h2 + 'h', 35, y + 4);
        }

        // Bars
        dailyData.forEach((d, i) => {
            const barH = (d.hours / maxHours) * (h - 50);
            const x = 45 + i * barWidth;
            const y = h - 30 - barH;

            // Bar gradient
            const gradient = ctx.createLinearGradient(x, y, x, h - 30);
            gradient.addColorStop(0, '#6C63FF');
            gradient.addColorStop(1, '#8B85FF');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x + 4, y, barWidth - 8, barH, [4, 4, 0, 0]);
            ctx.fill();

            // Value label
            if (d.hours > 0) {
                ctx.fillStyle = '#2D2B55';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(d.hours.toFixed(1), x + barWidth / 2, y - 6);
            }

            // Day label
            ctx.fillStyle = '#7B78AA';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.label, x + barWidth / 2, h - 12);
        });
    }

    function drawPatternChart() {
        const canvas = document.getElementById('pattern-chart');
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const days = 7;
        const rowHeight = (h - 40) / days;
        const hourWidth = (w - 60) / 24;

        // Header hours
        ctx.fillStyle = '#7B78AA';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        for (let hr = 0; hr < 24; hr += 3) {
            ctx.fillText(String(hr).padStart(2, '0'), 50 + hr * hourWidth, 12);
        }

        // Draw rows
        for (let i = 0; i < days; i++) {
            const dayStart = getDaysAgo(days - 1 - i);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);
            const y = 20 + i * rowHeight;

            // Day label
            ctx.fillStyle = '#7B78AA';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(dayStart.toLocaleDateString('es-ES', { weekday: 'short' }), 38, y + rowHeight / 2 + 4);

            // Background row
            ctx.fillStyle = i % 2 === 0 ? '#F8F7FF' : '#FFFFFF';
            ctx.fillRect(45, y, w - 55, rowHeight);

            // Sleep blocks
            const daySleep = appData.sleepEntries.filter(e => {
                const d = new Date(e.start);
                return d >= dayStart && d < dayEnd;
            });

            daySleep.forEach(entry => {
                const start = new Date(entry.start);
                const end = new Date(entry.end);
                const startHour = start.getHours() + start.getMinutes() / 60;
                const endHour = end.getHours() + end.getMinutes() / 60;

                const x1 = 45 + startHour * hourWidth;
                const blockW = (endHour - startHour) * hourWidth;

                ctx.fillStyle = entry.type === 'night' ? '#6C63FFB0' : '#8B85FFB0';
                ctx.beginPath();
                ctx.roundRect(x1, y + 3, Math.max(blockW, 2), rowHeight - 6, 3);
                ctx.fill();
            });
        }
    }

    // ========================================
    // Settings
    // ========================================
    document.getElementById('btn-settings').addEventListener('click', () => {
        document.getElementById('baby-name').value = appData.baby.name;
        document.getElementById('baby-dob').value = appData.baby.dob;
        document.getElementById('settings-modal').classList.remove('hidden');
    });

    document.getElementById('close-settings').addEventListener('click', () => {
        appData.baby.name = document.getElementById('baby-name').value;
        appData.baby.dob = document.getElementById('baby-dob').value;
        saveData();
        document.getElementById('settings-modal').classList.add('hidden');
    });

    document.getElementById('export-data').addEventListener('click', () => {
        const dataStr = JSON.stringify(appData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'babydream_backup_' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('clear-data').addEventListener('click', () => {
        if (!confirm('Estas seguro de que quieres borrar TODOS los datos? Esta accion no se puede deshacer.')) return;
        if (!confirm('Confirmacion final: Se eliminaran todos los registros permanentemente.')) return;
        appData = { ...defaultData };
        saveData();
        refreshDashboard();
        refreshHistory();
        refreshStats();
        document.getElementById('settings-modal').classList.add('hidden');
        alert('Datos eliminados.');
    });

    // Close modals on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });

    // ========================================
    // Initialize
    // ========================================
    function init() {
        updateSleepUI();
        refreshDashboard();

        // Auto-refresh dashboard every minute
        setInterval(() => {
            if (document.getElementById('tab-dashboard').classList.contains('active')) {
                refreshDashboard();
            }
            if (appData.currentSleep) {
                // Update awake-since on dashboard
            }
        }, 60000);
    }

    init();
})();
