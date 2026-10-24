// 资源库列表：分类筛选与卡片渲染
(function () {
    const grid = document.getElementById('resourceGrid');
    const filter = document.getElementById('resourceCategories');
    if (!grid) return;

    const resources = Array.isArray(window.RESOURCES_LIST) ? window.RESOURCES_LIST : [];
    const categories = ['全部', ...Array.from(new Set(resources.map(item => item.category)))];
    let current = '全部';

    function formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value || '';
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function renderFilter() {
        if (!filter) return;
        filter.innerHTML = categories.map(category => `
            <button type="button" class="resource-filter${category === current ? ' is-active' : ''}" data-category="${category}">
                ${category}
            </button>
        `).join('');

        filter.querySelectorAll('.resource-filter').forEach(button => {
            button.addEventListener('click', () => {
                current = button.dataset.category;
                renderFilter();
                renderGrid();
            });
        });
    }

    function renderGrid() {
        const list = current === '全部'
            ? resources
            : resources.filter(item => item.category === current);

        if (!list.length) {
            grid.innerHTML = '<p class="resource-empty">这个分类下还没有资源。</p>';
            return;
        }

        grid.innerHTML = list.map(item => `
            <article class="resource-card">
                <div class="resource-card-top">
                    <span class="resource-type">${item.type || '资料'}</span>
                    <span class="resource-date">${formatDate(item.date)}</span>
                </div>
                <h3><a href="resource.html?id=${encodeURIComponent(item.id)}">${item.title}</a></h3>
                <p>${item.description || ''}</p>
                <div class="resource-tags">
                    ${(item.tags || []).map(tag => `<span>${tag}</span>`).join('')}
                </div>
                <div class="resource-card-footer">
                    <span><i class="fas fa-clock" aria-hidden="true"></i> ${item.readTime || 1} 分钟</span>
                    <a class="resource-read" href="resource.html?id=${encodeURIComponent(item.id)}">
                        查看资源 <i class="fas fa-arrow-right" aria-hidden="true"></i>
                    </a>
                </div>
            </article>
        `).join('');
    }

    renderFilter();
    renderGrid();

    if (window.SiteLoader) window.SiteLoader.waitForImages(grid);
})();
