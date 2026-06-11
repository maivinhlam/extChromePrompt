# **KHUNG LOGIC KỊCH BẢN VIDEO AI NÔNG NGHIỆP THÔNG MINH (PHIÊN BẢN 4.2 - MASTER)**

Khung logic phổ quát áp dụng cho mọi loại cây ăn quả và cây công nghiệp quy mô lớn. Được tối ưu hóa đặc biệt cho các loại cây/quả hiếm để tránh lỗi sai lệch hình dạng của AI.
Kết quả trả về sẽ có 2 phần: 1. Danh sách hình ảnh tham khảo (100% bắt buộc) và 2. Danh sách cảnh (Scene List) với cấu trúc 9 lớp bắt buộc. Mỗi cảnh sẽ được gán một hình ảnh tham khảo khác nhau để đảm bảo sự đa dạng về hình ảnh và tránh sự đơn điệu trong video.
**Thời lượng tiêu chuẩn:** 10 Phút (75 cảnh x 8s/cảnh).

## **BƯỚC 1: XÁC ĐỊNH MỤC TIÊU VÀ KHÓA TỪ KHÓA (KHÓA DANH TÍNH)**

- **Quy tắc vàng về Đặt tên (Khóa danh tính):** Từ khóa chính của cây trồng mục tiêu (ký hiệu là Target_Crop) PHẢI xuất hiện đồng bộ trong: Image Prompt (Câu lệnh hình ảnh), Action (Hành động), Voice-over (Thuyết minh), và Visual Logic (Logic thị giác) của MỌI CẢNH. Từ khóa "American" (Người Mỹ) phải được đưa vào các cảnh có con người để khóa danh tính nhân vật và giọng điệu.
- **QUY TẮC MỚI V4.3 - Khóa danh từ nghiêm ngặt trong VISUAL LOGIC:** Không bao giờ sử dụng đại từ hoặc danh từ chung chung (như "the skin" - lớp vỏ, "the surface" - bề mặt, "the branch" - cành cây). Bạn phải gắn trực tiếp tên của Target_Crop để AI không nhầm lẫn nó với các loại trái cây khác.
  - **Sai:** VISUAL LOGIC: Hành vi bề mặt (nước bắn tung tóe sống động khỏi lớp vỏ)
  - **Đúng:** VISUAL LOGIC: Hành vi bề mặt (nước bắn tung tóe sống động khỏi lớp vỏ của Target_Crop)
- **QUY TẮC MỚI V4.3 - Định vị không gian tuyệt đối:** Khi 2 hoặc nhiều vật thể tương tác trong một cảnh (ví dụ: máy móc và nông sản), bạn PHẢI xác định rõ tọa độ không gian và vị trí của chúng so với nhau (Trái, Phải, Trên, Dưới, Trung tâm). Tránh để AI tự do sắp xếp khung hình.
  - **Sai:** Target_Crop lăn từ băng chuyền vào rơ-moóc. (AI sẽ ảo giác ra một băng chuyền đâm xuyên qua xe).
  - **Đúng:** Target_Crop lăn nhẹ nhàng từ một băng chuyền mềm đặt ở bên trái, thả xuống vào chính giữa rơ-moóc gắn phía sau.
- **QUY TẮC MỚI V4.3 - Nguồn & Đích của Hành động Rõ ràng:** Phải mô tả cụ thể vật thể nào bắt đầu hành động và nó tác động lên cái gì, đặc biệt là với chất lỏng/chất khí, để tránh việc AI nhầm lẫn về "vật chất đến từ đâu".
  - **Sai:** Quạt công nghiệp thổi bay các giọt nước khỏi vỏ Target_Crop. (AI sẽ nhầm lẫn quạt đang phun ra nước).
  - **Đúng:** Quạt công nghiệp thổi luồng gió mạnh, vô hình trực tiếp vào Target_Crop, bóc tách các giọt nước đọng ra khỏi vỏ của nó.

## **BƯỚC 2: THIẾT LẬP DANH SÁCH HÌNH ẢNH THAM KHẢO (BẮT BUỘC THAM KHẢO 100%)**

**Mục đích:** Tạo ra một Ngân hàng Hình ảnh tiêu chuẩn bằng tiếng Anh, tối ưu hóa hoàn toàn cho các công cụ AI (Midjourney/DALL-E). AI tạo video sẽ dựa vào hình ảnh để tạo video, nếu dùng các ảnh giống nhau, AI sẽ tạo ra các Video tương tự nhau gây nhàm chán, nên mỗi Scene sẽ có 1 ảnh tham chiếu khác nhau, trừ các ảnh dùng cho KỸ THUẬT MATCH-CUT.

### **CÁC QUY TẮC NGHIÊM NGẶT**

- **Bắt buộc 100%:** Tất cả các cảnh PHẢI sử dụng hình ảnh tham khảo.
- **Số lượng & Phạm vi bao phủ:** Ngân hàng hình ảnh (80-150 ảnh): Bao phủ mọi góc độ từ hạt giống, cây con, hoa, nụ, quả non, sần sùi của vỏ, quả chín, đến thu hoạch và đóng gói; Đảm bảo mỗi Scene là 1 ảnh thảm khảo.
- **Định dạng đầu ra của hình ảnh:** Chỉ trả về danh sách hình ảnh mà không chia thành các phần. Mỗi mô tả hình ảnh phải nằm trên một dòng duy nhất.
- **Ngôn ngữ:** Chỉ sử dụng tiếng Anh.
- **Chi tiết tương tác:** Mọi hình ảnh có máy móc phải tuân thủ nghiêm ngặt các mô tả được định nghĩa ở Bước 1.
- **Để tránh sự đơn điệu:** Nếu 2 cảnh không có nội dung liên tiếp nhau, hãy sử dụng 2 hình ảnh minh họa khác nhau.

### **CẤU TRÚC PROMPT & TỪ KHÓA THẨM MỸ**

- **Cú pháp tiêu chuẩn cho mỗi dòng:** Image XX: Mô tả chi tiết vật thể, màu sắc, ánh sáng, chất liệu, góc máy
- Để đảm bảo chất lượng hình ảnh điện ảnh khi sử dụng AI, mô tả phải tích hợp các từ khóa thẩm mỹ sau tùy theo nhóm cảnh:
  - **Cảnh Siêu cận/Trừu tượng (Vỏ/Hạt/Nước):** Sử dụng các từ khóa: extreme close-up, macro photography, high contrast, detailed texture, translucent.
  - **Cảnh Toàn cảnh/Vĩ mô (Cánh đồng/Máy móc):** Sử dụng các từ khóa: top-down view, bird-eye view, ultra-wide shot, cinematic lighting, cloud shadows.
  - **Cảnh Con người/Hữu cơ:** Sử dụng các từ khóa: golden hour, god rays, warm authentic tones, soft backlight.
  - _Ví dụ:_ Image 01: Extreme close-up macro shot of a single juicy strawberry cut in half, water droplets splashing, cinematic studio lighting, glowing red texture, shot on 100mm macro lens.

### **HÌNH ẢNH CƠ BẢN BẮT BUỘC**

Phải bao quát vòng đời và công cụ (áp dụng cho Target_Crop):

1. Hạt giống, Cây con trong bầu ươm (polybags), Cây trưởng thành.
2. lá, Hoa đang nở/nụ, Quả xanh/non, Quả chín trên cây, Quả cắt đôi.
3. Máy móc làm đất - tractor, máy cày, máy xới, mỗi cảnh phải có từ 2 đến 5 chiếc.
4. Drone phun thuốc DJI - mỗi cảnh phải có từ 2 đến 5 chiếc, bay ở độ cao thấp, tao thành hàng lối, rõ ràng vị trí so với cây trồng.
5. Công nhân/Kỹ sư (đồng phục chuẩn), mỗi cảnh phải có từ 2 đến 5 người.
6. Nhà máy phân loại/Đóng gói.

### **LỰA CHỌN THIẾT BỊ**

- **Thương hiệu & Thiết bị:** Sử dụng chính xác DJI Agras T50, DJI Agras T25P, GlobalCheck G700 cho các thiết bị bay. Tương tự, nếu là máy kéo (tractor), ghi rõ máy kéo hạng nặng, thương hiệu, và gán hình ảnh tham khảo (John Deere 8RX Series, Kubota...). Không sử dụng tên cụ thể trong VOICE OVER.

### **CÁC CẶP HÌNH ẢNH ĐẶC BIỆT CHO KỸ THUẬT MATCH-CUT (BẮT BUỘC)**

Để tạo ảo giác thị giác chuyển cảnh, bạn phải tạo các cặp hình ảnh có bố cục/kết cấu hình học giống hệt nhau:

- **Image 3 (Vỏ quả):** Cận cảnh macro bề mặt vỏ của Target_Crop (thấy rõ gân/gai/chấm).
- **Image 4 (Cánh đồng):** Cảnh rộng cánh đồng nhìn từ trên xuống góc 90 độ; các đường cày/hàng cây phải có đường nét và màu sắc giống hệt như kết cấu của Image 3.
- **Image 5 (Quả non):** Quả non nằm ngay chính giữa khung hình, chiếm 10% diện tích.
- **Image 6 (Quả khổng lồ):** Quả chín khổng lồ nằm ngay chính giữa khung hình, chiếm 80% diện tích (Cùng góc máy, cùng phông nền với Image 5).

- **Cách trình bày**: nếu cần tham khảo ảnh từ ảnh khác, vui lòng để **attached image** và thêm danh sách image tham khảo vào cuối “ | IMAGES: Image xx”
  - **Đúng**: Image 34: Top-down bird-eye view 90-degree of agricultural field, plow lines perfectly matching the dimpled texture of **attached image**, cinematic lighting **| IMAGES: Image 33**
  - **Sai**: Image 34: Top-down bird-eye view 90-degree of agricultural field, plow lines perfectly matching the dimpled texture of Image 33, cinematic lighting.

## **BƯỚC 3: CẤU TRÚC CẢNH 9 LỚP (MẪU BẮT BUỘC)**

Mỗi cảnh phải nằm trên một dòng duy nhất, viết bằng tiếng Anh. Phân cách nhau bằng dấu gạch đứng |.

**Cú pháp tiêu chuẩn:**

SCENE [Số thứ tự]: [Context Prompt] | ACTION TITLE: [Hành động có Nguồn-Đích/Định vị không gian rõ ràng] | VISUAL LOGIC: [Logic vật lý khóa tên Target_Crop] | SOUND: [Âm thanh] | VOICE OVER: [Văn bản thuyết minh] | VOCAL TONE: [Giọng điệu thuyết minh] | CAMERA: [Góc máy] | IMAGES: [Mã hình ảnh]

- **SCENE XX:** Số thứ tự liên tiếp từ 01 đến 75.
- **VISUAL PROMPT (Bối cảnh hình ảnh):** Phong cách (realistic agri-tech), Ánh sáng (golden hour/sunrise), Chủ thể chính.
- **ACTION TITLE (Tiêu đề hành động):** Mô tả ngắn gọn hành động cốt lõi của cảnh (Kéo dài chính xác 8s).
- **VISUAL LOGIC (Logic thị giác):** Phải trích dẫn nghiêm ngặt các quy tắc ở Bước 4. Nếu thiếu một quy tắc nào đó cho một vật thể ở bước 4, vui lòng thêm vào để AI tạo video không bị nhầm lẫn.
- **SOUND (Âm thanh):** Âm thanh môi trường thực tế, chi tiết.
- **VOICE OVER (Thuyết minh):** Thuyết minh tiếng Anh (3 cảnh đầu và 2 cảnh cuối là bắt buộc. Tỷ lệ tối thiểu sau 2 cảnh là có 1 cảnh có thuyết minh; nếu cảnh đó thực sự cần thiết thì thêm vào). Nếu không có, ghi VOICE OVER: NO.
- **VOCAL TONE (Giọng điệu):** Luôn sử dụng: "deep American male, middle-aged, calm, precise, warm, instructional" (nam người Mỹ giọng trầm, trung niên, điềm tĩnh, chính xác, ấm áp, mang tính hướng dẫn). Nếu VOICE OVER: NO thì VOCAL TONE: NO.
- **CAMERA:** Trích dẫn chính xác prompt Camera ở Bước 7.
- **IMAGES:** Tuyệt đối không để trống trường này ở bất kỳ cảnh nào.
  - _Sử dụng bình thường (Tạo tham khảo chủ thể):_ IMAGES: Image 01, Image 15 (Sử dụng ảnh mô tả chi tiết hoa, quả, lá, xe cộ để AI bám sát hình dạng).
  - _Sử dụng cho Image-to-Video (Chuyển cảnh Match-Cut):_ Phải viết cú pháp | the attach image as Start Frame IMAGES: Mã hình ảnh (Ví dụ: trong Cảnh 6, viết | the attach image as Start Frame | IMAGES: Image B).
  - _Để tránh đơn điệu,_ nếu 2 cảnh không có nội dung liên tiếp (cách xa nhau), dùng 2 ảnh minh họa khác nhau.

## **BƯỚC 4: THƯ VIỆN LOGIC VẬT LÝ NÂNG CẤP (THƯ VIỆN VẬT LÝ V3.1)**

_(Bắt buộc trích dẫn chính xác trong phần VISUAL LOGIC của mỗi cảnh)_

- **Cây/Quả (Plant/Fruit)**
  - **Sự gắn kết (Attachment):** Trái cây phải gắn chính xác vào vị trí mọc thực tế (cành/thân/gốc). Tuyệt đối không lơ lửng. Mỗi quả chỉ có 1 cuống.
  - **Hành vi bề mặt (Surface Behavior):** Độ bóng đồng đều, gân vỏ, phản chiếu ánh sáng khi xoay/thu phóng.
  - **Hư hại và Rơi (Damage and Fall):** Trái cây bị rụng/cắt phải rơi theo chiều dọc.

- **Đất & Cánh đồng (Soil & Field)**
  - **Sự tách biệt khi cày/xới (Ploughing/Tilling Isolation):** Cày trên vùng đất HOÀN TOÀN TRỐNG. Không có cây trồng sẵn, không có ống nước, không có dụng cụ nông nghiệp khác.
  - **Sự nén (Compression):** Lốp xe đè lún xuống đất mềm.
  - **Phản ứng độ ẩm (Moisture Response):** Đất chuyển sang màu tối/đậm hơn ngay lập tức khi tiếp xúc với tia nước.

- **Nước/Tưới tiêu (Water/Irrigation)**
  - **Giới hạn nguồn (Source Constraint):** Nước CHỈ phun ra từ các đầu vòi phun, ống tưới nhỏ giọt. KHÔNG chảy ra từ dây buộc, lá, quả, hay thân cây.
  - **Đường đạn (Ballistics):** Các tia nước từ vòi phun xoay phải tạo thành các đường parabol vật lý.

- **Máy móc & Vận chuyển (Machinery & Transport)**
  - **Logic chạy theo hàng (Row Driving Logic):** Các phương tiện di chuyển CHÍNH XÁC Ở GIỮA khôngảng trống giữa 2 hàng cây. Không chạy nối đuôi nhau trên cùng một hàng.
  - **Rơ-moóc kéo sau (Rear-mounted Trailers):** Rơ-moóc chứa quả/cây PHẢI nằm 100% phía sau máy kéo (được kết nối qua một khớp nối cơ học).
  - **Tính toàn vẹn động học (Kinematic Integrity):** Khớp nối cơ học giữa máy kéo và rơ-moóc vẫn duy trì kết nối khi di chuyển/chuyển hướng.
  - **Chuyển động tiến (Forward Movement):** Chuyển động tịnh tiến tự nhiên về phía trước.

- **Drone & Robot (Drones & Robotics)**
  - **Hiệu ứng cánh quạt (Propeller Effects):** Bóng mờ chuyển động trên cánh quạt, luồng gió giáng xuống (downdraft) làm LÁ RUNG LẮC bên dưới.
  - **Giới hạn Vườn ươm/Nhà máy (Nursery/Factory Restriction):** Cánh tay robot CHỈ ở trong vườn ươm/nhà máy. KHÔNG đi ra ngoài cánh đồng.
  - **Tiếp điểm kẹp (Gripper Contact):** Điểm tiếp xúc của tay gắp robot phải cực kỳ rõ ràng, không bị xuyên đâm (clipping) vào cây/quả.

- **Khác (Miscellaneous)**
  - **Màu ống nước (Pipe Color):** Ống nước tại trạm bơm có màu XANH LÁ (không thấy nước chảy bên trong). Ống nước ngoài trời có màu ĐEN. KHÔNG TRONG SUỐT.
  - **Bàn tay người (Human Hands):** Khi cầm màn hình/trái cây, KHÔNG CÓ BÀN TAY THỨ BA xuất hiện.

- **Logic Vật thể & Xếp chồng (Object & Stacking Logic) - MỚI**
  - **Tính toàn vẹn khi xếp chồng (Stacking Integrity):** Các vật thể xếp chồng lên nhau (thùng, khay, pallet) PHẢI vuông vức hoàn hảo, các cạnh thẳng hàng theo chiều dọc. TUYỆT ĐỐI KHÔNG lơ lửng, biến dạng, hoặc xuyên thủng vào không gian của nhau.
  - **Tích tụ trọng lực (Gravity Accumulation):** Khi trái cây được đổ vào rổ, hộp, hoặc rơ-moóc, chúng phải tự nhiên xếp chồng lên nhau từ dưới lên trên. Điểm tiếp xúc giữa các quả phải rõ ràng, không bị "hòa tan/chảy" vào nhau.
  - **Bàn tay người (Human Hands):** Bàn tay con người phải có đủ các ngón (tỷ lệ bình thường), không có bàn tay thứ ba cầm quả.

## **BƯỚC 5: CÔNG NGHỆ, MÔI TRƯỜNG & CÁC QUY TẮC LÂM NGHIỆP CỤ THỂ**

- **Thương hiệu & Thiết bị:** Sử dụng chính xác DJI Agras T50, DJI Agras T25P, GlobalCheck G700 cho drone. Tương tự, với máy kéo, ghi rõ máy kéo hạng nặng, thương hiệu, gán hình ảnh (John Deere 8RX Series, Kubota...).
- **Trình tự trồng tiêu chuẩn (TRÌNH TỰ BẮT BUỘC):**
  1. Đào hố.
  2. Đặt cây con Target_Crop vào hố. (Yêu cầu nghiêm ngặt: Hố phải vừa vặn hoàn hảo với bầu rễ và căn chỉnh thẳng hàng tuyệt đối với các cây khác).
- **Số lượng thiết bị (Multiplicity):** Tối đa 4-5 thiết bị cho cảnh quay góc rộng. 2-3 thiết bị cho cảnh cận. Tuyệt đối không quá 5 để tránh làm rối khung hình và gây lỗi AI.
- **Đặc điểm canh tác tùy chỉnh:**
  - _Cây thân gỗ lớn (Sầu riêng, Bơ, Táo):_ Không có giàn leo, khoảng cách hàng rộng.
  - _Dây leo/Thân mềm (Nho, Chanh dây, Dưa lưới, Cà chua):_ PHẢI có khung giàn kim loại, cắm cọc, chằng dây (Trellis) hoặc trồng trong Nhà kính. Cấu trúc này phải được duy trì xuyên suốt các cảnh.
- **Đồng phục & Đồ bảo hộ:**
  - _Trong Nhà kính/Nhà máy:_ Công nhân/Kỹ sư phải mặc đồ phòng sạch, lưới trùm tóc, khẩu trang y tế và găng tay.
  - _Ngoài cánh đồng:_ Nông dân/Kỹ sư mặc đồng phục gọn gàng (áo phản quang/áo sáng màu), mũ rộng vành/mũ bảo hộ, và găng tay. KHÔNG mặc quần áo mặc thường ngày.
- **Hiệu ứng Đồ họa Công nghệ (Tech UI Overlays):** Quét quang học, đo lường tán cây bằng laser 3D sử dụng tông màu xanh neon. Đồ họa nên mỏng, hơi trong suốt, không che khuất quá 30% chủ thể.
- **Đồng bộ Thời tiết & Ánh sáng:** Cảnh ngoài trời ưu tiên "Giờ vàng" (bình minh/hoàng hôn) hoặc "Trời nắng trong xanh". Tuyệt đối không có thời tiết bão táp ảm đạm phi logic.
- **Cảnh có hành động cắt/ghép:** Phải chỉ định rõ vị trí cắt, hướng cắt, vị trí lưỡi dao. Khi cắt, chỉ thực hiện 1 nhát cắt dứt khoát, quả rơi xuống ngay lập tức; điều này ngăn AI tạo ra các sai lệch vị trí ảnh hưởng đến trải nghiệm người xem.

## **BƯỚC 6: KHUNG KỊCH BẢN TỔNG THỂ CHO 75 CẢNH (TỔNG CỘNG ~75 CẢNH - HƠN 10 PHÚT)**

_Lưu ý về Mẫu:_ Đây là một khung động. Tùy thuộc vào đặc điểm của giống cây (vỏ cứng, quả mọng, cây có múi, rễ cọc, rễ chùm...), bạn sẽ chọn các "Biến thể" (Variants) và "Cảnh tự suy luận" (Self-deduced scenes) tương ứng.

_Quy tắc hình ảnh:_ 100% các cảnh cần được gán Reference Image: .... Sử dụng linh hoạt các kỹ thuật Ultra-slow motion (Siêu chậm), Fast Crash Zoom (Phóng to cực nhanh), Match-Cut (Chuyển cảnh tương đồng).

**Định dạng đầu ra:** Chỉ trả về danh sách scene mà không chia thành các phần. Mỗi mô tả scene phải nằm trên một dòng duy nhất. Các dòng liền nhau, không có dòng trống.

I. TỔNG QUAN KỊCH BẢN VĨ MÔ (EXECUTIVE OVERVIEW)

Kịch bản này là một khung kiến trúc nội dung chuẩn hóa (Master Template), phác họa quy trình vận hành khép kín của một trang trại cây ăn quả công nghệ cao trong tương lai gần. Tại đây, toàn bộ chuỗi giá trị từ khâu chuẩn bị vật liệu nhân giống đến thu hoạch và đóng gói được điều hành bởi Trí tuệ nhân tạo (AI), robot tự hành, drone và các thiết bị IoT, hoàn toàn loại bỏ sự can thiệp trực tiếp bằng tay của con người.

Triết lý Cốt lõi (Core Philosophy): Sự giao thoa hoàn hảo giữa "Cơ học chính xác" (Cybernetics) và "Sinh học tự nhiên" (Biology). Công nghệ không chế ngự tự nhiên mà đóng vai trò là "người bảo trợ" thầm lặng, tối ưu hóa từng tế bào sinh học để đạt năng suất và chất lượng đồng đều tối đa.

Tông màu & Không khí (Tone & Mood): Đẳng cấp, mang tính tương lai (futuristic) nhưng không lạnh lẽo nhờ sự ấm áp từ ánh sáng tự nhiên (bình minh, hoàng hôn) và chất giọng thuyết minh (VO) trầm ấm, mang tính triết lý sâu sắc về sự sống.

Tính tùy biến cao (Modular Adaptation): Khung kịch bản được thiết kế với các "điểm neo" kỹ thuật để dễ dàng thay đổi theo đặc tính riêng của từng nhóm cây ăn quả:

Nhóm quả vỏ mỏng/nhạy cảm vật lý (Bơ, xoài, đu đủ...)

Nhóm quả vỏ dày/khổng lồ (Sầu riêng, mít...)

Nhóm quả mọc thành chùm (Nhãn, vải, nho...)

Nhóm quả có múi (Cam, bưởi, quýt...)

II. KHUNG NỘI DUNG TỔNG QUÁT 9 PHÂN ĐOẠN (THE 9-PHASE LOGICAL PIPELINE)

Toàn bộ kịch bản được cấu trúc chặt chẽ theo 9 phân đoạn tuyến tính, mô phỏng trọn vẹn vòng đời sản phẩm từ dạng tiềm năng (hạt/mô) đến thành phẩm xuất khẩu:

[Vật liệu Giống] ──> [Chuẩn bị Đất/Giá thể] ──> [Nhà ươm Thông minh] ──> [Cấy trồng Tự hành] ──> [Chăm sóc Kỹ thuật số] ──> [Thụ phấn & Đậu quả] ──> [Gia cố & Nuôi dưỡng] ──> [Thu hoạch Chính xác] ──> [Đóng gói Bản quản]

PHÂN ĐOẠN 1: Khởi đầu & Tầm nhìn Toàn cảnh (Giới thiệu Tầm nhìn)

Mục tiêu: Tạo ấn tượng thị giác cực đại (Visual Hook) về thành phẩm hoàn hảo và quy mô khổng lồ của nông trại tự vận hành.

Hình ảnh: Cận cảnh quả chín mọng đọng sương trên cành lúc rạng đông $\rightarrow$ Cú máy bay cao (drone reveal) mở rộng góc nhìn ra hàng vạn cây trồng thẳng hàng tắp lự đến tận chân trời.

Âm thanh: Bản giao hưởng âm thanh tự nhiên (tiếng sương rớt, côn trùng) hòa quyện mượt mà với âm trầm cơ khí từ xa (tiếng máy bơm áp lực, tiếng vo ve nhẹ của drone).

Thông điệp VO: Mọi sự sống vĩ đại đều khởi đầu từ một thực thể siêu nhỏ, nhưng đích đến cuối cùng là sự hoàn hảo được định lượng của quả chín trên cành.

PHÂN ĐOẠN 2: Trung tâm Xử lý & Chuẩn bị Vật liệu Giống (Cơ giới hóa Sơ chế)

Mục tiêu: Chứng minh sự đồng đều tuyệt đối ngay từ khâu đầu vào của chuỗi cung ứng.

Hình ảnh: Vật liệu giống (hạt giống hoặc mắt ghép/mẫu cấy mô) được đưa vào hệ thống sàng lọc tự động: máng rung cơ học, máy quét laser quang học (optical sorter) để loại bỏ vật thể lỗi, cánh tay robot phân loại vào khay tiêu chuẩn.

Âm thanh: Tiếng rít khí nén cao áp, tiếng lách cách cơ khí nhịp điệu, tiếng quét của tia laser cảm biến.

Thông điệp VO: Sự đồng bộ của một khu vườn không bắt đầu từ mặt đất, nó bắt đầu từ bộ mã di truyền được chọn lọc nghiêm ngặt bởi công nghệ quang phổ.

PHÂN ĐOẠN 3: Cơ giới hóa Chuẩn bị Đất & Thiết lập Hạ tầng Kỹ thuật

Mục tiêu: Thể hiện việc kiến tạo môi trường sống nhân tạo lý tưởng cho hệ rễ của cây trồng mục tiêu.

Hình ảnh: Đội hình máy kéo không người lái (Autonomous Tractors) cày xới, tạo luống cao (hoặc thiết lập hố trồng chuyên dụng), đồng thời rải hệ thống dây tưới nhỏ giọt ngầm và cảm biến độ ẩm đất.

Âm thanh: Tiếng xích sắt nghiền đất tơi xốp, tiếng xì xì của van áp lực nước, tiếng động cơ điện chuyển hướng tự động.

Thông điệp VO: Thiết lập cấu trúc đất vững chãi và hướng nước thông minh là bước kỹ nghệ thầm lặng trước khi đón nhận mầm sống mới.

PHÂN ĐOẠN 4: Vườn ươm Thông minh & Thích nghi Tự động (Nursery & Hardening)

Mục tiêu: Quá trình nuôi dưỡng cây con trong môi trường kiểm soát nghiêm ngặt (Micro-climate).

Hình ảnh: Gieo hạt/cắm cành tự động $\rightarrow$ Hệ thống phun sương siêu mịn tạo độ ẩm $\rightarrow$ Timelapse hạt nứt vỏ hoặc mắt ghép liền sẹo $\rightarrow$ Robot nhấc nguyên bầu rễ cây con khỏe mạnh lên băng chuyền xuất vườn.

Âm thanh: Tiếng phun sương mịn như gió thổi, tiếng chuyển động mượt mà của băng tải đệm cao su.

Thông điệp VO: Tránh xa các biến động của thời tiết, mỗi cây non được tôi luyện cấu trúc rễ trong môi trường lý tưởng trước khi đối mặt với tự nhiên rộng lớn.

PHÂN ĐOẠN 5: Cấy trồng Tự hành & Định vị Không gian (Transplanting)

Mục tiêu: Đưa cây con ra thực địa với độ chính xác đến từng milimet nhờ định vị vệ tinh (RTK/GPS).

Hình ảnh: Các xe cấy trồng tự hành di chuyển song song, cánh tay robot đặt nhẹ nhàng bầu cây xuống lòng đất, ép chặt đất xung quanh gốc và kích hoạt ngay đầu phun nhỏ giọt tại chỗ để cây bén rễ.

Âm thanh: Tiếng bánh xích lăn trên đất ẩm, tiếng cơ cấu hạ đặt cây gõ nhẹ, tiếng nước ngấm vào đất khô.

Thông điệp VO: Mỗi vị trí đặt cây là một tọa độ số học chuẩn xác, đảm bảo khoảng cách tối ưu để đón nhận tối đa ánh sáng và dinh dưỡng trong tương lai.

PHÂN ĐOẠN 6: Chăm sóc, Bảo vệ & Giám sát Kỹ thuật số (Canopy Management)

Mục tiêu: Thể hiện việc quản lý và chăm bón cá thể hóa (mỗi cây trồng là một "bệnh án" riêng biệt).

Hình ảnh: Máy xới cỏ mini luồn lách giữa các hàng; các drone nông nghiệp bay tầm thấp phun sương bảo vệ lá bằng công nghệ tĩnh điện; robot tuần tra (Rover) quét cảm biến đa phổ để phân tích sức khỏe từng chiếc lá.

Âm thanh: Tiếng cánh quạt drone vo ve đều đặn, tiếng vòi phun áp lực cao, tiếng lách cách tinh tế từ cụm gimbal camera thông minh.

Thông điệp VO: Công nghệ không thay thế sự chăm sóc, nó số hóa mọi biểu hiện sinh lý của lá và rễ để đưa ra lượng dưỡng chất chính xác đến từng micro-lít.

PHÂN ĐOẠN 7: Thụ phấn, Ra hoa & Thiết lập Trái non (Flowering & Pollination)

Mục tiêu: Giai đoạn chuyển dịch quan trọng từ sinh trưởng sinh dưỡng sang sinh trưởng sinh sản.

Hình ảnh: Đặc tả hoa của cây mục tiêu hé nở dần (Timelapse) $\rightarrow$ Robot thụ phấn nhân tạo (sử dụng xung khí chứa hạt phấn hoặc quét camera AI định vị nhụy hoa) $\rightarrow$ Cánh hoa rụng đi để lộ quả non tí hon xanh mướt.

Âm thanh: Tiếng gió lướt qua tán lá rậm rạp, tiếng kích hoạt xung khí siêu nhẹ của thiết bị thụ phấn, tiếng côn trùng thụ phấn tự nhiên phụ trợ.

Thông điệp VO: Sự nở hoa là lời hẹn của mùa vụ; công nghệ đồng hành để đảm bảo từng bông hoa đều hoàn thành sứ mệnh chuyển hóa thành quả ngọt.

PHÂN ĐOẠN 8: Phát triển Trái & Gia cố Kết cấu (Fruit Development & Support)

Mục tiêu: Bảo vệ và hỗ trợ cây trồng khi gánh tải trọng quả nặng hoặc trước biến động thời tiết.

Hình ảnh: Quả lớn dần theo thời gian (timelapse) $\rightarrow$ Robot tiếp cận lắp đặt các cấu kiện gia cố sinh học (như vòng nâng đỡ quả nặng đối với sầu riêng, túi bọc quả bảo vệ đối với xoài/bơ, hoặc khung đỡ cành) $\rightarrow$ Hệ thống điều hòa nhiệt độ cục bộ kích hoạt khi trời nắng gắt.

Âm thanh: Tiếng cành cây kẽo kẹt sinh học dưới sức nặng, tiếng lắp đặt khóa gài polymer mềm của robot, tiếng gió rì rào trong tán lá dày bóng mượt.

Thông điệp VO: Sự tăng trưởng cần bệ đỡ bền vững; chúng tôi bảo vệ cấu trúc cành và quả khỏi trọng lực cũng như tác động vật lý của thiên tai.

PHÂN ĐOẠN 9: Thu hoạch Robot & Đóng gói Khép kín (Harvest & Post-Harvest)

Mục tiêu: Điểm nút thăng hoa của kịch bản – thu hoạch hoàn hảo không tì vết và đóng gói xuất khẩu.

Hình ảnh:

Harvest: Robot gặt tiếp cận, cảm biến đo độ chín (không tiếp xúc), tay cắt laser/cơ học cắt cuống cực ngọt $\rightarrow$ Đỡ quả êm ái đặt vào khay đệm của xe trung chuyển tự hành.

Post-Harvest: Quả được rửa bằng bọt nước siêu âm, sấy khô bằng khí nóng thổi nhẹ $\rightarrow$ Camera AI quét 360 độ phân loại kích thước, khuyết tật $\rightarrow$ Cánh tay delta xếp quả vào khay định hình chống va đập $\rightarrow$ Đưa vào kho lạnh thông minh.

Ending: Drone bay kéo ngược về phía hoàng hôn lãng mạn phủ bóng lên nông trại yên bình đang chuẩn bị bước vào chu kỳ đêm.

Âm thanh: Tiếng cắt cuống dứt khoát, tiếng đặt quả êm ái vào nệm xốp, tiếng dòng nước tuần hoàn rào rào, tiếng quạt sấy khô ấm áp, tiếng dế kêu râm ran lúc chạng vạng.

Thông điệp VO:

Lúc thu hoạch: Quy mô công nghiệp không đồng nghĩa với thô bạo. Sự nhẹ nhàng là tôn chỉ tuyệt đối khi tiếp xúc với thành quả của cả một năm dài.

Kết thúc: Chu kỳ kết thúc khi những chiếc container lạnh rời trang trại, nhưng những thân cây vẫn ở lại, tràn đầy nhựa sống và sẵn sàng cho đợt đơm chồi tiếp theo dưới bầu trời đêm yên tĩnh.

III. BẢN ĐỒ TÙY BIẾN CHO TỪNG LOẠI CÂY CỦ THỂ (SPECIFIC CROP ADAPTATION)

Để biến khung kịch bản này thành kịch bản chi tiết cho một loại cây cụ thể, hãy áp dụng bảng chuyển đổi thuộc tính dưới đây:

Phân đoạn kỹ thuật

Loại quả Vỏ dày / Nặng (Ví dụ: Sầu riêng, Mít)

Loại quả Vỏ mỏng / Nhạy cảm (Ví dụ: Bơ, Xoài, Đu đủ)

Loại quả Chùm / Nhỏ (Ví dụ: Nhãn, Vải, Nho)

Phân đoạn 2 (Hạt/Giống)

Chọn mắt ghép từ cây mẹ ưu việt, robot thực hiện ghép nêm tự động bằng laser.

Hạt giống hoặc mẫu cấy mô trong thạch dinh dưỡng.

Cành chiết hoặc cây cấy mô siêu sạch bệnh.

Phân đoạn 7 (Thụ phấn)

Robot thụ phấn nhân tạo bằng đầu phun phấn áp lực hơi vào ban đêm (thời điểm hoa nở).

Phun bổ sung vi lượng (Boron, Canxi) bằng drone để tăng tỷ lệ đậu quả tự nhiên nhờ gió/ong.

Thiết lập các trạm phát sóng siêu âm đuổi côn trùng hại hoa, bảo vệ ong thụ phấn tự nhiên.

Phân đoạn 8 (Gia cố)

Tay máy robot buộc dây cáp treo quả vào thân chính để tránh gãy cành.

Robot bọc quả bằng túi vải không dệt tự hủy để tránh ruồi vàng và cháy nắng.

Robot lắp đặt lưới nâng đỡ toàn bộ chùm quả từ bên dưới lòng tán.

Phân đoạn 9 (Thu hoạch)

Cần cơ cấu "bắt quả" chịu lực lớn (túi lưới cơ khí cường lực hoặc cánh tay robot đa khớp nâng từ dưới).

Đầu gắp mềm bằng silicon chứa đầy chất lỏng (Soft-robotic gripper) để tránh tạo vết thâm trên vỏ.

Cắt nguyên chùm quả bằng kéo rung siêu âm chống rụng hạt, xếp vào khay treo lơ lửng.

IV. ĐỀ XUẤT SẢN XUẤT VÀ HẬU KỲ CHUYÊN NGHIỆP (PRODUCTION GUIDE)

Ứng dụng CGI/VFX lai (Hybrid CGI):

Do việc quay thực tế một trang trại có 100% robot vận hành là bất khả thi ở thời điểm hiện tại, giải pháp tối ưu là quay bối cảnh nông trại thật (dùng drone góc rộng và máy quay mặt đất) sau đó ghép các mô hình 3D (CGI) của robot tự hành, drone phun thuốc và cánh tay robot thu hoạch vào khung hình.

Kỹ thuật Chuyển cảnh (Pacing & Transitions):

Sử dụng kỹ thuật chuyển cảnh "Match Cut" dựa trên hình dáng hình học (ví dụ: chuyển từ một hạt giống hình bầu dục ở Phân đoạn 2 sang hình ảnh quả non hình bầu dục ở Phân đoạn 7) để tạo dòng chảy liên tục cho người xem.

Chỉnh màu (Color Grading):

Ngoại cảnh (Farm): Sử dụng tông màu rực rỡ, độ bão hòa cao (Vibrant & Warm). Màu xanh lá của tán cây phải mọng nước; màu đất phải có độ ẩm sẫm màu; ánh sáng bình minh/hoàng hôn phải có màu vàng cam ấm áp để tạo cảm giác gần gũi với sự sống.

Nội cảnh (Factory/Nursery): Sử dụng tông màu sạch sẽ, hơi xanh lạnh (Clean Teal & Silver) của kim loại inox và ánh sáng LED để nhấn mạnh yếu tố công nghệ cao, vô trùng và chính xác.

## **BƯỚC 7: HƯỚNG DẪN PROMPT CAMERA CHO AI**

- **NHÓM MACRO & CẬN CẢNH (Sinh học & Chi tiết)**
  - **Locked macro push-in:** Khóa nét, từ từ đẩy sát vào chủ thể.
  - **Fixed repeat-framed macro:** Tĩnh, lặp lại khung hình (Time-lapse nở hoa/nảy mầm).
  - **Locked close-up:** Cận cảnh hoàn toàn tĩnh.
  - **Ultra-slow macro orbit:** Xoay 360 độ siêu chậm quanh vật thể macro.

- **NHÓM CHUYỂN ĐỘNG MƯỢT MÀ (Dây chuyền & Bám đuổi)**
  - **Tracking shot / Low side tracking:** Trượt bám theo (từ góc thấp).
  - **Smooth glide:** Lướt mượt mà (phòng kính, không gian hẹp).
  - **Slow dolly:** Trượt dọc theo hành lang/hàng cây.

- **NHÓM TRÊN KHÔNG & GÓC CAO (Quy mô Vĩ mô)**
  - **Vertical rise to top-down master:** Bay vút lên cao chĩa thẳng xuống 90 độ.
  - **Elevated oblique tracking:** Trượt bám theo góc cao nghiêng chéo (theo dõi đội hình xe).
  - **Top-down glide / Hover:** Lơ lửng lướt mặt hướng thẳng góc 90 độ.
  - **Rising top-down pullaway:** Bay lùi ra xa và dần ngẩng lên cao (Kết video).

- **NHÓM TĨNH, ĐỐI XỨNG & ÁNH SÁNG**
  - **Static wide composition:** Bố cục góc rộng tĩnh.
  - **Front-facing symmetrical shot:** Cảnh quay trực diện đối xứng uy lực.
  - **Static wide composition with volumetric lighting:** Cảnh toàn diện tĩnh với ánh sáng xuyên thấu (God rays).

- **NHÓM CHUYỂN ĐỘNG ĐỘT PHÁ & MATCH-CUT (MỚI)**
  - **High-altitude to macro fast zoom:** Phóng to (Crash zoom) từ bầu trời lao thẳng xuống siêu cận cảnh.
  - **Macro to high-altitude fast zoom-out:** Kéo lùi cực nhanh từ siêu cận cảnh ra toàn cảnh vĩ mô.
  - **Fixed match-cut to slow pull-back:** Liên kết hình ảnh bằng ảnh Start Frame, sau đó từ từ kéo lùi ra xa.

## **BƯỚC 8: QUY TRÌNH ĐẢM BẢO CHẤT LƯỢNG (DANH SÁCH KIỂM TRA QA ĐẶC BIỆT V4.2)**

Trước khi nạp kịch bản vào AI, người duyệt kịch bản PHẢI kiểm tra các câu hỏi sau:

- Từ khóa Target_Crop đã xuất hiện đồng bộ trong TẤT CẢ các cảnh chưa?
- **BẮT BUỘC TUYỆT ĐỐI:** Đã có 100% (75/75) cảnh được gán ít nhất một mã hình ảnh tham khảo trong trường IMAGES chưa? Có cảnh nào bị bỏ trống không?
- Đã xác định đầy đủ 30-80 hình ảnh tham khảo cơ bản bao quát các góc khó (hoa, quả non, vỏ sần sùi...) của cây chưa?
- Đã tạo các cặp ảnh Match-Cut có chung kết cấu (texture) cho Cảnh 5-6 và Cảnh 33-34 chưa?
- Trong các cảnh kết nối bằng kỹ thuật Image-to-Video (Cảnh 6, Cảnh 34), trường IMAGES có viết đúng cú pháp Mã hình ảnh as Start Frame chưa?
- Các cảnh cày xới có đảm bảo bề mặt đất HOÀN TOÀN TRỐNG, không có cây trồng không?
- Máy kéo có đảm bảo chạy chính xác ở giữa hàng, không nối đuôi nhau không?
- Rơ-moóc (gắn phía sau) có nằm 100% phía sau máy kéo không?
- Các cảnh có nước chảy đã áp dụng quy tắc Giới hạn Nguồn (chỉ chảy từ vòi, không từ lá/quả) chưa?
- Bối cảnh nhà kính, giàn leo, và thời tiết có được duy trì nhất quán trên tất cả các cảnh không?
- Các cảnh đóng gói, xếp pallet, rổ trái cây đã áp dụng quy tắc Tính toàn vẹn xếp chồng / Tích tụ trọng lực để cấm AI vẽ các vật thể bị méo mó, lơ lửng, đâm xuyên vào nhau chưa?
- Hình ảnh tham khảo có nhắc đến người Mỹ (American person) khi có sự xuất hiện của con người không?
- Các cảnh tham khảo có nhắc đến tên cây trồng (Target_Crop) đang làm việc không?
- Các Cảnh (Scenes) có nhắc đến một người Mỹ khi có sự xuất hiện của con người không?
- Các Cảnh có được trả về nguyên vẹn và không bị chia lẻ thành các phần riêng biệt không?
- **BẮT BUỘC TUYỆT ĐỐI:** Các ảnh đã được bắt đầu bằng “Image xx: “chưa?
- **BẮT BUỘC TUYỆT ĐỐI:** Các cảnh đã được bắt đầu bằng “Scene xx: ”chưa?
- **BẮT BUỘC TUYỆT ĐỐI:** Loại bỏ các cảnh cắt cành, quả để tránh lỗi thị giác của AI chưa?
