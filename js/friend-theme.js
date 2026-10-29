// 好友个人主页的主题切换
// 默认与全站共用 site-theme；生成的页面可用 data-friend-theme-key 使用独立键。
(function () {
    'use strict';

    const THEMES = ['colorful', 'dark', 'light'];
    const ICONS = { colorful: '🌈', dark: '🌙', light: '☀️' };
    const TITLES = { colorful: '彩色主题', dark: '暗色主题', light: '亮色主题' };

    // 生成的友链主页可以带 data-friend-theme-key，
    // 用它自己的键保存偏好，避免覆盖访客的全站主题。
    const STORAGE_KEY = (document.body && document.body.dataset.friendThemeKey) || 'site-theme';

    function getSavedTheme() {
        let theme = '';
        try {
            theme = localStorage.getItem(STORAGE_KEY) || '';
        } catch (e) {}
        if (THEMES.includes(theme)) return theme;

        const bodyTheme = THEMES.find(name => document.body.classList.contains(`theme-${name}`));
        return bodyTheme || 'colorful';
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

    function applyTheme(theme, persist) {
        if (!THEMES.includes(theme)) theme = 'colorful';

        const root = document.documentElement;
        THEMES.forEach(name => {
            document.body.classList.remove(`theme-${name}`);
            root.classList.remove(`theme-${name}`);
        });
        document.body.classList.add(`theme-${theme}`);
        root.classList.add(`theme-${theme}`);

        if (persist !== false) {
            try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
        }
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

    // 在页面内容解析前先应用主题；首屏不写入站点偏好，只有手动切换才保存。
    applyTheme(getSavedTheme(), false);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initToggle, { once: true });
    } else {
        initToggle();
    }
})();
