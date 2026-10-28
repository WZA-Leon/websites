// 在页面加载后注入导航栏和页脚，并初始化交互
// 以 script.js 自身位置为站点根目录，保证根目录页面与 blog-data 下的文章页
// 使用同一套导航/页脚资源路径。
const SITE_BASE = (() => {
    const script = document.currentScript ||
        Array.from(document.getElementsByTagName('script'))
            .find(s => /(^|\/)script\.js(?:[?#]|$)/.test(s.getAttribute('src') || ''));
    if (script && script.src) {
        return new URL('.', script.src).href;
    }
    return new URL('./', document.baseURI).href;
})();

function sitePath(path) {
    return new URL(path, SITE_BASE).href;
}

function buildNavHTML() {
    return `
    <nav id="main-nav" class="site-nav" aria-label="主导航">
        <div class="container nav-container">
            <a class="brand" href="${sitePath('index.html')}" aria-label="WZA Leon 首页">
                <img src="${sitePath('images/photo.png')}" alt="WZA Leon 头像" class="nav-avatar">
                <span>WZA · Leon</span>
            </a>
            <div id="navLinks" class="nav-links">
                <a href="${sitePath('index.html')}">首页</a>
                <a href="${sitePath('projects.html')}">项目</a>
                <a href="${sitePath('blog.html')}">博客</a>
                <a href="${sitePath('gallery.html')}">摄影</a>
                <a href="${sitePath('resources.html')}">云盘</a>
                <a href="${sitePath('friends.html')}">友链</a>
                <a href="${sitePath('about.html')}">关于</a>
                <a href="${sitePath('contact.html')}">联系</a>
                <a href="${sitePath('quiz.html')}">测验</a>
            </div>
            <div class="nav-actions">
                <a class="nav-icon-link" href="https://github.com/WZA-Leon" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">
                    <i class="fab fa-github" aria-hidden="true"></i>
                </a>
                <button id="themeToggle" class="theme-btn" title="切换主题" aria-label="切换主题">🌈</button>
                <button id="mobileMenuBtn" class="mobile-menu" aria-label="菜单" aria-expanded="false" aria-controls="navLinks">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </div>
    </nav>
    `;
}

// 主题管理（移除色盲模式）
const THEMES = ['colorful','dark','light'];
function applyTheme(name) {
    const root = document.documentElement;
    document.body.classList.remove(...THEMES.map(t=>`theme-${t}`));
    root.classList.remove(...THEMES.map(t=>`theme-${t}`));
    if (THEMES.includes(name)) {
        document.body.classList.add(`theme-${name}`);
        root.classList.add(`theme-${name}`);
    }
    document.body.classList.add('theme-transition');
    try { localStorage.setItem('site-theme', name); } catch(e){}
    const btn = document.getElementById('themeToggle');
    if (btn) {
        const map = { colorful: '🌈', dark: '🌙', light: '☀️' };
        const titles = { colorful: '彩色主题', dark: '暗色主题', light: '亮色主题' };
        btn.textContent = map[name] || '🎨';
        btn.title = titles[name] || name;
        btn.setAttribute('aria-label', titles[name] || name);
    }
}

function initThemeToggle() {
    let saved = 'colorful';
    try {
        saved = localStorage.getItem('site-theme') || 'colorful';
    } catch (e) {}
    if (!THEMES.includes(saved)) saved = 'colorful';
    applyTheme(saved);
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const current = THEMES.find(t=>document.body.classList.contains(`theme-${t}`)) || 'colorful';
        const next = THEMES[(THEMES.indexOf(current)+1) % THEMES.length];
        applyTheme(next);
    });
}

function buildFooterHTML() {
    return `
    <footer>
        <div class="container">
            <div class="footer-content">
                <div class="footer-column footer-brand">
                    <h3>WZA Leon · 创想日志</h3>
                    <p class="footer-tagline">中学生 · 跨学科创作者<br>用代码和影像记录想法。</p>
                    <p class="footer-status"><span aria-hidden="true"></span>每周日 19:30 更新</p>
                    <div class="social-icons" role="group" aria-label="社交与联系方式">
                        <a href="https://github.com/WZA-Leon" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub"><i class="fab fa-github" aria-hidden="true"></i></a>
                        <a href="mailto:wza-dl@outlook.com" aria-label="邮箱" title="邮箱"><i class="fas fa-envelope" aria-hidden="true"></i></a>
                        <a href="https://wza-leon.top" target="_blank" rel="noopener" aria-label="个人网站" title="个人网站"><i class="fas fa-globe" aria-hidden="true"></i></a>
                    </div>
                </div>

                <div class="footer-column">
                    <h3>浏览</h3>
                    <ul class="footer-links">
                        <li><a href="${sitePath('index.html')}">首页</a></li>
                        <li><a href="${sitePath('projects.html')}">项目</a></li>
                        <li><a href="${sitePath('blog.html')}">博客</a></li>
                        <li><a href="${sitePath('gallery.html')}">摄影</a></li>
                        <li><a href="${sitePath('resources.html')}">云盘</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h3>探索</h3>
                    <ul class="footer-links">
                        <li><a href="${sitePath('about.html')}">关于 WZA</a></li>
                        <li><a href="${sitePath('links.html')}">外部资源</a></li>
                        <li><a href="${sitePath('friends.html')}">友链</a></li>
                        <li><a href="${sitePath('features.html')}">能力图谱</a></li>
                        <li><a href="${sitePath('quiz.html')}">知识测验</a></li>
                        <li><a href="${sitePath('site-map.html')}">全部导航</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h3>联系</h3>
                    <ul class="footer-links footer-contact">
                        <li><i class="fas fa-map-marker-alt" aria-hidden="true"></i><span>大连市 · 甘井子区</span></li>
                        <li><a href="mailto:wza-dl@outlook.com"><i class="fas fa-envelope" aria-hidden="true"></i><span>wza-dl@outlook.com</span></a></li>
                        <li><a href="tel:+8613840926806"><i class="fas fa-phone" aria-hidden="true"></i><span>+86 138 4092 6806</span></a></li>
                        <li><a href="${sitePath('contact.html')}"><i class="fas fa-comments" aria-hidden="true"></i><span>留言 / 反馈</span></a></li>
                    </ul>
                </div>
            </div>

            <div class="copyright">
                <p>© 2026 WZA Leon · 创想日志</p>
                <p>保持好奇，保持创作 · <a href="${sitePath('site-map.html')}">整站地图</a></p>
            </div>
        </div>
    </footer>
    `;
}

function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    if (!mobileMenuBtn || !navLinks) return;

    const icon = mobileMenuBtn.querySelector('i');

    function setOpen(open) {
        navLinks.classList.toggle('active', open);
        document.body.classList.toggle('nav-open', open);
        mobileMenuBtn.setAttribute('aria-expanded', String(open));
        if (!icon) return;
        icon.classList.toggle('fa-bars', !open);
        icon.classList.toggle('fa-times', open);
    }

    mobileMenuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        setOpen(!navLinks.classList.contains('active'));
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('click', (event) => {
        if (!navLinks.classList.contains('active')) return;
        if (!(event.target instanceof Element)) return;
        if (event.target.closest('#main-nav')) return;
        setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !navLinks.classList.contains('active')) return;
        setOpen(false);
        mobileMenuBtn.focus();
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) setOpen(false);
    }, { passive: true });

    window.addEventListener('pageshow', () => setOpen(false));
}

function initSmoothScroll() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: reduceMotion ? 'auto' : 'smooth'
                });
            }
        });
    });
}

/* ---------- 导航状态与当前页面高亮 ---------- */
function initNavState() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    const updateShadow = () => {
        nav.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    updateShadow();
    window.addEventListener('scroll', updateShadow, { passive: true });

    const normalizePath = path => path.replace(/\/index\.html$/, '/');
    const current = new URL(window.location.href);
    const currentPath = normalizePath(current.pathname);
    const isBlogPage = /\/blog\.html$/.test(current.pathname) ||
        /\/post\.html$/.test(current.pathname) ||
        /\/blog-data\//.test(current.pathname);
    const isProjectPage = /\/project\.html$/.test(current.pathname);

    nav.querySelectorAll('.nav-links a').forEach(link => {
        const target = new URL(link.href, window.location.href);
        const targetPath = normalizePath(target.pathname);
        const samePage = targetPath === currentPath;
        const isBlogLink = /\/blog\.html$/.test(target.pathname);
        const isProjectLink = /\/projects\.html$/.test(target.pathname);
        if (samePage || (isBlogPage && isBlogLink) || (isProjectPage && isProjectLink)) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}

/* ---------- 滚动进入视口的揭示动画 ---------- */
function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const selector = [
        '.section-title',
        '.about-text',
        '.feature-card',
        '.contact-card',
        '.project-card',
        '.friend-card',
        '.blog-card',
        '.photo-card',
        '.work-card',
        '.photo-category-header',
        '.link-category',
        '.info-item',
        '.timeline-item',
        '.skill',
        '.site-map-card',
        '.card',
        '.question',
        '.result',
        '.category-tabs',
        '.category-card',
        '.quiz-category-section h2',
        '.post-header',
        '.post-content'
    ].join(',');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const element = entry.target;
            element.classList.add('is-visible');
            observer.unobserve(element);

            // 动画结束后移除 reveal 类，恢复卡片自身的 hover 过渡。
            let timer = 0;
            function finish() {
                element.removeEventListener('transitionend', onEnd);
                window.clearTimeout(timer);
                element.classList.remove('reveal', 'is-visible');
                element.style.removeProperty('--reveal-delay');
            }
            function onEnd(event) {
                if (event.target !== element || event.propertyName !== 'opacity') return;
                finish();
            }
            timer = window.setTimeout(finish, 1200);
            element.addEventListener('transitionend', onEnd);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

    function prepare(element) {
        if (!(element instanceof Element)) return;
        if (element.dataset.revealReady === 'true') return;
        element.dataset.revealReady = 'true';

        const rect = element.getBoundingClientRect();
        // 首屏内已可见的元素不再隐藏，避免加载时闪烁。
        if (rect.top < window.innerHeight * 0.92) return;

        const siblings = element.parentElement
            ? Array.from(element.parentElement.children).filter(child => child.matches(selector))
            : [element];
        const index = Math.max(0, siblings.indexOf(element));
        element.style.setProperty('--reveal-delay', `${Math.min(index, 6) * 45}ms`);

        element.classList.add('reveal');
        observer.observe(element);
    }

    document.querySelectorAll(selector).forEach(prepare);

    const mutationObserver = new MutationObserver(records => {
        records.forEach(record => {
            record.addedNodes.forEach(node => {
                if (!(node instanceof Element)) return;
                if (node.matches(selector)) prepare(node);
                node.querySelectorAll(selector).forEach(prepare);
            });
        });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
}

/* ---------- 文章图片：自适应宽度、悬停高光与点击放大 ---------- */
function wrapContentImages() {
    document.querySelectorAll('.post-content img, .markdown-content img').forEach((img) => {
        if (img.closest('.image-frame') || img.closest('pre')) return;
        const frame = document.createElement('span');
        frame.className = 'image-frame';
        img.parentNode.insertBefore(frame, img);
        frame.appendChild(img);
    });
}

let imageWrapQueued = false;
function scheduleWrapContentImages() {
    if (imageWrapQueued) return;
    imageWrapQueued = true;
    requestAnimationFrame(() => {
        imageWrapQueued = false;
        wrapContentImages();
    });
}

function initContentImageWrapping() {
    wrapContentImages();
    const observer = new MutationObserver(scheduleWrapContentImages);
    observer.observe(document.body, { childList: true, subtree: true });
}

function initContentImageLightbox() {
    let lightbox = null;
    let previousBodyOverflow = '';

    function getLightbox() {
        if (lightbox) return lightbox;
        lightbox = document.createElement('div');
        lightbox.className = 'image-lightbox';
        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-modal', 'true');
        lightbox.setAttribute('aria-label', '图片预览');
        lightbox.innerHTML = `
            <button class="image-lightbox-close" type="button" aria-label="关闭">×</button>
            <img class="image-lightbox-img" src="" alt="">
        `;
        document.body.appendChild(lightbox);
        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox ||
                event.target.closest('.image-lightbox-close')) {
                closeLightbox();
            }
        });
        return lightbox;
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('show');
        document.body.style.overflow = previousBodyOverflow;
    }

    document.addEventListener('click', (event) => {
        const image = event.target.closest('.post-content img, .markdown-content img');
        if (!image) return;
        event.preventDefault();
        const box = getLightbox();
        const preview = box.querySelector('.image-lightbox-img');
        preview.src = image.currentSrc || image.src;
        preview.alt = image.alt || '';
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => box.classList.add('show'));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeLightbox();
    });
}

window.addEventListener('DOMContentLoaded', () => {
    // 如果页面中没有导航，则注入
    if (!document.querySelector('#main-nav')) {
        const placeholder = document.getElementById('nav-placeholder');
        if (placeholder) {
            placeholder.outerHTML = buildNavHTML();
        } else {
            document.body.insertAdjacentHTML('afterbegin', buildNavHTML());
        }
    }

    // 如果页面中没有任何 footer，则注入（避免重复页脚）
    if (!document.querySelector('footer')) {
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.outerHTML = buildFooterHTML();
        } else {
            document.body.insertAdjacentHTML('beforeend', buildFooterHTML());
        }
    }

    // 初始化交互
    initMobileMenu();
    initSmoothScroll();
    initThemeToggle();
    initNavState();
    initContentImageWrapping();
    initContentImageLightbox();
    initScrollReveal();
    // 页面特定模块由各页面自己的JS负责初始化
});
