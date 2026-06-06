// 项目展示系统 JS - 使用手动维护的 projects-list.js
// 所有项目数据在 js/projects-list.js 中定义
let projectsData = {
    categories: ['all'],
    projects: []
};
let currentProjectCategory = 'all';

function initProjects() {
    // 从 window.PROJECTS_LIST 获取数据
    projectsData.projects = window.PROJECTS_LIST || [];
    const cats = new Set(['all']);
    projectsData.projects.forEach(p => cats.add(p.category || '未分类'));
    projectsData.categories = Array.from(cats);
    initProjectCategories();
    renderProjects();
}

function initProjectCategories() {
    const categoryContainer = document.getElementById('projectCategories');
    if (!categoryContainer) return;

    categoryContainer.innerHTML = projectsData.categories.map(cat => {
        const value = cat === 'all' ? 'all' : cat;
        return `
            <button class="category-btn ${value === 'all' ? 'active' : ''}" data-category="${value}">
                ${cat}
            </button>
        `;
    }).join('');

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentProjectCategory = e.currentTarget.dataset.category;
            renderProjects();
        });
    });
}

function resolveProjectImage(project) {
    const img = project.image || project.cover || '';
    if (!img) return './images/placeholder.svg';
    if (/^(https?:)?\/\//.test(img) || img.startsWith('/')) return img;
    return `./project-data/${project.id}/${img}`;
}

function renderProjects() {
    const container = document.getElementById('project-root');
    if (!container) return;

    const filtered = currentProjectCategory === 'all'
        ? projectsData.projects
        : projectsData.projects.filter(p => p.category === currentProjectCategory);

    if (!filtered.length) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">该分类下暂无项目</p>';
        return;
    }

    container.innerHTML = filtered.map(project => `
        <div class="project-card">
            <div class="project-image">
                <img src="${resolveProjectImage(project)}" alt="${project.name}" onerror="this.src='./images/placeholder.svg'">
                <div class="project-overlay">
                    ${project.link ? `<a href="${project.link}" class="project-link" target="_blank">访问网址</a>` : ''}
                </div>
            </div>
            <div class="project-info">
                <h3>${project.name}</h3>
                <p class="project-desc">${project.description || ''}</p>
                <div class="project-tags">${(project.technologies||[]).map(tech=>`<span class="tag">${tech}</span>`).join('')}</div>
                <div class="project-meta"><span class="category-badge">${project.category||''}</span><span class="date">${project.date||''}</span></div>
            </div>
        </div>
    `).join('');
}

// 初始化页面时运行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjects);
} else {
    initProjects();
}

