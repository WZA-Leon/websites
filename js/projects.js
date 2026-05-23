// 项目展示系统 JS
let projectsData = {
    categories: ['全部', '前端', '后端', '全栈', '工具'],
    projects: [
        {
            id: 'work1',
            name: '个人作品集网站',
            category: '全栈',
            description: '一个响应式个人作品展示网站，使用HTML5、CSS3和原生JavaScript开发，包含博客、项目、摄影等多个板块',
            image: './images/projects/project1.jpg',
            technologies: ['HTML5', 'CSS3', 'JavaScript'],
            link: '#',
            date: '2024'
        }
    ]
};

let currentProjectCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadProjectsData();
    initProjectCategories();
    renderProjects();
});

// 加载项目数据
async function loadProjectsData() {
    try {
        const response = await fetch('./project-data/index.json');
        const data = await response.json();
        console.log('项目数据:', data);
        
        // 如果本地有更详细的项目信息，可以进一步处理
        // 这里先使用示例数据
    } catch (error) {
        console.log('加载项目数据失败，使用示例数据:', error);
    }
}

// 初始化分类筛选
function initProjectCategories() {
    const categoryContainer = document.getElementById('projectCategories');
    
    if (!categoryContainer) return;
    
    categoryContainer.innerHTML = projectsData.categories.map(cat => {
        const value = cat === '全部' ? 'all' : cat;
        return `
            <button class="category-btn ${value === 'all' ? 'active' : ''}" data-category="${value}">
                ${cat}
            </button>
        `;
    }).join('');
    
    // 添加分类点击事件
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentProjectCategory = e.target.dataset.category;
            renderProjects();
        });
    });
}

// 渲染项目列表
function renderProjects() {
    const container = document.getElementById('project-root');
    if (!container) return;
    
    const filtered = currentProjectCategory === 'all' 
        ? projectsData.projects 
        : projectsData.projects.filter(p => p.category === currentProjectCategory);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">该分类下暂无项目</p>';
        return;
    }
    
    container.innerHTML = filtered.map(project => `
        <div class="project-card">
            <div class="project-image">
                <img src="${project.image}" alt="${project.name}" onerror="this.src='./images/placeholder.svg'">
                <div class="project-overlay">
                    <a href="${project.link}" class="project-link" target="_blank">查看项目</a>
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
