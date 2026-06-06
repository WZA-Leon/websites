// 摄影图库系统 JS
const galleryRoot = './images/photograph';
const GALLERY_BASE_URL = document.baseURI;
let galleryCategories = ['all'];
let galleryPhotos = [];
let currentGalleryCategory = 'all';

function resolveGalleryPath(relative) {
    return new URL(relative, GALLERY_BASE_URL).href;
}

document.addEventListener('DOMContentLoaded', async () => {
    await initGallery();
});

async function initGallery() {
    await loadGalleryData();
    initGalleryCategories();
    renderGallery();
    initPhotoModal();
}

async function loadGalleryData() {
    const rootIndex = await fetchJSON(resolveGalleryPath(`${galleryRoot}/index.json`));
    const categories = Array.isArray(rootIndex?.categories) ? rootIndex.categories : [];

    galleryCategories = ['all'];
    galleryPhotos = [];

    for (const folder of categories) {
        const catIndex = await fetchJSON(resolveGalleryPath(`${galleryRoot}/${folder}/index.json`));
        if (!catIndex) continue;

        const categoryName = catIndex.name || folder;
        galleryCategories.push(categoryName);

        const works = Array.isArray(catIndex.works) ? catIndex.works : [];
        for (const workItem of works) {
            const workFolder = typeof workItem === 'string' ? workItem : (workItem.folder || workItem.title || '');
            if (!workFolder) continue;

            const workIndex = await fetchJSON(resolveGalleryPath(`${galleryRoot}/${folder}/${workFolder}/index.json`));
            if (!workIndex) continue;

            const imageFile = workIndex.cover || (Array.isArray(workIndex.images) ? workIndex.images[0]?.filename : '');
                    const image = imageFile ? resolveImagePath(`${galleryRoot}/${folder}/${workFolder}`, imageFile) : '';

            galleryPhotos.push({
                id: `${folder}-${workFolder}`,
                name: workIndex.title || workFolder,
                description: workIndex.description || '',
                image: image || './images/placeholder.svg',
                category: categoryName,
                date: workIndex.date || '',
                source: `${galleryRoot}/${folder}/${workFolder}`
            });
        }
    }

    if (galleryCategories.length === 1) {
        galleryCategories = ['all'];
    }
}

function initGalleryCategories() {
    const categoryContainer = document.getElementById('galleryCategories');
    if (!categoryContainer) return;

    categoryContainer.innerHTML = galleryCategories.map(cat => {
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
            currentGalleryCategory = e.target.dataset.category;
            renderGallery();
        });
    });
}

function renderGallery() {
    const container = document.getElementById('photograph-root');
    if (!container) return;

    const filtered = currentGalleryCategory === 'all'
        ? galleryPhotos
        : galleryPhotos.filter(p => p.category === currentGalleryCategory);

    if (!filtered.length) {
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

    document.querySelectorAll('.photo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const photoId = e.currentTarget.dataset.photoId;
            const photo = galleryPhotos.find(p => p.id === photoId);
            if (photo) {
                openPhotoModal(photo);
            }
        });
    });
}

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
    return new URL(`${basePath}/${relative}`, GALLERY_BASE_URL).href;
}
