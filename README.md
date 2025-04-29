# Đổi tên file tự động

Ứng dụng web giúp đổi tên file ảnh và file nhãn JSON theo định dạng tùy chỉnh một cách nhanh chóng và hiệu quả.

![Đổi tên file tự động](/placeholder.svg?height=300&width=600&query=screenshot%20of%20file%20renaming%20application)

## Tính năng chính

- Đổi tên file ảnh (.jpg) và file nhãn (.json) theo định dạng `tên-sản-phẩm_mặt_số-thứ-tự`
- Tự động cập nhật đường dẫn ảnh trong file JSON
- Xem trước ảnh và tên file mới trước khi đổi tên
- Hỗ trợ phím tắt để tăng tốc quy trình làm việc
- Tự động trích xuất số thứ tự từ tên file gốc
- Tải xuống tất cả file đã đổi tên dưới dạng file ZIP
- Lưu lịch sử đổi tên để theo dõi và tham khảo

## Cách sử dụng

1. Chọn thư mục chứa hai thư mục con 'images' và 'labels'
2. Nhập tên sản phẩm, chọn mặt (F/B) và số thứ tự
3. Nhấn "Đổi tên file" để đổi tên file hiện tại
4. Tải xuống các file đã đổi tên hoặc tiếp tục đổi tên các file khác
5. Sau khi hoàn thành, nhấn "Tải xuống tất cả" để tải về một file ZIP chứa tất cả file đã đổi tên

## Phím tắt

- `Ctrl + →` - Di chuyển đến file tiếp theo
- `Ctrl + ←` - Di chuyển đến file trước đó
- `Ctrl + S` - Đổi tên file hiện tại
- `Ctrl + F` - Chọn mặt trước (Front)
- `Ctrl + B` - Chọn mặt sau (Back)
- `Ctrl + Enter` - Đổi tên file hiện tại

## Yêu cầu kỹ thuật

- Trình duyệt web hiện đại (Chrome, Firefox, Edge, Safari)
- Kết nối internet để tải các thư viện cần thiết

## Cài đặt và chạy

### Phương pháp 1: Sử dụng trực tiếp từ GitHub Pages

Truy cập ứng dụng tại: [https://yourusername.github.io/image-label-renamer](https://yourusername.github.io/image-label-renamer)

### Phương pháp 2: Chạy trên máy tính cá nhân

1. Clone repository:
\`\`\`bash
git clone https://github.com/yourusername/image-label-renamer.git
\`\`\`

2. Di chuyển vào thư mục dự án:
\`\`\`bash
cd image-label-renamer
\`\`\`

3. Cài đặt các gói phụ thuộc:
\`\`\`bash
npm install
\`\`\`

4. Chạy ứng dụng:
\`\`\`bash
npm run dev
\`\`\`

5. Mở trình duyệt và truy cập: `http://localhost:3000`

## Lưu ý

- Do giới hạn bảo mật của trình duyệt, các file đã đổi tên cần được tải xuống thủ công
- Ứng dụng chỉ xử lý các file ảnh .jpg và file nhãn .json

## Bản quyền

© 2023 Hà Trọng Nguyễn. Tất cả các quyền được bảo lưu.

## Giấy phép

MIT License
