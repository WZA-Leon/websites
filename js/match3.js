// Emoji 消消乐 · 限步轮次挑战
// 8x8 棋盘，拖动或点击交换相邻 emoji，三连及以上消除；
// 每轮有步数限制，下一轮步数由上一轮得分决定，支持连击、自动洗牌和本地存档。
(function () {
    'use strict';

    const ROWS = 8;
    const COLS = 8;
    const TYPES = [
        { emoji: '🍎', name: '苹果' },
        { emoji: '🍇', name: '葡萄' },
        { emoji: '🍋', name: '柠檬' },
        { emoji: '🍓', name: '草莓' },
        { emoji: '🫐', name: '蓝莓' },
        { emoji: '🥝', name: '猕猴桃' }
    ];
    const SPECIAL_TYPES = {
        bomb: { emoji: '💣', name: '炸弹方块' },
        wild: { emoji: '❓', name: '万能方块' }
    };
    const REWARDS = [
        'WZA 的赞美：这轮消得真漂亮。',
        'WZA 隔空亲了你一口（虚拟）。',
        'WZA 发了 0.00 元红包，并说“拿去买糖”。',
        'WZA 给你竖了个大大的拇指。',
        'WZA 请你喝了一杯空气奶茶。',
        'WZA 摸了摸你的头，说下一轮也拜托了。',
        'WZA 把“今日消除冠军”的称号借你用一天。',
        'WZA 认真地说：你比昨天更会玩了。'
    ];
    const TYPE_INDEXES = TYPES.map((_, index) => index);
    const SAVE_KEY = 'wza.match3.save.v2';
    const BEST_KEY = 'wza.match3.best.v1';
    const START_MOVES = 20;
    const MAX_MOVES = 40;
    const MOVES_PER_SCORE = 250;

    const boardEl = document.getElementById('match3Board');
    const fxEl = document.getElementById('match3Fx');
    const boardWrap = document.getElementById('boardWrap');
    const scoreEl = document.getElementById('scoreValue');
    const bestEl = document.getElementById('bestValue');
    const movesEl = document.getElementById('movesValue');
    const comboEl = document.getElementById('comboValue');
    const clearedEl = document.getElementById('clearedValue');
    const maxComboEl = document.getElementById('maxComboValue');
    const roundValueEl = document.getElementById('roundValue');
    const roundScoreEl = document.getElementById('roundScoreValue');
    const saveStatusEl = document.getElementById('saveStatus');
    const liveStatusEl = document.getElementById('liveStatus');
    const soundToggle = document.getElementById('soundToggle');
    const restartBtn = document.getElementById('restartBtn');
    const toastEl = document.getElementById('match3Toast');
    const roundOverlay = document.getElementById('roundOverlay');
    const roundEndNumberEl = document.getElementById('roundEndNumber');
    const roundEndScoreEl = document.getElementById('roundEndScore');
    const roundEndTotalEl = document.getElementById('roundEndTotal');
    const roundNextMovesEl = document.getElementById('roundNextMoves');
    const roundBonusSpecialsEl = document.getElementById('roundBonusSpecials');
    const roundRewardEl = document.getElementById('roundReward');
    const nextRoundBtn = document.getElementById('nextRoundBtn');

    if (!boardEl || !fxEl) return;

    const sfx = window.Match3SFX || {
        play() {},
        isEnabled: () => false,
        toggle: () => false
    };

    let grid = [];
    let selected = null;
    let busy = false;
    let score = 0;
    let best = 0;
    let movesLeft = START_MOVES;
    let cleared = 0;
    let maxCombo = 0;
    let combo = 0;
    let round = 1;
    let roundStartScore = 0;
    let roundOver = false;
    let pendingNextMoves = START_MOVES;
    let pendingStartSpecials = { bombs: 0, wilds: 0 };
    let pendingReward = '';
    let lastReward = '';
    let dragState = null;
    let suppressClick = false;
    let suppressClickTimer = null;
    let spawnId = 0;
    let saveTimer = null;
    let toastTimer = null;

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const nextFrame = () => new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    const format = value => Number(value).toLocaleString('zh-CN');

    function typeAt(index) {
        return TYPES[index] || TYPES[0];
    }

    function randomTypeIndex() {
        return Math.floor(Math.random() * TYPES.length);
    }

    function currentTypes() {
        return grid.map(row => row.map(tile => (
            tile && tile.kind === 'normal' ? tile.typeIndex : null
        )));
    }

    function serializeBoard() {
        return grid.map(row => row.map(tile => {
            if (!tile) return null;
            if (tile.kind === 'bomb' || tile.kind === 'wild') return tile.kind;
            return tile.typeIndex;
        }));
    }

    /* ---------- 棋盘生成 ---------- */

    function makeRandomTypes() {
        const types = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

        for (let r = 0; r < ROWS; r += 1) {
            for (let c = 0; c < COLS; c += 1) {
                const banned = new Set();
                if (c >= 2 && types[r][c - 1] === types[r][c - 2]) {
                    banned.add(types[r][c - 1]);
                }
                if (r >= 2 && types[r - 1][c] === types[r - 2][c]) {
                    banned.add(types[r - 1][c]);
                }
                const candidates = TYPE_INDEXES.filter(index => !banned.has(index));
                types[r][c] = candidates[Math.floor(Math.random() * candidates.length)];
            }
        }

        return types;
    }

    function generateTypes() {
        for (let attempt = 0; attempt < 200; attempt += 1) {
            const types = makeRandomTypes();
            if (hasPossibleMoveTypes(types)) return types;
        }
        return makeRandomTypes();
    }

    function findTypeMatches(types) {
        const matched = new Set();

        for (let r = 0; r < ROWS; r += 1) {
            let start = 0;
            for (let c = 1; c <= COLS; c += 1) {
                const same = c < COLS &&
                    types[r][c] !== null &&
                    types[r][c] === types[r][c - 1];
                if (!same) {
                    const length = c - start;
                    if (length >= 3) {
                        for (let k = start; k < c; k += 1) matched.add(r * COLS + k);
                    }
                    start = c;
                }
            }
        }

        for (let c = 0; c < COLS; c += 1) {
            let start = 0;
            for (let r = 1; r <= ROWS; r += 1) {
                const same = r < ROWS &&
                    types[r][c] !== null &&
                    types[r][c] === types[r - 1][c];
                if (!same) {
                    const length = r - start;
                    if (length >= 3) {
                        for (let k = start; k < r; k += 1) matched.add(k * COLS + c);
                    }
                    start = r;
                }
            }
        }

        return matched;
    }

    function matchAtTypes(types, row, col) {
        const value = types[row][col];
        if (value === null) return false;

        let horizontal = 1;
        for (let c = col - 1; c >= 0 && types[row][c] === value; c -= 1) horizontal += 1;
        for (let c = col + 1; c < COLS && types[row][c] === value; c += 1) horizontal += 1;
        if (horizontal >= 3) return true;

        let vertical = 1;
        for (let r = row - 1; r >= 0 && types[r][col] === value; r -= 1) vertical += 1;
        for (let r = row + 1; r < ROWS && types[r][col] === value; r += 1) vertical += 1;
        return vertical >= 3;
    }

    function hasPossibleMoveTypes(types) {
        for (let r = 0; r < ROWS; r += 1) {
            for (let c = 0; c < COLS; c += 1) {
                if (c + 1 < COLS) {
                    [types[r][c], types[r][c + 1]] = [types[r][c + 1], types[r][c]];
                    const possible = matchAtTypes(types, r, c) || matchAtTypes(types, r, c + 1);
                    [types[r][c], types[r][c + 1]] = [types[r][c + 1], types[r][c]];
                    if (possible) return true;
                }
                if (r + 1 < ROWS) {
                    [types[r][c], types[r + 1][c]] = [types[r + 1][c], types[r][c]];
                    const possible = matchAtTypes(types, r, c) || matchAtTypes(types, r + 1, c);
                    [types[r][c], types[r + 1][c]] = [types[r + 1][c], types[r][c]];
                    if (possible) return true;
                }
            }
        }
        return false;
    }

    function hasPossibleMove() {
        // 场上有炸弹或万能块时，总可以通过交换它们来产生动作。
        if (grid.flat().some(tile => tile && tile.kind !== 'normal')) return true;
        return hasPossibleMoveTypes(currentTypes());
    }

    function findMatches() {
        const matched = new Set();
        const addRun = run => {
            if (run.length >= 3) run.forEach(tile => matched.add(tile));
        };

        // 万能块可以替代任意一种普通元素。
        // 对每种元素类型各扫一遍，把万能块视为该类型；不同普通类型会被自然断开。
        for (let type = 0; type < TYPES.length; type += 1) {
            for (let row = 0; row < ROWS; row += 1) {
                let run = [];
                for (let col = 0; col < COLS; col += 1) {
                    const tile = grid[row][col];
                    const valid = tile && (
                        tile.kind === 'wild' ||
                        (tile.kind === 'normal' && tile.typeIndex === type)
                    );
                    if (valid) {
                        run.push(tile);
                    } else {
                        addRun(run);
                        run = [];
                    }
                }
                addRun(run);
            }

            for (let col = 0; col < COLS; col += 1) {
                let run = [];
                for (let row = 0; row < ROWS; row += 1) {
                    const tile = grid[row][col];
                    const valid = tile && (
                        tile.kind === 'wild' ||
                        (tile.kind === 'normal' && tile.typeIndex === type)
                    );
                    if (valid) {
                        run.push(tile);
                    } else {
                        addRun(run);
                        run = [];
                    }
                }
                addRun(run);
            }
        }

        return matched;
    }

    function runLengthAt(tile) {
        if (!tile || tile.kind !== 'normal') return 0;
        const value = tile.typeIndex;

        let horizontal = 1;
        for (let c = tile.col - 1; c >= 0; c -= 1) {
            const other = grid[tile.row][c];
            if (!other || other.kind !== 'normal' || other.typeIndex !== value) break;
            horizontal += 1;
        }
        for (let c = tile.col + 1; c < COLS; c += 1) {
            const other = grid[tile.row][c];
            if (!other || other.kind !== 'normal' || other.typeIndex !== value) break;
            horizontal += 1;
        }

        let vertical = 1;
        for (let r = tile.row - 1; r >= 0; r -= 1) {
            const other = grid[r][tile.col];
            if (!other || other.kind !== 'normal' || other.typeIndex !== value) break;
            vertical += 1;
        }
        for (let r = tile.row + 1; r < ROWS; r += 1) {
            const other = grid[r][tile.col];
            if (!other || other.kind !== 'normal' || other.typeIndex !== value) break;
            vertical += 1;
        }

        return Math.max(horizontal, vertical);
    }

    function pickSpecial(matched) {
        if (matched.size < 4) return null;

        let best = null;
        matched.forEach(tile => {
            if (tile.kind !== 'normal') return;
            const run = runLengthAt(tile);
            if (!best || run > best.run) best = { tile, run };
        });

        if (!best) return null;
        return {
            tile: best.tile,
            kind: matched.size >= 5 ? 'bomb' : 'wild'
        };
    }

    function bombArea(bombTile) {
        const affected = new Set();
        const queue = [bombTile];
        const visited = new Set();

        while (queue.length) {
            const bomb = queue.pop();
            if (!bomb || visited.has(bomb)) continue;
            visited.add(bomb);

            for (let dr = -1; dr <= 1; dr += 1) {
                for (let dc = -1; dc <= 1; dc += 1) {
                    const row = bomb.row + dr;
                    const col = bomb.col + dc;
                    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) continue;
                    const tile = grid[row][col];
                    if (!tile || affected.has(tile)) continue;
                    affected.add(tile);
                    if (tile.kind === 'bomb' && !visited.has(tile)) queue.push(tile);
                }
            }
        }

        affected.add(bombTile);
        return affected;
    }

    async function clearWildFallback(wildTile) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        directions.forEach(([dr, dc]) => {
            const row = wildTile.row + dr;
            const col = wildTile.col + dc;
            if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
            const tile = grid[row][col];
            if (tile && tile.kind === 'normal') neighbors.push(tile);
        });

        if (!neighbors.length) return false;

        const victim = neighbors[Math.floor(Math.random() * neighbors.length)];
        score += 10;
        cleared += 1;
        combo = 1;
        if (score > best) best = score;
        updateHud();
        showScoreFloat(new Set([victim]), 10, 1);
        spawnParticles(new Set([victim]));
        victim.el.classList.add('is-matched');
        showToast('❓ 没凑成三连，随机消除旁边一个元素');
        sfx.play('wildFallback', { type: victim.typeIndex });

        await sleep(250);
        if (victim.el.isConnected) victim.el.remove();
        grid[victim.row][victim.col] = null;
        await refillBoard();
        await sleep(250);
        return true;
    }

    function showBombFx(bombTile) {
        const blast = document.createElement('span');
        blast.className = 'fx-bomb';
        blast.textContent = '💥';
        blast.style.setProperty('--x', `${((bombTile.col + 0.5) / COLS) * 100}%`);
        blast.style.setProperty('--y', `${((bombTile.row + 0.5) / ROWS) * 100}%`);
        fxEl.appendChild(blast);
        window.setTimeout(() => blast.remove(), 750);
    }

    async function detonateBomb(bombTile) {
        const affected = bombArea(bombTile);
        const count = affected.size;
        const gained = count * 10;
        score += gained;
        cleared += count;
        combo = 1;
        if (score > best) best = score;
        updateHud();

        showBombFx(bombTile);
        showScoreFloat(affected, gained, 1);
        spawnParticles(affected);
        affected.forEach(tile => {
            tile.el.classList.add(tile.kind === 'bomb' ? 'is-detonating' : 'is-matched');
        });
        showToast(`💣 炸弹引爆，清出 ${count} 格`);
        sfx.play('bomb', { count });

        await sleep(300);
        affected.forEach(tile => {
            if (tile.el.isConnected) tile.el.remove();
            grid[tile.row][tile.col] = null;
        });

        await refillBoard();
        await sleep(250);
    }

    /* ---------- 渲染 ---------- */

    function setTilePosition(tile, row, col, animate = true) {
        tile.row = row;
        tile.col = col;
        tile.el.style.setProperty('--row', String(row));
        tile.el.style.setProperty('--col', String(col));
        tile.el.setAttribute('aria-label', `${tile.type.name}，第 ${row + 1} 行第 ${col + 1} 列`);

        if (!animate) {
            tile.el.style.transition = 'none';
            void tile.el.offsetWidth;
            requestAnimationFrame(() => {
                tile.el.style.transition = '';
            });
        }
    }

    function createTile(cell, row, col) {
        const specialKind = cell === 'bomb' || cell === 'wild' ? cell : null;
        const kind = specialKind || 'normal';
        const typeIndex = specialKind ? null : cell;
        const type = specialKind ? SPECIAL_TYPES[specialKind] : typeAt(cell);
        const tile = {
            id: ++spawnId,
            kind,
            typeIndex,
            type,
            row,
            col,
            el: document.createElement('button')
        };

        tile.el.type = 'button';
        tile.el.className = `tile${specialKind ? ` is-${specialKind}` : ''}`;
        tile.el.dataset.type = specialKind || String(cell);
        tile.el.innerHTML = `<span class="tile-face ${specialKind ? `special-${specialKind}` : `type-${cell}`}"><span class="tile-emoji">${type.emoji}</span></span>`;
        tile.el.addEventListener('click', () => onTileClick(tile));
        tile.el.addEventListener('pointerdown', event => onPointerDown(event, tile));
        tile.el.addEventListener('pointermove', onPointerMove);
        tile.el.addEventListener('pointerup', onPointerUp);
        tile.el.addEventListener('pointercancel', onPointerCancel);
        setTilePosition(tile, row, col, false);
        boardEl.appendChild(tile.el);

        return tile;
    }

    function setTileType(tile, typeIndex) {
        tile.kind = 'normal';
        tile.typeIndex = typeIndex;
        tile.type = typeAt(typeIndex);
        tile.el.classList.remove('is-bomb', 'is-wild');
        tile.el.dataset.type = String(typeIndex);

        const face = tile.el.querySelector('.tile-face');
        if (face) {
            face.className = `tile-face type-${typeIndex}`;
            const emoji = face.querySelector('.tile-emoji');
            if (emoji) emoji.textContent = tile.type.emoji;
        }
        tile.el.setAttribute('aria-label', `${tile.type.name}，第 ${tile.row + 1} 行第 ${tile.col + 1} 列`);
    }

    function setTileSpecial(tile, kind) {
        if (!SPECIAL_TYPES[kind]) return;

        tile.kind = kind;
        tile.typeIndex = null;
        tile.type = SPECIAL_TYPES[kind];
        tile.el.classList.remove('is-bomb', 'is-wild');
        tile.el.classList.add(`is-${kind}`);
        tile.el.dataset.type = kind;

        const face = tile.el.querySelector('.tile-face');
        if (face) {
            face.className = `tile-face special-${kind}`;
            const emoji = face.querySelector('.tile-emoji');
            if (emoji) emoji.textContent = tile.type.emoji;
        }
        tile.el.setAttribute('aria-label', `${tile.type.name}，第 ${tile.row + 1} 行第 ${tile.col + 1} 列`);
    }

    function buildBoard(cells) {
        boardEl.innerHTML = '';
        fxEl.innerHTML = '';
        selected = null;
        grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

        const tiles = [];
        for (let r = 0; r < ROWS; r += 1) {
            for (let c = 0; c < COLS; c += 1) {
                const tile = createTile(cells[r][c], r, c);
                tile.el.classList.add('is-entering');
                tile.el.style.setProperty('--enter-delay', `${(r + c) * 14}ms`);
                grid[r][c] = tile;
                tiles.push(tile);
            }
        }

        window.setTimeout(() => {
            tiles.forEach(tile => tile.el.classList.remove('is-entering'));
        }, 1100);
    }

    function applyStartingSpecials(specials) {
        const normalTiles = grid.flat().filter(tile => tile && tile.kind === 'normal');
        if (!normalTiles.length) return;

        for (let i = normalTiles.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [normalTiles[i], normalTiles[j]] = [normalTiles[j], normalTiles[i]];
        }

        let index = 0;
        const place = kind => {
            const tile = normalTiles[index];
            index += 1;
            if (!tile) return;
            setTileSpecial(tile, kind);
            tile.el.classList.add('is-special-forming');
            window.setTimeout(() => tile.el.classList.remove('is-special-forming'), 650);
        };

        for (let i = 0; i < specials.bombs; i += 1) place('bomb');
        for (let i = 0; i < specials.wilds; i += 1) place('wild');
    }

    function clearSelection() {
        if (selected) {
            selected.el.classList.remove('is-selected');
            selected = null;
        }
    }

    function isAdjacent(a, b) {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
    }

    function swapTiles(a, b) {
        const aRow = a.row;
        const aCol = a.col;
        const bRow = b.row;
        const bCol = b.col;

        grid[aRow][aCol] = b;
        grid[bRow][bCol] = a;
        setTilePosition(a, bRow, bCol, true);
        setTilePosition(b, aRow, aCol, true);
    }

    /* ---------- 拖动交换 ---------- */

    function tileAtDirection(tile, direction) {
        const delta = {
            up: [-1, 0],
            down: [1, 0],
            left: [0, -1],
            right: [0, 1]
        }[direction];
        if (!delta) return null;
        const row = tile.row + delta[0];
        const col = tile.col + delta[1];
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
        return grid[row][col] || null;
    }

    function suppressNextClick() {
        suppressClick = true;
        window.clearTimeout(suppressClickTimer);
        suppressClickTimer = window.setTimeout(() => {
            suppressClick = false;
        }, 450);
    }

    function onPointerDown(event, tile) {
        if (busy || roundOver || !tile) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        event.preventDefault();
        dragState = {
            tile,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            moved: false
        };
        tile.el.classList.add('is-dragging');

        try {
            tile.el.setPointerCapture(event.pointerId);
        } catch (e) {}
    }

    function onPointerMove(event) {
        if (!dragState || event.pointerId !== dragState.pointerId) return;
        const dx = event.clientX - dragState.startX;
        const dy = event.clientY - dragState.startY;
        if (Math.abs(dx) + Math.abs(dy) > 10) {
            dragState.moved = true;
            event.preventDefault();
        }
    }

    function onPointerUp(event) {
        if (!dragState || event.pointerId !== dragState.pointerId) return;

        const state = dragState;
        dragState = null;
        state.tile.el.classList.remove('is-dragging');
        try {
            state.tile.el.releasePointerCapture(state.pointerId);
        } catch (e) {}

        if (busy || roundOver || !state.tile.el.isConnected) return;

        const dx = event.clientX - state.startX;
        const dy = event.clientY - state.startY;
        const distance = Math.hypot(dx, dy);

        if (distance >= 14) {
            suppressNextClick();
            const direction = Math.abs(dx) >= Math.abs(dy)
                ? (dx > 0 ? 'right' : 'left')
                : (dy > 0 ? 'down' : 'up');
            const target = tileAtDirection(state.tile, direction);

            if (target) {
                clearSelection();
                attemptSwap(state.tile, target);
            } else {
                setLiveStatus('拖到相邻的格子上才能交换');
            }
            return;
        }

        handleTileSelection(state.tile);
        suppressNextClick();
    }

    function onPointerCancel(event) {
        if (!dragState || event.pointerId !== dragState.pointerId) return;
        dragState.tile.el.classList.remove('is-dragging');
        try {
            dragState.tile.el.releasePointerCapture(dragState.pointerId);
        } catch (e) {}
        dragState = null;
    }

    /* ---------- HUD / 存档 ---------- */

    function updateHud() {
        if (scoreEl) scoreEl.textContent = format(score);
        if (bestEl) bestEl.textContent = format(best);
        if (movesEl) movesEl.textContent = format(Math.max(0, movesLeft));
        if (comboEl) comboEl.textContent = `x${Math.max(1, combo)}`;
        if (clearedEl) clearedEl.textContent = format(cleared);
        if (maxComboEl) maxComboEl.textContent = `x${Math.max(1, maxCombo)}`;
        if (roundValueEl) roundValueEl.textContent = String(round);
        if (roundScoreEl) roundScoreEl.textContent = format(Math.max(0, score - roundStartScore));
    }

    function setLiveStatus(text) {
        if (liveStatusEl) liveStatusEl.textContent = text;
    }

    function markSaved(text = '进度已保存') {
        if (!saveStatusEl) return;
        saveStatusEl.textContent = text;
        saveStatusEl.classList.add('is-saved');
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(() => {
            saveStatusEl.textContent = '进度自动保存';
            saveStatusEl.classList.remove('is-saved');
        }, 1800);
    }

    function readBest() {
        try {
            const value = Number.parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
            return Number.isFinite(value) && value > 0 ? value : 0;
        } catch (e) {
            return 0;
        }
    }

    function calcNextMoves(roundScore) {
        return Math.min(
            MAX_MOVES,
            START_MOVES + Math.floor(Math.max(0, roundScore) / MOVES_PER_SCORE)
        );
    }

    function calcStartSpecials(roundScore) {
        const wilds = Math.min(2, 1 + (roundScore >= 1000 ? 1 : 0));
        const bombs = roundScore >= 2000
            ? Math.min(2, 1 + (roundScore >= 5000 ? 1 : 0))
            : 0;
        return { bombs, wilds };
    }

    function specialsLabel(specials) {
        const parts = [];
        if (specials.bombs > 0) parts.push(`💣×${specials.bombs}`);
        if (specials.wilds > 0) parts.push(`❓×${specials.wilds}`);
        return parts.length ? parts.join(' · ') : '无';
    }

    function pickReward() {
        const candidates = REWARDS.filter(reward => reward !== lastReward);
        const pool = candidates.length ? candidates : REWARDS;
        const reward = pool[Math.floor(Math.random() * pool.length)];
        lastReward = reward;
        return reward;
    }

    function hideRoundOverlay() {
        if (roundOverlay) roundOverlay.hidden = true;
    }

    function showRoundOverlay() {
        const roundScore = Math.max(0, score - roundStartScore);
        pendingNextMoves = calcNextMoves(roundScore);
        pendingStartSpecials = calcStartSpecials(roundScore);
        if (!pendingReward) pendingReward = pickReward();

        if (roundEndNumberEl) roundEndNumberEl.textContent = String(round);
        if (roundEndScoreEl) roundEndScoreEl.textContent = format(roundScore);
        if (roundEndTotalEl) roundEndTotalEl.textContent = format(score);
        if (roundNextMovesEl) roundNextMovesEl.textContent = String(pendingNextMoves);
        if (roundBonusSpecialsEl) roundBonusSpecialsEl.textContent = specialsLabel(pendingStartSpecials);
        if (roundRewardEl) roundRewardEl.textContent = pendingReward;
        if (nextRoundBtn) nextRoundBtn.textContent = `开始第 ${round + 1} 轮`;
        if (roundOverlay) roundOverlay.hidden = false;
    }

    function saveProgress(showStatus = true) {
        if (!grid.length) return;
        if (grid.flat().some(tile => !tile)) return;

        try {
            const payload = {
                v: 2,
                board: serializeBoard(),
                score,
                movesLeft,
                cleared,
                maxCombo,
                round,
                roundStartScore
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
            localStorage.setItem(BEST_KEY, String(best));
            if (showStatus) markSaved();
        } catch (e) {
            if (showStatus) markSaved('浏览器未允许本地保存');
        }
    }

    function loadProgress() {
        let data;
        try {
            data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
        } catch (e) {
            return false;
        }

        if (!data || data.v !== 2 || !Array.isArray(data.board)) return false;
        if (data.board.length !== ROWS) return false;
        if (data.board.some(row => !Array.isArray(row) || row.length !== COLS)) return false;
        if (data.board.some(row => row.some(value => {
            const isNormal = Number.isInteger(value) && value >= 0 && value < TYPES.length;
            return !isNormal && value !== 'bomb' && value !== 'wild';
        }))) return false;

        const normalTypes = data.board.map(row => row.map(value =>
            Number.isInteger(value) ? value : null
        ));

        // 存档必须是一个已经稳定、没有现成三连的棋盘。
        if (findTypeMatches(normalTypes).size > 0) return false;

        score = Number.isFinite(Number(data.score)) ? Math.max(0, Math.floor(Number(data.score))) : 0;
        movesLeft = Number.isFinite(Number(data.movesLeft))
            ? Math.max(0, Math.floor(Number(data.movesLeft)))
            : START_MOVES;
        cleared = Number.isFinite(Number(data.cleared)) ? Math.max(0, Math.floor(Number(data.cleared))) : 0;
        maxCombo = Number.isFinite(Number(data.maxCombo)) ? Math.max(0, Math.floor(Number(data.maxCombo))) : 0;
        round = Number.isFinite(Number(data.round)) ? Math.max(1, Math.floor(Number(data.round))) : 1;
        roundStartScore = Number.isFinite(Number(data.roundStartScore))
            ? Math.max(0, Math.min(score, Math.floor(Number(data.roundStartScore))))
            : 0;
        roundOver = movesLeft <= 0;
        pendingNextMoves = calcNextMoves(score - roundStartScore);
        best = Math.max(readBest(), score);
        buildBoard(data.board);
        updateHud();
        markSaved('已恢复上次进度');

        if (roundOver) {
            busy = true;
            showRoundOverlay();
            setLiveStatus('本轮步数用完了，准备下一轮');
        } else {
            setLiveStatus('欢迎回来，继续消除吧');
        }
        return true;
    }

    /* ---------- 视觉反馈 ---------- */

    function showToast(message) {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toastEl.classList.remove('is-visible');
        }, 2200);
    }

    function showScoreFloat(tiles, gained, cascade) {
        const list = Array.from(tiles);
        if (!list.length) return;

        const row = list.reduce((sum, tile) => sum + tile.row, 0) / list.length;
        const col = list.reduce((sum, tile) => sum + tile.col, 0) / list.length;
        const label = document.createElement('span');
        label.className = 'fx-score';
        label.textContent = `+${format(gained)}${cascade > 1 ? ` x${cascade}` : ''}`;
        label.style.setProperty('--x', `${((col + 0.5) / COLS) * 100}%`);
        label.style.setProperty('--y', `${((row + 0.5) / ROWS) * 100}%`);
        fxEl.appendChild(label);
        window.setTimeout(() => label.remove(), 1050);
    }

    function showCombo(cascade) {
        const banner = document.createElement('span');
        banner.className = 'fx-combo';
        banner.textContent = `连锁 x${cascade}`;
        fxEl.appendChild(banner);
        window.setTimeout(() => banner.remove(), 1000);
    }

    function spawnParticles(tiles) {
        const list = Array.from(tiles).slice(0, 22);
        list.forEach(tile => {
            const particle = document.createElement('span');
            particle.className = 'fx-particle';
            particle.textContent = tile.type.emoji;
            particle.style.setProperty('--x', `${((tile.col + 0.5) / COLS) * 100}%`);
            particle.style.setProperty('--y', `${((tile.row + 0.5) / ROWS) * 100}%`);
            particle.style.setProperty('--dx', `${(Math.random() - 0.5) * 170}px`);
            particle.style.setProperty('--dy', `${-40 - Math.random() * 110}px`);
            particle.style.setProperty('--rot', `${(Math.random() - 0.5) * 320}deg`);
            fxEl.appendChild(particle);
            window.setTimeout(() => particle.remove(), 780);
        });
    }

    function celebrateBest() {
        if (bestEl) {
            bestEl.classList.add('is-best');
            window.setTimeout(() => bestEl.classList.remove('is-best'), 1700);
        }
        showToast(`新纪录！最高分 ${format(best)}`);
        sfx.play('best');
    }

    /* ---------- 消除与下落 ---------- */

    async function refillBoard() {
        const drops = [];

        for (let c = 0; c < COLS; c += 1) {
            let writeRow = ROWS - 1;

            for (let r = ROWS - 1; r >= 0; r -= 1) {
                const tile = grid[r][c];
                if (!tile) continue;
                if (r !== writeRow) {
                    grid[writeRow][c] = tile;
                    grid[r][c] = null;
                    setTilePosition(tile, writeRow, c, true);
                }
                writeRow -= 1;
            }

            const emptyCount = writeRow + 1;
            for (let r = writeRow; r >= 0; r -= 1) {
                const typeIndex = randomTypeIndex();
                const startRow = r - emptyCount;
                const tile = createTile(typeIndex, startRow, c);
                grid[r][c] = tile;
                drops.push({ tile, row: r, col: c });
            }
        }

        if (drops.length) {
            await nextFrame();
            drops.forEach(({ tile, row, col }) => {
                setTilePosition(tile, row, col, true);
                tile.el.classList.add('is-new');
                window.setTimeout(() => tile.el.classList.remove('is-new'), 340);
            });
        }

        await sleep(330);
    }

    async function shuffleBoard() {
        const wasBusy = busy;
        busy = true;
        showToast('没有可消除的组合，自动洗牌');
        sfx.play('shuffle');
        boardWrap.classList.add('is-shaking');

        let types = null;
        for (let attempt = 0; attempt < 120; attempt += 1) {
            const candidate = makeRandomTypes();
            if (findTypeMatches(candidate).size === 0 && hasPossibleMoveTypes(candidate)) {
                types = candidate;
                break;
            }
        }
        if (!types) types = generateTypes();

        const tiles = grid.flat().filter(Boolean);
        tiles.forEach(tile => tile.el.classList.add('is-flipping'));
        await sleep(180);

        for (let r = 0; r < ROWS; r += 1) {
            for (let c = 0; c < COLS; c += 1) {
                if (grid[r][c]) setTileType(grid[r][c], types[r][c]);
            }
        }

        await sleep(360);
        tiles.forEach(tile => tile.el.classList.remove('is-flipping'));
        boardWrap.classList.remove('is-shaking');
        setLiveStatus('洗牌完成，继续消除吧');
        busy = wasBusy;
    }

    async function ensurePlayable() {
        if (hasPossibleMove()) return;
        await shuffleBoard();
        saveProgress();
    }

    async function resolveMatches() {
        let cascade = 0;
        let newBest = false;
        let newWild = null;
        let matched = findMatches();

        while (matched.size) {
            cascade += 1;
            combo = cascade;
            const special = pickSpecial(matched);
            const removed = new Set(matched);
            if (special) removed.delete(special.tile);

            const count = matched.size;
            const gained = count * 10 * cascade;
            score += gained;
            cleared += removed.size;
            maxCombo = Math.max(maxCombo, cascade);
            if (score > best) {
                best = score;
                newBest = true;
            }

            updateHud();
            showScoreFloat(matched, gained, cascade);
            spawnParticles(matched);
            if (cascade > 1) showCombo(cascade);
            sfx.play(cascade > 1 ? 'cascade' : 'match', { count, cascade });

            matched.forEach(tile => {
                tile.el.classList.add(special && tile === special.tile ? 'is-forming' : 'is-matched');
            });
            await sleep(250);

            removed.forEach(tile => {
                if (tile.el.isConnected) tile.el.remove();
                grid[tile.row][tile.col] = null;
            });

            if (special) {
                setTileSpecial(special.tile, special.kind);
                special.tile.el.classList.remove('is-forming');
                special.tile.el.classList.add('is-special-forming');
                window.setTimeout(() => special.tile.el.classList.remove('is-special-forming'), 650);
                showToast(special.kind === 'bomb'
                    ? '五连！生成 💣 炸弹方块'
                    : '四连！生成 ❓ 万能方块');
                sfx.play(special.kind === 'bomb' ? 'specialBomb' : 'specialWild');
                if (special.kind === 'wild') newWild = special.tile;
            }

            await refillBoard();
            await sleep(250);
            matched = findMatches();
        }

        // 新生成的万能块如果实在没有形成三连，随机消掉一个相邻普通元素。
        if (newWild && newWild.kind === 'wild' && newWild.el.isConnected) {
            const cleared = await clearWildFallback(newWild);
            if (cleared) await resolveMatches();
        }

        combo = 0;
        updateHud();
        if (newBest) celebrateBest();
        if (movesLeft > 0) await ensurePlayable();
        saveProgress();
        setLiveStatus(movesLeft > 0 ? '继续消除吧' : '本轮步数用完了');
    }

    async function attemptSwap(a, b) {
        if (busy || roundOver) return;
        busy = true;
        clearSelection();
        sfx.play('swap');
        setLiveStatus('交换中…');

        swapTiles(a, b);
        await sleep(240);

        const bombTile = a.kind === 'bomb' ? a : (b.kind === 'bomb' ? b : null);
        if (bombTile) {
            movesLeft = Math.max(0, movesLeft - 1);
            updateHud();
            await detonateBomb(bombTile);
            await resolveMatches();
            busy = false;

            if (movesLeft <= 0) {
                endRound();
                return;
            }
            saveProgress();
            return;
        }

        const wildTile = a.kind === 'wild' ? a : (b.kind === 'wild' ? b : null);
        if (wildTile) {
            const matches = findMatches();
            if (!matches.size) {
                sfx.play('invalid');
                boardWrap.classList.add('is-shaking');
                a.el.classList.add('is-invalid');
                b.el.classList.add('is-invalid');
                setLiveStatus('万能块没有凑成三连，换个元素试试');
                await sleep(80);

                swapTiles(a, b);
                await sleep(240);
                a.el.classList.remove('is-invalid');
                b.el.classList.remove('is-invalid');
                boardWrap.classList.remove('is-shaking');
                busy = false;
                return;
            }
        } else {
            const matches = findMatches();
            if (!matches.size) {
                sfx.play('invalid');
                boardWrap.classList.add('is-shaking');
                a.el.classList.add('is-invalid');
                b.el.classList.add('is-invalid');
                setLiveStatus('没有形成三连，再换个位置试试');
                await sleep(80);

                swapTiles(a, b);
                await sleep(240);
                a.el.classList.remove('is-invalid');
                b.el.classList.remove('is-invalid');
                boardWrap.classList.remove('is-shaking');
                busy = false;
                return;
            }
        }

        movesLeft = Math.max(0, movesLeft - 1);
        updateHud();
        await resolveMatches();
        busy = false;

        if (movesLeft <= 0) {
            endRound();
            return;
        }
        saveProgress();
    }

    function onTileClick(tile) {
        if (suppressClick) {
            suppressClick = false;
            return;
        }
        handleTileSelection(tile);
    }

    function handleTileSelection(tile) {
        if (busy || roundOver || !tile) return;

        if (!selected) {
            selected = tile;
            tile.el.classList.add('is-selected');
            sfx.play('select');
            setLiveStatus(`已选中${tile.type.name}，再点一个相邻的 emoji`);
            return;
        }

        if (selected === tile) {
            clearSelection();
            setLiveStatus('已取消选择');
            return;
        }

        if (!isAdjacent(selected, tile)) {
            clearSelection();
            selected = tile;
            tile.el.classList.add('is-selected');
            setLiveStatus(`已改为选中${tile.type.name}`);
            return;
        }

        const first = selected;
        clearSelection();
        attemptSwap(first, tile);
    }

    /* ---------- 轮次 / 开局 ---------- */

    function endRound() {
        if (roundOver) return;

        roundOver = true;
        busy = true;
        clearSelection();
        pendingNextMoves = calcNextMoves(score - roundStartScore);
        pendingReward = pickReward();
        showRoundOverlay();
        sfx.play('roundEnd', { round });
        saveProgress();
        setLiveStatus(`第 ${round} 轮结束，本轮 ${format(score - roundStartScore)} 分`);
    }

    function startNextRound() {
        if (!roundOver) return;

        round += 1;
        roundStartScore = score;
        movesLeft = pendingNextMoves || calcNextMoves(0);
        roundOver = false;
        busy = false;
        combo = 0;
        const startingSpecials = { ...pendingStartSpecials };
        const startingReward = pendingReward;
        hideRoundOverlay();
        clearSelection();
        boardWrap.classList.remove('is-shaking');
        buildBoard(generateTypes());
        applyStartingSpecials(startingSpecials);
        updateHud();
        saveProgress();
        sfx.play('roundStart', { round, movesLeft });
        setLiveStatus(`第 ${round} 轮开始，剩余 ${movesLeft} 步`);
        if (startingReward) showToast(`WZA 的奖励：${startingReward}`);
        pendingReward = '';
        pendingStartSpecials = { bombs: 0, wilds: 0 };
    }

    function startNewGame() {
        clearSelection();
        round = 1;
        movesLeft = START_MOVES;
        roundStartScore = 0;
        roundOver = false;
        pendingNextMoves = START_MOVES;
        pendingStartSpecials = { bombs: 0, wilds: 0 };
        pendingReward = '';
        busy = false;
        score = 0;
        cleared = 0;
        maxCombo = 0;
        combo = 0;
        boardWrap.classList.remove('is-shaking');
        hideRoundOverlay();

        const types = generateTypes();
        buildBoard(types);
        updateHud();
        saveProgress();
        markSaved('新棋局已保存');
        setLiveStatus('第 1 轮开始，拖动或点击交换 emoji');
    }

    function syncSoundToggle() {
        if (!soundToggle) return;
        const enabled = sfx.isEnabled();
        soundToggle.textContent = enabled ? '🔊' : '🔇';
        soundToggle.setAttribute('aria-pressed', String(enabled));
        soundToggle.setAttribute('aria-label', enabled ? '关闭音效' : '开启音效');
        soundToggle.title = enabled ? '音效已开启（音频待接入）' : '音效占位（待接入音频）';
    }

    function bindControls() {
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                const enabled = sfx.toggle();
                syncSoundToggle();
                showToast(enabled ? '音效接口已开启，音频文件接入后生效' : '音效已关闭');
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (busy && !roundOver) {
                    showToast('等这一轮消除结束再重开吧');
                    return;
                }
                if (!window.confirm('重新开始会清空当前分数和进度，最高分会保留。继续吗？')) return;
                startNewGame();
            });
        }

        if (nextRoundBtn) {
            nextRoundBtn.addEventListener('click', () => {
                if (roundOver) startNextRound();
            });
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !busy) saveProgress(false);
        });

        window.addEventListener('beforeunload', () => {
            if (!busy) saveProgress(false);
        });
    }

    function init() {
        best = readBest();
        bindControls();
        const restored = loadProgress();

        if (!restored) {
            startNewGame();
        } else if (!roundOver && !hasPossibleMove()) {
            ensurePlayable();
        }

        best = Math.max(best, score);
        updateHud();
        syncSoundToggle();
        if (restored) saveProgress(false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
