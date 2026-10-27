# Gọn — YouTube Picture-in-Picture

Trình phát YouTube web tiếng Việt, có nút đưa video vào cửa sổ nổi luôn trên các ứng dụng khác.

## Dùng thử

1. Mở trang GitHub Pages bằng Chrome hoặc Edge trên máy tính.
2. Dán liên kết YouTube và chọn **Phát**.
3. Chọn **Cửa sổ nổi** để tách video ra cửa sổ Picture-in-Picture. Đóng cửa sổ nổi để đưa video trở lại trang.
4. Có thể cài ứng dụng từ trình duyệt rồi ghim vào taskbar.

## Xuất bản

GitHub Actions xuất bản website từ nhánh `main`. Trong **Settings → Pages**, chọn **GitHub Actions** làm nguồn xuất bản nếu Pages chưa được bật cho repository.

## Ghi chú

- Cửa sổ nổi dùng Document Picture-in-Picture, hiện cần Chrome hoặc Edge trên máy tính. Cửa sổ do trình duyệt quản lý; người dùng có thể di chuyển và đổi kích thước theo khả năng của trình duyệt.
- Điều khiển media của Windows tùy vào hỗ trợ Media Session API của trình duyệt.
- Video phát từ YouTube. Một số video không cho nhúng và sẽ không phát trong app.
- Ứng dụng không tải hoặc lưu video.
