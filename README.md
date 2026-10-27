# Gọn — YouTube Picture-in-Picture

Trình phát YouTube tiếng Việt. Dán liên kết video để mở video trong cửa sổ nổi Picture-in-Picture; cửa sổ chỉ hiển thị hình ảnh video, không có thanh điều hướng.

## Dùng thử

1. Mở trang GitHub Pages bằng Chrome hoặc Edge trên máy tính.
2. Dán link YouTube hoặc toàn bộ mã `<iframe>` vào ô nhập. App sẽ thử mở cửa sổ nổi và phát video ngay.
3. Di chuột vào cửa sổ nổi để hiện nút video trước/tiếp, phát/tạm dừng, âm lượng và khóa thao tác.\n4. Nút tiếp theo chỉ hoạt động khi link/mã nhúng có playlist.\n5. Đóng cửa sổ nổi để quay lại app.
6. Dùng thanh trượt trong app để chỉnh độ trong suốt của video; độ mờ hướng về nền đen của cửa sổ nổi.\n7. Có thể cài ứng dụng từ trình duyệt rồi ghim vào taskbar.

## Xuất bản

GitHub Actions xuất bản website từ nhánh `main`. Trong **Settings → Pages**, chọn **GitHub Actions** làm nguồn xuất bản nếu Pages chưa được bật cho repository.

## Ghi chú\n\n- Khóa thao tác sẽ ẩn điều khiển và chặn chuột trên video; mở khóa bằng nút trong app chính hoặc nút khóa trong cửa sổ. Nó không biến cửa sổ thành click-through để bấm ứng dụng phía sau.\n- Video trước/tiếp chỉ có khi nguồn là playlist.\n\n- Chrome/Edge luôn giữ một phần thanh điều khiển nhận diện website trong cửa sổ Picture-in-Picture; website không thể ẩn tên miền đó.

- Cửa sổ nổi dùng Document Picture-in-Picture, hiện cần Chrome hoặc Edge trên máy tính. Kích thước và khả năng thay đổi kích thước do trình duyệt quản lý; không thể cam kết thu nhỏ đến mọi kích thước tùy ý.
- Một số video/nhúng YouTube có giới hạn kích thước trình phát và có thể không phát được trong cửa sổ quá nhỏ.
- Điều khiển media của Windows tùy thuộc vào hỗ trợ Media Session API của trình duyệt.
- Ứng dụng phát video từ YouTube, không tải hoặc lưu nội dung video.
