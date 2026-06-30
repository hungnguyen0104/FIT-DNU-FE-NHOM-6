// ==========================================
// 1. KHAI BÁO CÁC BIẾN TOÀN CỤC
// ==========================================
let adminModal; // Biến lưu trữ đối tượng Modal form của Bootstrap để có thể điều khiển bật/tắt
let artworksList = []; // Mảng chứa danh sách tác phẩm tải từ API
let artistsList = []; // Mảng chứa danh sách họa sĩ tải từ API


let currentPage = 1; // Trang hiện tại
const itemsPerPage = 5; // Số tác phẩm hiện trên 1 trang (bạn có thể đổi thành 10)
let currentStyleFilter = '__ALL__';

const FORM_ERROR_IDS = [
    'formTitle',
    'formImage',
    'formArtistId',
    'formStyle',
    'formDesc',
];

function showFieldError(fieldId, message) {
    const errorEl = document.getElementById('error-' + fieldId);
    const inputEl = document.getElementById(fieldId);
    if (errorEl) errorEl.textContent = message;
    if (inputEl) inputEl.classList.add('is-invalid');
}

function clearFieldError(fieldId) {
    const errorEl = document.getElementById('error-' + fieldId);
    const inputEl = document.getElementById(fieldId);
    if (errorEl) errorEl.textContent = '';
    if (inputEl) inputEl.classList.remove('is-invalid');
}

function clearFieldErrors() {
    FORM_ERROR_IDS.forEach(clearFieldError);
}

function isValidImageUrl(url) {
    const trimmed = (url || '').trim();
    if (!trimmed) return false;
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

function validateArtworkForm() {
    clearFieldErrors();
    let isValid = true;

    const title = document.getElementById('formTitle').value.trim();
    const image = document.getElementById('formImage').value.trim();
    const artistId = document.getElementById('formArtistId').value;
    const style = document.getElementById('formStyle').value;
    const desc = document.getElementById('formDesc').value.trim();

    if (!title) {
        showFieldError('formTitle', 'Tên tác phẩm không được để trống.');
        isValid = false;
    }

    if (!image) {
        showFieldError('formImage', 'Link ảnh không được để trống.');
        isValid = false;
    } else if (!isValidImageUrl(image)) {
        showFieldError('formImage', 'URL ảnh không hợp lệ (phải bắt đầu bằng http:// hoặc https://).');
        isValid = false;
    }

    if (!artistId) {
        showFieldError('formArtistId', 'Vui lòng chọn họa sĩ.');
        isValid = false;
    }

    if (!style) {
        showFieldError('formStyle', 'Vui lòng chọn phong cách.');
        isValid = false;
    }

    if (!desc) {
        showFieldError('formDesc', 'Mô tả không được để trống.');
        isValid = false;
    }

    return isValid;
}

function bindFieldValidationClear() {
    FORM_ERROR_IDS.forEach(function (fieldId) {
        const el = document.getElementById(fieldId);
        if (!el) return;
        el.addEventListener('input', function () {
            clearFieldError(fieldId);
        });
        el.addEventListener('change', function () {
            clearFieldError(fieldId);
        });
    });
}

// ==========================================
// 2. KHỞI TẠO KHI TRANG ĐÃ TẢI XONG (DOMContentLoaded)
// ==========================================
document.addEventListener('DOMContentLoaded', async() => {
    // Kết nối biến adminModal với cái form HTML bằng ID 'adminFormModal'
    adminModal = new bootstrap.Modal(document.getElementById('adminFormModal'));

    // Load data: Gọi API lấy dữ liệu tác phẩm và họa sĩ CÙNG LÚC (Promise.all) để tiết kiệm thời gian
    const [artworks, artists] = await Promise.all([api.getArtworks(), api.getArtists()]);

    artworksList = artworks; // Lưu dữ liệu lấy được vào biến toàn cục
    artistsList = artists;

    populateArtistsSelect(); // Đổ danh sách họa sĩ vào ô chọn (select dropdown)
    renderAdminTable(); // In danh sách tác phẩm ra bảng

    const styleFilterEl = document.getElementById('adminStyleFilter');
    if (styleFilterEl) {
        styleFilterEl.addEventListener('change', () => {
            currentStyleFilter = styleFilterEl.value;
            currentPage = 1;
            renderAdminTable();
        });
    }

    // Form Submit Event: Lắng nghe sự kiện khi người dùng bấm nút "Lưu dữ liệu" trong Modal
    document.getElementById('artworkForm').addEventListener('submit', async(e) => {
        e.preventDefault();
        if (!validateArtworkForm()) return;
        await saveArtwork();
    });

    bindFieldValidationClear();

    const imageInput = document.getElementById('formImage');
    if (imageInput) {
        imageInput.addEventListener('input', () => updateImagePreview(imageInput.value));
        imageInput.addEventListener('change', () => updateImagePreview(imageInput.value));
    }
});

function updateImagePreview(url) {
    const img = document.getElementById('imagePreview');
    const placeholder = document.getElementById('previewPlaceholder');
    if (!img || !placeholder) return;

    const trimmed = (url || '').trim();
    if (trimmed) {
        img.src = trimmed;
        img.classList.remove('d-none');
        placeholder.classList.add('d-none');
        img.onerror = () => {
            img.classList.add('d-none');
            placeholder.classList.remove('d-none');
        };
    } else {
        img.src = '';
        img.classList.add('d-none');
        placeholder.classList.remove('d-none');
    }
}

function setAdminModalMode(isEdit) {
    const titleEl = document.getElementById('adminModalTitle');
    const subtitleEl = document.getElementById('adminModalSubtitle');
    const submitTextEl = document.getElementById('adminFormSubmitText');

    if (isEdit) {
        if (titleEl) titleEl.textContent = 'Sửa tác phẩm';
        if (subtitleEl) subtitleEl.textContent = 'Cập nhật thông tin và ảnh xem trước bên trái.';
        if (submitTextEl) submitTextEl.textContent = 'Lưu thay đổi';
    } else {
        if (titleEl) titleEl.textContent = 'Thêm tác phẩm mới';
        if (subtitleEl) subtitleEl.textContent = 'Điền thông tin và xem trước ảnh trước khi đăng tải.';
        if (submitTextEl) submitTextEl.textContent = 'Đăng tải tác phẩm';
    }
}

function resetStyleFilter() {
    currentStyleFilter = '__ALL__';
    const styleFilterEl = document.getElementById('adminStyleFilter');
    if (styleFilterEl) styleFilterEl.value = '__ALL__';
    currentPage = 1;
    renderAdminTable();
}

// ==========================================
// 2.1. HÀM TRẢ VỀ MÀU "PHÂN LOẠI" (BADGE)
// ==========================================
function getStyleBadgeClass(style) {
    const normalized = (style || '').toString().trim().toLowerCase();
    switch (normalized) {
        case 'trừu tượng':
            return 'badge-style-abstract';
        case 'hiện đại':
            return 'badge-style-modern';
        case 'cổ điển':
            return 'badge-style-classic';
        case 'tối giản':
            return 'badge-style-minimal';
        default:
            return 'badge-style-default';
    }
}

function getFilteredArtworks() {
    if (currentStyleFilter === '__ALL__') return artworksList;
    return artworksList.filter(a => (a.style || '').toString().trim() === currentStyleFilter);
}

// ==========================================
// 3. HÀM HIỂN THỊ BẢNG QUẢN LÝ (RENDER)
// ==========================================

function renderAdminTable() {
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = '';

    let totalLikes = 0;

    // 1. Tính tổng like cho TẤT CẢ tác phẩm (để khối thống kê vẫn đúng)
    artworksList.forEach(art => {
        totalLikes += art.likes;
    });

    const filtered = getFilteredArtworks();

    // 2. Thuật toán cắt mảng lấy dữ liệu cho TRANG HIỆN TẠI
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filtered.slice(startIndex, endIndex);

    // 3. Đổ dữ liệu vào bảng
    currentItems.forEach(art => {
        const tr = document.createElement('tr');
        const dateString = art.createdAt ? new Date(art.createdAt).toLocaleDateString('vi-VN') : 'Chưa có';
        const statusBadge = art.status === 'Đã duyệt' ? 'bg-success' : 'bg-warning text-dark';
        const styleBadgeClass = getStyleBadgeClass(art.style);

        // ĐÂY CHÍNH LÀ ĐOẠN GIAO DIỆN BẢNG PHÓNG TO MÀ CHÚNG TA BỊ MẤT
        tr.innerHTML = `
           <td class="py-3">
                <img src="${art.image}" class="object-fit-cover shadow-sm" width="85" height="85" style="border-radius: 8px; border: 1px solid var(--border-gold);" alt="">
            </td>
            
            <td class="py-3" style="font-family: var(--font-serif); font-size: 1.2rem; font-weight: 500;">
                ${art.title}
            </td>
            
            <td class="py-3">
                <span class="badge-style ${styleBadgeClass}">
                    ${art.style || 'Chưa phân loại'}
                </span>
            </td>
            
            <td class="py-3">
                <span style="color: var(--gold-main); font-weight: 500;"><i class="fas fa-heart me-1"></i> ${art.likes}</span>
            </td>
            
            <td class="py-3 text-gray" style="font-size: 0.9rem;">
                ${dateString}
            </td>

            <td class="py-3">
                <span class="badge px-3 py-2 rounded-pill ${art.status === 'Đã duyệt' ? 'text-success border-success' : 'text-warning border-warning'}" style="background: transparent; border: 1px solid; font-weight: 500;">
                    ${art.status.toUpperCase()}
                </span>
            </td>
            
            <td class="py-3">
                <div class="d-flex align-items-center justify-content-end gap-2" style="padding-right: 0.5rem;">
                    <button class="btn btn-sm rounded-pill px-3" style="background: transparent; border: 1px solid var(--gold-main); color: var(--gold-main); transition: 0.3s; font-size: 0.85rem;" onmouseover="this.style.background='var(--gold-main)'; this.style.color='#000';" onmouseout="this.style.background='transparent'; this.style.color='var(--gold-main)';" onclick="openAdminModal('${art.id}')">
                        <i class="fas fa-edit me-1"></i> Sửa
                    </button>
                    <button class="btn btn-sm rounded-pill px-3" style="background: transparent; border: 1px solid #dc3545; color: #dc3545; transition: 0.3s; font-size: 0.85rem;" onmouseover="this.style.background='#dc3545'; this.style.color='#fff';" onmouseout="this.style.background='transparent'; this.style.color='#dc3545';" onclick="deleteArtworkHandler('${art.id}')">
                        <i class="fas fa-trash me-1"></i> Xóa
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Cập nhật thống kê trên thanh Toolbar
    document.getElementById('stat-total-artworks').innerText = artworksList.length;
    document.getElementById('stat-total-likes').innerText = totalLikes;

    // 4. Gọi hàm vẽ thanh phân trang (Pagination)
    renderPagination();
}

// ==========================================
// 4. HÀM ĐỔ DỮ LIỆU HỌA SĨ VÀO Ô CHỌN (SELECT)
// ==========================================
function populateArtistsSelect() {
    const select = document.getElementById('formArtistId');
    if (!select) return; // Bảo vệ: Nếu HTML không có ô select này thì thoát hàm để tránh lỗi

    // Kiểm tra xem API có trả về mảng dữ liệu hợp lệ không
    if (!Array.isArray(artistsList) || artistsList.length === 0) {
        select.innerHTML = '<option value="">Chưa có dữ liệu hoặc API lỗi</option>';
        return;
    }

    // Biến từng họa sĩ thành một thẻ <option> và nối chúng lại thành một chuỗi HTML dài
    select.innerHTML = artistsList.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
}

// ==========================================
// 5. HÀM MỞ MODAL ĐỂ THÊM HOẶC SỬA TÁC PHẨM
// ==========================================
function openAdminModal(id = null) {
    const form = document.getElementById('artworkForm');
    form.reset();
    clearFieldErrors();

    if (id) {
        const art = artworksList.find(a => a.id === id);
        if (!art) return;

        setAdminModalMode(true);
        document.getElementById('formId').value = art.id;
        document.getElementById('formTitle').value = art.title;
        document.getElementById('formArtistId').value = art.artistId;
        document.getElementById('formStyle').value = art.style;
        document.getElementById('formImage').value = art.image;
        document.getElementById('formDesc').value = art.description;
        document.getElementById('formStatus').value = art.status;
        updateImagePreview(art.image);
    } else {
        setAdminModalMode(false);
        document.getElementById('formId').value = '';
        updateImagePreview('');
    }

    adminModal.show();
}

// ==========================================
// 6. HÀM LƯU DỮ LIỆU KHI NHẤN "LƯU DỮ LIỆU"
// ==========================================
async function saveArtwork() {
    const id = document.getElementById('formId').value;

    const payload = {
        title: document.getElementById('formTitle').value.trim(),
        artistId: document.getElementById('formArtistId').value,
        style: document.getElementById('formStyle').value,
        image: document.getElementById('formImage').value.trim(),
        description: document.getElementById('formDesc').value.trim(),
        status: document.getElementById('formStatus').value,

        likes: id ? artworksList.find(a => a.id === id).likes : 0,
        liked: id ? artworksList.find(a => a.id === id).liked : false,

        createdAt: id ? artworksList.find(a => a.id === id).createdAt : new Date().toISOString()
    };

    if (id) {
        await api.updateArtwork(id, payload);
        showToast('Cập nhật thành công!');
    } else {
        await api.createArtwork(payload);
        showToast('Thêm mới thành công!');
    }

    document.getElementById('artworkForm').reset();
    clearFieldErrors();
    updateImagePreview('');
    document.getElementById('formId').value = '';

    adminModal.hide();
    artworksList = await api.getArtworks();
    renderAdminTable();
}

// ==========================================
// 7. HÀM XỬ LÝ KHI BẤM NÚT XÓA
// ==========================================
// HÀM XỬ LÝ KHI BẤM NÚT XÓA Ở BẢNG
function deleteArtworkHandler(id) {
    idToDelete = id; // Ghi nhớ ID của tác phẩm đang muốn xóa
    deleteModalInstance.show(); // Bật bảng hỏi "Bạn có chắc chắn..." lên
}

// ==========================================
// 8. CÁC HÀM XỬ LÝ GIAO DIỆN MỚI (TOAST & XÓA)
// ==========================================
let deleteModalInstance; // Biến lưu Modal Xóa
let idToDelete = null; // Biến nhớ xem đang bấm xóa tác phẩm nào

// Hàm hiển thị Toast thông báo xịn xò góc dưới bên phải
function showToast(message) {
    document.getElementById('toastMessage').innerText = message;
    const toastEl = document.getElementById('liveToast');
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 }); // Hiện 3 giây rồi tự tắt
    toast.show();
}

// Khởi tạo Modal Xóa và lắng nghe nút "Xóa ngay"
document.addEventListener('DOMContentLoaded', () => {
    deleteModalInstance = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

    document.getElementById('confirmDeleteBtn').addEventListener('click', async() => {
        if (idToDelete) {
            deleteModalInstance.hide(); // Tắt hộp thoại hỏi
            await api.deleteArtwork(idToDelete); // Gọi API xóa

            showToast('Đã xóa tác phẩm thành công!'); // Bật thông báo Toast thay cho alert

            artworksList = await api.getArtworks(); // Tải lại danh sách
            renderAdminTable(); // Vẽ lại bảng
            idToDelete = null; // Reset lại ID
        }
    });
});




// Hàm vẽ các con số 1, 2, 3...
function renderPagination() {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';

    // Tính tổng số trang cần có
    const filtered = getFilteredArtworks();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    // Nếu chỉ có 1 trang hoặc không có tác phẩm nào thì ẩn thanh phân trang
    if (totalPages <= 1) return;

    // Vẽ nút "Trước" (<)
    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    paginationContainer.innerHTML += `
        <li class="page-item ${prevDisabled}">
            <a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></a>
        </li>
    `;

    // Vẽ các nút số (1, 2, 3...)
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = currentPage === i ? 'active' : '';
        paginationContainer.innerHTML += `
            <li class="page-item ${activeClass}">
                <a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    // Vẽ nút "Sau" (>)
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';
    paginationContainer.innerHTML += `
        <li class="page-item ${nextDisabled}">
            <a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></a>
        </li>
    `;
}

// Hàm nhận lệnh khi người dùng bấm vào một số trang
function changePage(page) {
    const filtered = getFilteredArtworks();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    // Kiểm tra xem trang người dùng bấm có hợp lệ không
    if (page >= 1 && page <= totalPages) {
        currentPage = page; // Đổi số trang hiện tại
        renderAdminTable(); // Gọi vẽ lại bảng
    }
}