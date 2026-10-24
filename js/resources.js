// 云盘分享列表：分类筛选、搜索、复制链接与提取码
(function () {
    'use strict';

    const grid = document.getElementById('shareGrid');
    const filterBar = document.getElementById('shareCategories');
    const searchInput = document.getElementById('shareSearch');
    const toolbar = document.getElementById('shareToolbar');
    const toast = document.getElementById('shareToast');
    if (!grid) return;

    const shares = (Array.isArray(window.SHARES_LIST) ? window.SHARES_LIST.slice() : [])
        .filter(item => item && item.title)
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    const categories = ['全部', ...Array.from(new Set(
        shares.map(item => item.category).filter(Boolean)
    ))];

    let currentCategory = '全部';
    let query = '';

    const PLATFORM_META = {
        baidu: { name: '百度网盘', icon: 'fas fa-cloud' },
        aliyun: { name: '阿里云盘', icon: 'fas fa-cloud' },
        quark: { name: '夸克网盘', icon: 'fas fa-bolt' },
        pan123: { name: '123 云盘', icon: 'fas fa-box' },
        lanzou: { name: '蓝奏云', icon: 'fas fa-wind' },
        onedrive: { name: 'OneDrive', icon: 'fas fa-cloud' },
        gdrive: { name: 'Google Drive', icon: 'fab fa-google-drive' },
        mega: { name: 'MEGA', icon: 'fas fa-hard-drive' },
        other: { name: '其他网盘', icon: 'fas fa-link' }
    };

    const STATUS_META = {
        active: { label: '可用', className: 'is-active' },
        expired: { label: '已失效', className: 'is-expired' },
        planned: { label: '整理中', className: 'is-planned' }
    };

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[character]));
    }

    function safeUrl(value) {
        if (!value) return '';
        try {
            const url = new URL(value, window.location.href);
            return /^https?:$/.test(url.protocol) ? url.href : '';
        } catch (error) {
            return '';
        }
    }

    function formatDate(value) {
        if (!value) return '';
        const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function platformOf(item) {
        const key = String(item.platform || 'other').toLowerCase();
        const meta = PLATFORM_META[key] || PLATFORM_META.other;
        return {
            key: PLATFORM_META[key] ? key : 'other',
            name: meta.name,
            icon: meta.icon
        };
    }

    function statusOf(item) {
        let key = String(item.status || '').toLowerCase();
        if (!STATUS_META[key]) key = safeUrl(item.url) ? 'active' : 'planned';
        if (key === 'active' && !safeUrl(item.url)) key = 'planned';
        const meta = STATUS_META[key];
        return { key, label: meta.label, className: meta.className };
    }

    function matchesQuery(item) {
        if (!query) return true;
        const platform = platformOf(item);
        const haystack = [
            item.title,
            item.description,
            item.category,
            item.note,
            platform.name,
            ...(Array.isArray(item.tags) ? item.tags : []),
            ...(Array.isArray(item.files) ? item.files : [])
        ].join(' ').toLowerCase();
        return haystack.includes(query.toLowerCase());
    }

    function renderFilters() {
        if (!filterBar) return;
        filterBar.innerHTML = categories.map(category => {
            const count = category === '全部'
                ? shares.length
                : shares.filter(item => item.category === category).length;
            return `
                <button type="button" class="share-filter${category === currentCategory ? ' is-active' : ''}" data-category="${escapeHtml(category)}">
                    ${escapeHtml(category)}<span>${count}</span>
                </button>
            `;
        }).join('');
    }

    function renderFiles(item) {
        const files = Array.isArray(item.files) ? item.files.filter(Boolean) : [];
        if (!files.length) return '';

        const visible = files.slice(0, 4);
        const rest = files.length - visible.length;
        return `
            <ul class="share-files">
                ${visible.map(file => `<li><i class="fas fa-file-lines" aria-hidden="true"></i><span>${escapeHtml(file)}</span></li>`).join('')}
                ${rest > 0 ? `<li class="share-file-more">还有 ${rest} 个文件…</li>` : ''}
            </ul>
        `;
    }

    function renderCard(item) {
        const platform = platformOf(item);
        const status = statusOf(item);
        const url = safeUrl(item.url);
        const canOpen = Boolean(url) && status.key === 'active';
        const code = item.code ? String(item.code) : '';
        const tags = Array.isArray(item.tags) ? item.tags.filter(Boolean) : [];

        const openAction = canOpen
            ? `<a class="btn btn-small share-open" href="${escapeHtml(url)}" target="_blank" rel="noopener">打开网盘 <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
            : `<button type="button" class="btn btn-small share-open is-disabled" disabled>${status.key === 'expired' ? '链接已失效' : '整理中'}</button>`;
        const copyAction = url
            ? `<button type="button" class="share-copy" data-copy="${escapeHtml(url)}" data-copy-label="链接">复制链接</button>`
            : '';

        return `
            <article class="share-card ${status.className}" data-id="${escapeHtml(item.id || item.title)}">
                <div class="share-card-top">
                    <span class="share-platform" data-platform="${platform.key}">
                        <i class="${platform.icon}" aria-hidden="true"></i> ${platform.name}
                    </span>
                    <span class="share-status ${status.className}">${status.label}</span>
                </div>
                <h3>${escapeHtml(item.title)}</h3>
                <p class="share-desc">${escapeHtml(item.description || '')}</p>
                ${renderFiles(item)}
                ${tags.length ? `<div class="share-tags">${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                <div class="share-meta">
                    ${item.size ? `<span><i class="fas fa-database" aria-hidden="true"></i> ${escapeHtml(item.size)}</span>` : ''}
                    ${item.category ? `<span><i class="fas fa-folder" aria-hidden="true"></i> ${escapeHtml(item.category)}</span>` : ''}
                    ${item.date ? `<span><i class="fas fa-calendar" aria-hidden="true"></i> ${formatDate(item.date)}</span>` : ''}
                </div>
                ${code ? `
                    <div class="share-code">
                        <span class="share-code-label"><i class="fas fa-key" aria-hidden="true"></i> 提取码</span>
                        <code>${escapeHtml(code)}</code>
                        <button type="button" data-copy="${escapeHtml(code)}" data-copy-label="提取码">复制</button>
                    </div>
                ` : ''}
                ${item.note ? `<p class="share-note-line"><i class="fas fa-circle-info" aria-hidden="true"></i>${escapeHtml(item.note)}</p>` : ''}
                <div class="share-actions">
                    ${openAction}
                    ${copyAction}
                </div>
            </article>
        `;
    }

    function emptyState() {
        const filtered = currentCategory !== '全部' || Boolean(query);
        if (!shares.length) {
            return `
                <div class="share-empty">
                    <span class="share-empty-icon"><i class="fas fa-cloud-arrow-up" aria-hidden="true"></i></span>
                    <h3>第一批分享还在整理</h3>
                    <p>正在把学习资料、软件工具和摄影素材整理上网盘。链接准备好后会出现在这里；也可以先去博客看看已经写好的文章。</p>
                    <div class="share-empty-tags">
                        <span>学习资料</span>
                        <span>软件工具</span>
                        <span>摄影素材</span>
                        <span>电子书</span>
                    </div>
                    <div class="share-empty-actions">
                        <a class="btn btn-small" href="blog.html">去博客看文章</a>
                        <a class="btn btn-small btn-accent" href="contact.html">告诉我你想要什么</a>
                    </div>
                </div>
            `;
        }

        return `
            <div class="share-empty">
                <span class="share-empty-icon"><i class="fas fa-magnifying-glass" aria-hidden="true"></i></span>
                <h3>没有匹配的分享</h3>
                <p>${filtered ? '换一个关键词，或者清除筛选再看看。' : '这一页暂时还没有内容。'}</p>
                ${filtered ? '<div class="share-empty-actions"><button type="button" class="btn btn-small" data-reset>清除筛选</button></div>' : ''}
            </div>
        `;
    }

    function renderStats() {
        const count = shares.length;
        const categoryCount = new Set(shares.map(item => item.category).filter(Boolean)).size;
        const latest = shares.map(item => formatDate(item.date)).filter(Boolean).sort().pop() || '';

        const setText = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        setText('statShares', String(count).padStart(2, '0'));
        setText('statCategories', String(categoryCount).padStart(2, '0'));
        setText('statUpdated', latest ? latest.slice(5) : '—');
        setText('shareCountMeta', `${count} 份分享`);
        setText('shareStatusText', count
            ? `共 ${count} 份分享，最近更新于 ${latest}。`
            : '第一批分享正在整理，链接准备好后会出现在这里。');
    }

    function render() {
        const list = shares.filter(item =>
            (currentCategory === '全部' || item.category === currentCategory) &&
            matchesQuery(item)
        );

        grid.innerHTML = list.length
            ? list.map(renderCard).join('')
            : emptyState();

        renderStats();

        if (window.SiteLoader) window.SiteLoader.waitForImages(grid);
    }

    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                // 浏览器拒绝剪贴板权限时，继续尝试兼容方案。
            }
        }

        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.top = '-999px';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();

        let copied = false;
        try {
            copied = document.execCommand('copy');
        } catch (error) {
            copied = false;
        }
        area.remove();
        return copied;
    }

    let toastTimer = 0;
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toast.classList.remove('is-visible');
        }, 2200);
    }

    if (filterBar) {
        filterBar.addEventListener('click', event => {
            const button = event.target.closest('.share-filter');
            if (!button) return;
            currentCategory = button.dataset.category || '全部';
            renderFilters();
            render();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', event => {
            query = event.target.value.trim();
            render();
        });
    }

    grid.addEventListener('click', async event => {
        const reset = event.target.closest('[data-reset]');
        if (reset) {
            currentCategory = '全部';
            query = '';
            if (searchInput) searchInput.value = '';
            renderFilters();
            render();
            return;
        }

        const copyButton = event.target.closest('[data-copy]');
        if (!copyButton) return;

        const value = copyButton.getAttribute('data-copy');
        if (!value) return;

        const label = copyButton.getAttribute('data-copy-label') || '';
        const originalText = copyButton.textContent;
        const copied = await copyText(value);

        copyButton.textContent = copied ? '已复制' : '复制失败';
        window.setTimeout(() => {
            copyButton.textContent = originalText;
        }, 1500);
        showToast(copied ? `已复制${label}` : '复制失败，请手动选择复制');
    });

    if (toolbar) toolbar.hidden = shares.length === 0;
    renderFilters();
    render();
})();
