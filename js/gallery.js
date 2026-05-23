// 摄影图库系统 JS
let galleryData = {
    categories: ['全部', '风景', '人物', '建筑', '微距'],
    photos: [
        {
            id: 'photo1',
            name: '日出时刻',
            category: '风景',
            image: './images/gallery/landscape1.jpg',
            description: '清晨的日出，光线温暖而柔和',
            date: '2024'
        },
        {
            id: 'photo2',
            name: '城市夜景',
            category: '建筑',
            image: './images/gallery/city1.jpg',
            description: '都市的灯火阑珊',
            date: '2024'
        },
        {
            id: 'photo3',
            name: '自然之美',
            category: '风景',
            image: './images/gallery/landscape2.jpg',
            description: '大自然的壮美风景',
            date: '2024'
        },
        {
            id: 'photo4',
            name: '微距世界',
            category: '微距',
            image: './images/gallery/macro1.jpg',
            description: '放大视角中的精致细节',
            date: '2024'
        }
    ]
};

let currentGalleryCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadGalleryData();
    initGalleryCategories();
    renderGallery();
    initPhotoModal();
});

// 加载摄影数据
async function loadGalleryData() {
    try {
        const response = await fetch('./images/photograph/index.json');
        const data = await response.json();
        console.log('摄影数据:', data);
        
        // 如果本地有更详细的摄影信息，可以进一步处理
        // 这里先使用示例数据
    } catch (error) {
        console.log('加载摄影数据失败，使用示例数据:', error);
    }
}

// 初始化分类筛选
function initGalleryCategories() {
    const categoryContainer = document.getElementById('galleryCategories');
    
    if (!categoryContainer) return;
    
    categoryContainer.innerHTML = galleryData.categories.map(cat => {
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
            currentGalleryCategory = e.target.dataset.category;
            renderGallery();
        });
    });
}

// 渲染图库
function renderGallery() {
    const container = document.getElementById('photograph-root');
    if (!container) return;
    
    const filtered = currentGalleryCategory === 'all' 
        ? galleryData.photos 
        : galleryData.photos.filter(p => p.category === currentGalleryCategory);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">该分类下暂无作品</p>';
        return;
    }
    
    container.innerHTML = filtered.map(photo => `
        <div class="photo-card" data-photo-id="${photo.id}">
            <div class="photo-image">
                <img src="${photo.image}" alt="${photo.name}" onerror="this.src='./images/placeholder.svg'">
                <div class="photo-overlay">
                    <button class="photo-btn" data-photo-id="${photo.id}">
                        <i class="fas fa-search-plus"></i>
                    </button>
                </div>
            </div>
            <div class="photo-info">
                <h3>${photo.name}</h3>
                <p class="photo-desc">${photo.description}</p>
                <div class="photo-meta">
                    <span class="category-badge">${photo.category}</span>
                    <span class="date">${photo.date}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // 添加图片点击事件
    document.querySelectorAll('.photo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const photoId = e.currentTarget.dataset.photoId;
            const photo = galleryData.photos.find(p => p.id === photoId);
            if (photo) {
                openPhotoModal(photo);
            }
        });
    });
}

// 初始化图片模态框
function initPhotoModal() {
    const modal = document.getElementById('photoModal');
    const closeBtn = document.querySelector('.photo-close');
    
    if (!modal || !closeBtn) return;
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    });
}

// 打开图片模态框
function openPhotoModal(photo) {
    const modal = document.getElementById('photoModal');
    const img = document.getElementById('photoModalImg');
    const caption = document.getElementById('photoCaption');
    
    if (!modal) return;
    
    img.src = photo.image;
    img.alt = photo.name;
    caption.innerHTML = `<h3>${photo.name}</h3><p>${photo.description}</p>`;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}
