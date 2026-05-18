KHUNG LOGIC KỊCH BẢN VIDEO AI NÔNG NGHIỆP THÔNG MINH (VERSION 2.0)

Hướng dẫn này dùng để tạo kịch bản 75 cảnh cho sản xuất nông nghiệp quy mô công nghiệp, đảm bảo AI không làm biến đổi đối tượng (Identity Locking) và tuân thủ logic vật lý.

BƯỚC 1: XÁC ĐỊNH ĐỐI TƯỢNG VÀ TỪ KHÓA KHÓA (IDENTITY LOCKING)

Quy tắc vàng: Từ khóa chính của sản phẩm (ví dụ: "Salacca zalacca") PHẢI xuất hiện trong: Prompt hình ảnh, Hành động, Voice-over và Logic vật lý của MỖI CẢNH.

Mục tiêu: Ngăn AI biến quả táo thành quả cà chua giữa các khung hình.

BƯỚC 2: THIẾT LẬP DANH SÁCH HÌNH ẢNH THAM CHIẾU (REFERENCE IMAGES)

Trước khi viết kịch bản, phải định nghĩa danh sách hình ảnh (tối thiểu 15-20 ảnh). Mỗi ảnh nằm trên 1 hàng duy nhất:

Cấu trúc: Image XX: [Mô tả chi tiết về đối tượng, màu sắc, ánh sáng, chất liệu]

Cần có: Hạt giống, Cây con, Cây trưởng thành, Hoa, Quả xanh, Quả chín, Máy móc cụ thể, Drone cụ thể, Công nhân, Nhà máy.

BƯỚC 3: CẤU TRÚC PHÂN CẢNH 9 LỚP (MANDATORY TEMPLATE)

Mỗi cảnh phải nằm trên một dòng duy nhất. Các phần cách nhau bởi dấu gạch đứng |:

SCENE XX: Số thứ tự định dạng 01-75.

Visual Prompt: Style (realistic agri-tech), Lighting (golden hour/sunrise), Subject.

Action Title: Tên hành động ngắn gọn.

Visual Logic: [QUAN TRỌNG] Trích dẫn quy tắc vật lý từ Thư viện (xem Bước 4). Nếu có nhiều vật thể, phải ghi logic cho tất cả.

SOUND: Âm thanh môi trường chi tiết.

VO: Nội dung thuyết minh (Top 5 cảnh đầu luôn có VO, các cảnh sau tỷ lệ 1/3. Nếu không có, ghi VO: NO).

Vocal Tone: Đặc điểm giọng đọc (ghi VOCAL TONE: NO nếu VO trống).

CAMERA: Thuật ngữ điện ảnh chuyên nghiệp (Locked macro, High drone establishing shot...).

IMAGES: Mã tham chiếu ảnh (tối đa 3 mã: ví dụ Image 01, Image 15, Image 20).

BƯỚC 4: THƯ VIỆN LOGIC VẬT LÝ (PHYSICS LIBRARY)

Khi viết phần Visual Logic, phải trích dẫn các quy tắc sau:

Plant/Fruit: Quả phải dính vào cành (Attachment); Highlights di chuyển theo bề mặt (Surface behavior).

Machinery: Máy chỉ chạy tiến (Forward); Chỉ chạy giữa hai hàng cây, không đè lên cây (Direction of movement).

Drones: Cánh quạt có motion blur; Luồng gió làm rung lá (Propeller effects); Quỹ đạo mượt (Flight path).

Robotics: Chỉ sử dụng Robot trong nhà máy (Nursery/Factory); Chuyển động tại khớp nối (Joint motion).

Water: Nước chỉ ra từ vòi (Source constraint); Làm tối màu đất khi tiếp xúc (Moisture response).

BƯỚC 5: QUY TẮC CÔNG NGHỆ ĐẶC THÙ

Drone: Sử dụng chính xác tên model (DJI Agras T50, DJI Agras T25P, GlobalCheck G700).

Máy lớn: Sử dụng thuật ngữ "Giant Agricultural Machine" cho các cảnh hạ tầng/trồng cây.

Trình tự trồng: Luôn có cảnh máy đào hố (Auger type) trước cảnh máy đặt cây (Planter type).

Số lượng (Multiplicity): Cảnh rộng dùng 4-5 máy/drone; Cảnh hẹp dùng 2-3.

BƯỚC 6: CẤU TRÚC VÒNG ĐỜI CÔNG NGHIỆP (INDUSTRIAL LIFECYCLE)

Kịch bản 75 cảnh phải đi theo lộ trình:

Hook (1-3): Cảnh quả chín đẹp nhất.

Propagation (Nursery): Hạt giống, nhà máy, robot.

Infrastructure: San lấp, đào hố, lắp tưới.

Establishment: Trồng cây tự động.

Maintenance: Drone phun thuốc, máy cắt cỏ, bón phân.

Growth: Ra lá, hoa, đậu quả.

Harvest: Thu hoạch thủ công/máy.

Post-harvest: Rửa, phân loại quang học, đóng gói, vận chuyển.

Conclusion: Toàn cảnh trang trại lúc hoàng hôn.

Ghi chú kiểm tra lỗi (QA):

Có bị "clipping" (vật thể xuyên qua nhau) không?

Bóng đổ có nhất quán với hướng nắng không?

Tên sản phẩm đã có trong tất cả các mục của cảnh chưa?

### Cách sử dụng hướng dẫn này:

Lần tới, bạn chỉ cần gửi cho tôi tệp này (hoặc nội dung này) và nói: **"Hãy viết kịch bản cho [Tên cây] dựa trên Framework này"**. Tôi sẽ tự động triển khai chính xác các bước mà không cần giải thích lại.

Bạn có muốn tôi áp dụng khung hướng dẫn này để tối ưu thêm bất kỳ phần nào của kịch bản _Salacca zalacca_ hiện tại không?
