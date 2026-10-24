// 全站页面加载层：首次加载 + 站内跳转
// 独立于 script.js，页面只需在 <head> 中引入本文件与 css/page-loader.css
(function () {
    'use strict';

    const THEMES = ['colorful', 'dark', 'light'];
    const root = document.documentElement;
    const reduceMotion = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    // 尽早同步主题类，保证加载层颜色与已保存主题一致
    let savedTheme = 'colorful';
    try {
        savedTheme = localStorage.getItem('site-theme') || 'colorful';
    } catch (e) {}
    if (!THEMES.includes(savedTheme)) savedTheme = 'colorful';
    THEMES.forEach(theme => root.classList.remove(`theme-${theme}`));
    root.classList.add(`theme-${savedTheme}`);

    let loader = document.getElementById('site-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'site-loader';
        loader.className = 'site-loader';
        loader.setAttribute('role', 'status');
        loader.setAttribute('aria-live', 'polite');
        loader.innerHTML = `
            <span class="site-loader-spinner" aria-hidden="true"></span>
            <span class="site-loader-text" aria-hidden="true">WZA · LEON</span>
            <span class="site-loader-status">页面加载中</span>
        `;
        (document.body || root).appendChild(loader);
    }

    const startedAt = Date.now();
    const MIN_VISIBLE = 300;
    const INITIAL_TIMEOUT = 5000;
    const HARD_TIMEOUT = 8000;

    let pending = 1;
    let initialReleased = false;
    let hidden = false;
    let hideTimer = 0;
    let navigating = false;

    function hide() {
        if (hidden) return;
        hidden = true;
        window.clearTimeout(hideTimer);
        loader.classList.add('is-hidden');
        loader.setAttribute('aria-hidden', 'true');
    }

    function show() {
        hidden = false;
        window.clearTimeout(hideTimer);
        loader.classList.remove('is-hidden');
        loader.removeAttribute('aria-hidden');
    }

    function maybeHide() {
        if (hidden || pending > 0) return;
        const elapsed = Date.now() - startedAt;
        const delay = Math.max(0, MIN_VISIBLE - elapsed);
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(hide, delay);
    }

    function hold() {
        window.clearTimeout(hideTimer);
        pending += 1;
        let released = false;
        return function release() {
            if (released) return;
            released = true;
            pending = Math.max(0, pending - 1);
            maybeHide();
        };
    }

    function releaseInitial() {
        if (initialReleased) return;
        initialReleased = true;
        pending = Math.max(0, pending - 1);
        maybeHide();
    }

    function waitFor(promise) {
        const release = hold();
        return Promise.resolve(promise)
            .catch(() => {})
            .finally(release);
    }

    function waitForImages(container) {
        if (!container) return Promise.resolve();
        const images = Array.from(container.querySelectorAll('img'));
        if (!images.length) return Promise.resolve();

        const ready = Promise.all(images.map(image => {
            if (image.complete || image.loading === 'lazy') return Promise.resolve();
            return new Promise(resolve => {
                const done = () => resolve();
                image.addEventListener('load', done, { once: true });
                image.addEventListener('error', done, { once: true });
                // 防止在检查 complete 与绑定事件之间图片已经加载完成。
                if (image.complete) done();
            });
        }));
        return waitFor(ready);
    }

    // 供博客、图库、项目等异步模块延长加载层显示时间
    window.SiteLoader = { show, hide, waitFor, waitForImages };

    if (document.readyState === 'complete') {
        releaseInitial();
    } else {
        window.addEventListener('load', releaseInitial, { once: true });
    }
    window.setTimeout(releaseInitial, INITIAL_TIMEOUT);
    window.setTimeout(() => {
        if (navigating) return;
        pending = 0;
        hide();
    }, HARD_TIMEOUT);

    document.addEventListener('DOMContentLoaded', () => {
        if (document.body && loader.parentNode !== document.body) {
            document.body.appendChild(loader);
        }

        // 不等待外部字体/图标 CDN，只等待页面自身的图片，避免网络慢时转圈过久。
        releaseInitial();
        waitForImages(document.body);
    }, { once: true });

    window.addEventListener('pageshow', (event) => {
        navigating = false;
        if (event.persisted) hide();
    });

    // 站内跳转：显示同一加载层，避免页面切换时的空白和卡顿
    document.addEventListener('click', (event) => {
        if (navigating || event.defaultPrevented ||
            (event.button != null && event.button !== 0)) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (!(event.target instanceof Element)) return;

        const link = event.target.closest('a[href]');
        if (!link) return;
        if (link.target && link.target !== '_self') return;
        if (link.hasAttribute('download')) return;
        if (link.closest('[data-no-transition]')) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') ||
            /^(mailto:|tel:|javascript:|data:)/i.test(href)) return;

        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.hash) return;

        const normalizePath = path => path.replace(/\/index\.html$/, '/');
        const current = new URL(window.location.href);
        if (normalizePath(url.pathname) === normalizePath(current.pathname) &&
            url.search === current.search) return;

        event.preventDefault();
        navigating = true;
        show();
        window.setTimeout(() => {
            window.location.href = url.href;
        }, reduceMotion ? 80 : 350);
    });
})();
