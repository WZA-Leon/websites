import * as THREE from 'three';

/* ============================================================
   WZA 3D Racing — static Three.js arcade time trial
   ============================================================ */

const SAVE_KEY = 'wza.racing3d.save.v1';
const TOTAL_LAPS = 3;
const UPGRADE_MAX = 4;

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (rng, a, b) => a + (b - a) * rng();
const TAU = Math.PI * 2;

const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900;

/* ---------- maps ---------- */
const MAPS = [
    {
        id: 'coast',
        name: '黄昏海岸',
        tag: 'COASTAL RUN',
        icon: '🌅',
        difficulty: '★★☆',
        desc: '落日下的海岸公路，长弯与海风。晚一点刹车，就能把速度带进下一个弯。',
        reward: 1.0,
        points: [
            [0, 0, 1.6], [55, -10, 1.8], [105, -36, 2.2], [126, -85, 2.8],
            [112, -137, 3.2], [72, -166, 3.4], [24, -167, 3.0], [-28, -151, 2.5],
            [-74, -116, 2.0], [-102, -72, 1.7], [-94, -28, 1.5], [-58, 4, 1.6]
        ],
        roadWidth: 15,
        groundY: -2.2,
        groundColor: 0x8b7658,
        roadColor: 0x2c2d2e,
        curbA: 0xb64c3d,
        curbB: 0xf2e7ce,
        skyTop: 0x101c33,
        skyHorizon: 0xf08355,
        skyBottom: 0x263a49,
        fogColor: 0xd98b64,
        fogDensity: 0.00155,
        sunColor: 0xffb16c,
        sunIntensity: 2.7,
        hemiSky: 0xffbd8c,
        hemiGround: 0x1e2a31,
        exposure: 1.06,
        night: false,
        guardrail: true,
        props: 'coast',
        weather: null,
        uiA: '#773a2f',
        uiB: '#122b3a',
        uiGlow: 'rgba(255, 176, 102, .62)'
    },
    {
        id: 'city',
        name: '霓虹夜城',
        tag: 'NEON DISTRICT',
        icon: '🌃',
        difficulty: '★★★',
        desc: '午夜的霓虹街区，直角弯和窄路。城市灯光会反射在湿漉漉的沥青上。',
        reward: 1.25,
        points: [
            [0, 0, 0.8], [65, -8, 0.9], [118, -28, 1.1], [142, -67, 1.2],
            [132, -111, 1.0], [94, -138, 0.8], [48, -146, 0.7], [10, -128, 0.6],
            [-18, -91, 0.5], [-54, -72, 0.4], [-103, -80, 0.3], [-133, -53, 0.2],
            [-139, -14, 0.1], [-119, 22, 0.0], [-76, 38, 0.0], [-28, 32, 0.2]
        ],
        roadWidth: 14,
        groundY: -1.0,
        groundColor: 0x161b24,
        roadColor: 0x1e232b,
        curbA: 0x66512f,
        curbB: 0x151b23,
        skyTop: 0x02040c,
        skyHorizon: 0x171c3e,
        skyBottom: 0x070a13,
        fogColor: 0x0b1020,
        fogDensity: 0.0028,
        sunColor: 0x9ab6ff,
        sunIntensity: 2.2,
        hemiSky: 0x6676bd,
        hemiGround: 0x080a10,
        exposure: 1.9,
        night: true,
        guardrail: true,
        props: 'city',
        weather: null,
        uiA: '#1a2050',
        uiB: '#070b18',
        uiGlow: 'rgba(104, 228, 255, .55)'
    },
    {
        id: 'snow',
        name: '雪山公路',
        tag: 'ALPINE PASS',
        icon: '🏔️',
        difficulty: '★★★',
        desc: '高海拔雪线，连续下坡和盲弯。低温会让轮胎更滑，提前减速。',
        reward: 1.1,
        points: [
            [0, 0, 10], [62, -22, 11], [111, -58, 13], [128, -101, 15],
            [103, -143, 17], [60, -161, 18], [22, -151, 17], [-17, -125, 16],
            [-46, -91, 14], [-85, -78, 13], [-121, -94, 14], [-137, -132, 15],
            [-110, -168, 14], [-57, -176, 12], [-4, -161, 11], [34, -129, 10]
        ],
        roadWidth: 14.5,
        groundY: -1.8,
        groundColor: 0xd9e4e5,
        roadColor: 0x272c31,
        curbA: 0x49637a,
        curbB: 0xd9e8ef,
        skyTop: 0x3c6f96,
        skyHorizon: 0xc9e2ee,
        skyBottom: 0x7899ac,
        fogColor: 0xc7dce7,
        fogDensity: 0.00235,
        sunColor: 0xeaf6ff,
        sunIntensity: 2.2,
        hemiSky: 0xd9efff,
        hemiGround: 0x5d707b,
        exposure: 1.02,
        night: false,
        guardrail: true,
        props: 'snow',
        weather: 'snow',
        uiA: '#31536d',
        uiB: '#0c1e2b',
        uiGlow: 'rgba(193, 241, 255, .62)'
    },
    {
        id: 'desert',
        name: '沙暴峡谷',
        tag: 'DUST CANYON',
        icon: '🏜️',
        difficulty: '★★★★',
        desc: '峡谷中的高速长弯，热浪和横风会不断把车身往外推。相信下压力。',
        reward: 1.3,
        points: [
            [-160, -12, 1.6], [-112, -74, 1.8], [-44, -112, 2.2], [25, -110, 2.4],
            [84, -82, 2.0], [132, -34, 1.8], [145, 22, 1.4], [111, 74, 1.2],
            [54, 102, 1.0], [-8, 104, 0.9], [-72, 85, 0.8], [-126, 48, 1.0]
        ],
        roadWidth: 16,
        groundY: -2.0,
        groundColor: 0xa5744a,
        roadColor: 0x34302d,
        curbA: 0x8f4634,
        curbB: 0xd6b47f,
        skyTop: 0x466d8c,
        skyHorizon: 0xeab071,
        skyBottom: 0x9f6240,
        fogColor: 0xd49b68,
        fogDensity: 0.0020,
        sunColor: 0xffd08d,
        sunIntensity: 2.9,
        hemiSky: 0xffc18d,
        hemiGround: 0x68452f,
        exposure: 1.08,
        night: false,
        guardrail: false,
        props: 'desert',
        weather: 'dust',
        uiA: '#7a452d',
        uiB: '#2a1b16',
        uiGlow: 'rgba(255, 187, 111, .55)'
    },
    {
        id: 'sakura',
        name: '樱色山道',
        tag: 'SAKURA RIDGE',
        icon: '🌸',
        difficulty: '★★★★',
        desc: '山坡上的樱花发卡弯，粉色花雨会遮住视线。轻点刹车，别让后轮先离开赛道。',
        reward: 1.4,
        points: [
            [0, 0, 3.0], [47, -22, 3.4], [86, -57, 4.2], [102, -99, 5.0],
            [83, -133, 5.8], [45, -146, 6.4], [7, -126, 7.0], [-30, -99, 7.5],
            [-73, -78, 7.8], [-116, -90, 7.2], [-137, -128, 6.5], [-118, -160, 5.8],
            [-75, -171, 5.0], [-27, -158, 4.3], [14, -135, 3.7], [42, -101, 3.2]
        ],
        roadWidth: 13.8,
        groundY: -1.4,
        groundColor: 0x4a5e42,
        roadColor: 0x2e2b2b,
        curbA: 0x9e4d54,
        curbB: 0xf2dfd5,
        skyTop: 0x6a8eb4,
        skyHorizon: 0xffc5d2,
        skyBottom: 0x8f687d,
        fogColor: 0xe5b9c3,
        fogDensity: 0.0023,
        sunColor: 0xffd6c2,
        sunIntensity: 2.2,
        hemiSky: 0xffd9e1,
        hemiGround: 0x4b4b42,
        exposure: 1.06,
        night: false,
        guardrail: true,
        props: 'sakura',
        weather: 'petal',
        uiA: '#7b4754',
        uiB: '#24332f',
        uiGlow: 'rgba(255, 197, 211, .64)'
    }
];

const CARS = [
    {
        id: 'rookie', name: '海岸 Rookie', price: 0, topSpeed: 52, accel: 13.5,
        handling: 1.5, brake: 20, color: 0x4ed2cf, accent: 0xc8ffff,
        uiA: '#5de0da', uiB: '#0c5967', desc: '均衡、宽容的入门中置跑车。'
    },
    {
        id: 'night', name: '霓虹夜行者', price: 900, topSpeed: 56, accel: 15.5,
        handling: 1.58, brake: 20.5, color: 0x695be8, accent: 0xc7b6ff,
        uiA: '#8a73ff', uiB: '#21154e', desc: '夜城特调涡轮，直线加速更凶。'
    },
    {
        id: 'snow', name: '雪原猎手', price: 1800, topSpeed: 59, accel: 15,
        handling: 1.72, brake: 21, color: 0x9ad9e8, accent: 0xffffff,
        uiA: '#b5eef6', uiB: '#2b5a70', desc: '四驱雪地设定，弯中更稳定。'
    },
    {
        id: 'desert', name: '沙暴 GT', price: 3200, topSpeed: 63, accel: 17,
        handling: 1.55, brake: 19, color: 0xe6964f, accent: 0xffe1a6,
        uiA: '#ffb35e', uiB: '#5f2c19', desc: '高极速、高下压力，为峡谷而生。'
    },
    {
        id: 'sakura', name: '樱速 S', price: 5000, topSpeed: 68, accel: 19,
        handling: 1.78, brake: 22, color: 0xf28fac, accent: 0xffe4ed,
        uiA: '#ff9eb9', uiB: '#5a233a', desc: '轻量化山路特化，转向响应极快。'
    }
];

const UPGRADE_DEFS = [
    { id: 'engine', name: '引擎', effect: '极速 / 加速' },
    { id: 'handling', name: '操控', effect: '转向响应' },
    { id: 'brake', name: '制动', effect: '刹车力度' }
];

function getUpgradeCost(car, level) {
    return Math.round((150 + car.price * 0.14) * (level + 1));
}

function getCarStats(carId) {
    const car = CARS.find(item => item.id === carId) || CARS[0];
    const levels = (save.upgrades && save.upgrades[car.id]) || {};
    const engine = levels.engine || 0;
    const handling = levels.handling || 0;
    const brake = levels.brake || 0;
    return {
        car,
        engine,
        handling,
        brake,
        maxSpeed: car.topSpeed + engine * 3.25,
        accel: car.accel + engine * 1.15,
        turn: car.handling + handling * 0.075,
        brakeForce: car.brake + brake * 2.4,
        topKmh: Math.round((car.topSpeed + engine * 3.25) * 3.6)
    };
}

function defaultSave() {
    return {
        coins: 0,
        owned: ['rookie'],
        selectedCar: 'rookie',
        upgrades: {
            rookie: { engine: 0, handling: 0, brake: 0 }
        },
        best: {},
        muted: false
    };
}

function loadSave() {
    const base = defaultSave();
    try {
        const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
        if (!raw || typeof raw !== 'object') return base;
        const next = {
            ...base,
            ...raw,
            owned: Array.isArray(raw.owned) && raw.owned.length ? [...new Set(['rookie', ...raw.owned])] : ['rookie'],
            upgrades: { ...base.upgrades, ...(raw.upgrades || {}) },
            best: raw.best && typeof raw.best === 'object' ? raw.best : {}
        };
        if (!CARS.some(car => car.id === next.selectedCar) || !next.owned.includes(next.selectedCar)) {
            next.selectedCar = 'rookie';
        }
        next.coins = Math.max(0, Math.floor(Number(next.coins) || 0));
        CARS.forEach(car => {
            next.upgrades[car.id] = {
                engine: clamp(Math.floor(Number(next.upgrades[car.id]?.engine) || 0), 0, UPGRADE_MAX),
                handling: clamp(Math.floor(Number(next.upgrades[car.id]?.handling) || 0), 0, UPGRADE_MAX),
                brake: clamp(Math.floor(Number(next.upgrades[car.id]?.brake) || 0), 0, UPGRADE_MAX)
            };
        });
        return next;
    } catch (error) {
        return base;
    }
}

let save = loadSave();

/* ---------- dom ---------- */
const canvas = $('raceCanvas');
const mapGrid = $('mapGrid');
const mapName = $('mapName');
const mapTag = $('mapTag');
const mapDesc = $('mapDesc');
const mapDifficulty = $('mapDifficulty');
const mapLength = $('mapLength');
const mapBest = $('mapBest');
const mapReward = $('mapReward');
const currentCarName = $('currentCarName');
const currentCarStats = $('currentCarStats');
const carSilhouette = $('carSilhouette');
const menuLayer = $('menuLayer');
const raceHud = $('raceHud');
const hudMap = $('hudMap');
const hudLap = $('hudLap');
const hudSpeed = $('hudSpeed');
const raceTime = $('raceTime');
const raceStatus = $('raceStatus');
const countdown = $('countdown');
const pauseLayer = $('pauseLayer');
const resultsLayer = $('resultsLayer');
const garageLayer = $('garageLayer');
const garageList = $('garageList');
const loadingLayer = $('loadingLayer');
const touchControls = $('touchControls');
const raceFlash = $('raceFlash');

/* ---------- state ---------- */
let selectedMapId = MAPS[0].id;
let selectedCarId = save.selectedCar;
let mode = 'menu';
let pausedFrom = 'racing';
let menuAngle = 0;
let lastFrame = performance.now();
let audioCtx = null;
let engineOsc = null;
let engineGain = null;
let engineFilter = null;
let audioMuted = Boolean(save.muted);

let renderer = null;
let scene = null;
let camera = null;
let world = null;
let carRoot = null;
let carVisual = null;
let track = null;
let map = MAPS[0];
let envRT = null;
let sunLight = null;
let weather = null;
let sunTarget = null;
let headlight = null;

const race = {
    lap: 1,
    time: 0,
    lapStart: 0,
    bestLap: Infinity,
    topSpeed: 0,
    offroadTime: 0,
    prevIndex: 0,
    lastLapAt: -99,
    countdown: 3.2,
    lastCount: 3
};

const carState = {
    pos: new THREE.Vector3(),
    yaw: 0,
    speed: 0,
    steer: 0,
    index: 0,
    lateral: 0
};

const input = { throttle: false, brake: false, left: false, right: false };

/* ---------- formatting ---------- */
function formatCoins(value) {
    return Math.floor(value).toLocaleString('zh-CN');
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '—';
    const safe = Math.max(0, seconds);
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    const ms = Math.floor((safe % 1) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function formatScore(value) {
    return Math.round(value).toLocaleString('zh-CN');
}

function formatLength(meters) {
    return `${Math.round(meters)} m`;
}

/* ---------- save ---------- */
function persist() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (error) {
        /* local-only best effort */
    }
}

function syncCoins() {
    document.querySelectorAll('[data-coins]').forEach(node => {
        node.textContent = formatCoins(save.coins);
    });
}

/* ---------- seeded random ---------- */
function mulberry32(seed) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/* ---------- texture factory ---------- */
function makeCanvasTexture(width, height, paint, { repeatX = 1, repeatY = 1, srgb = true } = {}) {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    paint(ctx, width, height);
    const texture = new THREE.CanvasTexture(c);
    if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 1;
    return texture;
}

function makeRoadTexture(mapConfig) {
    return makeCanvasTexture(512, 512, (ctx, w, h) => {
        ctx.fillStyle = '#292c2e';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 3800; i++) {
            const v = 34 + Math.floor(Math.random() * 38);
            ctx.fillStyle = `rgba(${v},${v + 2},${v + 3},${0.24 + Math.random() * 0.38})`;
            const r = Math.random() * 2.2;
            ctx.fillRect(Math.random() * w, Math.random() * h, r, r);
        }
        // subtle tire polish lines
        ctx.fillStyle = 'rgba(8, 10, 11, .22)';
        ctx.fillRect(w * 0.22, 0, w * 0.11, h);
        ctx.fillRect(w * 0.67, 0, w * 0.11, h);
        // solid edge lines
        ctx.fillStyle = 'rgba(241, 237, 218, .88)';
        ctx.fillRect(w * 0.035, 0, w * 0.014, h);
        ctx.fillRect(w * 0.951, 0, w * 0.014, h);
        // center dashed line
        ctx.fillStyle = 'rgba(244, 211, 144, .82)';
        for (let y = 0; y < h; y += 92) ctx.fillRect(w * 0.494, y, w * 0.012, 48);
        // faint lane separators
        ctx.fillStyle = 'rgba(229, 232, 220, .16)';
        for (let y = 18; y < h; y += 50) {
            ctx.fillRect(w * 0.335, y, 3, 23);
            ctx.fillRect(w * 0.66, y, 3, 23);
        }
        // oil / repaired patch
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = `rgba(12, 14, 15, ${0.05 + Math.random() * 0.08})`;
            ctx.beginPath();
            ctx.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 60, 6 + Math.random() * 16, Math.random() * TAU, 0, TAU);
            ctx.fill();
        }
    });
}

function makeCurbTexture(a, b) {
    return makeCanvasTexture(64, 128, (ctx, w, h) => {
        ctx.fillStyle = b;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = a;
        for (let y = -h; y < h * 2; y += 44) {
            ctx.save();
            ctx.translate(0, y);
            ctx.rotate(-0.55);
            ctx.fillRect(-20, 0, w + 40, 22);
            ctx.restore();
        }
    }, { repeatY: 1 });
}

function makeCheckerTexture() {
    return makeCanvasTexture(128, 128, (ctx, w, h) => {
        const cell = w / 8;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                ctx.fillStyle = (x + y) % 2 ? '#161b1c' : '#f0e9d8';
                ctx.fillRect(x * cell, y * cell, cell, cell);
            }
        }
    });
}

function makeWindowTexture(tint) {
    return makeCanvasTexture(128, 256, (ctx, w, h) => {
        ctx.fillStyle = '#060a10';
        ctx.fillRect(0, 0, w, h);
        for (let y = 18; y < h - 10; y += 20) {
            for (let x = 10; x < w - 8; x += 16) {
                const lit = Math.random() > 0.54;
                ctx.fillStyle = lit ? tint : 'rgba(20, 29, 38, .85)';
                ctx.globalAlpha = lit ? 0.42 + Math.random() * 0.5 : 0.7;
                ctx.fillRect(x, y, 7, 9);
            }
        }
        ctx.globalAlpha = 1;
    });
}

function makeGroundTexture(color, kind) {
    const base = new THREE.Color(color);
    const r = Math.round(base.r * 255);
    const g = Math.round(base.g * 255);
    const b = Math.round(base.b * 255);
    return makeCanvasTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 1600; i++) {
            const d = (Math.random() - 0.5) * (kind === 'snow' ? 22 : 46);
            ctx.fillStyle = `rgba(${clamp(r + d, 0, 255)},${clamp(g + d, 0, 255)},${clamp(b + d, 0, 255)},${0.18 + Math.random() * 0.25})`;
            const size = 1 + Math.random() * 4;
            ctx.fillRect(Math.random() * w, Math.random() * h, size, size);
        }
        if (kind === 'grass') {
            for (let i = 0; i < 260; i++) {
                ctx.strokeStyle = `rgba(${clamp(r - 18, 0, 255)},${clamp(g + 14, 0, 255)},${clamp(b - 12, 0, 255)},.24)`;
                ctx.beginPath();
                ctx.moveTo(Math.random() * w, Math.random() * h);
                ctx.lineTo(Math.random() * w, Math.random() * h);
                ctx.stroke();
            }
        }
        if (kind === 'asphalt') {
            for (let i = 0; i < 900; i++) {
                ctx.fillStyle = `rgba(${clamp(r + 35, 0, 255)},${clamp(g + 35, 0, 255)},${clamp(b + 35, 0, 255)},.12)`;
                ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
            }
        }
    }, { repeatX: 42, repeatY: 42 });
}

function makeParticleTexture() {
    return makeCanvasTexture(64, 64, (ctx, w, h) => {
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.35, 'rgba(255,255,255,.78)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }, { srgb: false });
}

/* ============================================================
   Three.js world
   ============================================================ */

function initThree() {
    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: !IS_TOUCH,
            alpha: false,
            powerPreference: 'high-performance'
        });
    } catch (error) {
        loadingLayer.innerHTML = '<p>你的浏览器暂时无法启动 WebGL。请开启硬件加速后重试。</p>';
        return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 1.2 : 1.5));
    renderer.setSize(canvas.clientWidth || 1000, canvas.clientHeight || 620, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 2400);
    camera.position.set(0, 8, -16);

    window.addEventListener('resize', resizeRenderer);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && (mode === 'racing' || mode === 'countdown')) {
            pauseRace();
        }
    });
    return true;
}

function resizeRenderer() {
    if (!renderer) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}

function disposeWorld() {
    if (sunLight && sunLight.shadow && sunLight.shadow.map) sunLight.shadow.map.dispose();
    if (envRT) {
        envRT.dispose();
        envRT = null;
    }
    if (world) {
        scene.remove(world);
        world.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach(material => {
                    Object.values(material).forEach(value => {
                        if (value && value.isTexture) value.dispose();
                    });
                    material.dispose();
                });
            }
        });
        world.clear();
    }
    world = null;
    carRoot = null;
    carVisual = null;
    track = null;
    weather = null;
    sunLight = null;
    headlight = null;
}

function createSky(mapConfig) {
    const geo = new THREE.SphereGeometry(1600, 32, 18);
    const mat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
            topColor: { value: new THREE.Color(mapConfig.skyTop) },
            horizonColor: { value: new THREE.Color(mapConfig.skyHorizon) },
            bottomColor: { value: new THREE.Color(mapConfig.skyBottom) },
            sunColor: { value: new THREE.Color(mapConfig.sunColor) },
            sunDirection: { value: new THREE.Vector3(0.6, 0.35, 0.5).normalize() }
        },
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 horizonColor;
            uniform vec3 bottomColor;
            uniform vec3 sunColor;
            uniform vec3 sunDirection;
            varying vec3 vWorldPosition;
            void main() {
                vec3 dir = normalize(vWorldPosition - cameraPosition);
                float height = clamp(dir.y, -0.14, 1.0);
                vec3 color = mix(bottomColor, horizonColor, smoothstep(-0.1, 0.035, height));
                color = mix(color, topColor, smoothstep(0.015, 0.18, height));
                float sun = max(dot(dir, normalize(sunDirection)), 0.0);
                color += sunColor * pow(sun, 780.0) * 2.1;
                color += sunColor * pow(sun, 18.0) * 0.14;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -10;
    return mesh;
}

function createEnvironment(mapConfig) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileCubemapShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(mapConfig.skyHorizon);
    const sky = new THREE.Mesh(
        new THREE.SphereGeometry(100, 24, 12),
        new THREE.MeshBasicMaterial({ color: mapConfig.skyTop, side: THREE.BackSide })
    );
    envScene.add(sky);
    const sun = new THREE.Mesh(
        new THREE.SphereGeometry(7, 12, 8),
        new THREE.MeshBasicMaterial({ color: mapConfig.sunColor })
    );
    sun.position.set(35, 25, 30);
    envScene.add(sun);
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(260, 260),
        new THREE.MeshBasicMaterial({ color: mapConfig.groundColor })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -18;
    envScene.add(ground);
    const target = pmrem.fromScene(envScene, 0.045);
    scene.environment = target.texture;
    envRT = target;
    sky.geometry.dispose();
    sky.material.dispose();
    sun.geometry.dispose();
    sun.material.dispose();
    ground.geometry.dispose();
    ground.material.dispose();
    pmrem.dispose();
    return target.texture;
}

function createLights(mapConfig) {
    const hemi = new THREE.HemisphereLight(mapConfig.hemiSky, mapConfig.hemiGround, mapConfig.night ? 3.0 : 0.78);
    world.add(hemi);
    const ambient = new THREE.AmbientLight(0xffffff, mapConfig.night ? 0.24 : 0.12);
    world.add(ambient);

    sunLight = new THREE.DirectionalLight(mapConfig.sunColor, mapConfig.sunIntensity);
    sunLight.position.set(85, 105, 55);
    sunLight.castShadow = true;
    const shadowSize = IS_TOUCH ? 1024 : 2048;
    sunLight.shadow.mapSize.set(shadowSize, shadowSize);
    sunLight.shadow.camera.left = -72;
    sunLight.shadow.camera.right = 72;
    sunLight.shadow.camera.top = 72;
    sunLight.shadow.camera.bottom = -72;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 260;
    sunLight.shadow.bias = -0.0002;
    sunLight.shadow.normalBias = 0.035;
    sunTarget = new THREE.Object3D();
    world.add(sunTarget);
    sunLight.target = sunTarget;
    world.add(sunLight);
}

/* ---------- track ---------- */
function makeTrack(mapConfig) {
    const points = mapConfig.points.map(([x, z, y]) => new THREE.Vector3(x, y, z));
    const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.45);
    const length = curve.getLength();
    const count = 720;
    const samples = [];
    let cumulative = 0;
    let prev = null;
    for (let i = 0; i <= count; i++) {
        const t = i / count;
        const point = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t).normalize();
        const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        if (prev) cumulative += point.distanceTo(prev);
        samples.push({
            point,
            tangent,
            side,
            distance: cumulative,
            v: cumulative / 9
        });
        prev = point;
    }
    // make the last row exactly equal to the first for a seamless ribbon
    samples[count] = {
        ...samples[0],
        point: samples[0].point.clone(),
        distance: length,
        v: length / 9
    };
    return {
        curve,
        length,
        count,
        samples,
        halfWidth: mapConfig.roadWidth / 2,
        nearest(position, hint = 0) {
            let best = Infinity;
            let bestIndex = 0;
            const windowSize = 92;
            const scan = (from, to) => {
                for (let i = from; i <= to; i++) {
                    const sample = samples[i];
                    const dx = position.x - sample.point.x;
                    const dz = position.z - sample.point.z;
                    const distance = dx * dx + dz * dz;
                    if (distance < best) {
                        best = distance;
                        bestIndex = i;
                    }
                }
            };
            if (hint > 0) {
                const from = Math.max(0, hint - windowSize);
                const to = Math.min(count, hint + windowSize);
                scan(from, to);
                if (best > 70 * 70) {
                    best = Infinity;
                    scan(0, count);
                }
            } else {
                scan(0, count);
            }
            const sample = samples[bestIndex];
            const offset = position.clone().sub(sample.point);
            return {
                index: bestIndex,
                point: sample.point,
                tangent: sample.tangent,
                side: sample.side,
                lateral: offset.dot(sample.side),
                distance: Math.sqrt(best)
            };
        }
    };
}

function makeStripGeometry(samples, leftOffset, rightOffset, yOffset = 0.02) {
    const positions = [];
    const uvs = [];
    const indices = [];
    for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const l = s.point.clone().addScaledVector(s.side, leftOffset);
        const r = s.point.clone().addScaledVector(s.side, rightOffset);
        positions.push(l.x, l.y + yOffset, l.z, r.x, r.y + yOffset, r.z);
        uvs.push(0, s.v, 1, s.v);
        if (i < samples.length - 1) {
            const a = i * 2;
            indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

function makeApronGeometry(samples, sideSign, halfWidth, groundY, width = 58) {
    const positions = [];
    const uvs = [];
    const indices = [];
    for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const inner = s.point.clone().addScaledVector(s.side, sideSign * halfWidth);
        const outer = s.point.clone().addScaledVector(s.side, sideSign * (halfWidth + width));
        positions.push(inner.x, inner.y - 0.26, inner.z, outer.x, groundY, outer.z);
        uvs.push(0, s.v * 0.18, 1, s.v * 0.18);
        if (i < samples.length - 1) {
            const a = i * 2;
            if (sideSign > 0) indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
            else indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

function makeRailGeometry(samples, offset, height, yBase = 0.15) {
    const positions = [];
    const uvs = [];
    const indices = [];
    for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const p = s.point.clone().addScaledVector(s.side, offset);
        positions.push(p.x, p.y + yBase, p.z, p.x, p.y + yBase + height, p.z);
        uvs.push(s.v, 0, s.v, 1);
        if (i < samples.length - 1) {
            const a = i * 2;
            indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

function addTrackToWorld(mapConfig) {
    const samples = track.samples;
    const half = track.halfWidth;
    const roadTexture = makeRoadTexture(mapConfig);
    const roadMat = new THREE.MeshStandardMaterial({
        map: roadTexture,
        color: 0xffffff,
        roughness: 0.74,
        metalness: 0.14,
        envMapIntensity: mapConfig.night ? 1.8 : 0.82
    });
    const road = new THREE.Mesh(makeStripGeometry(samples, -half, half, 0.03), roadMat);
    road.receiveShadow = true;
    world.add(road);

    const underMat = new THREE.MeshStandardMaterial({
        color: mapConfig.roadColor,
        roughness: 0.95,
        metalness: 0.02
    });
    const under = new THREE.Mesh(makeStripGeometry(samples, -half - 1.2, half + 1.2, -0.18), underMat);
    under.receiveShadow = true;
    world.add(under);

    const gravelMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.92,
        metalness: 0.02,
        side: THREE.DoubleSide
    });
    [-1, 1].forEach(sign => {
        const gravel = new THREE.Mesh(makeStripGeometry(samples, sign * (half + 1.2), sign * (half + 3.2), 0.04), gravelMat);
        gravel.receiveShadow = true;
        world.add(gravel);
    });

    if (mapConfig.props === 'city') {
        const neonA = new THREE.MeshBasicMaterial({ color: 0x31e7ef, toneMapped: false });
        const neonB = new THREE.MeshBasicMaterial({ color: 0xff4d9a, toneMapped: false });
        world.add(new THREE.Mesh(makeStripGeometry(samples, -half - 0.08, -half + 0.22, 0.13), neonA));
        world.add(new THREE.Mesh(makeStripGeometry(samples, half - 0.22, half + 0.08, 0.13), neonB));
    }

    const curbTexture = makeCurbTexture(mapConfig.curbA, mapConfig.curbB);
    const curbMat = new THREE.MeshStandardMaterial({
        map: curbTexture,
        roughness: 0.62,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
    [-1, 1].forEach(sign => {
        const curb = new THREE.Mesh(makeStripGeometry(samples, sign * half, sign * (half + 0.7), 0.08), curbMat);
        curb.receiveShadow = true;
        world.add(curb);
    });

    const apronMat = new THREE.MeshStandardMaterial({
        map: makeGroundTexture(mapConfig.groundColor, mapConfig.props === 'desert' ? 'sand' : mapConfig.props === 'snow' ? 'snow' : mapConfig.props === 'city' ? 'asphalt' : 'grass'),
        color: 0xffffff,
        roughness: 0.98,
        metalness: 0.01,
        side: THREE.DoubleSide
    });
    [-1, 1].forEach(sign => {
        const apron = new THREE.Mesh(makeApronGeometry(samples, sign, half + 3.2, mapConfig.groundY, mapConfig.props === 'coast' ? 26 : 58), apronMat);
        apron.receiveShadow = true;
        world.add(apron);
    });

    if (mapConfig.guardrail) addGuardrails(samples, half, mapConfig);
    addStartGate(samples, half, mapConfig);
}

function addGuardrails(samples, half, mapConfig) {
    const railMat = new THREE.MeshStandardMaterial({
        color: 0x9aa4a4,
        roughness: 0.32,
        metalness: 0.86,
        envMapIntensity: 1.1
    });
    const postGeo = new THREE.BoxGeometry(0.11, 0.85, 0.11);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5c6565, roughness: 0.58, metalness: 0.55 });
    [-1, 1].forEach(sign => {
        const rail = new THREE.Mesh(makeRailGeometry(samples, sign * (half + 1.1), 0.6, 0.2), railMat);
        rail.castShadow = true;
        rail.receiveShadow = true;
        world.add(rail);
    });
    const posts = [];
    for (let i = 0; i < samples.length; i += 7) {
        const s = samples[i];
        [-1, 1].forEach(sign => {
            const p = s.point.clone().addScaledVector(s.side, sign * (half + 1.1));
            posts.push({
                p: new THREE.Vector3(p.x, p.y + 0.22, p.z),
                q: new THREE.Quaternion(),
                s: new THREE.Vector3(1, 1, 1)
            });
        });
    }
    const mesh = new THREE.InstancedMesh(postGeo, postMat, posts.length);
    const matrix = new THREE.Matrix4();
    posts.forEach((item, i) => {
        matrix.compose(item.p, item.q, item.s);
        mesh.setMatrixAt(i, matrix);
    });
    mesh.castShadow = true;
    mesh.instanceMatrix.needsUpdate = true;
    world.add(mesh);
}

function addStartGate(samples, half, mapConfig) {
    const s = samples[0];
    const yaw = Math.atan2(s.tangent.x, s.tangent.z);
    const group = new THREE.Group();
    group.position.copy(s.point);
    group.rotation.y = yaw;
    const dark = new THREE.MeshStandardMaterial({ color: 0x1d2528, roughness: 0.42, metalness: 0.7 });
    const trim = new THREE.MeshStandardMaterial({
        color: 0x10171a,
        roughness: 0.36,
        metalness: 0.75,
        emissive: new THREE.Color(mapConfig.night ? 0x2adde1 : 0x8b4c25),
        emissiveIntensity: mapConfig.night ? 1.4 : 0.16
    });
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.22, 5.2, 0.22), dark);
    left.position.set(-half + 1, 2.6, 0);
    const right = left.clone();
    right.position.x = half - 1;
    const top = new THREE.Mesh(new THREE.BoxGeometry(half * 2 - 1.6, 0.28, 0.28), trim);
    top.position.y = 4.9;
    const banner = new THREE.Mesh(
        new THREE.BoxGeometry(half * 2 - 2.4, 0.75, 0.12),
        new THREE.MeshStandardMaterial({
            color: mapConfig.night ? 0x172530 : 0xe8dfc8,
            roughness: 0.5,
            metalness: 0.2,
            emissive: new THREE.Color(mapConfig.night ? 0x29aeb8 : 0x6a4d2b),
            emissiveIntensity: mapConfig.night ? 1.1 : 0.1
        })
    );
    banner.position.y = 4.35;
    const line = new THREE.Mesh(
        new THREE.PlaneGeometry(half * 2, 1.9),
        new THREE.MeshStandardMaterial({ map: makeCheckerTexture(), roughness: 0.58, metalness: 0.1 })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.y = 0.08;
    group.add(left, right, top, banner, line);
    group.traverse(item => {
        if (item.isMesh) {
            item.castShadow = true;
            item.receiveShadow = true;
        }
    });
    world.add(group);
}

/* ---------- ground / scenery ---------- */
function addGround(mapConfig) {
    const groundTexture = makeGroundTexture(mapConfig.groundColor, mapConfig.props === 'desert' ? 'sand' : mapConfig.props === 'snow' ? 'snow' : mapConfig.props === 'city' ? 'asphalt' : 'grass');
    const mat = new THREE.MeshStandardMaterial({
        map: groundTexture,
        color: 0xffffff,
        roughness: 0.97,
        metalness: 0.02
    });
    if (mapConfig.props === 'coast') {
        const waterMat = new THREE.MeshPhysicalMaterial({
            color: 0x174e63,
            roughness: 0.16,
            metalness: 0.28,
            clearcoat: 1,
            clearcoatRoughness: 0.12,
            envMapIntensity: 1.8
        });
        const water = new THREE.Mesh(new THREE.PlaneGeometry(2500, 2500, 1, 1), waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.y = mapConfig.groundY - 0.15;
        world.add(water);
    } else {
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400, 1, 1), mat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = mapConfig.groundY;
        ground.receiveShadow = true;
        world.add(ground);
    }

    addMountains(mapConfig);
}

function addMountains(mapConfig) {
    const rng = mulberry32(mapConfig.id.length * 947 + 31);
    const isCoast = mapConfig.props === 'coast';
    const mat = new THREE.MeshStandardMaterial({
        color: isCoast ? 0x74857b : mapConfig.props === 'snow' ? 0xb4c6cc : mapConfig.props === 'desert' ? 0xb36a49 : mapConfig.props === 'city' ? 0x121822 : 0x7a8a70,
        roughness: 0.95,
        metalness: 0.02,
        flatShading: true
    });
    const geo = new THREE.ConeGeometry(1, 1, 5 + Math.floor(rng() * 2));
    const items = [];
    const count = mapConfig.props === 'city' ? 0 : isCoast ? 12 : IS_TOUCH ? 18 : 30;
    for (let i = 0; i < count; i++) {
        const angle = rng() * TAU;
        const radius = (isCoast ? 780 : 540) + rng() * (isCoast ? 620 : 620);
        const scale = (isCoast ? 22 : mapConfig.props === 'snow' ? 65 : 42) + rng() * (isCoast ? 44 : mapConfig.props === 'snow' ? 95 : 62);
        items.push({
            p: new THREE.Vector3(Math.cos(angle) * radius, mapConfig.groundY + scale * 0.46, Math.sin(angle) * radius),
            q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rng() * TAU, 0)),
            s: new THREE.Vector3(scale * (0.7 + rng() * 0.8), scale, scale * (0.7 + rng() * 0.8))
        });
    }
    addInstances(geo, mat, items, false, false);
    if (mapConfig.props === 'snow') {
        const capMat = new THREE.MeshStandardMaterial({ color: 0xe5f0f2, roughness: 0.9, flatShading: true });
        const caps = items.map(item => ({
            p: item.p.clone().add(new THREE.Vector3(0, item.s.y * 0.3, 0)),
            q: item.q,
            s: new THREE.Vector3(item.s.x * 0.47, item.s.y * 0.34, item.s.z * 0.47)
        }));
        addInstances(geo, capMat, caps, false, false);
    }
}

function addInstances(geo, mat, items, cast = true, receive = false) {
    if (!items.length) return null;
    const mesh = new THREE.InstancedMesh(geo, mat, items.length);
    const matrix = new THREE.Matrix4();
    items.forEach((item, i) => {
        matrix.compose(item.p, item.q || new THREE.Quaternion(), item.s || new THREE.Vector3(1, 1, 1));
        mesh.setMatrixAt(i, matrix);
    });
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    mesh.instanceMatrix.needsUpdate = true;
    world.add(mesh);
    return mesh;
}

function trackSidePlacements(rng, step, minOffset, maxOffset, countEach = 1) {
    const items = [];
    for (let i = 8; i < track.count - 4; i += step) {
        const s = track.samples[i];
        for (let n = 0; n < countEach; n++) {
            const sign = n === 0 ? -1 : 1;
            const offset = track.halfWidth + minOffset + rng() * (maxOffset - minOffset);
            const p = s.point.clone().addScaledVector(s.side, sign * offset);
            items.push({
                sample: s,
                p,
                sign,
                rng
            });
        }
    }
    return items;
}

function buildProps(mapConfig) {
    const rng = mulberry32(mapConfig.id.charCodeAt(0) * 811 + 97);
    if (mapConfig.props === 'coast') buildCoastProps(rng);
    if (mapConfig.props === 'city') buildCityProps(rng);
    if (mapConfig.props === 'snow') buildSnowProps(rng);
    if (mapConfig.props === 'desert') buildDesertProps(rng);
    if (mapConfig.props === 'sakura') buildSakuraProps(rng);
    buildWeather(mapConfig, rng);
}

function groundAt(p) {
    return new THREE.Vector3(p.x, map.groundY, p.z);
}

function buildCoastProps(rng) {
    const spots = trackSidePlacements(rng, 24, 8, 38, 2);
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.3, 4.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7d5f42, roughness: 0.9 });
    const leafGeo = new THREE.ConeGeometry(1.65, 0.42, 5);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7b4c, roughness: 0.82, side: THREE.DoubleSide });
    const trunks = [];
    const leaves = [];
    spots.forEach(({ p, sample }, index) => {
        if (index % 3 === 0) return;
        const base = new THREE.Vector3(p.x, sample.point.y - 0.18, p.z);
        const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(rng, -0.08, 0.08), rng() * TAU, rand(rng, -0.08, 0.08)));
        const scale = rand(rng, 0.78, 1.35);
        trunks.push({ p: base.clone().add(new THREE.Vector3(0, 2.25 * scale, 0)), q: tilt, s: new THREE.Vector3(scale, scale, scale) });
        for (let leaf = 0; leaf < 5; leaf++) {
            const angle = (leaf / 5) * TAU + rng() * 0.5;
            leaves.push({
                p: base.clone().add(new THREE.Vector3(Math.cos(angle) * 0.85 * scale, (4.2 + rand(rng, -0.1, 0.4)) * scale, Math.sin(angle) * 0.85 * scale)),
                q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(rng, -0.3, 0.3), angle, rand(rng, -0.6, 0.6))),
                s: new THREE.Vector3(scale, scale, scale)
            });
        }
    });
    addInstances(trunkGeo, trunkMat, trunks, true, false);
    addInstances(leafGeo, leafMat, leaves, true, false);

    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6f6556, roughness: 0.95, flatShading: true });
    const rocks = trackSidePlacements(rng, 37, 7, 50, 1).map(({ p, sample }) => ({
        p: new THREE.Vector3(p.x, sample.point.y - 0.1, p.z),
        q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rng(), rng() * TAU, rng())),
        s: new THREE.Vector3(rand(rng, 0.8, 2.4), rand(rng, 0.55, 1.5), rand(rng, 0.8, 2.2))
    }));
    addInstances(rockGeo, rockMat, rocks, true, true);

    // beach umbrellas
    const poleGeo = new THREE.CylinderGeometry(0.045, 0.045, 2.2, 5);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xe3ded0, roughness: 0.5 });
    const canopyGeo = new THREE.ConeGeometry(1.55, 0.45, 8);
    const canopyMats = [0xe56f63, 0xe6b95e, 0x5bc1bd].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
    const umbrellas = trackSidePlacements(rng, 82, 12, 24, 1).slice(0, 8);
    umbrellas.forEach(({ p, sample }, i) => {
        const base = new THREE.Vector3(p.x, sample.point.y - 0.2, p.z);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.copy(base).y += 1.1;
        const canopy = new THREE.Mesh(canopyGeo, canopyMats[i % canopyMats.length]);
        canopy.position.copy(base).y += 2.1;
        pole.castShadow = true;
        canopy.castShadow = true;
        world.add(pole, canopy);
    });

    // distant lighthouse
    const lighthouse = new THREE.Group();
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xe7e1cd, roughness: 0.55 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xb64d40, roughness: 0.45 });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.3, 24, 10), towerMat);
    tower.position.y = 12;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.9, 4.4, 10), redMat);
    band.position.y = 17;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe4a2 }));
    lamp.position.y = 24.5;
    lighthouse.add(tower, band, lamp);
    lighthouse.position.set(-225, map.groundY, -250);
    world.add(lighthouse);
}

function buildCityProps(rng) {
    const windowMat = new THREE.MeshStandardMaterial({
        map: makeWindowTexture('#65d9ff'),
        color: 0xffffff,
        roughness: 0.55,
        metalness: 0.5,
        emissive: new THREE.Color(0x2f88a0),
        emissiveIntensity: 1.15,
        emissiveMap: makeWindowTexture('#ffcf73')
    });
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const buildings = [];
    for (let i = 68; i < track.count - 4; i += 16) {
        const s = track.samples[i];
        [-1, 1].forEach(sign => {
            const offset = track.halfWidth + rand(rng, 58, 125);
            const p = s.point.clone().addScaledVector(s.side, sign * offset);
            const h = rand(rng, 16, 64);
            buildings.push({
                p: new THREE.Vector3(p.x, map.groundY + h / 2, p.z),
                q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rng() * TAU, 0)),
                s: new THREE.Vector3(rand(rng, 8, 19), h, rand(rng, 8, 19))
            });
        });
    }
    addInstances(boxGeo, windowMat, buildings, false, false);

    const poleGeo = new THREE.CylinderGeometry(0.07, 0.11, 5.5, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x303842, roughness: 0.5, metalness: 0.7 });
    const lampGeo = new THREE.BoxGeometry(0.3, 0.16, 0.6);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe9b2 });
    const poles = [];
    const lamps = [];
    for (let i = 12; i < track.count - 4; i += 34) {
        const s = track.samples[i];
        [-1, 1].forEach(sign => {
            const p = s.point.clone().addScaledVector(s.side, sign * (track.halfWidth + 4.2));
            poles.push({ p: p.clone().add(new THREE.Vector3(0, 2.7, 0)), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1) });
            lamps.push({ p: p.clone().add(new THREE.Vector3(0, 5.45, 0)), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1) });
        });
    }
    addInstances(poleGeo, poleMat, poles, true, false);
    addInstances(lampGeo, lampMat, lamps, false, false);

    // neon billboards
    const neonColors = [0x35e6e6, 0xff5a9e, 0xffcb64, 0x8b72ff];
    for (let i = 0; i < 14; i++) {
        const s = track.samples[Math.floor(rand(rng, 8, track.count - 4))];
        const sign = rng() > 0.5 ? 1 : -1;
        const p = s.point.clone().addScaledVector(s.side, sign * (track.halfWidth + rand(rng, 10, 18)));
        const mat = new THREE.MeshBasicMaterial({ color: neonColors[i % neonColors.length] });
        const board = new THREE.Mesh(new THREE.BoxGeometry(rand(rng, 3, 5), rand(rng, 7, 15), 0.18), mat);
        board.position.set(p.x, map.groundY + rand(rng, 12, 25), p.z);
        board.rotation.y = Math.atan2(s.tangent.x, s.tangent.z) + (rng() > 0.5 ? 0 : Math.PI);
        world.add(board);
    }

    for (let i = 0; i < 5; i++) {
        const s = track.samples[Math.floor((i / 5) * track.count)];
        const color = i % 2 ? 0xff4e9e : 0x36e5ed;
        const light = new THREE.PointLight(color, 22, 58, 2);
        light.position.set(s.point.x, s.point.y + 5.2, s.point.z);
        world.add(light);
    }

    // Night stars above the city skyline.
    const starPositions = [];
    for (let i = 0; i < 420; i++) {
        const angle = rng() * TAU;
        const elevation = rand(rng, 0.18, 0.98);
        const radius = 1100;
        starPositions.push(
            Math.cos(angle) * radius * Math.cos(elevation),
            Math.sin(elevation) * radius,
            Math.sin(angle) * radius * Math.cos(elevation)
        );
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xcfe3ff, size: 1.1, transparent: true, opacity: 0.72, depthWrite: false, fog: false });
    const stars = new THREE.Points(starGeo, starMat);
    stars.frustumCulled = false;
    world.add(stars);
}

function buildSnowProps(rng) {
    const trunkGeo = new THREE.CylinderGeometry(0.13, 0.25, 3.2, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4b3b31, roughness: 0.9 });
    const pineGeo = new THREE.ConeGeometry(1.7, 4.2, 7);
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x254b42, roughness: 0.84, flatShading: true });
    const snowCapGeo = new THREE.ConeGeometry(1.3, 1.8, 7);
    const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xe5f0ef, roughness: 0.8, flatShading: true });
    const trunks = [];
    const pines = [];
    const caps = [];
    trackSidePlacements(rng, 19, 9, 52, 2).forEach(({ p, sample }, index) => {
        if (index % 4 === 0) return;
        const scale = rand(rng, 0.7, 1.55);
        const base = new THREE.Vector3(p.x, sample.point.y - 0.25, p.z);
        trunks.push({ p: base.clone().add(new THREE.Vector3(0, 1.6 * scale, 0)), q: new THREE.Quaternion(), s: new THREE.Vector3(scale, scale, scale) });
        pines.push({ p: base.clone().add(new THREE.Vector3(0, 4.0 * scale, 0)), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rng() * TAU, 0)), s: new THREE.Vector3(scale, scale, scale) });
        caps.push({ p: base.clone().add(new THREE.Vector3(0, 6.05 * scale, 0)), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rng() * TAU, 0)), s: new THREE.Vector3(scale, scale, scale) });
    });
    addInstances(trunkGeo, trunkMat, trunks, true, false);
    addInstances(pineGeo, pineMat, pines, true, false);
    addInstances(snowCapGeo, snowCapMat, caps, true, false);

    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x78858c, roughness: 0.95, flatShading: true });
    const rocks = trackSidePlacements(rng, 41, 7, 35, 1).map(({ p, sample }) => ({
        p: new THREE.Vector3(p.x, sample.point.y - 0.1, p.z),
        q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rng(), rng() * TAU, rng())),
        s: new THREE.Vector3(rand(rng, 0.8, 2.1), rand(rng, 0.6, 1.4), rand(rng, 0.8, 2.0))
    }));
    addInstances(rockGeo, rockMat, rocks, true, true);

    const snowBankGeo = new THREE.SphereGeometry(1, 8, 5);
    const snowBankMat = new THREE.MeshStandardMaterial({ color: 0xe5efef, roughness: 0.92, flatShading: true });
    const banks = trackSidePlacements(rng, 31, 4, 17, 2).map(({ p, sample }) => ({
        p: new THREE.Vector3(p.x, sample.point.y - 0.2, p.z),
        q: new THREE.Quaternion(),
        s: new THREE.Vector3(rand(rng, 1.6, 4.3), rand(rng, 0.35, 0.85), rand(rng, 1.2, 3.4))
    }));
    addInstances(snowBankGeo, snowBankMat, banks, false, true);
}

function buildDesertProps(rng) {
    const mesaGeo = new THREE.CylinderGeometry(1, 1.25, 1, 7);
    const mesaMat = new THREE.MeshStandardMaterial({ color: 0x9d583d, roughness: 0.96, flatShading: true });
    const mesas = [];
    for (let i = 0; i < (IS_TOUCH ? 16 : 25); i++) {
        const angle = rand(rng, 0, TAU);
        const radius = rand(rng, 230, 520);
        const h = rand(rng, 10, 26);
        mesas.push({
            p: new THREE.Vector3(Math.cos(angle) * radius, map.groundY + h / 2, Math.sin(angle) * radius),
            q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rng() * TAU, 0)),
            s: new THREE.Vector3(rand(rng, 8, 18), h, rand(rng, 8, 17))
        });
    }
    addInstances(mesaGeo, mesaMat, mesas, true, true);

    const cactusGeo = new THREE.CylinderGeometry(0.3, 0.38, 3.8, 7);
    const cactusMat = new THREE.MeshStandardMaterial({ color: 0x3f714a, roughness: 0.82 });
    const armGeo = new THREE.CylinderGeometry(0.15, 0.18, 1.5, 6);
    const body = [];
    const arms = [];
    trackSidePlacements(rng, 27, 8, 46, 2).forEach(({ p, sample }, index) => {
        if (index % 3 === 0) return;
        const base = new THREE.Vector3(p.x, sample.point.y - 0.2, p.z);
        const scale = rand(rng, 0.7, 1.25);
        body.push({ p: base.clone().add(new THREE.Vector3(0, 1.9 * scale, 0)), q: new THREE.Quaternion(), s: new THREE.Vector3(scale, scale, scale) });
        if (rng() > 0.4) {
            arms.push({
                p: base.clone().add(new THREE.Vector3(0.6 * scale, 2.5 * scale, 0)),
                q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.5)),
                s: new THREE.Vector3(scale, scale, scale)
            });
        }
    });
    addInstances(cactusGeo, cactusMat, body, true, false);
    addInstances(armGeo, cactusMat, arms, true, false);

    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x8c5942, roughness: 0.98, flatShading: true });
    const rocks = trackSidePlacements(rng, 23, 6, 28, 2).map(({ p, sample }) => ({
        p: new THREE.Vector3(p.x, sample.point.y - 0.1, p.z),
        q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rng(), rng() * TAU, rng())),
        s: new THREE.Vector3(rand(rng, 0.5, 2.8), rand(rng, 0.5, 1.5), rand(rng, 0.6, 2.4))
    }));
    addInstances(rockGeo, rockMat, rocks, true, true);
}

function buildSakuraProps(rng) {
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.34, 4.2, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x59433b, roughness: 0.9 });
    const crownGeo = new THREE.IcosahedronGeometry(1.7, 1);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xe391ae, roughness: 0.85, flatShading: true });
    const crownMat2 = new THREE.MeshStandardMaterial({ color: 0xf5b3c6, roughness: 0.9, flatShading: true });
    const trunks = [];
    const crowns = [];
    trackSidePlacements(rng, 17, 9, 38, 2).forEach(({ p, sample }, index) => {
        if (index % 3 === 0) return;
        const base = new THREE.Vector3(p.x, sample.point.y - 0.25, p.z);
        const scale = rand(rng, 0.75, 1.4);
        trunks.push({ p: base.clone().add(new THREE.Vector3(0, 2.1 * scale, 0)), q: new THREE.Quaternion(), s: new THREE.Vector3(scale, scale, scale) });
        crowns.push({ p: base.clone().add(new THREE.Vector3(rand(rng, -0.35, 0.35), 4.4 * scale, rand(rng, -0.35, 0.35))), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rng(), rng() * TAU, rng())), s: new THREE.Vector3(scale * 1.25, scale * 0.95, scale * 1.15) });
        crowns.push({ p: base.clone().add(new THREE.Vector3(rand(rng, -0.8, 0.8), 4.6 * scale, rand(rng, -0.8, 0.8))), q: new THREE.Quaternion(), s: new THREE.Vector3(scale * 0.7, scale * 0.7, scale * 0.7) });
    });
    addInstances(trunkGeo, trunkMat, trunks, true, false);
    addInstances(crownGeo, crownMat, crowns.filter((_, i) => i % 2 === 0), true, false);
    addInstances(crownGeo, crownMat2, crowns.filter((_, i) => i % 2 === 1), true, false);

    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x5c6254, roughness: 0.96, flatShading: true });
    const rocks = trackSidePlacements(rng, 39, 5, 22, 1).map(({ p, sample }) => ({
        p: new THREE.Vector3(p.x, sample.point.y - 0.1, p.z),
        q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rng(), rng() * TAU, rng())),
        s: new THREE.Vector3(rand(rng, 0.5, 1.8), rand(rng, 0.4, 1.0), rand(rng, 0.6, 1.7))
    }));
    addInstances(rockGeo, rockMat, rocks, true, true);

    // torii gate near start
    const s = track.samples[Math.floor(track.count * 0.12)];
    const gate = new THREE.Group();
    const red = new THREE.MeshStandardMaterial({ color: 0xa43e3e, roughness: 0.58, metalness: 0.08 });
    const postGeo = new THREE.BoxGeometry(0.45, 5.5, 0.45);
    const left = new THREE.Mesh(postGeo, red);
    left.position.x = -track.halfWidth - 2;
    const right = left.clone();
    right.position.x = track.halfWidth + 2;
    const top = new THREE.Mesh(new THREE.BoxGeometry(track.halfWidth * 2 + 5.5, 0.5, 0.6), red);
    top.position.y = 5.2;
    const top2 = new THREE.Mesh(new THREE.BoxGeometry(track.halfWidth * 2 + 3.8, 0.3, 0.5), red);
    top2.position.y = 4.65;
    gate.add(left, right, top, top2);
    gate.position.copy(s.point);
    gate.rotation.y = Math.atan2(s.tangent.x, s.tangent.z);
    world.add(gate);
}

function buildWeather(mapConfig, rng) {
    if (!mapConfig.weather) return;
    const count = IS_TOUCH ? 380 : 760;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    const spread = mapConfig.weather === 'dust' ? 48 : 38;
    for (let i = 0; i < count; i++) {
        positions[i * 3] = rand(rng, -spread, spread);
        positions[i * 3 + 1] = rand(rng, 0, 30);
        positions[i * 3 + 2] = rand(rng, -spread, spread);
        velocities[i] = rand(rng, 0.5, 1.5);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const color = mapConfig.weather === 'snow' ? 0xe9f6ff : mapConfig.weather === 'petal' ? 0xffb3c9 : 0xd9b07b;
    const mat = new THREE.PointsMaterial({
        color,
        size: mapConfig.weather === 'dust' ? 0.22 : 0.28,
        transparent: true,
        opacity: mapConfig.weather === 'dust' ? 0.28 : 0.72,
        depthWrite: false,
        map: makeParticleTexture(),
        blending: mapConfig.weather === 'dust' ? THREE.NormalBlending : THREE.AdditiveBlending
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    world.add(points);
    weather = {
        points,
        positions,
        velocities,
        count,
        spread,
        kind: mapConfig.weather,
        update(dt, center) {
            points.position.set(center.x, 0, center.z);
            for (let i = 0; i < count; i++) {
                const idx = i * 3;
                positions[idx + 1] -= velocities[i] * dt * (this.kind === 'dust' ? 0.35 : 2.3);
                if (this.kind === 'petal') {
                    positions[idx] += Math.sin((performance.now() + i * 17) * 0.0004) * dt * 0.8;
                    positions[idx + 2] += Math.cos((performance.now() + i * 11) * 0.0003) * dt * 0.6;
                } else if (this.kind === 'snow') {
                    positions[idx] += Math.sin((performance.now() + i * 13) * 0.0003) * dt * 0.45;
                } else {
                    positions[idx] += dt * 0.55;
                }
                if (positions[idx + 1] < 0) {
                    positions[idx + 1] = rand(Math.random, 18, 34);
                    positions[idx] = rand(Math.random, -this.spread, this.spread);
                    positions[idx + 2] = rand(Math.random, -this.spread, this.spread);
                }
            }
            geo.attributes.position.needsUpdate = true;
        }
    };
}

/* ---------- car ---------- */
function makeCarModel(carDef) {
    const group = new THREE.Group();
    const paint = new THREE.MeshPhysicalMaterial({
        color: carDef.color,
        metalness: 0.68,
        roughness: 0.24,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.35
    });
    const paintDark = new THREE.MeshStandardMaterial({ color: new THREE.Color(carDef.color).multiplyScalar(0.42), roughness: 0.38, metalness: 0.55 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x11171a, roughness: 0.34, metalness: 0.75 });
    const glass = new THREE.MeshPhysicalMaterial({
        color: 0x08131a,
        metalness: 0.25,
        roughness: 0.08,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.7
    });
    const tire = new THREE.MeshStandardMaterial({ color: 0x131619, roughness: 0.86, metalness: 0.05 });
    const rim = new THREE.MeshStandardMaterial({ color: 0xaeb8b7, roughness: 0.25, metalness: 0.92 });
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfff3cc });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff3c27 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.32, 4.1), paint);
    chassis.position.y = 0.38;
    chassis.castShadow = true;
    group.add(chassis);

    const lower = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.18, 3.92), trim);
    lower.position.y = 0.2;
    lower.castShadow = true;
    group.add(lower);

    // low wedge hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.18, 1.38), paint);
    hood.position.set(0, 0.58, 1.08);
    hood.rotation.x = -0.055;
    hood.castShadow = true;
    group.add(hood);

    // cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.52, 1.75), glass);
    cabin.position.set(0, 0.78, -0.25);
    cabin.rotation.x = -0.07;
    cabin.castShadow = true;
    group.add(cabin);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.1, 1.05), paintDark);
    roof.position.set(0, 1.02, -0.32);
    roof.rotation.x = -0.07;
    roof.castShadow = true;
    group.add(roof);

    // rear deck & spoiler
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 0.95), paint);
    deck.position.set(0, 0.55, -1.58);
    group.add(deck);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.08, 0.42), trim);
    wing.position.set(0, 0.83, -1.95);
    wing.rotation.x = 0.08;
    group.add(wing);
    [-0.66, 0.66].forEach(x => {
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.1), trim);
        strut.position.set(x, 0.7, -1.94);
        group.add(strut);
    });

    // side mirrors
    [-1, 1].forEach(sign => {
        const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.19), paintDark);
        mirror.position.set(sign * 0.88, 0.79, 0.4);
        group.add(mirror);
    });

    // lights
    [-0.62, 0.62].forEach(x => {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.04), headMat);
        lamp.position.set(x, 0.55, 2.055);
        group.add(lamp);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.095, 0.04), tailMat);
        tail.position.set(x, 0.55, -2.055);
        group.add(tail);
    });
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.08, 0.44), trim);
    splitter.position.set(0, 0.12, 2.0);
    group.add(splitter);
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.42), trim);
    diffuser.position.set(0, 0.15, -2.03);
    group.add(diffuser);
    [-0.93, 0.93].forEach(sign => {
        const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 2.25), trim);
        skirt.position.set(sign, 0.18, 0);
        group.add(skirt);
    });
    const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.055, 0.035), tailMat);
    tailBar.position.set(0, 0.59, -2.074);
    group.add(tailBar);
    [-0.42, 0.42].forEach(x => {
        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.22, 9), trim);
        exhaust.rotation.x = Math.PI / 2;
        exhaust.position.set(x, 0.28, -2.1);
        group.add(exhaust);
    });
    const underglow = new THREE.Mesh(
        new THREE.PlaneGeometry(1.9, 4.4),
        new THREE.MeshBasicMaterial({ color: carDef.accent, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.y = 0.035;
    group.add(underglow);
    const glowTexture = makeParticleTexture();
    [-0.62, 0.62].forEach(x => {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0xffe8b5,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        }));
        sprite.position.set(x, 0.55, 2.09);
        sprite.scale.set(0.7, 0.7, 0.7);
        group.add(sprite);
    });

    // wheels
    const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 18);
    wheelGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.25, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const wheels = [];
    const frontPivots = [];
    [[-0.94, 1.34], [0.94, 1.34], [-0.94, -1.34], [0.94, -1.34]].forEach(([x, z], index) => {
        const pivot = new THREE.Group();
        pivot.position.set(x, 0.37, z);
        if (index < 2) frontPivots.push(pivot);
        const wheel = new THREE.Group();
        const tireMesh = new THREE.Mesh(wheelGeo, tire);
        tireMesh.castShadow = true;
        const rimMesh = new THREE.Mesh(rimGeo, rim);
        wheel.add(tireMesh, rimMesh);
        pivot.add(wheel);
        group.add(pivot);
        wheels.push(wheel);
    });
    // fake brake discs
    wheels.forEach(wheel => {
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.255, 12), new THREE.MeshStandardMaterial({ color: 0x32383a, roughness: 0.55, metalness: 0.7 }));
        disc.rotation.z = Math.PI / 2;
        wheel.add(disc);
    });

    group.position.y = 0.02;
    return { group, wheels, frontPivots, paint, underglow, headlights: [] };
}

function addCarToWorld() {
    if (carRoot) {
        world.remove(carRoot);
        carRoot.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach(material => material.dispose());
            }
        });
    }
    const carDef = CARS.find(car => car.id === selectedCarId) || CARS[0];
    carVisual = makeCarModel(carDef);
    carRoot = carVisual.group;
    world.add(carRoot);
    placeCarAtStart();
}

function placeCarAtStart() {
    if (!track) return;
    const s = track.samples[Math.min(18, track.count)];
    carState.pos.copy(s.point);
    carState.yaw = Math.atan2(s.tangent.x, s.tangent.z);
    carState.speed = 0;
    carState.steer = 0;
    carState.index = 18;
    carState.lateral = 0;
    carRoot.position.set(carState.pos.x, s.point.y + 0.34, carState.pos.z);
    carRoot.rotation.set(0, carState.yaw, 0);
    race.prevIndex = 18;
    updateChaseCamera(1, true);
}

/* ---------- build world ---------- */
function buildWorld(mapConfig) {
    loadingLayer.hidden = false;
    mode = 'menu';
    disposeWorld();
    map = mapConfig;
    scene.background = new THREE.Color(mapConfig.skyHorizon);
    scene.fog = new THREE.FogExp2(mapConfig.fogColor, mapConfig.fogDensity);
    renderer.toneMappingExposure = mapConfig.exposure;
    world = new THREE.Group();
    scene.add(world);

    const sky = createSky(mapConfig);
    world.add(sky);
    createEnvironment(mapConfig);
    createLights(mapConfig);
    addGround(mapConfig);
    track = makeTrack(mapConfig);
    addTrackToWorld(mapConfig);
    buildProps(mapConfig);
    addCarToWorld();

    menuAngle = 0;
    mapName.textContent = mapConfig.name;
    mapTag.textContent = mapConfig.tag;
    mapDesc.textContent = mapConfig.desc;
    mapDifficulty.textContent = mapConfig.difficulty;
    mapLength.textContent = formatLength(track.length);
    mapReward.textContent = `×${mapConfig.reward.toFixed(1)}`;
    const best = save.best[mapConfig.id];
    mapBest.textContent = best ? formatScore(best.score) : '—';
    hudMap.textContent = mapConfig.name;
    renderCurrentCar();
    resizeRenderer();
    loadingLayer.hidden = true;
}

function updateChaseCamera(dt, immediate = false) {
    if (!carRoot) return;
    const forward = new THREE.Vector3(Math.sin(carState.yaw), 0, Math.cos(carState.yaw));
    const speedFactor = clamp(carState.speed / 20, 0, 1);
    const targetPos = carRoot.position.clone()
        .addScaledVector(forward, -8.4 - speedFactor * 1.7)
        .add(new THREE.Vector3(0, 3.15 + speedFactor * 0.55, 0));
    const lookAt = carRoot.position.clone().addScaledVector(forward, 5.5 + speedFactor * 3.5);
    lookAt.y += 0.9;
    if (immediate) {
        camera.position.copy(targetPos);
    } else {
        const t = 1 - Math.pow(0.002, dt);
        camera.position.lerp(targetPos, t);
    }
    camera.lookAt(lookAt);
    camera.fov = lerp(camera.fov, 62 + speedFactor * 14, immediate ? 1 : 1 - Math.pow(0.08, dt));
    camera.updateProjectionMatrix();
}

function updateMenuCamera(dt) {
    if (!carRoot) return;
    menuAngle += dt * 0.18;
    const radius = 10.5;
    const target = carRoot.position.clone();
    camera.position.set(
        target.x + Math.sin(menuAngle) * radius,
        target.y + 3.5,
        target.z + Math.cos(menuAngle) * radius
    );
    camera.lookAt(target.x, target.y + 0.8, target.z);
    camera.fov = lerp(camera.fov, 40, 1 - Math.pow(0.02, dt));
    camera.updateProjectionMatrix();
}

/* ============================================================
   UI
   ============================================================ */

function renderMapCards() {
    mapGrid.innerHTML = MAPS.map(mapConfig => {
        const best = save.best[mapConfig.id];
        return `
            <button type="button" class="map-card${mapConfig.id === selectedMapId ? ' is-selected' : ''}" data-map="${mapConfig.id}" style="--map-a:${mapConfig.uiA};--map-b:${mapConfig.uiB};--map-glow:${mapConfig.uiGlow}">
                <span class="map-card-arrow">↗</span>
                <span class="map-card-icon">${mapConfig.icon}</span>
                <strong>${mapConfig.name}</strong>
                <small>${mapConfig.tag} · ${mapConfig.difficulty}</small>
                <span class="map-card-best">${best ? `BEST ${formatScore(best.score)}` : '尚未挑战'}</span>
            </button>
        `;
    }).join('');
    mapGrid.querySelectorAll('[data-map]').forEach(button => {
        button.addEventListener('click', () => selectMap(button.dataset.map));
    });
}

function renderBrief() {
    const mapConfig = MAPS.find(item => item.id === selectedMapId) || MAPS[0];
    const best = save.best[mapConfig.id];
    mapName.textContent = mapConfig.name;
    mapTag.textContent = mapConfig.tag;
    mapDesc.textContent = mapConfig.desc;
    mapDifficulty.textContent = mapConfig.difficulty;
    mapReward.textContent = `×${mapConfig.reward.toFixed(1)}`;
    mapBest.textContent = best ? formatScore(best.score) : '—';
    mapLength.textContent = track ? formatLength(track.length) : '—';
    hudMap.textContent = mapConfig.name;
    renderCurrentCar();
}

function renderCurrentCar() {
    const stats = getCarStats(selectedCarId);
    currentCarName.textContent = stats.car.name;
    currentCarStats.textContent = `极速 ${stats.topKmh} km/h · 操控 ${stats.turn.toFixed(2)} · 制动 ${Math.round(stats.brakeForce)}`;
    carSilhouette.style.setProperty('--car-top', stats.car.uiA);
    carSilhouette.style.setProperty('--car-bottom', stats.car.uiB);
}

function selectMap(id) {
    if (!MAPS.some(item => item.id === id)) return;
    selectedMapId = id;
    renderMapCards();
    renderBrief();
    const mapConfig = MAPS.find(item => item.id === id);
    buildWorld(mapConfig);
    showMenu();
}

function openGarage() {
    if (mode !== 'menu') return;
    renderGarage();
    garageLayer.hidden = false;
}

function closeGarage() {
    garageLayer.hidden = true;
    renderCurrentCar();
    renderBrief();
}

function renderGarage() {
    garageList.innerHTML = CARS.map(car => {
        const owned = save.owned.includes(car.id);
        const selected = save.selectedCar === car.id;
        const stats = getCarStats(car.id);
        const upgradeButtons = UPGRADE_DEFS.map(upgrade => {
            const level = save.upgrades[car.id]?.[upgrade.id] || 0;
            const maxed = level >= UPGRADE_MAX;
            const cost = getUpgradeCost(car, level);
            const disabled = !owned || maxed || save.coins < cost;
            return `<button type="button" class="upgrade-btn" data-upgrade="${upgrade.id}" data-car="${car.id}" ${disabled ? 'disabled' : ''}>${upgrade.name} ${maxed ? 'MAX' : `Lv.${level} · ${formatCoins(cost)}`}</button>`;
        }).join('');
        return `
            <div class="garage-car${selected ? ' is-selected' : ''}${owned ? '' : ' is-locked'}" style="--car-a:${car.uiA};--car-b:${car.uiB}">
                <div class="garage-car-art"></div>
                <div class="garage-car-copy">
                    <strong>${car.name}${selected ? ' · 使用中' : ''}</strong>
                    <small>${car.desc}</small>
                    <div class="garage-stats">
                        <span>极速 ${stats.topKmh}</span>
                        <span>操控 ${stats.turn.toFixed(2)}</span>
                        <span>制动 ${Math.round(stats.brakeForce)}</span>
                    </div>
                    <div class="garage-upgrades">${owned ? upgradeButtons : '<span class="garage-stats"><span>购买后解锁升级</span></span>'}</div>
                </div>
                <div class="garage-car-actions">
                    ${owned
                        ? `<button type="button" class="race-secondary-btn" data-select-car="${car.id}" ${selected ? 'disabled' : ''}>${selected ? '已选择' : '选择'}</button>`
                        : `<button type="button" class="race-primary-btn" data-buy-car="${car.id}" ${save.coins < car.price ? 'disabled' : ''}>购买 · ${formatCoins(car.price)}</button>`}
                </div>
            </div>
        `;
    }).join('');
    syncCoins();
}

function buyCar(id) {
    const car = CARS.find(item => item.id === id);
    if (!car || save.owned.includes(id) || save.coins < car.price) return;
    save.coins -= car.price;
    save.owned.push(id);
    save.selectedCar = id;
    selectedCarId = id;
    save.upgrades[id] = save.upgrades[id] || { engine: 0, handling: 0, brake: 0 };
    persist();
    addCarToWorld();
    renderGarage();
    renderCurrentCar();
    renderBrief();
    syncCoins();
}

function selectCar(id) {
    if (!save.owned.includes(id) || selectedCarId === id) return;
    selectedCarId = id;
    save.selectedCar = id;
    persist();
    addCarToWorld();
    renderGarage();
    renderCurrentCar();
    renderBrief();
}

function upgradeCar(carId, type) {
    if (!save.owned.includes(carId)) return;
    const car = CARS.find(item => item.id === carId);
    if (!car) return;
    const levels = save.upgrades[carId] || { engine: 0, handling: 0, brake: 0 };
    const level = levels[type] || 0;
    if (level >= UPGRADE_MAX) return;
    const cost = getUpgradeCost(car, level);
    if (save.coins < cost) return;
    save.coins -= cost;
    levels[type] = level + 1;
    save.upgrades[carId] = levels;
    persist();
    renderGarage();
    renderCurrentCar();
    renderBrief();
    syncCoins();
}

/* ---------- HUD / screens ---------- */
function showMenu() {
    mode = 'menu';
    menuLayer.hidden = false;
    raceHud.hidden = true;
    pauseLayer.hidden = true;
    resultsLayer.hidden = true;
    garageLayer.hidden = true;
    countdown.hidden = true;
    document.body.classList.remove('race-live');
    if (track) {
        placeCarAtStart();
        menuAngle = 0;
    }
    syncCoins();
    renderMapCards();
    renderBrief();
    if (audioCtx) engineGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.08);
}

function startRace() {
    if (!track || !carRoot) return;
    garageLayer.hidden = true;
    menuLayer.hidden = true;
    raceHud.hidden = false;
    resultsLayer.hidden = true;
    pauseLayer.hidden = true;
    document.body.classList.add('race-live');
    placeCarAtStart();
    race.lap = 1;
    race.time = 0;
    race.lapStart = 0;
    race.bestLap = Infinity;
    race.topSpeed = 0;
    race.offroadTime = 0;
    race.prevIndex = carState.index;
    race.lastLapAt = -99;
    race.countdown = 3.0;
    race.lastCount = 3;
    mode = 'countdown';
    input.throttle = false;
    input.brake = false;
    input.left = false;
    input.right = false;
    countdown.hidden = false;
    countdown.textContent = '3';
    raceStatus.textContent = '准备发车';
    hudLap.textContent = `LAP 1 / ${TOTAL_LAPS}`;
    hudSpeed.textContent = '0';
    raceTime.textContent = '00:00.000';
    initAudio();
    updateChaseCamera(1, true);
    syncCoins();
}

function pauseRace() {
    if (mode !== 'racing' && mode !== 'countdown') return;
    pausedFrom = mode;
    mode = 'paused';
    pauseLayer.hidden = false;
    setEngineGain(0.0001);
}

function resumeRace() {
    if (mode !== 'paused') return;
    mode = pausedFrom;
    pauseLayer.hidden = true;
    input.brake = false;
    input.throttle = false;
    input.left = false;
    input.right = false;
    if (audioCtx) audioCtx.resume();
}

function restartRace() {
    pauseLayer.hidden = true;
    resultsLayer.hidden = true;
    startRace();
}

function quitToMenu() {
    pauseLayer.hidden = true;
    resultsLayer.hidden = true;
    mode = 'menu';
    menuLayer.hidden = false;
    raceHud.hidden = true;
    document.body.classList.remove('race-live');
    placeCarAtStart();
    renderMapCards();
    renderBrief();
    if (audioCtx) setEngineGain(0.0001);
}

function finishRace() {
    if (mode !== 'racing') return;
    mode = 'finished';
    const carStats = getCarStats(selectedCarId);
    const speedKmh = Math.round(race.topSpeed * 3.6);
    const score = Math.max(
        100,
        Math.round(
            3300 +
            speedKmh * 18 +
            Math.max(0, 1900 - race.offroadTime * 48) -
            race.time * 20 +
            race.lap * 120
        )
    );
    const coins = Math.max(20, Math.round((score / 18) * mapConfigReward()));
    const oldBest = save.best[selectedMapId];
    const isBest = !oldBest || score > oldBest.score;
    save.coins += coins;
    if (isBest) {
        save.best[selectedMapId] = {
            score,
            time: race.time,
            lap: Number.isFinite(race.bestLap) ? race.bestLap : race.time
        };
    }
    persist();
    syncCoins();
    $('resultTitle').textContent = isBest ? '新纪录！' : '完赛';
    $('resultBadge').textContent = isBest ? 'NEW BEST' : 'FINISH';
    $('resultTime').textContent = formatTime(race.time);
    $('resultLap').textContent = formatTime(race.bestLap);
    $('resultSpeed').textContent = `${speedKmh} km/h`;
    $('resultScore').textContent = formatScore(score);
    $('resultCoins').textContent = `+${formatCoins(coins)}`;
    resultsLayer.hidden = false;
    document.body.classList.remove('race-live');
    raceStatus.textContent = isBest ? '新纪录' : '完赛';
    setEngineGain(0.0001);
    playFinishSound();
}

function mapConfigReward() {
    return (MAPS.find(item => item.id === selectedMapId) || MAPS[0]).reward;
}

function showLapToast(text) {
    const node = document.createElement('div');
    node.className = 'lap-toast';
    node.textContent = text;
    $('raceStage').appendChild(node);
    window.setTimeout(() => node.remove(), 1450);
}

/* ============================================================
   Audio
   ============================================================ */
function initAudio() {
    if (audioMuted) return;
    try {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            audioCtx = new AC();
            engineOsc = audioCtx.createOscillator();
            engineOsc.type = 'sawtooth';
            engineOsc.frequency.value = 65;
            engineFilter = audioCtx.createBiquadFilter();
            engineFilter.type = 'lowpass';
            engineFilter.frequency.value = 420;
            engineGain = audioCtx.createGain();
            engineGain.gain.value = 0.0001;
            engineOsc.connect(engineFilter);
            engineFilter.connect(engineGain);
            engineGain.connect(audioCtx.destination);
            engineOsc.start();
        }
        audioCtx.resume();
        setEngineGain(0.018);
    } catch (error) {
        audioCtx = null;
    }
}

function setEngineGain(value) {
    if (!audioCtx || !engineGain) return;
    engineGain.gain.setTargetAtTime(clamp(value, 0.0001, 0.06), audioCtx.currentTime, 0.08);
}

function updateEngineSound() {
    if (!audioCtx || !engineOsc || audioMuted) return;
    const speed = clamp(carState.speed / 20, 0, 1);
    engineOsc.frequency.setTargetAtTime(58 + speed * 72 + Math.abs(carState.steer) * 6, audioCtx.currentTime, 0.08);
    engineFilter.frequency.setTargetAtTime(300 + speed * 700, audioCtx.currentTime, 0.1);
    setEngineGain(mode === 'racing' ? 0.012 + speed * 0.018 : 0.0001);
}

function playFinishSound() {
    if (!audioCtx || audioMuted) return;
    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, now + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.07, now + index * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + 0.45);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 0.5);
    });
}

function toggleSound() {
    audioMuted = !audioMuted;
    save.muted = audioMuted;
    persist();
    $('soundBtn').classList.toggle('is-muted', audioMuted);
    $('soundBtn').innerHTML = `<i class="fas fa-volume-${audioMuted ? 'xmark' : 'high'}" aria-hidden="true"></i>`;
    if (audioMuted) setEngineGain(0.0001);
    else initAudio();
}

/* ============================================================
   Input
   ============================================================ */
function setInput(control, pressed) {
    if (control in input) input[control] = pressed;
}

function bindInputs() {
    window.addEventListener('keydown', event => {
        const key = event.key.toLowerCase();
        if (key === 'escape') {
            if (mode === 'racing' || mode === 'countdown') pauseRace();
            else if (mode === 'paused') resumeRace();
            return;
        }
        if (mode === 'paused' && key === 'p') {
            resumeRace();
            return;
        }
        if (key === 'r' && mode === 'racing') {
            resetCarToTrack();
            return;
        }
        if (key === 'p' && mode === 'racing') {
            pauseRace();
            return;
        }
        if (mode !== 'racing') return;
        if (key === 'w' || key === 'arrowup') input.throttle = true;
        if (key === 's' || key === 'arrowdown') input.brake = true;
        if (key === 'a' || key === 'arrowleft') input.left = true;
        if (key === 'd' || key === 'arrowright') input.right = true;
        if (key === ' ') input.brake = true;
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    });

    window.addEventListener('keyup', event => {
        const key = event.key.toLowerCase();
        if (key === 'w' || key === 'arrowup') input.throttle = false;
        if (key === 's' || key === 'arrowdown') input.brake = false;
        if (key === 'a' || key === 'arrowleft') input.left = false;
        if (key === 'd' || key === 'arrowright') input.right = false;
        if (key === ' ') input.brake = false;
    });

    touchControls.querySelectorAll('[data-control]').forEach(button => {
        const control = button.dataset.control;
        const press = event => {
            event.preventDefault();
            setInput(control, true);
            button.classList.add('is-pressed');
            if (button.setPointerCapture) {
                try { button.setPointerCapture(event.pointerId); } catch (error) { /* noop */ }
            }
        };
        const release = event => {
            event.preventDefault();
            setInput(control, false);
            button.classList.remove('is-pressed');
        };
        button.addEventListener('pointerdown', press);
        button.addEventListener('pointerup', release);
        button.addEventListener('pointercancel', release);
        button.addEventListener('lostpointercapture', release);
    });
}

function resetCarToTrack() {
    if (!track) return;
    const nearest = track.nearest(carState.pos, carState.index);
    carState.pos.copy(nearest.point);
    carState.yaw = Math.atan2(nearest.tangent.x, nearest.tangent.z);
    carState.speed = 0;
    carState.steer = 0;
    carState.index = nearest.index;
    carState.lateral = 0;
    carRoot.position.set(carState.pos.x, nearest.point.y + 0.34, carState.pos.z);
    carRoot.rotation.set(0, carState.yaw, 0);
    race.prevIndex = nearest.index;
    updateChaseCamera(1, true);
    raceStatus.textContent = '已回到赛道';
}

/* ---------- physics / camera / render ---------- */
function updateCar(dt) {
    if (!carRoot || !track) return;
    const stats = getCarStats(selectedCarId);
    const steering = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    carState.steer = lerp(carState.steer, steering, 1 - Math.pow(0.001, dt));

    const projected = track.nearest(carRoot.position, carState.index);
    carState.index = projected.index;
    carState.lateral = projected.lateral;
    const roadLimit = track.halfWidth + 1.2;
    const onRoad = Math.abs(projected.lateral) <= track.halfWidth + 0.1;

    if (!onRoad) {
        race.offroadTime += dt;
        carState.speed *= Math.pow(0.46, dt);
    }
    if (Math.abs(projected.lateral) > roadLimit) {
        const correction = Math.sign(projected.lateral) * roadLimit - projected.lateral;
        carRoot.position.addScaledVector(projected.side, correction);
        carState.speed *= 0.7;
        flashRace();
    }

    const maxSpeed = stats.maxSpeed * (onRoad ? 1 : 0.52);
    if (input.throttle) carState.speed += stats.accel * dt * (1 - carState.speed / (maxSpeed + 1));
    if (input.brake) carState.speed -= stats.brakeForce * dt;
    carState.speed -= carState.speed * (onRoad ? 0.075 : 0.36) * dt;
    carState.speed = clamp(carState.speed, 0, maxSpeed);
    race.topSpeed = Math.max(race.topSpeed, carState.speed);

    const speedFactor = clamp(carState.speed / stats.maxSpeed, 0, 1);
    const turnRate = stats.turn * (0.38 + speedFactor * 0.9) * (carState.speed > 1 ? 1 : 0);
    carState.yaw += carState.steer * turnRate * dt;
    const forward = new THREE.Vector3(Math.sin(carState.yaw), 0, Math.cos(carState.yaw));
    carRoot.position.addScaledVector(forward, carState.speed * dt);

    const after = track.nearest(carRoot.position, carState.index);
    carState.index = after.index;
    carState.lateral = after.lateral;
    carRoot.position.y = after.point.y + 0.34;

    // avoid driving backwards through the start line / lap counter
    updateLapProgress(after.index);

    carRoot.rotation.y = carState.yaw;
    carRoot.rotation.x = -Math.asin(clamp(after.tangent.y, -0.25, 0.25)) * 0.36;
    carRoot.rotation.z = -carState.steer * speedFactor * 0.028;

    if (carVisual) {
        carVisual.wheels.forEach((wheel, index) => {
            wheel.rotation.x += carState.speed * dt / 0.36;
            if (index < 2) {
                wheel.parent.rotation.y = carState.steer * 0.38;
            }
        });
        carVisual.underglow.material.opacity = 0.06 + speedFactor * 0.12;
    }

    updateChaseCamera(dt);
    hudSpeed.textContent = String(Math.round(carState.speed * 3.6));
    hudLap.textContent = `LAP ${Math.min(race.lap, TOTAL_LAPS)} / ${TOTAL_LAPS}`;
    raceTime.textContent = formatTime(race.time);
}

function updateLapProgress(index) {
    const total = track.count;
    const prev = race.prevIndex;
    const crossed = prev > total * 0.72 && index < total * 0.28;
    if (crossed && carState.speed > 0.4 && race.time - race.lastLapAt > 6) {
        race.lastLapAt = race.time;
        const lapTime = race.time - race.lapStart;
        if (lapTime < race.bestLap) race.bestLap = lapTime;
        race.lapStart = race.time;
        if (race.lap >= TOTAL_LAPS) {
            finishRace();
            return;
        }
        race.lap += 1;
        showLapToast(`LAP ${race.lap} · ${formatTime(lapTime)}`);
        flashRace();
        raceStatus.textContent = `第 ${race.lap} 圈`;
    }
    race.prevIndex = index;
}

function flashRace() {
    raceFlash.classList.remove('is-active');
    void raceFlash.offsetWidth;
    raceFlash.classList.add('is-active');
}

function tick(dt) {
    if (mode === 'menu') {
        updateMenuCamera(dt);
        if (weather) weather.update(dt, carRoot.position);
        return;
    }
    if (mode === 'paused' || mode === 'finished') {
        if (weather && carRoot) weather.update(dt * 0.15, carRoot.position);
        return;
    }
    if (mode === 'countdown') {
        race.countdown -= dt;
        const n = Math.max(1, Math.ceil(race.countdown));
        if (n !== race.lastCount) {
            race.lastCount = n;
            countdown.textContent = String(n);
            countdown.hidden = false;
        }
        if (race.countdown <= 0) {
            countdown.hidden = true;
            mode = 'racing';
            race.time = 0;
            race.lapStart = 0;
            raceStatus.textContent = '比赛进行中';
            showLapToast('GO!');
            initAudio();
        }
        updateChaseCamera(dt);
        return;
    }
    if (mode === 'racing') {
        race.time += dt;
        updateCar(dt);
        if (weather) weather.update(dt, carRoot.position);
        updateEngineSound();
    }
}

function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    if (!renderer || !scene || !camera) return;
    tick(dt);
    if (sunLight && carRoot && (mode === 'racing' || mode === 'countdown' || mode === 'paused' || mode === 'finished')) {
        const forward = new THREE.Vector3(Math.sin(carState.yaw), 0, Math.cos(carState.yaw));
        sunLight.position.set(carRoot.position.x + 80, carRoot.position.y + 110, carRoot.position.z + 50);
        sunTarget.position.copy(carRoot.position).addScaledVector(forward, 15);
    }
    renderer.render(scene, camera);
}

/* ============================================================
   Wiring
   ============================================================ */
function bindUi() {
    $('startRaceBtn').addEventListener('click', startRace);
    $('garageBtn').addEventListener('click', openGarage);
    $('garageBtn2').addEventListener('click', openGarage);
    $('garageClose').addEventListener('click', closeGarage);
    $('pauseBtn').addEventListener('click', pauseRace);
    $('soundBtn').addEventListener('click', toggleSound);
    $('resumeBtn').addEventListener('click', resumeRace);
    $('restartBtn').addEventListener('click', restartRace);
    $('quitToMenuBtn').addEventListener('click', quitToMenu);
    $('raceAgainBtn').addEventListener('click', restartRace);
    $('resultMenuBtn').addEventListener('click', quitToMenu);
    $('resultGarageBtn').addEventListener('click', () => {
        resultsLayer.hidden = true;
        mode = 'menu';
        menuLayer.hidden = false;
        raceHud.hidden = true;
        placeCarAtStart();
        renderMapCards();
        renderBrief();
        openGarage();
    });
    $('resultsLayer').addEventListener('click', event => {
        if (event.target === resultsLayer) return;
    });
    garageList.addEventListener('click', event => {
        const buy = event.target.closest('[data-buy-car]');
        if (buy) { buyCar(buy.dataset.buyCar); return; }
        const select = event.target.closest('[data-select-car]');
        if (select) { selectCar(select.dataset.selectCar); return; }
        const upgrade = event.target.closest('[data-upgrade]');
        if (upgrade) upgradeCar(upgrade.dataset.car, upgrade.dataset.upgrade);
    });
    $('soundBtn').innerHTML = `<i class="fas fa-volume-${audioMuted ? 'xmark' : 'high'}" aria-hidden="true"></i>`;
    $('soundBtn').classList.toggle('is-muted', audioMuted);
}



function start() {
    if (!initThree()) return;
    bindUi();
    bindInputs();
    renderMapCards();
    const currentMap = MAPS.find(item => item.id === selectedMapId) || MAPS[0];
    buildWorld(currentMap);
    showMenu();
    requestAnimationFrame(animate);
}

start();
