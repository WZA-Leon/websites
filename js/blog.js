// 博客系统 JS
let allArticles = [];
let currentCategory = 'all';

// 初始化博客
async function initBlog() {
    try {
        // 获取博客索引
        const response = await fetch('./blog-data/index.json');
        const data = await response.json();
        allArticles = data.articles;
        
        // 生成博客列表
        renderBlogList(allArticles);
        
        // 设置分类按钮事件
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', filterByCategory);
        });
        
        // 设置模态框关闭按钮
        document.getElementById('modalClose').addEventListener('click', closeBlogModal);
        document.getElementById('blogModal').addEventListener('click', (e) => {
            if (e.target.id === 'blogModal') {
                closeBlogModal();
            }
        });
    } catch (error) {
        console.error('Error loading blog data:', error);
        document.getElementById('blogGrid').innerHTML = '<p class="error">加载博客数据失败</p>';
    }
}

// 渲染博客列表
function renderBlogList(articles) {
    const blogGrid = document.getElementById('blogGrid');
    
    if (articles.length === 0) {
        blogGrid.innerHTML = '<p class="no-content">暂无文章</p>';
        return;
    }
    
    blogGrid.innerHTML = articles.map(article => `
        <article class="blog-card" data-id="${article.id}">
            <div class="blog-header">
                <h3 class="blog-title">${article.title}</h3>
                <span class="blog-category">${article.category}</span>
            </div>
            <p class="blog-excerpt">${article.excerpt}</p>
            <div class="blog-footer">
                <div class="blog-date">
                    <i class="fas fa-calendar"></i> ${formatDate(article.date)}
                </div>
                <button class="btn-read-more" data-id="${article.id}">
                    阅读全文
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
            <div class="blog-tags">
                ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </article>
    `).join('');
    
    // 添加点击事件
    document.querySelectorAll('.btn-read-more').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = btn.dataset.id;
            openBlogModal(id);
        });
    });
}

// 分类过滤
function filterByCategory(e) {
    // 移除所有active状态
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    // 添加active到点击的按钮
    e.target.classList.add('active');
    
    currentCategory = e.target.dataset.category;
    
    // 过滤文章
    if (currentCategory === 'all') {
        renderBlogList(allArticles);
    } else {
        const filtered = allArticles.filter(article => article.category === currentCategory);
        renderBlogList(filtered);
    }
}

// 打开博客详情模态框
async function openBlogModal(articleId) {
    const article = allArticles.find(a => a.id === articleId);
    if (!article) return;
    
    try {
        // 获取markdown文件
        const response = await fetch(`./blog-data/${articleId}.md`);
        const markdown = await response.text();
        
        // 使用marked渲染markdown
        const htmlContent = marked.parse(markdown);
        
        // 填充模态框
        document.getElementById('modalTitle').textContent = article.title;
        document.getElementById('modalDate').textContent = formatDate(article.date);
        document.getElementById('modalCategory').textContent = article.category;
        document.getElementById('modalContent').innerHTML = htmlContent;
        
        // 显示模态框
        document.getElementById('blogModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading article:', error);
        alert('无法加载文章内容');
    }
}

// 关闭模态框
function closeBlogModal() {
    document.getElementById('blogModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

// 日期格式化
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', initBlog);
