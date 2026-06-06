// 在页面加载后注入导航栏和页脚，并初始化交互
function buildNavHTML() {
    return `
    <nav id="main-nav" class="site-nav">
        <div class="container nav-container">
            <a class="brand" href="index.html">
                <img src="images/photo.png" alt="avatar" class="nav-avatar">
                <span>WZA · Leon</span>
            </a>
            <div id="navLinks" class="nav-links">
                <a href="index.html">首页</a>
                <a href="features.html">探索</a>
                <a href="projects.html">项目</a>
                <a href="gallery.html">摄影</a>
                <a href="blog.html">博客</a>
                <a href="about.html">关于</a>
                <a href="contact.html">联系</a>
                <a href="quiz.html">测验</a>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
                <button id="themeToggle" class="theme-btn" title="切换主题">🌈</button>
                <button id="mobileMenuBtn" class="mobile-menu" aria-label="菜单">
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
    document.body.classList.remove(...THEMES.map(t=>`theme-${t}`));
    if (THEMES.includes(name)) document.body.classList.add(`theme-${name}`);
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
    const saved = (localStorage.getItem('site-theme')) || 'dark';
    applyTheme(saved);
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const current = THEMES.find(t=>document.body.classList.contains(`theme-${t}`)) || 'dark';
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
                        <li><a href="index.html">首页</a></li>
                        <li><a href="features.html">探索</a></li>
                        <li><a href="about.html">关于WZA</a></li>
                        <li><a href="projects.html">项目</a></li>
                        <li><a href="contact.html">联系我们</a></li>
                    </ul>
                </div>
                
                <div class="footer-column">
                    <h3>兴趣领域</h3>
                    <ul class="footer-links">
                        <li><a href="#">阅读</a></li>
                        <li><a href="#">旅游</a></li>
                        <li><a href="#">音乐</a></li>
                        <li><a href="projects.html">编程</a></li>
                        <li><a href="gallery.html">摄影</a></li>
                        <li><a href="#">游戏</a></li>
                    </ul>
                </div>
                
                <div class="footer-column">
                    <h3>联系 WZA</h3>
                    <ul class="footer-links">
                        <li><i class="fas fa-map-marker-alt"></i> 大连 · 甘井子区</li>
                        <li><i class="fas fa-phone"></i> +86 130 1942 8653</li>
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

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
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

    // 页面淡入
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
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
    const top = await fetchJSON('./images/photograph/index.json');
    const categories = top?.categories || top || [];
    if (!Array.isArray(categories) || categories.length === 0) {
        root.innerHTML = '<p class="error">无法加载作品索引。</p>';
        return;
    }

    for (const cat of categories) {
        const folder = typeof cat === 'string' ? cat : (cat.folder || cat.name || '');
        if (!folder) continue;

        const catPath = `./images/photograph/${folder}`;
        const catIndex = await fetchJSON(`${catPath}/index.json`);
        if (!catIndex) continue;

        const categoryName = catIndex.name || folder;
        const categoryDesc = catIndex.description || catIndex.summary || '';
        const categoryCover = catIndex.cover ? resolveImagePath(catPath, catIndex.cover) : 'images/photo.png';
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
            const cover = coverRel ? resolveImagePath(workPath, coverRel) : 'images/photo.png';

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

async function initProjectGallery() {
    const root = document.getElementById('project-root');
    root.innerHTML = '';
    const top = await fetchJSON('./project-data/index.json');
    const projects = Array.isArray(top?.projects) ? top.projects : top || [];
    if (!Array.isArray(projects) || projects.length === 0) {
        root.innerHTML = '<p class="error">无法加载项目索引。</p>';
        return;
    }

    for (const item of projects) {
        const folder = typeof item === 'string' ? item : (item.folder || item.title || '');
        if (!folder) continue;

        const projectPath = `./project-data/${folder}`;
        const projectIndex = await fetchJSON(`${projectPath}/index.json`);
        if (!projectIndex) continue;

        const title = projectIndex.title || projectIndex.name || folder;
        const description = projectIndex.description || projectIndex.intro || '';
        const url = projectIndex.url || projectIndex.link || '';
        const markdown = projectIndex.markdown || projectIndex.readme || 'README.md';

        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="project-content">
                <h3>${title}</h3>
                <p>${description}</p>
                <div class="project-links">
                    ${url ? `<a href="${url}" target="_blank" rel="noopener" class="btn btn-small">访问网址</a>` : ''}
                    <a href="${projectPath}/${markdown}" target="_blank" rel="noopener" class="btn btn-small btn-accent">查看文档</a>
                </div>
            </div>
        `;
        root.appendChild(card);
    }
}