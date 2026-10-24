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
    <nav id="main-nav" class="site-nav">
        <div class="container nav-container">
            <a class="brand" href="${sitePath('index.html')}">
                <img src="${sitePath('images/photo.png')}" alt="avatar" class="nav-avatar">
                <span>WZA · Leon</span>
            </a>
            <div id="navLinks" class="nav-links">
                <a href="${sitePath('index.html')}">首页</a>
                <a href="${sitePath('resources.html')}">云盘</a>
                <a href="${sitePath('projects.html')}">项目</a>
                <a href="${sitePath('gallery.html')}">摄影</a>
                <a href="${sitePath('blog.html')}">博客</a>
                <a href="${sitePath('friends.html')}">友链</a>
                <a href="${sitePath('about.html')}">关于</a>
                <a href="${sitePath('contact.html')}">联系</a>
                <a href="${sitePath('quiz.html')}">测验</a>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
                <button id="themeToggle" class="theme-btn" title="切换主题">🌈</button>
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
                <div class="footer-column">
                    <h3>WZA Leon · 创想日志</h3>
                    <p style="margin-top: 8px; color: #ccc;">中学生 · 跨学科创作者</p>
                    <div class="social-icons">
                        <a href="#"><i class="fab fa-github"></i></a>
                        <a href="#"><i class="fab fa-bilibili"></i></a>
                        <a href="#"><i class="fab fa-instagram"></i></a>
                        <a href="#"><i class="fas fa-envelope"></i></a>
                    </div>
                </div>
                
                <div class="footer-column">
                    <h3>快速链接</h3>
                    <ul class="footer-links">
                        <li><a href="${sitePath('index.html')}">首页</a></li>
                        <li><a href="${sitePath('resources.html')}">云盘</a></li>
                        <li><a href="${sitePath('about.html')}">关于WZA</a></li>
                        <li><a href="${sitePath('projects.html')}">项目</a></li>
                        <li><a href="${sitePath('friends.html')}">友链</a></li>
                        <li><a href="${sitePath('contact.html')}">联系我们</a></li>
                    </ul>
                </div>
                
                <div class="footer-column">
                    <h3>兴趣领域</h3>
                    <ul class="footer-links">
                        <li><a href="#">阅读</a></li>
                        <li><a href="#">旅游</a></li>
                        <li><a href="#">音乐</a></li>
                        <li><a href="${sitePath('projects.html')}">编程</a></li>
                        <li><a href="${sitePath('gallery.html')}">摄影</a></li>
                        <li><a href="#">游戏</a></li>
                    </ul>
                </div>
                
                <div class="footer-column">
                    <h3>联系 WZA</h3>
                    <ul class="footer-links">
                        <li><i class="fas fa-map-marker-alt"></i> 大连市 · 甘井子区</li>
                        <li><i class="fas fa-phone"></i> +86 138 4092 6806</li>
                        <li><i class="fas fa-envelope"></i> wza-dl@outlook.com</li>
                        <li><i class="fas fa-clock"></i> 每周日 19:30 更新</li>
                    </ul>
                </div>
            </div>
            
            <div class="copyright">
                <p>© 2026 WZA Leon · 创想日志 | 保持好奇，保持创作 | wza-leon.top</p>
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

/* ---------- 摄影画廊动态生成与查看器 ---------- */
async function fetchJSON(path) {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
    } catch (e) {
        console.warn('fetchJSON failed:', path, e);
        return null;
    }
}

async function initPhotoGallery() {
    const root = document.getElementById('photograph-root');
    root.innerHTML = '';
    const top = await fetchJSON(sitePath('images/photograph/index.json'));
    const categories = top?.categories || top || [];
    if (!Array.isArray(categories) || categories.length === 0) {
        root.innerHTML = '<p class="error">无法加载作品索引。</p>';
        return;
    }

    for (const cat of categories) {
        const folder = typeof cat === 'string' ? cat : (cat.folder || cat.name || '');
        if (!folder) continue;

        const catPath = sitePath(`images/photograph/${folder}`);
        const catIndex = await fetchJSON(`${catPath}/index.json`);
        if (!catIndex) continue;

        const categoryName = catIndex.name || folder;
        const categoryDesc = catIndex.description || catIndex.summary || '';
        const categoryCover = catIndex.cover ? resolveImagePath(catPath, catIndex.cover) : sitePath('images/photo.png');
        const works = Array.isArray(catIndex.works) ? catIndex.works : [];

        const catEl = document.createElement('div');
        catEl.className = 'photo-category';
        catEl.innerHTML = `
            <div class="photo-category-header">
                <div class="category-cover"><img src="${categoryCover}" alt="${categoryName}"></div>
                <div class="category-text">
                    <h3>${categoryName}</h3>
                    <p>${categoryDesc}</p>
                </div>
            </div>
            <div class="category-grid"></div>
        `;
        const grid = catEl.querySelector('.category-grid');

        for (const work of works) {
            const workFolder = typeof work === 'string' ? work : (work.folder || work.title || '');
            if (!workFolder) continue;

            const workPath = `${catPath}/${workFolder}`;
            const workIndex = await fetchJSON(`${workPath}/index.json`);
            const title = workIndex?.title || work.title || workFolder;
            const desc = workIndex?.description || work.description || '';
            const coverRel = workIndex?.cover || work.cover || '';
            const cover = coverRel ? resolveImagePath(workPath, coverRel) : sitePath('images/photo.png');

            const card = document.createElement('div');
            card.className = 'work-card';
            card.innerHTML = `
                <div class="work-cover"><img src="${cover}" alt="${title}"></div>
                <div class="work-info"><h4>${title}</h4><p>${desc}</p></div>
            `;

            card.addEventListener('click', () => {
                openViewer(workPath, workIndex || { title, description: desc, cover: coverRel });
            });
            grid.appendChild(card);
        }

        root.appendChild(catEl);
    }
}

function resolveImagePath(base, relative) {
    if (!relative) return '';
    if (/^(https?:)?\/\//.test(relative) || relative.startsWith('/')) {
        return relative;
    }
    return `${base}/${relative}`;
}

function ensureViewer() {
    let v = document.getElementById('photo-viewer');
    if (v) return v;
    v = document.createElement('div');
    v.id = 'photo-viewer';
    v.className = 'photo-viewer';
    v.innerHTML = `
        <div class="viewer-inner">
            <div class="viewer-image-wrap"><img class="viewer-image" src="" alt=""></div>
            <div class="viewer-meta"><h3></h3><p class="desc"></p></div>
            <button class="viewer-close" aria-label="关闭">✕</button>
        </div>
    `;
    document.body.appendChild(v);
    v.querySelector('.viewer-close').addEventListener('click', closeViewer);
    v.addEventListener('click', (e)=>{
        if (e.target === v) closeViewer();
    });
    const img = v.querySelector('.viewer-image');
    img.addEventListener('click', ()=> img.classList.toggle('zoomed'));
    return v;
}

function openViewer(catPath, workFolder, workIndex) {
    const v = ensureViewer();
    const innerImg = v.querySelector('.viewer-image');
    const metaTitle = v.querySelector('.viewer-meta h3');
    const metaDesc = v.querySelector('.viewer-meta .desc');

    // 如果 workIndex 为 null，尝试加载
    const idxPromise = workIndex ? Promise.resolve(workIndex) : fetchJSON(`${catPath}/${workFolder}/index.json`);
    idxPromise.then(idx => {
        if (!idx) {
            metaTitle.textContent = '无法加载作品';
            metaDesc.textContent = '';
            innerImg.src = '';
        } else {
            metaTitle.textContent = idx.title || workFolder;
            metaDesc.textContent = idx.description || '';
            const first = Array.isArray(idx.images) && idx.images.length > 0 ? idx.images[0].filename : (idx.cover || '');
            const imgPath = first ? resolveImagePath(`${catPath}/${workFolder}`, first) : '';
            innerImg.src = imgPath;
            innerImg.alt = idx.title || '';
            innerImg.classList.remove('zoomed');
        }
        v.classList.add('show');
    });
}

function closeViewer() {
    const v = document.getElementById('photo-viewer');
    if (v) v.classList.remove('show');
}