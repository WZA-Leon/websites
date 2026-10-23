// 音频播放器：把页面里的 [data-audio-player] 占位节点渲染成统一播放器。
// 默认读取 media/colors.mp3，可在占位节点上用 data-src / data-title / data-artist 覆盖。
(function () {
    const DEFAULT_SRC = 'media/colors.mp3';
    const DEFAULT_TITLE = 'WZA 的私人电台';
    const DEFAULT_ARTIST = '背景音乐';
    const DEFAULT_VOLUME = 0.8;

    function formatTime(value) {
        if (!Number.isFinite(value) || value < 0) return '0:00';
        const total = Math.floor(value);
        const minutes = Math.floor(total / 60);
        const seconds = total % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    function createPlayer(container) {
        const rawSrc = container.dataset.src || DEFAULT_SRC;
        const src = typeof sitePath === 'function' ? sitePath(rawSrc) : rawSrc;
        const title = container.dataset.title || DEFAULT_TITLE;
        const artist = container.dataset.artist || DEFAULT_ARTIST;

        const player = document.createElement('div');
        player.className = 'audio-player';
        player.setAttribute('role', 'region');
        player.setAttribute('aria-label', '音频播放器');
        player.innerHTML = `
            <audio class="audio-player-media" preload="metadata"></audio>
            <div class="audio-player-cover" aria-hidden="true">
                <i class="fas fa-compact-disc"></i>
            </div>
            <div class="audio-player-main">
                <span class="audio-player-kicker" aria-live="polite">Ready</span>
                <span class="audio-player-title"></span>
                <span class="audio-player-artist"></span>
                <div class="audio-player-timeline">
                    <span class="audio-player-time audio-player-current">0:00</span>
                    <input class="audio-player-seek" type="range" min="0" max="1000" step="1" value="0" aria-label="播放进度" disabled>
                    <span class="audio-player-time audio-player-duration">0:00</span>
                </div>
            </div>
            <div class="audio-player-actions">
                <button class="audio-player-btn audio-player-play" type="button" aria-label="播放">
                    <i class="fas fa-play" aria-hidden="true"></i>
                    <span class="audio-player-spinner" aria-hidden="true"></span>
                </button>
                <button class="audio-player-btn audio-player-mute" type="button" aria-label="静音" aria-pressed="false">
                    <i class="fas fa-volume-high" aria-hidden="true"></i>
                </button>
                <input class="audio-player-volume" type="range" min="0" max="100" step="1" value="100" aria-label="音量" title="音量">
                <button class="audio-player-btn audio-player-loop" type="button" aria-label="循环播放" aria-pressed="false">
                    <i class="fas fa-repeat" aria-hidden="true"></i>
                </button>
            </div>
        `;

        const audio = player.querySelector('.audio-player-media');
        const kickerEl = player.querySelector('.audio-player-kicker');
        const titleEl = player.querySelector('.audio-player-title');
        const artistEl = player.querySelector('.audio-player-artist');
        const currentEl = player.querySelector('.audio-player-current');
        const durationEl = player.querySelector('.audio-player-duration');
        const seek = player.querySelector('.audio-player-seek');
        const playBtn = player.querySelector('.audio-player-play');
        const muteBtn = player.querySelector('.audio-player-mute');
        const volume = player.querySelector('.audio-player-volume');
        const loopBtn = player.querySelector('.audio-player-loop');
        const playIcon = playBtn.querySelector('i');
        const muteIcon = muteBtn.querySelector('i');

        titleEl.textContent = title;
        artistEl.textContent = artist;
        audio.title = title;

        container.replaceChildren(player);

        let seeking = false;
        let playPending = false;
        let lastVolume = DEFAULT_VOLUME;

        function updateStatus() {
            if (player.classList.contains('is-unavailable')) {
                kickerEl.textContent = 'Unavailable';
                return;
            }
            if (player.classList.contains('is-buffering')) {
                kickerEl.textContent = 'Buffering';
                return;
            }
            if (audio.ended) {
                kickerEl.textContent = 'Ended';
                return;
            }
            if (!audio.paused) {
                kickerEl.textContent = 'Now Playing';
                return;
            }
            kickerEl.textContent = audio.currentTime > 0 ? 'Paused' : 'Ready';
        }

        function updatePlayLabel() {
            if (player.classList.contains('is-unavailable')) return;
            const buffering = player.classList.contains('is-buffering');
            const playing = player.classList.contains('is-playing');
            playBtn.setAttribute('aria-label',
                buffering ? (playing ? '暂停' : '加载中') : (playing ? '暂停' : '播放'));
        }

        function setBuffering(buffering) {
            player.classList.toggle('is-buffering', buffering);
            player.setAttribute('aria-busy', String(buffering));
            updatePlayLabel();
            updateStatus();
        }

        function updatePlayUI(playing) {
            player.classList.toggle('is-playing', playing);
            playIcon.className = playing ? 'fas fa-pause' : 'fas fa-play';
            updatePlayLabel();
            updateStatus();
        }

        function setProgress(percent) {
            const clamped = Math.min(100, Math.max(0, percent));
            seek.value = String(Math.round(clamped * 10));
            seek.style.setProperty('--audio-progress', `${clamped}%`);
        }

        function updateDurationUI() {
            const duration = audio.duration;
            const valid = Number.isFinite(duration) && duration > 0;
            durationEl.textContent = valid ? formatTime(duration) : '0:00';
            seek.disabled = !valid;
            if (!valid) setProgress(0);
        }

        function markUnavailable() {
            playPending = false;
            player.classList.add('is-unavailable');
            setBuffering(false);
            updatePlayUI(false);
            kickerEl.textContent = 'Unavailable';
            artistEl.textContent = '暂无音频 · 敬请期待';
            artistEl.title = rawSrc;
            currentEl.textContent = '0:00';
            durationEl.textContent = '0:00';
            setProgress(0);
            playBtn.disabled = true;
            muteBtn.disabled = true;
            volume.disabled = true;
            loopBtn.disabled = true;
            seek.disabled = true;
            playBtn.setAttribute('aria-label', '音频不可用');
        }

        function updateVolumeUI() {
            const level = Math.round((Number.isFinite(audio.volume) ? audio.volume : 1) * 100);
            const muted = audio.muted || audio.volume === 0;
            volume.value = String(level);
            volume.style.setProperty('--audio-progress', `${level}%`);
            volume.classList.toggle('is-muted', muted);
            volume.setAttribute('aria-valuetext', `${level}%`);
            muteBtn.classList.toggle('is-active', muted);
            muteBtn.setAttribute('aria-pressed', String(muted));
            muteBtn.setAttribute('aria-label', muted ? '取消静音' : '静音');
            muteIcon.className = muted ? 'fas fa-volume-xmark' : 'fas fa-volume-high';
            if (!muted && audio.volume > 0) lastVolume = audio.volume;
        }

        playBtn.addEventListener('click', async () => {
            if (audio.error) return;
            if (audio.paused) {
                if (playPending) return;
                playPending = true;
                setBuffering(true);
                try {
                    await audio.play();
                    if (!audio.paused && audio.readyState >= 3) {
                        setBuffering(false);
                        updatePlayUI(true);
                    }
                } catch (error) {
                    setBuffering(false);
                    if (audio.paused) updatePlayUI(false);
                } finally {
                    playPending = false;
                }
            } else {
                audio.pause();
            }
        });

        muteBtn.addEventListener('click', () => {
            if (audio.muted || audio.volume === 0) {
                audio.muted = false;
                if (audio.volume === 0) audio.volume = lastVolume || DEFAULT_VOLUME;
            } else {
                audio.muted = true;
            }
            updateVolumeUI();
        });

        volume.addEventListener('input', () => {
            const level = Number(volume.value);
            audio.muted = false;
            audio.volume = level / 100;
            if (level > 0) lastVolume = audio.volume;
            updateVolumeUI();
        });

        loopBtn.addEventListener('click', () => {
            audio.loop = !audio.loop;
            loopBtn.classList.toggle('is-active', audio.loop);
            loopBtn.setAttribute('aria-pressed', String(audio.loop));
        });

        seek.addEventListener('pointerdown', () => {
            seeking = true;
        });

        seek.addEventListener('pointerup', () => {
            seeking = false;
        });

        seek.addEventListener('pointercancel', () => {
            seeking = false;
        });

        seek.addEventListener('input', () => {
            const percent = Number(seek.value) / 10;
            seek.style.setProperty('--audio-progress', `${percent}%`);
            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                currentEl.textContent = formatTime(audio.duration * percent / 100);
            }
        });

        seek.addEventListener('change', () => {
            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                audio.currentTime = audio.duration * Number(seek.value) / 1000;
            }
            seeking = false;
            updateStatus();
        });

        audio.addEventListener('loadedmetadata', updateDurationUI);
        audio.addEventListener('durationchange', updateDurationUI);

        audio.addEventListener('timeupdate', () => {
            if (seeking) return;
            const duration = audio.duration;
            if (!Number.isFinite(duration) || duration <= 0) return;
            const percent = audio.currentTime / duration * 100;
            setProgress(percent);
            currentEl.textContent = formatTime(audio.currentTime);
        });

        audio.addEventListener('play', () => {
            if (audio.readyState < 3) setBuffering(true);
            updateStatus();
        });

        audio.addEventListener('playing', () => {
            setBuffering(false);
            updatePlayUI(true);
        });

        audio.addEventListener('pause', () => {
            setBuffering(false);
            updatePlayUI(false);
        });

        audio.addEventListener('ended', () => {
            setBuffering(false);
            updatePlayUI(false);
            updateStatus();
        });

        audio.addEventListener('waiting', () => {
            if (!audio.paused) setBuffering(true);
        });

        audio.addEventListener('stalled', () => {
            if (!audio.paused) setBuffering(true);
        });

        audio.addEventListener('canplay', () => {
            if (!audio.paused && audio.readyState >= 3) {
                setBuffering(false);
                updatePlayUI(true);
            } else {
                updateStatus();
            }
        });

        audio.addEventListener('seeked', () => {
            if (!audio.paused && audio.readyState >= 3) {
                setBuffering(false);
                updatePlayUI(true);
            } else {
                updateStatus();
            }
        });

        audio.addEventListener('volumechange', updateVolumeUI);
        audio.addEventListener('error', markUnavailable);

        audio.src = src;
        audio.load();
        updateVolumeUI();
        updateStatus();
    }

    function initAudioPlayers() {
        document.querySelectorAll('[data-audio-player]').forEach((container) => {
            if (container.dataset.audioReady === 'true') return;
            container.dataset.audioReady = 'true';
            createPlayer(container);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAudioPlayers);
    } else {
        initAudioPlayers();
    }
})();
