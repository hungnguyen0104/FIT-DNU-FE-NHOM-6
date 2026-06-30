// ==========================================
// 1. CẤU HÌNH ĐƯỜNG DẪN API (URL)
// ==========================================
// Biến lưu trữ đường link gốc của MockAPI.
// Có thể override bằng localStorage key: ag_api_base_url (để user tự dán link trong UI)
var API_BASE_URL_DEFAULT = "https://69fc37acfce564e259177add.mockapi.io";
var API_BASE_URL = (function () {
    try {
        var saved = localStorage.getItem("ag_api_base_url");
        return saved && saved.trim() ? saved.trim() : API_BASE_URL_DEFAULT;
    } catch (e) {
        return API_BASE_URL_DEFAULT;
    }
})();

// Biến lưu trữ các đường dẫn cụ thể (endpoints) cho từng loại dữ liệu.
var USERS_ENDPOINT_FULL = (function () {
    try {
        var saved = localStorage.getItem("ag_users_endpoint_full");
        return saved && saved.trim() ? saved.trim().replace(/\/+$/, "") : "https://6a1809b61878294b597c46d8.mockapi.io/user";
    } catch (e) {
        return "https://6a1809b61878294b597c46d8.mockapi.io/user";
    }
})();

var ENDPOINTS = {
    artworks: API_BASE_URL + "/artworks", // Đường link để lấy/thêm/sửa/xóa tác phẩm
    artists: API_BASE_URL + "/artists",   // Đường link để lấy danh sách họa sĩ
    // Users endpoint can be configured as full URL (e.g. https://xxx.mockapi.io/user)
    users: USERS_ENDPOINT_FULL ? USERS_ENDPOINT_FULL : (API_BASE_URL + "/users"),
};

// ==========================================
// 2. CÁC HÀM TIỆN ÍCH DÙNG CHUNG (UTILS)
// ==========================================

// Hàm kiểm tra và xử lý kết quả trả về từ server
function handleResponse(response, errorMessage) {
    // Nếu kết quả trả về bị lỗi (mã lỗi 400, 404, 500...), response.ok sẽ là false
    if (!response.ok) {
        alert(errorMessage || "Yêu cầu thất bại"); // Hiện thông báo lỗi cho người dùng
        throw new Error(errorMessage || "Yêu cầu thất bại"); // Ném ra lỗi để chặn tiến trình chạy tiếp
    }
    // Nếu thành công (mã 200, 201), chuyển đổi dữ liệu từ dạng JSON sang Object Javascript
    return response.json();
}

// Bật tắt loading
function showLoader() {
    const loader = document.getElementById("loader-overlay");
    if (loader) loader.style.display = "flex"; // Dùng flex để giữ thẻ con luôn căn giữa
}

function hideLoader() {
    const loader = document.getElementById("loader-overlay");
    if (loader) loader.style.display = "none";
}

// ==========================================
// 3. CÁC HÀM TƯƠNG TÁC VỚI CƠ SỞ DỮ LIỆU (API CALLS)
// ==========================================

// Hàm lấy danh sách toàn bộ tác phẩm nghệ thuật (Method mặc định của fetch là GET)
function getArtworks() {
    showLoader(); // Bật loading trước khi gọi API
    return fetch(ENDPOINTS.artworks)
        .then(function (response) {
            return handleResponse(response, "Không thể lấy danh sách tác phẩm");
        })
        .catch(function (error) {
            throw error; // Nếu có lỗi mạng hoặc server chết, bắt lỗi tại đây
        })
        .finally(hideLoader); // .finally luôn chạy cuối cùng dù thành công hay thất bại để tắt loading
}


// Hàm lấy danh sách toàn bộ họa sĩ (Đã chuyển sang jQuery AJAX )
function getArtists() {
    showLoader(); // Vẫn giữ lệnh bật loading

    return $.ajax({
        url: ENDPOINTS.artists,
        method: 'GET',
        dataType: 'json'
    }).always(function () {
        hideLoader(); // Lệnh .always() của jQuery tương đương với .finally() của fetch (luôn chạy để tắt loading)
    });
}

// ===== USERS (for auth) =====
function getUsers() {
    showLoader();
    return fetch(ENDPOINTS.users)
        .then(function (response) {
            return handleResponse(response, "Không thể lấy danh sách người dùng");
        })
        .catch(function (error) {
            throw error;
        })
        .finally(hideLoader);
}

function createUser(data) {
    showLoader();
    return fetch(ENDPOINTS.users, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(function (response) {
            return handleResponse(response, "Không thể tạo tài khoản");
        })
        .catch(function (error) {
            throw error;
        })
        .finally(hideLoader);
}

// Hàm thêm mới một tác phẩm vào database (Cần dùng method POST)
function createArtwork(data) {
    showLoader();
    return fetch(ENDPOINTS.artworks, {
        method: "POST", // Báo cho server biết đây là hành động tạo mới
        headers: {
            "Content-Type": "application/json", // Khai báo định dạng dữ liệu gửi lên là JSON
        },
        body: JSON.stringify(data), // Chuyển đổi dữ liệu từ form (Javascript Object) thành chuỗi JSON
    })
        .then(function (response) {
            return handleResponse(response, "Không thể thêm tác phẩm mới");
        })
        .catch(function (error) {
            throw error;
        })
        .finally(hideLoader);
}

// Hàm cập nhật (chỉnh sửa) một tác phẩm đã có (Cần dùng method PUT và truyền thêm ID)
// Thêm tham số isSilent (nếu là true thì sẽ KHÔNG hiện loading)
function updateArtwork(id, data, isSilent) {
    if (!isSilent) {
        showLoader(); // Chỉ hiện loading nếu không phải chạy ngầm
    }

    return fetch(ENDPOINTS.artworks + "/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(function (response) {
            return handleResponse(response, "Không thể cập nhật tác phẩm");
        })
        .catch(function (error) {
            throw error;
        })
        .finally(function () {
            if (!isSilent) {
                hideLoader(); // Chỉ tắt loading nếu trước đó có bật
            }
        });
}

// Hàm xóa một tác phẩm khỏi database (Cần dùng method DELETE và truyền ID)
function deleteArtwork(id) {
    showLoader();
    return fetch(ENDPOINTS.artworks + "/" + id, {
        method: "DELETE", // Báo cho server biết đây là hành động xóa
    })
        .then(function (response) {
            return handleResponse(response, "Không thể xóa tác phẩm");
        })
        .catch(function (error) {
            throw error;
        })
        .finally(hideLoader);
}

// ==========================================
// 4. XUẤT RA OBJECT ĐỂ CÁC FILE KHÁC (app.js, admin.js) SỬ DỤNG
// ==========================================
// Gom tất cả các hàm ở trên vào một biến 'api'. 
// Khi ở file khác muốn dùng, ta chỉ cần gọi: api.getArtworks(), api.createArtwork(), v.v...
var api = {
    getArtworks: getArtworks,
    getArtists: getArtists,
    createArtwork: createArtwork,
    updateArtwork: updateArtwork,
    deleteArtwork: deleteArtwork,
    getUsers: getUsers,
    createUser: createUser,
    getBaseUrl: function () { return API_BASE_URL; },
    getUsersEndpoint: function () { return ENDPOINTS.users; },
    setBaseUrl: function (url) {
        if (!url || !url.trim()) throw new Error("Link MockAPI không hợp lệ");
        var cleaned = url.trim().replace(/\/+$/, "");
        localStorage.setItem("ag_api_base_url", cleaned);
        location.reload();
    },
    setUsersEndpointFull: function (url) {
        if (!url || !url.trim()) throw new Error("Link users endpoint không hợp lệ");
        var cleaned = url.trim().replace(/\/+$/, "");
        localStorage.setItem("ag_users_endpoint_full", cleaned);
        location.reload();
    },
    resetBaseUrl: function () {
        localStorage.removeItem("ag_api_base_url");
        location.reload();
    }
};