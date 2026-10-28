// 摄影作品模块
// 数据：images/photograph/index.json → <分类>/index.json → <作品>/index.json
// 功能：分类筛选、作品卡片、支持键盘与多图切换的查看器
(function () {
    'use strict';

    const GALLERY_ROOT = new URL('./images/photograph/', document.baseURI);
    const PLACEHOLDER_IMAGE = new URL('./images/placeholder.svg', document.baseURI).href;
    const ALL_CATEGORY = '__all__';

    const state = {
        categories: [],
        photos: [],
        activeCategory: ALL_CATEGORY,
        activePhoto: null,
        imageIndex: 0,
        returnFocus: null,
        previousOverflow: ''
    };

    const dom = {};

    document.addEventListener('DOMContentLoaded', () => {
        dom.grid = document.getElementById('photograph-root');
        dom.filter = document.getElementById('galleryCategories');
        dom.status = document.getElementById('galleryStatus');

        if (!dom.grid || !dom.filter) return;

        dom.grid.setAttribute('aria-busy', 'true');

        const ready = initGallery().catch((error) => {
            console.error('[gallery] 初始化失败：', error);
            renderMessage('作品加载失败，请刷新页面重试。');
            setStatus('作品加载失败');
        });

        if (window.SiteLoader) {
            window.SiteLoader.waitFor(
                ready.then(() => window.SiteLoader.waitForImages(dom.grid))
            );
        }
    });

    async function initGallery() {
        try {
            const catalog = await loadCatalog();
            state.categories = catalog.categories;
            state.photos = catalog.photos;

            bindModal();

            if (!state.categories.length) {
                setFilterVisible(false);
                renderMessage('摄影作品正在整理中，敬请期待。');
                setStatus('暂无作品');
                return;
            }

            renderFilters();
            renderPhotos();
        } finally {
            dom.grid.removeAttribute('aria-busy');
        }
    }

    /* ---------- 读取索引 ---------- */

    async function loadCatalog() {
        const rootIndex = await fetchJSON(new URL('index.json', GALLERY_ROOT));
        const declared = Array.isArray(rootIndex)
            ? rootIndex
            : (rootIndex && Array.isArray(rootIndex.categories) ? rootIndex.categories : []);

        const seen = new Set();
        const entries = [];

        declared.forEach((item) => {
            const entry = normalizeCategoryEntry(item);
            if (!entry || seen.has(entry.folder)) return;
            seen.add(entry.folder);
            entries.push(entry);
        });

        const loaded = await Promise.all(entries.map((entry) => loadCategory(entry)));
        const categories = [];
        const photos = [];

        loaded.forEach((result) => {
            if (!result) return;
            categories.push(result.category);
            photos.push(...result.photos);
        });

        return { categories, photos };
    }

    function normalizeCategoryEntry(item) {
        if (typeof item === 'string') {
            const folder = item.trim();
            return folder ? { folder, name: '' } : null;
        }
        if (!item || typeof item !== 'object') return null;

        const folder = firstString(item.folder, item.id, item.slug, item.path, item.dir);
        if (!folder) return null;
        return { folder, name: firstString(item.name, item.title) };
    }

    async function loadCategory(entry) {
        const base = childBase(GALLERY_ROOT, entry.folder);
        const index = await fetchJSON(new URL('index.json', base));

        if (!index) {
            console.warn('[gallery] 分类索引缺失：', base.href);
            return null;
        }

        const category = {
            key: entry.folder,
            name: firstString(index.name, entry.name, entry.folder),
            cover: resolveAsset(base, index.cover),
            works: Array.isArray(index.works) ? index.works : []
        };

        const photos = await Promise.all(
            category.works.map((work) => loadWork(base, category, work))
        );

        return {
            category,
            photos: photos.filter(Boolean)
        };
    }

    async function loadWork(categoryBase, category, entry) {
        const ref = entry && typeof entry === 'object' ? entry : { folder: entry };
        const folder = firstString(ref.folder, ref.id, ref.slug, ref.path, ref.dir);
        if (!folder) return null;

        const base = childBase(categoryBase, folder);
        const index = (await fetchJSON(new URL('index.json', base))) || {};

        const hasData = index.title || index.cover || Array.isArray(index.images) ||
            ref.title || ref.cover || Array.isArray(ref.images);

        if (!hasData) {
            console.warn('[gallery] 作品索引缺失：', base.href);
            return null;
        }

        const images = normalizeImages(index.images || ref.images, base);
        const cover = resolveAsset(base, index.cover || ref.cover) ||
            (images[0] && images[0].src) ||
            category.cover ||
            '';

        return {
            id: `${category.key}/${folder}`,
            title: firstString(index.title, ref.title, ref.name, folder),
            description: firstString(index.description, ref.description),
            date: firstString(index.date, ref.date),
            categoryKey: category.key,
            categoryName: category.name,
            cover,
            images: images.length ? images : (cover ? [{ src: cover, caption: '' }] : [])
        };
    }

    function normalizeImages(list, base) {
        if (!Array.isArray(list)) return [];

        return list.map((item) => {
            if (typeof item === 'string') {
                const src = resolveAsset(base, item);
                return src ? { src, caption: '' } : null;
            }
            if (!item || typeof item !== 'object') return null;

            const src = resolveAsset(base, firstString(item.filename, item.src, item.file, item.path));
            if (!src) return null;

            return {
                src,
                caption: firstString(item.caption, item.title, item.alt)
            };
        }).filter(Boolean);
    }

    /* ---------- 渲染分类与作品 ---------- */

    function renderFilters() {
        const items = [{ key: ALL_CATEGORY, label: '全部' }].concat(
            state.categories.map((category) => ({ key: category.key, label: category.name }))
        );

        dom.filter.textContent = '';

        items.forEach((item) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'category-btn';
            button.dataset.key = item.key;
            button.textContent = item.label;
            button.setAttribute('aria-pressed', String(item.key === state.activeCategory));
            if (item.key === state.activeCategory) button.classList.add('active');
            button.addEventListener('click', () => selectCategory(item.key));
            dom.filter.appendChild(button);
        });
    }

    function selectCategory(key) {
        if (key === state.activeCategory) return;

        state.activeCategory = key;
        dom.filter.querySelectorAll('.category-btn').forEach((button) => {
            const active = button.dataset.key === key;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        renderPhotos();
    }

    function renderPhotos() {
        const photos = visiblePhotos();

        if (!photos.length) {
            renderMessage(state.photos.length
                ? `「${categoryLabel(state.activeCategory)}」分类下还没有作品。`
                : '摄影作品正在整理中，敬请期待。');
            setStatus(state.photos.length ? '当前分类暂无作品' : '暂无作品');
            return;
        }

        dom.grid.textContent = '';

        const fragment = document.createDocumentFragment();
        photos.forEach((photo) => fragment.appendChild(createPhotoCard(photo)));
        dom.grid.appendChild(fragment);

        setStatus(state.activeCategory === ALL_CATEGORY
            ? `共 ${photos.length} 件作品`
            : `「${categoryLabel(state.activeCategory)}」共 ${photos.length} 件作品`);
    }

    function createPhotoCard(photo) {
        const card = document.createElement('article');
        card.className = 'photo-card';

        const imageWrap = document.createElement('div');
        imageWrap.className = 'photo-image';
        if (!photo.cover) imageWrap.classList.add('is-missing');

        const image = document.createElement('img');
        image.src = photo.cover || PLACEHOLDER_IMAGE;
        image.alt = photo.title;
        image.loading = 'lazy';
        image.decoding = 'async';
        image.addEventListener('error', () => {
            if (image.src === PLACEHOLDER_IMAGE) return;
            image.src = PLACEHOLDER_IMAGE;
            imageWrap.classList.add('is-missing');
        });
        imageWrap.appendChild(image);

        const missing = document.createElement('span');
        missing.className = 'photo-missing';
        missing.textContent = '图片待补充';
        imageWrap.appendChild(missing);

        const overlay = document.createElement('div');
        overlay.className = 'photo-overlay';
        overlay.setAttribute('aria-hidden', 'true');

        const icon = document.createElement('span');
        icon.className = 'photo-btn';
        icon.innerHTML = '<i class="fas fa-search-plus"></i>';
        overlay.appendChild(icon);
        imageWrap.appendChild(overlay);

        const info = document.createElement('div');
        info.className = 'photo-info';

        const title = document.createElement('h3');
        title.textContent = photo.title;
        info.appendChild(title);

        if (photo.description) {
            const description = document.createElement('p');
            description.className = 'photo-desc';
            description.textContent = photo.description;
            info.appendChild(description);
        }

        const meta = document.createElement('div');
        meta.className = 'photo-meta';

        const badge = document.createElement('span');
        badge.className = 'category-badge';
        badge.textContent = photo.categoryName;
        meta.appendChild(badge);

        if (photo.date) {
            const date = document.createElement('span');
            date.className = 'date';
            date.textContent = photo.date;
            meta.appendChild(date);
        }

        info.appendChild(meta);

        // 透明按钮铺满整张卡片：整卡可点，同时保留原生键盘操作。
        const openButton = document.createElement('button');
        openButton.type = 'button';
        openButton.className = 'photo-open';
        openButton.setAttribute('aria-label', `查看作品：${photo.title}`);
        openButton.addEventListener('click', () => openPhotoModal(photo));

        card.appendChild(imageWrap);
        card.appendChild(info);
        card.appendChild(openButton);

        return card;
    }

    function renderMessage(text) {
        dom.grid.textContent = '';

        const message = document.createElement('p');
        message.className = 'gallery-empty';
        message.textContent = text;
        dom.grid.appendChild(message);
    }

    function setStatus(text) {
        if (!dom.status) return;
        dom.status.textContent = text;
    }

    function setFilterVisible(visible) {
        const section = dom.filter.closest('.gallery-category-section');
        if (section) section.hidden = !visible;
    }

    function visiblePhotos() {
        if (state.activeCategory === ALL_CATEGORY) return state.photos;
        return state.photos.filter((photo) => photo.categoryKey === state.activeCategory);
    }

    function categoryLabel(key) {
        const category = state.categories.find((item) => item.key === key);
        return category ? category.name : key;
    }

    /* ---------- 查看器 ---------- */

    function bindModal() {
        dom.modal = document.getElementById('photoModal');
        if (!dom.modal) return;

        dom.modalImage = document.getElementById('photoModalImg');
        dom.modalTitle = document.getElementById('photoTitle');
        dom.modalDescription = document.getElementById('photoDesc');
        dom.modalShotCaption = document.getElementById('photoShotCaption');
        dom.modalCounter = document.getElementById('photoCounter');
        dom.modalClose = dom.modal.querySelector('.photo-close');
        dom.modalPrev = dom.modal.querySelector('.photo-prev');
        dom.modalNext = dom.modal.querySelector('.photo-next');

        if (!dom.modalImage || !dom.modalTitle) return;

        if (dom.modalClose) dom.modalClose.addEventListener('click', closePhotoModal);
        if (dom.modalPrev) dom.modalPrev.addEventListener('click', () => stepImage(-1));
        if (dom.modalNext) dom.modalNext.addEventListener('click', () => stepImage(1));

        dom.modal.addEventListener('click', (event) => {
            if (event.target === dom.modal) closePhotoModal();
        });

        dom.modalImage.addEventListener('error', () => {
            if (dom.modalImage.src !== PLACEHOLDER_IMAGE) {
                dom.modalImage.src = PLACEHOLDER_IMAGE;
            }
        });

        document.addEventListener('keydown', onModalKeydown);
    }

    function openPhotoModal(photo) {
        if (!dom.modal || !photo) return;

        state.activePhoto = photo;
        state.imageIndex = 0;
        state.returnFocus = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

        renderModalImage();

        state.previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        dom.modal.classList.add('show');
        dom.modal.setAttribute('aria-hidden', 'false');

        if (dom.modalClose) dom.modalClose.focus();
    }

    function renderModalImage() {
        const photo = state.activePhoto;
        if (!photo || !dom.modalImage) return;

        const images = photo.images && photo.images.length
            ? photo.images
            : [{ src: photo.cover || PLACEHOLDER_IMAGE, caption: '' }];

        state.imageIndex = Math.min(Math.max(state.imageIndex, 0), images.length - 1);
        const image = images[state.imageIndex];
        const hasMultiple = images.length > 1;

        dom.modalImage.src = image.src || PLACEHOLDER_IMAGE;
        dom.modalImage.alt = image.caption || photo.title;

        dom.modalTitle.textContent = photo.title;

        if (dom.modalDescription) {
            dom.modalDescription.textContent = photo.description || '';
            dom.modalDescription.hidden = !photo.description;
        }

        if (dom.modalShotCaption) {
            const caption = image.caption && image.caption !== photo.title ? image.caption : '';
            dom.modalShotCaption.textContent = caption;
            dom.modalShotCaption.hidden = !caption;
        }

        if (dom.modalCounter) {
            dom.modalCounter.textContent = hasMultiple ? `${state.imageIndex + 1} / ${images.length}` : '';
            dom.modalCounter.hidden = !hasMultiple;
        }

        if (dom.modalPrev) dom.modalPrev.hidden = !hasMultiple;
        if (dom.modalNext) dom.modalNext.hidden = !hasMultiple;
    }

    function stepImage(delta) {
        const photo = state.activePhoto;
        if (!photo) return;

        const count = photo.images && photo.images.length ? photo.images.length : 1;
        if (count < 2) return;

        state.imageIndex = (state.imageIndex + delta + count) % count;
        renderModalImage();
    }

    function closePhotoModal() {
        if (!dom.modal || !dom.modal.classList.contains('show')) return;

        dom.modal.classList.remove('show');
        dom.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = state.previousOverflow;
        state.activePhoto = null;

        const target = state.returnFocus;
        state.returnFocus = null;
        if (target && document.contains(target) && typeof target.focus === 'function') {
            target.focus();
        }
    }

    function onModalKeydown(event) {
        if (!dom.modal || !dom.modal.classList.contains('show')) return;

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                closePhotoModal();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                stepImage(-1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                stepImage(1);
                break;
            case 'Tab':
                trapFocus(event);
                break;
            default:
                break;
        }
    }

    function trapFocus(event) {
        const focusable = Array.from(dom.modal.querySelectorAll('button:not([hidden])'))
            .filter((element) => !element.disabled);

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    /* ---------- 工具函数 ---------- */

    async function fetchJSON(url) {
        try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('[gallery] 读取失败：', String(url), error);
            return null;
        }
    }

    function childBase(parent, relative) {
        const path = String(relative)
            .split('/')
            .filter(Boolean)
            .map((segment) => encodeURIComponent(segment))
            .join('/');

        return new URL(`${path}/`, parent);
    }

    function resolveAsset(base, relative) {
        const raw = firstString(relative);
        if (!raw) return '';

        if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(raw)) return raw;

        try {
            return new URL(raw, base).href;
        } catch (error) {
            return '';
        }
    }

    function firstString(...values) {
        for (const value of values) {
            if (typeof value === 'string' && value.trim()) return value.trim();
        }
        return '';
    }
})();
