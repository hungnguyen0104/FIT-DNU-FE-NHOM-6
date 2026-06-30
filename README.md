# Lớp 19-08 — Nhóm 6

| Thành viên | MSSV |
|------------|------|
| Nguyễn Minh Hưng | 1971020214 |
| Nguyễn Xuân Hưng | 1971020215 |
| Trần Khánh Hùng | 1971020206 |

## Demo

- **GitHub Pages:** https://hungnguyen0104.github.io/FIT-DNU-FE-NHOM-6/
- **Vercel:** _(cập nhật link sau khi deploy — Import repo GitHub → Framework Preset: Other → Deploy)_

## MockAPI.io

| Resource | Endpoint |
|----------|----------|
| Artworks | `https://69fc37acfce564e259177add.mockapi.io/artworks` |
| Artists | `https://69fc37acfce564e259177add.mockapi.io/artists` |
| Users | `https://6a1809b61878294b597c46d8.mockapi.io/user` |

**Schema `artworks`:** `id`, `title`, `image`, `artistId`, `style`, `description`, `status`, `likes`, `liked`, `createdAt`

## Tài khoản demo

- **Admin:** `admin` / `admin123` (trang Quản trị)
- **User:** đăng ký mới qua trang Đăng nhập (lưu trên MockAPI `/user`)

## Deploy lên Vercel

1. Push code lên GitHub (repository public).
2. Vào [vercel.com](https://vercel.com) → **Add New Project** → chọn repo.
3. Root Directory: thư mục chứa `index.html` (nếu repo nằm trong subfolder thì chọn đúng folder).
4. Framework Preset: **Other** → Deploy.
5. Copy link `*.vercel.app` vào mục Demo ở trên.
