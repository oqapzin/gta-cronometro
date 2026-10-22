/**
 * GTA VI - Official Countdown Timer Logic
 * Pure JavaScript with Timezone Conversion & Ambient FX
 */

// Country Database with IANA Timezones and Flags
const COUNTRIES_DATA = [
    { id: 'br', name: 'Brasil', flag: '🇧🇷', tz: 'America/Sao_Paulo', label: 'Brasília (UTC-3)' },
    { id: 'us-ny', name: 'Estados Unidos (Leste)', flag: '🇺🇸', tz: 'America/New_York', label: 'Nova York (UTC-5)' },
    { id: 'us-la', name: 'Estados Unidos (Oeste)', flag: '🇺🇸', tz: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
    { id: 'pt', name: 'Portugal', flag: '🇵🇹', tz: 'Europe/Lisbon', label: 'Lisboa (UTC+0)' },
    { id: 'uk', name: 'Reino Unido', flag: '🇬🇧', tz: 'Europe/London', label: 'Londres (UTC+0)' },
    { id: 'jp', name: 'Japão', flag: '🇯🇵', tz: 'Asia/Tokyo', label: 'Tóquio (UTC+9)' },
    { id: 'de', name: 'Alemanha', flag: '🇩🇪', tz: 'Europe/Berlin', label: 'Berlim (UTC+1)' },
    { id: 'fr', name: 'França', flag: '🇫🇷', tz: 'Europe/Paris', label: 'Paris (UTC+1)' },
    { id: 'es', name: 'Espanha', flag: '🇪🇸', tz: 'Europe/Madrid', label: 'Madri (UTC+1)' },
    { id: 'it', name: 'Itália', flag: '🇮🇹', tz: 'Europe/Rome', label: 'Roma (UTC+1)' },
    { id: 'ar', name: 'Argentina', flag: '🇦🇷', tz: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (UTC-3)' },
    { id: 'ca', name: 'Canadá', flag: '🇨🇦', tz: 'America/Toronto', label: 'Toronto (UTC-5)' },
    { id: 'au', name: 'Austrália', flag: '🇦🇺', tz: 'Australia/Sydney', label: 'Sydney (UTC+11)' },
    { id: 'mx', name: 'México', flag: '🇲🇽', tz: 'America/Mexico_City', label: 'Cidade do México (UTC-6)' },
    { id: 'cl', name: 'Chile', flag: '🇨🇱', tz: 'America/Santiago', label: 'Santiago (UTC-4)' },
    { id: 'kr', name: 'Coreia do Sul', flag: '🇰🇷', tz: 'Asia/Seoul', label: 'Seul (UTC+9)' }
];

// Target release date settings: November 19, 2026, 00:00:00 local time
const TARGET_YEAR = 2026;
const TARGET_MONTH = 11; // November (1-indexed for logic)
const TARGET_DAY = 19;
const TARGET_HOUR = 0;
const TARGET_MIN = 0;
const TARGET_SEC = 0;

// State
let selectedCountry = COUNTRIES_DATA[0]; // Default Brasil
let timerInterval = null;
let clockInterval = null;

// DOM Elements
const selectTrigger = document.getElementById('selectTrigger');
const selectDropdown = document.getElementById('selectDropdown');
const countryList = document.getElementById('countryList');
const countrySearch = document.getElementById('countrySearch');
const selectedFlag = document.getElementById('selectedFlag');
const selectedCountryName = document.getElementById('selectedCountryName');
const selectedTzBadge = document.getElementById('selectedTzBadge');
const autoDetectBtn = document.getElementById('autoDetectBtn');

const currentCountryTime = document.getElementById('currentCountryTime');
const countryReleaseDate = document.getElementById('countryReleaseDate');
const releaseModeText = document.getElementById('releaseModeText');

const daysValue = document.getElementById('daysValue');
const hoursValue = document.getElementById('hoursValue');
const minutesValue = document.getElementById('minutesValue');
const secondsValue = document.getElementById('secondsValue');
const targetStatusMessage = document.getElementById('targetStatusMessage');

const soundToggleBtn = document.getElementById('soundToggleBtn');
const shareBtn = document.getElementById('shareBtn');
const toastEl = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initCountryDropdown();
    tryAutoDetectUserTimezone();
    startCountdown();
    startCountryClock();
    initAmbientParticles();
    initSynthAudio();
    initShareFeature();
});

/* ===================================================
   COUNTRY SELECTOR & SEARCH
   =================================================== */
function initCountryDropdown() {
    renderCountryList(COUNTRIES_DATA);

    // Toggle dropdown
    selectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });

    // Search filter
    countrySearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = COUNTRIES_DATA.filter(c => 
            c.name.toLowerCase().includes(query) || 
            c.label.toLowerCase().includes(query)
        );
        renderCountryList(filtered);
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!selectTrigger.contains(e.target) && !selectDropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    // Auto-detect button
    autoDetectBtn.addEventListener('click', () => {
        detectUserTimezoneWithFeedback();
    });
}

function renderCountryList(list) {
    countryList.innerHTML = '';
    if (list.length === 0) {
        countryList.innerHTML = '<li style="padding: 16px; color: var(--text-dim); text-align: center;">Nenhum país encontrado</li>';
        return;
    }

    list.forEach(country => {
        const li = document.createElement('li');
        li.className = `country-item ${country.id === selectedCountry.id ? 'active' : ''}`;
        li.innerHTML = `
            <div class="item-left">
                <span class="item-flag">${country.flag}</span>
                <span class="item-name">${country.name}</span>
            </div>
            <span class="item-tz">${country.label}</span>
        `;
        li.addEventListener('click', () => {
            selectCountry(country);
            closeDropdown();
        });
        countryList.appendChild(li);
    });
}

function toggleDropdown() {
    const isHidden = selectDropdown.classList.contains('hidden');
    if (isHidden) {
        selectDropdown.classList.remove('hidden');
        selectTrigger.classList.add('open');
        countrySearch.focus();
    } else {
        closeDropdown();
    }
}

function closeDropdown() {
    selectDropdown.classList.add('hidden');
    selectTrigger.classList.remove('open');
    countrySearch.value = '';
    renderCountryList(COUNTRIES_DATA);
}

function selectCountry(country) {
    selectedCountry = country;
    selectedFlag.textContent = country.flag;
    selectedCountryName.textContent = country.name;
    selectedTzBadge.textContent = country.label;

    // Refresh UI
    updateCountryClock();
    updateCountdown();
    renderCountryList(COUNTRIES_DATA);
    showToast(`Fuso horário alterado para ${country.name}`);
}

function tryAutoDetectUserTimezone() {
    try {
        const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const matched = COUNTRIES_DATA.find(c => c.tz === userTz);
        if (matched) {
            selectCountry(matched);
        }
    } catch (err) {
        console.warn('Não foi possível autodetectar fuso horário:', err);
    }
}

function detectUserTimezoneWithFeedback() {
    try {
        const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const matched = COUNTRIES_DATA.find(c => c.tz === userTz);
        if (matched) {
            selectCountry(matched);
            showToast(`Fuso detectado com sucesso: ${matched.name} (${userTz})`);
        } else {
            // Find closest by offset or notify
            showToast(`Seu fuso atual é: ${userTz}`);
        }
    } catch (err) {
        showToast('Não foi possível detectar o fuso horário automaticamente.');
    }
}

/* ===================================================
   TIMEZONE CLOCK & TARGET CALCULATION
   =================================================== */
function updateCountryClock() {
    try {
        const now = new Date();
        const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
            timeZone: selectedCountry.tz,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        currentCountryTime.textContent = timeFormatter.format(now);
    } catch (err) {
        currentCountryTime.textContent = '--:--:--';
    }
}

function startCountryClock() {
    updateCountryClock();
    clockInterval = setInterval(updateCountryClock, 1000);
}

/**
 * Calculates milliseconds remaining until TARGET date at 00:00:00 local time
 * in the selected country's timezone.
 */
function getTargetTimeForTimezone(tz) {
    // Current UTC timestamp
    const nowUtc = Date.now();

    // Get current date parts in target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });

    const parts = formatter.formatToParts(new Date(nowUtc));
    const partMap = {};
    parts.forEach(p => partMap[p.type] = parseInt(p.value, 10));

    // Approximate timezone offset by comparing UTC representation with timezone parts
    // Local date string in the target timezone:
    const targetDateLocal = new Date(Date.UTC(TARGET_YEAR, TARGET_MONTH - 1, TARGET_DAY, TARGET_HOUR, TARGET_MIN, TARGET_SEC));
    
    // We compute the difference between target date and current time in that timezone:
    const currentInTz = new Date(Date.UTC(
        partMap.year,
        partMap.month - 1,
        partMap.day,
        partMap.hour,
        partMap.minute,
        partMap.second
    ));

    const diff = targetDateLocal.getTime() - currentInTz.getTime();
    return Math.max(0, diff);
}

/* ===================================================
   COUNTDOWN TIMER DISPLAY
   =================================================== */
let prevDays = '', prevHours = '', prevMinutes = '', prevSeconds = '';

function updateCountdown() {
    const remainingMs = getTargetTimeForTimezone(selectedCountry.tz);

    if (remainingMs <= 0) {
        daysValue.textContent = '00';
        hoursValue.textContent = '00';
        minutesValue.textContent = '00';
        secondsValue.textContent = '00';
        targetStatusMessage.innerHTML = '🎉 <strong>GTA VI FOI LANÇADO!</strong> BEM-VINDO A VICE CITY!';
        return;
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedDays = String(days).padStart(2, '0');
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    // Update with tick animations if changed
    updateDigit(daysValue, formattedDays, prevDays);
    updateDigit(hoursValue, formattedHours, prevHours);
    updateDigit(minutesValue, formattedMinutes, prevMinutes);
    updateDigit(secondsValue, formattedSeconds, prevSeconds);

    prevDays = formattedDays;
    prevHours = formattedHours;
    prevMinutes = formattedMinutes;
    prevSeconds = formattedSeconds;

    targetStatusMessage.innerHTML = `Faltam exatamente <strong>${days} dias, ${hours} horas e ${minutes} minutos</strong> em ${selectedCountry.name}!`;
}

function updateDigit(element, newVal, oldVal) {
    if (element.textContent !== newVal) {
        element.textContent = newVal;
        if (oldVal !== '') {
            element.classList.remove('digit-tick');
            // Trigger reflow for animation restart
            void element.offsetWidth;
            element.classList.add('digit-tick');
        }
    }
}

function startCountdown() {
    updateCountdown();
    timerInterval = setInterval(updateCountdown, 1000);
}

/* ===================================================
   AMBIENT SYNTHWAVE AUDIO (Web Audio API)
   Generates a warm Vice City twilight 80s synth pad
   =================================================== */
let audioCtx = null;
let isAudioPlaying = false;
let synthGain = null;
let activeOscillators = [];

function initSynthAudio() {
    soundToggleBtn.addEventListener('click', () => {
        if (!isAudioPlaying) {
            startSynthAtmosphere();
        } else {
            stopSynthAtmosphere();
        }
    });
}

function startSynthAtmosphere() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Master Gain
        synthGain = audioCtx.createGain();
        synthGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        synthGain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 2.5); // Fade in

        // Lowpass filter for warm 80s analog vibe
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, audioCtx.currentTime);

        // Slow LFO for filter breath
        const lfo = audioCtx.createOscillator();
        lfo.frequency.setValueAtTime(0.18, audioCtx.currentTime);
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.setValueAtTime(160, audioCtx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        // Chords (F minor / Eb major atmospheric notes for Vice City mystery)
        const notes = [
            174.61, // F3
            220.00, // A3 (or 207.65 Ab)
            261.63, // C4
            329.63, // E4 / Eb
            87.31   // Sub bass F2
        ];

        activeOscillators = [];

        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const noteGain = audioCtx.createGain();
            
            // Mix sawtooth and sine for retro analog feel
            osc.type = idx === notes.length - 1 ? 'sine' : 'sawtooth';
            osc.frequency.setValueAtTime(freq + (Math.random() * 0.8 - 0.4), audioCtx.currentTime); // Slight chorus detune

            noteGain.gain.setValueAtTime(idx === notes.length - 1 ? 0.35 : 0.08, audioCtx.currentTime);

            osc.connect(noteGain);
            noteGain.connect(filter);
            osc.start();
            activeOscillators.push(osc);
        });

        filter.connect(synthGain);
        synthGain.connect(audioCtx.destination);

        isAudioPlaying = true;
        soundToggleBtn.classList.add('active');
        soundToggleBtn.querySelector('.sound-text').textContent = 'Pausar Áudio';
        soundToggleBtn.querySelector('.audio-waves').classList.remove('hidden');
        showToast('Trilha sonora atmosférica ativada 🌴🎵');
    } catch (err) {
        console.error('Audio could not start:', err);
        showToast('Áudio não suportado neste navegador.');
    }
}

function stopSynthAtmosphere() {
    if (synthGain && audioCtx) {
        // Fade out
        synthGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
        setTimeout(() => {
            activeOscillators.forEach(osc => {
                try { osc.stop(); } catch(e){}
            });
            activeOscillators = [];
        }, 1300);
    }
    isAudioPlaying = false;
    soundToggleBtn.classList.remove('active');
    soundToggleBtn.querySelector('.sound-text').textContent = 'Áudio Vice City';
    soundToggleBtn.querySelector('.audio-waves').classList.add('hidden');
    showToast('Áudio pausado.');
}

/* ===================================================
   AMBIENT FLOATING PARTICLES CANVAS
   =================================================== */
function initAmbientParticles() {
    const canvas = document.getElementById('ambientCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = 45;
    const colors = ['#ff2a85', '#ff9e00', '#00f0ff', '#f72585'];

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2.2 + 0.8,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: -(Math.random() * 0.45 + 0.15),
            speedX: (Math.random() - 0.5) * 0.3,
            alpha: Math.random() * 0.7 + 0.2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;

            if (p.y < 0) {
                p.y = height + 10;
                p.x = Math.random() * width;
            }
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.shadowBlur = 12;
            ctx.shadowColor = p.color;
            ctx.fill();
        });

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        requestAnimationFrame(animate);
    }

    animate();
}

/* ===================================================
   SHARE & TOAST NOTIFICATION
   =================================================== */
function initShareFeature() {
    shareBtn.addEventListener('click', async () => {
        const text = `🌴 Faltam ${daysValue.textContent} dias e ${hoursValue.textContent} horas para o lançamento de GTA VI no fuso do ${selectedCountry.name}! Confira a contagem regressiva oficial de Vice City.`;
        
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(text);
                showToast('Link e contagem copiados para a área de transferência! 📋');
                return;
            } catch(e) {}
        }
        showToast('Compartilhe: ' + text);
    });
}

let toastTimeout = null;
function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastEl.classList.add('hidden');
    }, 3200);
}
