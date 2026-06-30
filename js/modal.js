// Khai báo biến toàn cục để lưu trữ đối tượng Modal của Bootstrap
let detailModal;

// Lắng nghe sự kiện: Đợi toàn bộ file HTML tải xong thì mới bắt đầu chạy đoạn code bên trong
document.addEventListener('DOMContentLoaded', () => {
    // Tìm thẻ HTML có id là 'artworkModal' và khởi tạo nó thành một Modal của Bootstrap
    // Gán kết quả vào biến detailModal để có thể gọi lệnh mở/đóng sau này
    detailModal = new bootstrap.Modal(document.getElementById('artworkModal'));
});

// Hàm được gọi khi người dùng bấm vào một tác phẩm để xem chi tiết
function openArtworkModal(id) {

    // Tìm kiếm trong mảng artworksData xem có tác phẩm nào mang ID trùng khớp không
    const art = artworksData.find(a => a.id === id);

    // Tìm kiếm thông tin họa sĩ dựa trên artistId của tác phẩm. 
    // Nếu không tìm thấy, tạo một dữ liệu dự phòng (Unknown và ảnh placeholder) để tránh lỗi
    const artist = artistsData.find(a => a.id === art.artistId) || { name: 'Unknown', avatar: 'https://via.placeholder.com/50' };

    // Kiểm tra xem tác phẩm có ngày tạo (createdAt) không.
    // Nếu có, chuyển đổi sang định dạng ngày tháng của Việt Nam (DD/MM/YYYY), nếu không thì in chữ 'Đang cập nhật'
    const dateStr = art.createdAt ? new Date(art.createdAt).toLocaleDateString('vi-VN') : 'Đang cập nhật';

    // Gán chuỗi ngày tháng vừa xử lý vào thẻ HTML hiển thị ngày
    document.getElementById('modalDate').innerText = dateStr;

    // Kiểm tra an toàn: Nếu thực sự tìm thấy tác phẩm (art không bị rỗng/undefined) thì mới làm các bước tiếp theo
    if (art) {
        // Lấy dữ liệu từ đối tượng 'art' và 'artist' để gán vào các thẻ HTML tương ứng trong Modal
        document.getElementById('modalImage').src = art.image; // Gán link ảnh
        document.getElementById('modalImage').parentElement.style.backgroundImage = `url('${art.image}')`;
        document.getElementById('modalTitle').innerText = art.title; // Gán tiêu đề
        const modalStyleEl = document.getElementById('modalStyle');
        if (modalStyleEl) {
            if (art.style && typeof getStyleTagClass === 'function') {
                modalStyleEl.className = `${getStyleTagClass(art.style)} mb-3 align-self-start`;
                modalStyleEl.textContent = art.style;
                modalStyleEl.classList.remove('d-none');
            } else {
                modalStyleEl.className = 'd-none';
                modalStyleEl.textContent = '';
            }
        }
        document.getElementById('modalDesc').innerText = art.description; // Gán mô tả/câu chuyện
        document.getElementById('modalArtistName').innerText = artist.name; // Gán tên họa sĩ
        document.getElementById('modalArtistAvatar').src = artist.avatar; // Gán ảnh đại diện họa sĩ

        // Sau khi đã đổ đầy đủ dữ liệu, dùng lệnh show() để hiển thị Modal lên màn hình
        detailModal.show();
    }
}