# Gọn — YouTube & TikTok mini player

Trình phát gọn nhẹ bằng tiếng Việt. Dán link video để mở player nổi, hoặc chọn Mở TikTok để lướt trang TikTok trong cửa sổ nhỏ có thể đổi kích thước.

## Cách dùng

1. Mở GitHub Pages bằng Chrome hoặc Edge trên máy tính.
2. Dán link YouTube/mã nhúng, link video TikTok đầy đủ như `https://www.tiktok.com/@creator/video/1234567890`, hoặc link hồ sơ như `https://www.tiktok.com/@creator`.
3. App mở video TikTok trong cửa sổ dọc nhỏ; link hồ sơ mở thẻ video của creator để cuộn ngang. Video YouTube mở trong cửa sổ ngang.
4. Dùng điều khiển trên trang chính để phát/tạm dừng, tua, chỉnh âm lượng và tốc độ phát, khóa thao tác hoặc chuyển bài trong playlist YouTube.
5. Dùng thanh trượt để chỉnh độ trong suốt. Với TikTok có thêm thanh **Thu nhỏ màn hình** (40%–100%).

## Ghi chú

- Nút Mở TikTok để lướt mở trang chủ TikTok trong cửa sổ popup dọc 420×760, có thể đổi kích thước. Cửa sổ này hiển thị toàn bộ trang TikTok nhưng không phải cửa sổ luôn nổi.

- Video và hồ sơ TikTok dùng Embed Player/Creator Profile Embed chính thức của TikTok; không cần API key.
- Với YouTube, app ưu tiên phụ đề tiếng Việt và có công tắc bật/tắt trên trang chính nếu video có phụ đề.
- API nhúng không cho app đổi track lồng tiếng. Tốc độ phát thay đổi theo các mức mà video đó hỗ trợ.
- YouTube IFrame API không có lệnh bỏ qua quảng cáo; app không thể thêm nút bỏ qua quảng cáo hoạt động trong player nhúng. Nếu YouTube hiện nút bỏ qua gốc, hãy dùng nút đó trong player. Player nhúng không có API chính thức để ép chọn track lồng tiếng Việt; lựa chọn giọng đọc vẫn do YouTube quyết định theo video và tùy chọn người xem.
- Thẻ hồ sơ TikTok cho phép cuộn qua các video của creator trên máy tính. Đây không phải bảng tin For You vô hạn.
- Player TikTok hỗ trợ phát/tạm dừng, tua, tắt/bật tiếng và video liên quan. API nhúng chỉ cho phép tắt/bật tiếng, không chỉnh mức âm lượng chính xác; thanh âm lượng hoạt động như nút tắt/bật tiếng với TikTok.
- Link TikTok rút gọn có thể không chứa mã video. Hãy dùng link đầy đủ dạng `@creator/video/ID` hoặc hồ sơ `@creator`.
- Cửa sổ nổi chỉ hiển thị player; điều khiển nằm trên trang chính. Khóa thao tác sẽ chặn click vào video; thanh tiêu đề và nút cửa sổ do trình duyệt quản lý.
- App phát trực tiếp từ nền tảng gốc và không tải video.

## Thu nhỏ & độ trong suốt cho trang tiktok.com (tiện ích)

Nút **Mở TikTok để lướt** mở trang tiktok.com thật. Vì là domain khác (và TikTok chặn nhúng iframe), trang Gọn không thể chỉnh trang đó. Thư mục `tiktok-overlay-extension/` là tiện ích Chrome/Edge nhỏ để làm việc này ngay trên cửa sổ TikTok:

1. Mở `chrome://extensions` (hoặc `edge://extensions`), bật **Chế độ nhà phát triển**.
2. Chọn **Tải tiện ích đã giải nén** và trỏ tới thư mục `tiktok-overlay-extension`.
3. Mở TikTok từ Gọn. Bấm nút tròn ◐ ở góc dưới bên phải để hiện hai thanh trượt: **Thu nhỏ màn hình** (40%–100%, zoom thật của trình duyệt) và **Độ trong suốt** (0%–90%). Cài đặt được lưu lại.

Ghi chú: độ trong suốt làm mờ nội dung về nền đen (giống phần YouTube), không xuyên thấu ra màn hình desktop.

Từ phiên bản 1.1.0, tiện ích còn giữ video TikTok **tiếp tục phát** khi cửa sổ TikTok bị che, bị thu nhỏ hoặc bạn chuyển sang tab/cửa sổ khác (TikTok vốn tự dừng khi trình duyệt báo trang bị ẩn). Sau khi cập nhật, vào `chrome://extensions` bấm **Tải lại** cho tiện ích rồi mở lại cửa sổ TikTok.

Thanh tiêu đề của cửa sổ popup (biểu tượng + nút thu nhỏ/phóng to/đóng) do trình duyệt vẽ nên web hoặc tiện ích không gỡ được; đây đã là dạng tối giản nhất.

## Ghim TikTok luôn trên cùng (tiện ích v1.3.0)

1. Cài tiện ích trong `tiktok-overlay-extension` (xem phần trên) và bấm **Tải lại** sau mỗi lần cập nhật.
2. Bấm **Mở TikTok để lướt** trên Gọn. Một cửa sổ nhỏ mở ra (trang `tiktok.com/robots.txt`) với nút **📌 Ghim TikTok**.
3. Bấm nút đó: TikTok mở trong cửa sổ nổi (Picture-in-Picture) **luôn nằm trên cùng**, không có thanh địa chỉ, giống cửa sổ YouTube.
4. Trong cửa sổ nổi, bấm **◐** ở góc trên bên phải để chỉnh **Thu nhỏ màn hình** và **Độ trong suốt**.
5. Thu nhỏ (đừng đóng) cửa sổ nhỏ ban đầu: cửa sổ nổi sẽ đóng theo nếu nó bị đóng.

Cửa sổ nổi thuộc cùng domain tiktok.com nên TikTok cho phép nhúng và giữ đăng nhập. Nút **TikTok popup** vẫn mở cửa sổ TikTok thường (không ghim được).
