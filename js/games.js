// 游戏大厅：分类筛选 + 搜索（目前作用于占位游戏位）
(function () {
    'use strict';

    const search = document.getElementById('gameSearch');
    const chips = Array.from(document.querySelectorAll('.games-chip'));
    const cards = Array.from(document.querySelectorAll('.game-card'));
    const count = document.getElementById('gamesCount');
    const empty = document.getElementById('gamesEmpty');
    if (!cards.length) return;

    let activeFilter = 'all';

    function applyFilter() {
        const query = (search ? search.value : '').trim().toLowerCase();
        let visible = 0;

        cards.forEach(card => {
            const categoryMatches = activeFilter === 'all' || card.dataset.category === activeFilter;
            const haystack = `${card.dataset.title || ''} ${card.textContent || ''}`.toLowerCase();
            const searchMatches = !query || haystack.includes(query);
            const show = categoryMatches && searchMatches;
            card.hidden = !show;
            if (show) visible += 1;
        });

        if (count) {
            count.textContent = `${visible} 个游戏位 · 0 款上架`;
        }
        if (empty) {
            empty.hidden = visible > 0;
        }
    }

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            activeFilter = chip.dataset.filter || 'all';
            chips.forEach(item => {
                const isActive = item === chip;
                item.classList.toggle('is-active', isActive);
                item.setAttribute('aria-pressed', String(isActive));
            });
            applyFilter();
        });
    });

    if (search) {
        search.addEventListener('input', applyFilter);
    }

    applyFilter();
})();
