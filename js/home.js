// 首页快速入口：关键词搜索 + 类型筛选
(function () {
    'use strict';

    const input = document.getElementById('quickSearch');
    const grid = document.getElementById('quickGrid');
    const filters = document.getElementById('quickFilters');
    const count = document.getElementById('quickCount');
    const empty = document.getElementById('quickEmpty');
    const reset = document.getElementById('quickReset');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.quick-card'));
    if (!cards.length) return;

    let currentType = 'all';

    function applyFilter() {
        const keyword = input ? input.value.trim().toLowerCase() : '';
        let visible = 0;

        cards.forEach(card => {
            const typeMatch = currentType === 'all' || card.dataset.type === currentType;
            const haystack = `${card.dataset.keywords || ''} ${card.textContent || ''}`.toLowerCase();
            const keywordMatch = !keyword || haystack.includes(keyword);
            const show = typeMatch && keywordMatch;

            card.hidden = !show;
            if (show) visible += 1;
        });

        if (count) {
            count.textContent = visible === cards.length
                ? `${cards.length} 个入口`
                : `${visible} / ${cards.length} 个入口`;
        }
        if (empty) empty.hidden = visible !== 0;
        grid.hidden = visible === 0;
    }

    if (input) {
        input.addEventListener('input', applyFilter);
    }

    if (filters) {
        filters.addEventListener('click', event => {
            const button = event.target.closest('.quick-filter');
            if (!button) return;

            currentType = button.dataset.filter || 'all';
            filters.querySelectorAll('.quick-filter').forEach(item => {
                item.classList.toggle('is-active', item === button);
            });
            applyFilter();
        });
    }

    if (reset) {
        reset.addEventListener('click', () => {
            currentType = 'all';
            if (input) input.value = '';
            if (filters) {
                filters.querySelectorAll('.quick-filter').forEach(item => {
                    item.classList.toggle('is-active', item.dataset.filter === 'all');
                });
            }
            applyFilter();
            if (input) input.focus();
        });
    }

    applyFilter();
})();
