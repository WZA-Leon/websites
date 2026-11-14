// Emoji 消消乐音效占位层
// 现在只保留统一接口和开关状态，接入音频文件后在这里实现即可。
(function () {
    'use strict';

    const STORAGE_KEY = 'wza.match3.sound';
    const CUES = [
        'select', 'swap', 'match', 'cascade', 'invalid', 'best', 'shuffle',
        'bomb', 'specialBomb', 'specialWild', 'wildFallback', 'roundStart', 'roundEnd'
    ];

    let enabled = false;
    try {
        enabled = localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {}

    function play(name, detail) {
        if (!enabled) return;
        // TODO: 在这里播放对应音效，例如 match / cascade / invalid / best。
        // 目前只保留调用点，不发出实际声音。
        void name;
        void detail;
    }

    function setEnabled(value) {
        enabled = Boolean(value);
        try {
            localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
        } catch (e) {}
        document.dispatchEvent(new CustomEvent('match3:soundchange', {
            detail: { enabled }
        }));
    }

    function toggle() {
        setEnabled(!enabled);
        return enabled;
    }

    window.Match3SFX = {
        cues: CUES.slice(),
        play,
        setEnabled,
        toggle,
        isEnabled: () => enabled
    };
})();
