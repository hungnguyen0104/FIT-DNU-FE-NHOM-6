// ==========================================
// 1. KHAI BÁO CÁC BIẾN TOÀN CỤC (GLOBAL VARIABLES)
// ==========================================
let artworksData = [];
let artistsData = [];
let currentFilter = localStorage.getItem('artFilter') || 'All';
let sortByLikes = false;

document.addEventListener('DOMContentLoaded', init);

// ==========================================
// 2. HÀM KHỞI TẠO (INIT)
// ==========================================
async function init() {
    setupEventListeners();
    if (window.auth) {
        window.auth.ensureAdminCredentials();
    }

    const [artworks, artists] = await Promise.all([
        api.getArtworks(),
        api.getArtists()
    ]);

    artworksData = artworks.filter(a => a.status === 'Đã duyệt');
    artistsData = artists;

    applyFilterBtnState();
    renderArtworks();
}

// ==========================================
// 3. HÀM IN DANH SÁCH TÁC PHẨM (RENDER)
// ==========================================
function renderArtworks(searchQuery = '') {
    const $container = $('#gallery-container');
    $container.hide();

    const currentUser = window.auth ? window.auth.getCurrentUser() : null;
    const likesMap = window.auth ? window.auth.getCurrentUserLikesMap() : {};

    let filtered = artworksData.filter(art => {
        const matchFilter = currentFilter === 'All' || art.style === currentFilter;
        const matchSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchFilter && matchSearch;
    });

    if (sortByLikes) {
        filtered.sort((a, b) => b.likes - a.likes);
    }

    $container.html('');

    if (filtered.length === 0) {
        $container.html('<p class="text-center w-100 text-muted mt-5">Không tìm thấy tác phẩm nào phù hợp.</p>');
        $container.slideDown(400);
        return;
    }

    filtered.forEach((art, index) => {
        const artist = artistsData.find(a => a.id == art.artistId) || { name: 'Unknown' };
        const likedByMe = !!(currentUser && likesMap && likesMap[art.id]);
        const styleTagHtml = typeof renderStyleTag === 'function' ? renderStyleTag(art.style) : '';

        const cardHTML = `
            <div class="col-12 col-sm-6 col-xl-4 mb-4 luxury-card" style="display: none;">
                <img src="${art.image}" alt="${art.title}" onclick="openArtworkModal('${art.id}')" style="cursor: pointer;">
                <div class="card-title-row mb-1">
                    <div class="card-title-serif text-truncate text-white fw-bold fs-5">${art.title}</div>
                    ${styleTagHtml}
                </div>
                <div class="card-artist-sans text-secondary small mb-3"><i class="fas fa-palette me-2"></i>${artist.name}</div>
                
                <div class="d-flex justify-content-between align-items-center mt-auto">
                    <div class="likes-text text-white fs-6" onclick="toggleLike('${art.id}', this)" style="cursor: pointer; transition: 0.3s;">
                        <i class="fa-${likedByMe ? 'solid text-danger' : 'regular'} fa-heart me-1"></i>
                        <span id="likes-count-${art.id}">${art.likes}</span>
                    </div>
                    
                    <button class="btn btn-outline-light rounded-circle p-0" style="width: 32px; height: 32px;" onclick="openArtworkModal('${art.id}')" title="Xem chi tiết">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;

        const $card = $(cardHTML);
        $container.append($card);

        setTimeout(() => {
            $card.fadeIn(500);
        }, (index % 4) * 100);
    });

    $container.fadeIn(300);
}

// ==========================================
// 4. HÀM XỬ LÝ KHI BẤM NÚT LIKE (HIỆU ỨNG PHÁO HOA TUNG TÓE)
// ==========================================
async function toggleLike(id, btnElement) {
    if (window.auth && !window.auth.isLoggedIn()) {
        const modalEl = document.getElementById('loginRequiredModal');
        if (modalEl && window.bootstrap) {
            const m = new bootstrap.Modal(modalEl);
            m.show();
        } else {
            alert('Bạn cần đăng nhập để tim tác phẩm.');
        }
        return;
    }

    const art = artworksData.find(a => a.id == id);
    if (!art) return;

    if (window.auth) {
        const map = window.auth.getCurrentUserLikesMap() || {};
        if (map[id]) return;
        map[id] = true;
        window.auth.setCurrentUserLikesMap(map);
    }

    art.likes = parseInt(art.likes) || 0;
    art.likes += 1;
    art.liked = true;

    const $btn = $(btnElement);
    $btn.css('position', 'relative');
    const $icon = $btn.find('i');

    $icon.removeClass('fa-regular heart-vip-anim').addClass('fa-solid text-danger');
    void $icon[0].offsetWidth;
    $icon.addClass('heart-vip-anim');

    const $ripple = $('<div class="heart-ripple"></div>');
    $btn.append($ripple);
    setTimeout(() => $ripple.remove(), 600);

    const particleCount = 6;
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const velocity = 30 + Math.random() * 35;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        const rot = (Math.random() - 0.5) * 360;

        const $particle = $('<i class="fa-solid fa-heart heart-particle"></i>');
        $particle.css({
            '--tx': `${tx}px`,
            '--ty': `${ty}px`,
            '--rot': `${rot}deg`,
            'font-size': `${8 + Math.random() * 8}px`
        });

        $btn.append($particle);
        setTimeout(() => $particle.remove(), 700);
    }

    const $likesCount = $(`#likes-count-${id}`);
    $likesCount.text(art.likes).css({
        'transform': 'scale(1.4) translateY(-2px)',
        'color': '#ff4757',
        'text-shadow': '0 0 10px rgba(255, 71, 87, 0.6)',
        'transition': 'all 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });

    setTimeout(() => {
        $likesCount.css({ 'transform': 'scale(1) translateY(0)', 'color': '', 'text-shadow': 'none' });
    }, 200);

    try {
        await api.updateArtwork(id, { likes: art.likes, liked: true }, true);
    } catch (error) {
        console.error("Lỗi lưu tim:", error);
    }
}

// ==========================================
// 5. HÀM CÀI ĐẶT SỰ KIỆN (EVENTS) — JavaScript thuần
// ==========================================
function setupEventListeners() {
    const filterContainer = document.getElementById('filter-container');
    if (filterContainer) {
        filterContainer.addEventListener('click', function (e) {
            const btn = e.target.closest('button:not(#sortLikesBtn)');
            if (!btn || !filterContainer.contains(btn)) return;

            currentFilter = btn.getAttribute('data-filter');
            localStorage.setItem('artFilter', currentFilter);
            applyFilterBtnState();

            const searchInput = document.getElementById('searchInput');
            renderArtworks(searchInput ? searchInput.value : '');
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            renderArtworks(this.value);
        });
    }

    const sortLikesBtn = document.getElementById('sortLikesBtn');
    if (sortLikesBtn) {
        sortLikesBtn.addEventListener('click', function () {
            sortByLikes = !sortByLikes;
            this.classList.toggle('active');
            this.classList.toggle('text-white');

            const icon = this.querySelector('i');
            if (icon) {
                if (sortByLikes) {
                    icon.classList.add('text-danger');
                } else {
                    icon.classList.remove('text-danger');
                }
            }

            const searchEl = document.getElementById('searchInput');
            renderArtworks(searchEl ? searchEl.value : '');
        });
    }

    window.addEventListener('scroll', function () {
        const navbar = document.getElementById('main-navbar');
        if (!navbar) return;
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    }, { passive: true });
}

// ==========================================
// 6. HÀM CẬP NHẬT GIAO DIỆN NÚT LỌC
// ==========================================
function applyFilterBtnState() {
    const buttons = document.querySelectorAll('#filter-container button:not(#sortLikesBtn)');
    buttons.forEach(function (btn) {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.color = '#aaa';
        btn.style.borderColor = 'rgba(255,255,255,0.2)';
    });

    const activeBtn = document.querySelector(`#filter-container button[data-filter="${currentFilter}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.background = 'var(--gold-dim)';
        activeBtn.style.color = 'var(--gold-text)';
        activeBtn.style.borderColor = 'var(--gold-main)';
    }
}
