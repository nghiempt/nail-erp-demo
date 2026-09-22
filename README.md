# NailSpace — demo quản lý tiệm nail

Website demo (UI only) cho hệ thống quản lý tiệm nail, dựng bằng Next.js từ
các file thiết kế HTML có sẵn.

## Chạy local

```bash
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

```
designs/          file thiết kế gốc (nguồn dữ liệu, không phải code chạy)
scripts/
  convert.mjs     sinh trang Next.js từ designs/
src/
  app/            routes
  components/     Artboard
  generated/      HTML sinh ra tự động — KHÔNG sửa tay
```

`designs/` chứa thiết kế dạng `x-dc` template. `scripts/convert.mjs` đọc
chúng, chạy phần `renderVals()` của thiết kế, expand template (`{{...}}`,
`<sc-for>`, `<sc-if>`) thành HTML tĩnh, gắn nhãn vai trò cho từng phần tử
(dùng cho responsive) và đổi link `*.dc.html` thành route Next.js.

Script chạy tự động trong `npm run build`. Chạy riêng:

```bash
npm run convert
```

> Sửa thiết kế thì sửa file trong `designs/` rồi chạy lại converter —
> **không sửa tay** trong `src/generated/`.

## Responsive

Desktop từ 1440px giữ nguyên 100% như thiết kế. Dưới mức đó
`src/app/responsive.css` reflow lại: sidebar thành drawer, grid co về 1 cột,
bảng cuộn ngang, panel phải xuống dưới.

## Deploy

Import repo vào Vercel là xong — Next.js ở thư mục gốc nên Vercel tự nhận,
không cần cấu hình gì thêm.
