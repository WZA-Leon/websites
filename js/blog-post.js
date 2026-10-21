// 根据 URL 中的 id 加载 Markdown 文章并渲染
(function () {
    const contentEl = document.getElementById('postContent');
    const titleEl = document.getElementById('postTitle');
    const dateEl = document.getElementById('postDate');
    const categoryEl = document.getElementById('postCategory');
    const readTimeEl = document.getElementById('postReadTime');
    const tagsEl = document.getElementById('postTags');

    if (!contentEl) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const articles = Array.isArray(window.BLOG_LIST) ? window.BLOG_LIST : [];
    const article = articles.find(item => item.id === id);

    function showError(message) {
        if (tagsEl) tagsEl.innerHTML = '';
        contentEl.innerHTML = '';
        const error = document.createElement('p');
        error.className = 'error';
        error.textContent = message;
        contentEl.appendChild(error);
    }

    if (!article) {
        if (titleEl) titleEl.textContent = '文章未找到';
        document.title = '文章未找到 - WZA-Leon 博客';
        showError(id ? '没有找到这篇文章。' : '缺少文章参数，请从博客列表进入。');
        return;
    }

    document.title = `${article.title} - WZA-Leon 博客`;
    if (titleEl) titleEl.textContent = article.title;
    if (dateEl) dateEl.textContent = article.date || '';
    if (categoryEl) categoryEl.textContent = article.category || '';
    if (tagsEl) {
        tagsEl.innerHTML = (article.tags || [])
            .map(tag => `<span class="tag">${tag}</span>`)
            .join('');
    }

    if (!window.marked || typeof window.marked.parse !== 'function') {
        showError('Markdown 渲染库加载失败，请检查网络后重试。');
        return;
    }

    const markdownUrl = new URL(`./blog-data/${encodeURIComponent(article.id)}.md`, document.baseURI);
    const contentBase = new URL('./blog-data/', document.baseURI);

    const loadPromise = fetch(markdownUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
        })
        .then(markdown => {
            contentEl.innerHTML = window.marked.parse(markdown, { gfm: true, breaks: false });

            // 页面头部已展示标题，去掉 Markdown 开头重复的一级标题。
            const firstElement = contentEl.firstElementChild;
            if (firstElement && firstElement.tagName === 'H1') {
                firstElement.remove();
            }

            resolveRelativeUrls(contentEl, contentBase);

            const charCount = markdown.replace(/\s+/g, '').length;
            if (readTimeEl) readTimeEl.textContent = String(Math.max(1, Math.round(charCount / 500)));

            // 文章内图片加载完再隐藏全站加载层，避免图片弹出造成跳动。
            if (window.SiteLoader) {
                return window.SiteLoader.waitForImages(contentEl);
            }
        })
        .catch(error => {
            console.error('Failed to load markdown:', markdownUrl.href, error);
            showError('文章加载失败，请稍后重试。');
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
