// 项目展示系统 - 使用手动维护的 projects-list.js
// 所有项目数据在 js/projects-list.js 中定义
let projectsData = {
    categories: ['all'],
    projects: []
};
let currentProjectCategory = 'all';

function initProjects() {
    projectsData.projects = window.PROJECTS_LIST || [];
    const cats = new Set(['all']);
    projectsData.projects.forEach(project => cats.add(project.category || '未分类'));
    projectsData.categories = Array.from(cats);

    initProjectCategories();
    renderProjects();

    if (window.SiteLoader) {
        window.SiteLoader.waitForImages(document.getElementById('project-root'));
    }
}

function initProjectCategories() {
    const categoryContainer = document.getElementById('projectCategories');
    if (!categoryContainer) return;

    categoryContainer.innerHTML = projectsData.categories.map(category => {
        const label = category === 'all' ? '全部' : category;
        return `
            <button type="button" class="category-btn ${category === currentProjectCategory ? 'active' : ''}" data-category="${category}">
                ${label}
            </button>
        `;
    }).join('');

    categoryContainer.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', () => {
            categoryContainer.querySelectorAll('.category-btn').forEach(item => item.classList.remove('active'));
            button.classList.add('active');
            currentProjectCategory = button.dataset.category;
            renderProjects();
        });
    });
}

function renderProjects() {
    const container = document.getElementById('project-root');
    if (!container) return;

    const filtered = currentProjectCategory === 'all'
        ? projectsData.projects
        : projectsData.projects.filter(project => project.category === currentProjectCategory);

    if (!filtered.length) {
        container.innerHTML = '<p class="resource-empty">这个分类下还没有项目。</p>';
        return;
    }

    container.innerHTML = filtered.map((project, index) => {
        const tags = (project.technologies || [])
            .map(tech => `<span class="tag">${tech}</span>`)
            .join('');
        const external = project.link
            ? `<a class="project-external" href="${project.link}" target="_blank" rel="noopener">访问网址 <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
            : '';

        return `
            <article class="project-tile">
                <div class="project-tile-top">
                    <span class="project-index">${String(index + 1).padStart(2, '0')}</span>
                    <span class="project-tile-category">${project.category || '未分类'}</span>
                </div>
                <h3>${project.name}</h3>
                <p class="project-tile-desc">${project.description || ''}</p>
                <div class="project-tags">${tags}</div>
                <div class="project-tile-actions">
                    <a class="btn btn-small" href="project.html?id=${encodeURIComponent(project.id)}">查看文档 <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
                    ${external}
                </div>
            </article>
        `;
    }).join('');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjects);
} else {
    initProjects();
}
