// GitHub 提交记录：主页 / about 共用
(function () {
    'use strict';

    const DEFAULT_REPO = 'WZA-Leon/websites';
    const INITIAL_VISIBLE = 20;
    const CACHE_PREFIX = 'wza-github-commits-v1:';
    const CACHE_TTL = 5 * 60 * 1000;
    const sharedRequests = new Map();

    function init() {
        document.querySelectorAll('[data-github-commits]').forEach(setup);
    }

    function setup(root) {
        if (root.dataset.commitReady === 'true') return;
        root.dataset.commitReady = 'true';

        const repo = (root.dataset.repo || DEFAULT_REPO).trim();
        const list = root.querySelector('[data-commit-list]');
        const meta = root.querySelector('[data-commit-meta]');
        const empty = root.querySelector('[data-commit-empty]');
        const toggle = root.querySelector('[data-commit-toggle]');

        if (!list || !meta) return;

        load(root, repo, list, meta, empty, toggle);
    }

    async function load(root, repo, list, meta, empty, toggle) {
        meta.textContent = '正在读取 GitHub 提交…';
        root.classList.add('is-loading');
        root.setAttribute('aria-busy', 'true');

        try {
            const result = await fetchCommits(repo);
            const items = result.items;

            renderList(list, items);
            renderControls(meta, empty, toggle, items, result);

            if (toggle) {
                toggle.onclick = () => toggleRows(root, list, toggle, meta, items.length, result.cached);
            }

            root.classList.remove('is-loading', 'is-error');
            root.removeAttribute('aria-busy');
        } catch (error) {
            root.classList.add('is-error');
            root.classList.remove('is-loading');
            root.removeAttribute('aria-busy');
            list.textContent = '';
            if (empty) empty.hidden = true;
            if (toggle) toggle.hidden = true;
            meta.textContent = '暂时无法读取 GitHub 提交（可能被限流），可以直接去 GitHub 查看完整记录。';
        }
    }

    function renderList(list, items) {
        list.textContent = '';

        items.forEach((item, index) => {
            const row = document.createElement('li');
            row.className = 'commit-item';
            if (index >= INITIAL_VISIBLE) row.hidden = true;

            const link = document.createElement('a');
            link.className = 'commit-link';
            link.href = item.url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.title = `${item.message} — ${item.author}${item.dateLabel ? '，' + item.dateLabel : ''}`;

            const time = document.createElement('time');
            time.className = 'commit-date';
            time.dateTime = item.date || '';
            time.textContent = item.shortDate || '--';
            time.title = item.dateLabel || '';

            const copy = document.createElement('span');
            copy.className = 'commit-copy';

            const message = document.createElement('strong');
            message.textContent = item.message;

            const detail = document.createElement('small');
            detail.textContent = `${item.author} · ${item.sha}`;

            const icon = document.createElement('i');
            icon.className = 'fas fa-arrow-up-right-from-square';
            icon.setAttribute('aria-hidden', 'true');

            copy.append(message, detail);
            link.append(time, copy, icon);
            row.appendChild(link);
            list.appendChild(row);
        });
    }

    function renderControls(meta, empty, toggle, items, result) {
        const total = items.length;
        const visible = Math.min(INITIAL_VISIBLE, total);
        const cacheLabel = result && result.cached ? ' · 缓存' : '';

        if (!total) {
            meta.textContent = '还没有读取到提交。';
            if (empty) empty.hidden = false;
            if (toggle) toggle.hidden = true;
            return;
        }

        meta.textContent = `共 ${total} 条提交 · 默认显示最近 ${visible} 条${cacheLabel}`;
        if (empty) empty.hidden = true;

        if (!toggle) return;

        if (total <= INITIAL_VISIBLE) {
            toggle.hidden = true;
            return;
        }

        toggle.hidden = false;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = `展开剩余 ${total - INITIAL_VISIBLE} 条`;
    }

    function toggleRows(root, list, toggle, meta, total, cached) {
        const expanded = root.dataset.expanded === 'true';
        const next = !expanded;
        const cacheLabel = cached ? ' · 缓存' : '';

        root.dataset.expanded = String(next);
        toggle.setAttribute('aria-expanded', String(next));

        Array.from(list.children).forEach((row, index) => {
            row.hidden = next ? false : index >= INITIAL_VISIBLE;
        });

        meta.textContent = next
            ? `共 ${total} 条提交 · 已展开全部${cacheLabel}`
            : `共 ${total} 条提交 · 默认显示最近 ${Math.min(INITIAL_VISIBLE, total)} 条${cacheLabel}`;
        toggle.textContent = next
            ? `收起，只显示前 ${INITIAL_VISIBLE} 条`
            : `展开剩余 ${total - INITIAL_VISIBLE} 条`;
    }

    async function fetchCommits(repo) {
        const cached = readCache(repo, false);
        if (cached) return { items: cached, cached: true };

        if (sharedRequests.has(repo)) return sharedRequests.get(repo);

        const request = (async () => {
            const parts = repo.split('/').filter(Boolean);
            if (parts.length !== 2) throw new Error('无效的仓库名');

            const response = await fetch(
                `https://api.github.com/repos/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}/commits?per_page=100`,
                {
                    headers: { Accept: 'application/vnd.github+json' },
                    cache: 'no-store'
                }
            );

            if (!response.ok) throw new Error(`GitHub API ${response.status}`);

            const data = await response.json();
            if (!Array.isArray(data)) throw new Error('GitHub API 返回格式异常');

            const items = data.map((entry) => normalizeCommit(entry, repo)).filter(Boolean);
            writeCache(repo, items);

            return { items, cached: false };
        })();

        sharedRequests.set(repo, request);

        try {
            const result = await request;
            return result;
        } catch (error) {
            const stale = readCache(repo, true);
            if (stale) return { items: stale, cached: true };
            throw error;
        } finally {
            sharedRequests.delete(repo);
        }
    }

    function normalizeCommit(entry, repo) {
        if (!entry || typeof entry !== 'object' || !entry.sha) return null;

        const commit = entry.commit || {};
        const rawMessage = typeof commit.message === 'string' ? commit.message : '';
        const message = rawMessage.split(/\r?\n/)[0].trim() || '(无提交信息)';
        const date = commit.author?.date || commit.committer?.date || '';
        const author = commit.author?.name || entry.author?.login || '未知作者';
        const sha = String(entry.sha).slice(0, 7);
        const htmlUrl = typeof entry.html_url === 'string' && /^https:\/\/github\.com\//.test(entry.html_url)
            ? entry.html_url
            : `https://github.com/${repo}/commit/${entry.sha}`;

        return {
            message,
            author,
            sha,
            url: htmlUrl,
            date,
            dateLabel: formatLongDate(date),
            shortDate: formatShortDate(date)
        };
    }

    function formatLongDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    function formatShortDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function cacheKey(repo) {
        return CACHE_PREFIX + repo;
    }

    function readCache(repo, allowStale) {
        try {
            const raw = sessionStorage.getItem(cacheKey(repo));
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.items)) return null;

            const fresh = Date.now() - Number(parsed.savedAt || 0) < CACHE_TTL;
            if (!fresh && !allowStale) return null;

            return parsed.items;
        } catch (error) {
            return null;
        }
    }

    function writeCache(repo, items) {
        try {
            sessionStorage.setItem(cacheKey(repo), JSON.stringify({
                savedAt: Date.now(),
                items
            }));
        } catch (error) {
            // 隐私模式下 sessionStorage 可能不可用，忽略即可。
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
