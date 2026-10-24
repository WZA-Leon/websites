// 好友个人主页的主题切换
// 与全站 script.js 共用 site-theme 存储键，默认使用彩色主题。
(function () {
    'use strict';

    const THEMES = ['colorful', 'dark', 'light'];
    const ICONS = { colorful: '🌈', dark: '🌙', light: '☀️' };
    const TITLES = { colorful: '彩色主题', dark: '暗色主题', light: '亮色主题' };

    function getSavedTheme() {
        let theme = 'colorful';
        try {
            theme = localStorage.getItem('site-theme') || 'colorful';
        } catch (e) {}
        return THEMES.includes(theme) ? theme : 'colorful';
    }

    function currentTheme() {
        return THEMES.find(theme => document.body.classList.contains(`theme-${theme}`)) || 'colorful';
    }

    function updateButton(theme) {
        document.querySelectorAll('[data-friend-theme-toggle]').forEach(button => {
            button.textContent = ICONS[theme] || '🎨';
            button.title = TITLES[theme] || theme;
            button.setAttribute('aria-label', TITLES[theme] || theme);
        });
    }

    function applyTheme(theme) {
        if (!THEMES.includes(theme)) theme = 'colorful';

        const root = document.documentElement;
        THEMES.forEach(name => {
            document.body.classList.remove(`theme-${name}`);
            root.classList.remove(`theme-${name}`);
        });
        document.body.classList.add(`theme-${theme}`);
        root.classList.add(`theme-${theme}`);

        try { localStorage.setItem('site-theme', theme); } catch (e) {}
        updateButton(theme);
    }

    function initToggle() {
        const button = document.getElementById('friendThemeToggle');
        if (!button) return;

        updateButton(currentTheme());
        button.addEventListener('click', () => {
            const current = currentTheme();
            const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
            applyTheme(next);
        });
    }

    // 在页面内容解析前先应用主题，避免先闪一下暗色/白色。
    applyTheme(getSavedTheme());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initToggle, { once: true });
    } else {
        initToggle();
    }
})();
