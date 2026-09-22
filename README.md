# NailSpace — demo quản lý tiệm nail

Website demo (UI only) cho hệ thống quản lý tiệm nail, dựng bằng Next.js từ
các file thiết kế HTML có sẵn trong repo.

## Chạy local

```bash
cd web
npm install
npm run dev
```

Mở http://localhost:3000

## Các trang

| Route | Màn hình |
| --- | --- |
| `/` | Landing page cho khách |
| `/login` | Đăng nhập phân quyền |
| `/dashboard` | Dashboard chủ tiệm |
| `/quan-ly` | Dashboard quản lý ca |
| `/nhan-vien-dashboard` | Dashboard nhân viên |
| `/don-hang` | Danh sách đơn hàng |
| `/tao-don` | Tạo và cập nhật đơn |
| `/dich-vu` | Danh sách dịch vụ |
| `/khach-hang` | Quản lý khách hàng |
| `/nhan-vien` | Nhân viên và chấm công |
| `/gallery` | Gallery mẫu móng |
| `/zalo-oa` | Tin nhắn Zalo OA |

## Cấu trúc

Các thư mục `*-html/` ở gốc repo là **file thiết kế gốc** (design mockup dạng
`x-dc` template). Chúng là nguồn dữ liệu, không phải code chạy.

`scripts/convert.mjs` đọc các file đó, chạy phần `renderVals()` của thiết kế,
expand template (`{{...}}`, `<sc-for>`, `<sc-if>`) thành HTML tĩnh và đổi link
`*.dc.html` thành route Next.js. Kết quả ghi vào `web/src/generated/`.

Script này chạy tự động trong `npm run build`. Muốn chạy riêng:

```bash
node scripts/convert.mjs
```

> Sửa thiết kế thì sửa file `*.dc.html` rồi chạy lại converter —
> **không sửa tay** trong `web/src/generated/`.

## Deploy

Repo đã có `vercel.json`. Import repo vào Vercel là deploy được ngay,
không cần cấu hình thêm.
