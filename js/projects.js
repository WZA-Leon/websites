// 项目展示系统 JS
const projectDataRoot = './project-data';
const PROJECT_BASE_URL = document.baseURI;
let projectsData = {
    categories: ['all'],
    projects: []
};
let currentProjectCategory = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    await initProjects();
});

async function initProjects() {
    await loadProjectsData();
    initProjectCategories();
    renderProjects();
}

async function loadProjectsData() {
    const rootIndex = await fetchJSON(new URL(`${projectDataRoot}/index.json`, PROJECT_BASE_URL).href);
    const projectKeys = Array.isArray(rootIndex?.projects) ? rootIndex.projects : [];
    const categories = new Set(['all']);
    const projects = [];

    for (const item of projectKeys) {
        const folder = typeof item === 'string' ? item : (item.folder || item.id || item.name || '');
        if (!folder) continue;

        const projectIndex = await fetchJSON(new URL(`${projectDataRoot}/${folder}/index.json`, PROJECT_BASE_URL).href);
        if (!projectIndex) continue;

        const category = projectIndex.category || projectIndex.type || '未分类';
        categories.add(category);

        const imageFile = projectIndex.cover || projectIndex.image || '';
        const image = imageFile ? resolveImagePath(`${projectDataRoot}/${folder}`, imageFile) : './images/placeholder.svg';
        const technologies = Array.isArray(projectIndex.technologies)
            ? projectIndex.technologies
            : (typeof projectIndex.technologies === 'string' ? [projectIndex.technologies] : []);

        projects.push({
            id: folder,
            name: projectIndex.title || projectIndex.name || folder,
            category,
            description: projectIndex.description || projectIndex.intro || '',
            image,
            technologies,
            link: projectIndex.url || projectIndex.link || '#',
            markdown: projectIndex.markdown || projectIndex.readme || projectIndex.README || 'README.md',
            date: projectIndex.date || ''
        });
    }

    projectsData.categories = Array.from(categories);
    projectsData.projects = projects;
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
            e.target.classList.add('active');
            currentProjectCategory = e.target.dataset.category;
            renderProjects();
        });
    });
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
                <img src="${project.image}" alt="${project.name}" onerror="this.src='./images/placeholder.svg'">
                <div class="project-overlay">
                    ${project.link && project.link !== '#' ? `<a href="${project.link}" class="project-link" target="_blank">访问网址</a>` : ''}
                </div>
            </div>
            <div class="project-info">
                <h3>${project.name}</h3>
                <p class="project-desc">${project.description}</p>
                <div class="project-tags">
                    ${project.technologies.map(tech => `<span class="tag">${tech}</span>`).join('')}
                </div>
                <div class="project-meta">
                    <span class="category-badge">${project.category}</span>
                    <span class="date">${project.date}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function fetchJSON(path) {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
    } catch (err) {
        console.warn('fetchJSON failed:', path, err);
        return null;
    }
}

function resolveImagePath(basePath, relative) {
    if (!relative) return '';
    if (/^(https?:)?\/\//.test(relative) || relative.startsWith('/')) {
        return relative;
    }
    return new URL(`${basePath}/${relative}`, PROJECT_BASE_URL).href;
}
