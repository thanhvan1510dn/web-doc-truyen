# Dự án Hệ thống Web Đọc Truyện & Admin Portal

## Kiến trúc Hệ thống
1. **User Web (`/web-doc-truyen`)**:
   - Giao diện đọc truyện hiện đại: Chế độ sáng/tối/sepia/midnight, tùy chỉnh cỡ chữ, dòng, phông chữ.
   - Tìm kiếm, lọc thể loại, hiển thị mục lục phân quyển linh hoạt.
   - Hỗ trợ đường link động trong phần Văn án.

2. **Admin Portal (`/admin-web-doc-truyen`)**:
   - Quản trị nội dung: Thêm/sửa/xóa truyện, quản lý quyển và chương.
   - Trích xuất tự động qua Studio Document Parser (hỗ trợ .pdf, .docx, .txt).
   - Thống kê lượt đọc và tương tác.

3. **Cơ sở dữ liệu đám mây (Google Cloud Firestore)**:
   - Project ID: `web-truyen-6bac3`
   - Collection chính: `stories` (Mỗi document chứa metadata truyện, danh sách `volumes` và các `chapters`).
   - Thời gian thực (Real-time listener `onSnapshot`): Tự động đồng bộ <0.1s giữa Admin và User Web.