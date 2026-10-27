# Gọn — YouTube & TikTok mini player

Trình phát gọn nhẹ bằng tiếng Việt. Dán link video để mở player nổi, hoặc chọn Mở TikTok để lướt trang TikTok trong cửa sổ nhỏ có thể đổi kích thước.

## Cách dùng

1. Mở GitHub Pages bằng Chrome hoặc Edge trên máy tính.
2. Dán link YouTube/mã nhúng, link video TikTok đầy đủ như `https://www.tiktok.com/@creator/video/1234567890`, hoặc link hồ sơ như `https://www.tiktok.com/@creator`.
3. App mở video TikTok trong cửa sổ dọc nhỏ; link hồ sơ mở thẻ video của creator để cuộn ngang. Video YouTube mở trong cửa sổ ngang.
4. Dùng điều khiển trên trang chính để phát/tạm dừng, tua, chỉnh âm lượng và tốc độ phát, khóa thao tác hoặc chuyển bài trong playlist YouTube.
5. Dùng thanh trượt để chỉnh độ trong suốt. Với TikTok có thêm thanh **Thu nhỏ màn hình** (40%–100%).

## Ghi chú

- Video và hồ sơ TikTok dùng Embed Player/Creator Profile Embed chính thức của TikTok; không cần API key.
- Với YouTube, app ưu tiên phụ đề tiếng Việt và có công tắc bật/tắt trên trang chính nếu video có phụ đề.
- API nhúng không cho app đổi track lồng tiếng. Tốc độ phát thay đổi theo các mức mà video đó hỗ trợ.
- YouTube IFrame API không có lệnh bỏ qua quảng cáo; app không thể thêm nút bỏ qua quảng cáo hoạt động trong player nhúng. Nếu YouTube hiện nút bỏ qua gốc, hãy dùng nút đó trong player. Player nhúng không có API chính thức để ép chọn track lồng tiếng Việt; lựa chọn giọng đọc vẫn do YouTube quyết định theo video và tùy chọn người xem.
- Thẻ hồ sơ TikTok cho phép cuộn qua các video của creator trên máy tính. Đây không phải bảng tin For You vô hạn.
- Player TikTok hỗ trợ phát/tạm dừng, tua, tắt/bật tiếng và video liên quan. API nhúng chỉ cho phép tắt/bật tiếng, không chỉnh mức âm lượng chính xác; thanh âm lượng hoạt động như nút tắt/bật tiếng với TikTok.
- Link TikTok rút gọn có thể không chứa mã video. Hãy dùng link đầy đủ dạng `@creator/video/ID` hoặc hồ sơ `@creator`.
- Cửa sổ nổi chỉ hiển thị player; điều khiển nằm trên trang chính. Khóa thao tác sẽ chặn click vào video; thanh tiêu đề và nút cửa sổ do trình duyệt quản lý.
- App phát trực tiếp từ nền tảng gốc và không tải video.

## YouTube Shorts (lướt gọn)

- Dán link Shorts như `https://www.youtube.com/shorts/ID`: video mở trong cửa sổ nổi **dọc** (270×480), luôn nằm trên cùng, có thanh **Độ trong suốt** và **Thu nhỏ màn hình**.
- Dán **nhiều link** cùng lúc (mỗi link một dòng hoặc cách nhau bằng dấu cách) để tạo hàng đợi: clip tự chuyển khi hết, hoặc dùng nút trước/sau trên trang chính. Tiêu đề hiện vị trí dạng `2/5`.
- Playlist Shorts (`youtube.com/playlist?list=...`) cũng dùng được với nút trước/sau.
- YouTube không cho nhúng bảng tin Shorts đề xuất nên cần tự dán link hoặc dùng playlist.
- Thư mục `tiktok-overlay-extension` không còn cần cho Shorts; link video TikTok nhúng vẫn dùng được như trước.
