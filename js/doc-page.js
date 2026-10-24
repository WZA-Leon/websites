// 项目 Markdown 文档渲染器
(function () {
    const contentEl = document.getElementById('docContent');
    const titleEl = document.getElementById('docTitle');
    const descriptionEl = document.getElementById('docDescription');
    const categoryEl = document.getElementById('docCategory');
    const dateEl = document.getElementById('docDate');
    const readTimeEl = document.getElementById('docReadTime');
    const tagsEl = document.getElementById('docTags');
    const actionsEl = document.getElementById('docActions');

    if (!contentEl) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const list = Array.isArray(window.PROJECTS_LIST) ? window.PROJECTS_LIST : [];
    const item = list.find(entry => entry.id === id);

    function showError(message) {
        if (tagsEl) tagsEl.innerHTML = '';
        contentEl.innerHTML = '';
        const error = document.createElement('p');
        error.className = 'doc-error';
        error.textContent = message;
        contentEl.appendChild(error);
    }

    if (!item) {
        if (titleEl) titleEl.textContent = '内容未找到';
        document.title = '内容未找到 - WZA-Leon';
        showError(id ? '没有找到这个项目。' : '缺少 id 参数，请从项目列表进入。');
        return;
    }

    const title = item.title || item.name || '项目文档';
    const base = new URL(`./project-data/${encodeURIComponent(item.id)}/`, document.baseURI);
    const markdownFile = item.markdown || 'README.md';
    const markdownUrl = new URL(markdownFile, base);

    document.title = `${title} - WZA-Leon`;
    if (titleEl) titleEl.textContent = title;
    if (descriptionEl) descriptionEl.textContent = item.description || '';
    if (categoryEl) categoryEl.textContent = item.category || '';
    if (dateEl) dateEl.textContent = item.date || '';
    if (readTimeEl) readTimeEl.textContent = String(item.readTime || 1);
    if (tagsEl) {
        tagsEl.innerHTML = (item.tags || item.technologies || [])
            .map(tag => `<span><i class="fas fa-hashtag" aria-hidden="true"></i> ${tag}</span>`)
            .join('');
    }
    if (actionsEl) {
        actionsEl.innerHTML = item.link
            ? `<a class="btn" href="${item.link}" target="_blank" rel="noopener">访问项目 <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
            : '';
    }

    if (!window.marked || typeof window.marked.parse !== 'function') {
        showError('Markdown 渲染库加载失败，请检查网络后重试。');
        return;
    }

    const loadPromise = fetch(markdownUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
        })
        .then(markdown => {
            contentEl.innerHTML = window.marked.parse(markdown, { gfm: true, breaks: false });

            const first = contentEl.firstElementChild;
            if (first && first.tagName === 'H1') first.remove();

            resolveRelativeUrls(contentEl, base);

            if (readTimeEl) {
                const charCount = markdown.replace(/\s+/g, '').length;
                if (!item.readTime) readTimeEl.textContent = String(Math.max(1, Math.round(charCount / 500)));
            }

            if (window.SiteLoader) return window.SiteLoader.waitForImages(contentEl);
        })
        .catch(error => {
            console.error('Failed to load markdown:', markdownUrl.href, error);
            showError('内容加载失败，请稍后重试。');
        });

    if (window.SiteLoader) window.SiteLoader.waitFor(loadPromise);

    function resolveRelativeUrls(container, baseUrl) {
        const absoluteUrl = value => {
            if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) return value;
            return new URL(value, baseUrl).href;
        };

        ['src', 'href', 'poster'].forEach(attribute => {
            container.querySelectorAll(`[${attribute}]`).forEach(element => {
                const resolved = absoluteUrl(element.getAttribute(attribute));
                if (resolved) element.setAttribute(attribute, resolved);
            });
        });

        container.querySelectorAll('[srcset]').forEach(element => {
            const srcset = element.getAttribute('srcset');
            if (!srcset) return;
            const resolved = srcset.split(',').map(part => {
                const [url, ...descriptor] = part.trim().split(/\s+/);
                return [absoluteUrl(url), ...descriptor].join(' ');
            }).join(', ');
            element.setAttribute('srcset', resolved);
        });
    }
})();
