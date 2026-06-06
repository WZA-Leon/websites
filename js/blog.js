// 博客系统 JS - 使用手动维护的 blog-list.js
// 所有文章数据在 js/blog-list.js 中定义
let allArticles = [];
let currentCategory = 'all';

function initBlog() {
    // 从 window.BLOG_LIST 获取数据
    allArticles = window.BLOG_LIST || [];
    renderBlogList(allArticles);
    
    // 分类按钮事件
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentCategory = e.currentTarget.dataset.category;
            if (currentCategory === 'all') {
                renderBlogList(allArticles);
            } else {
                renderBlogList(allArticles.filter(a => a.category === currentCategory));
            }
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function renderBlogList(articles) {
    const blogGrid = document.getElementById('blogGrid');
    if (!blogGrid) return;
    if (!Array.isArray(articles) || articles.length === 0) {
        blogGrid.innerHTML = '<p class="no-content">暂无文章</p>';
        return;
    }

    blogGrid.innerHTML = articles.map(article => {
        const url = article.url || `./blog-data/${article.id}/post.html`;
        const tags = Array.isArray(article.tags) 
            ? article.tags.map(t => `<span class="tag">${t}</span>`).join('') 
            : '';
        return `
        <article class="blog-card" data-id="${article.id}">
            <div class="blog-header">
                <h3 class="blog-title"><a href="${url}">${article.title}</a></h3>
                <span class="blog-category">${article.category || ''}</span>
            </div>
            <p class="blog-excerpt">${article.excerpt || ''}</p>
            <div class="blog-footer">
                <div class="blog-date"><i class="fas fa-calendar"></i> ${formatDate(article.date)}</div>
                <a class="btn-read-more" href="${url}">阅读全文 <i class="fas fa-arrow-right"></i></a>
            </div>
            <div class="blog-tags">${tags}</div>
        </article>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', initBlog);
