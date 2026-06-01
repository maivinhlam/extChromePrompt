# **KHUNG LOGIC KỊCH BẢN VIDEO AI NÔNG NGHIỆP THÔNG MINH (PHIÊN BẢN 4.2 \- MASTER)**

Khung logic phổ quát áp dụng cho mọi loại cây ăn quả và cây công nghiệp quy mô lớn. Được tối ưu hóa đặc biệt cho các loại cây/quả hiếm để tránh lỗi sai lệch hình dạng của AI.

**Thời lượng tiêu chuẩn:** 10 Phút (80 cảnh x 8s/cảnh).

## **BƯỚC 1: XÁC ĐỊNH MỤC TIÊU VÀ KHÓA TỪ KHÓA (KHÓA DANH TÍNH)**

- **Quy tắc vàng về Đặt tên (Khóa danh tính):** Từ khóa chính của cây trồng mục tiêu (ký hiệu là \[Target_Crop\]) PHẢI xuất hiện đồng bộ trong: Image Prompt (Câu lệnh hình ảnh), Action (Hành động), Voice-over (Thuyết minh), và Visual Logic (Logic thị giác) của MỌI CẢNH. Từ khóa "American" (Người Mỹ) phải được đưa vào các cảnh có con người để khóa danh tính nhân vật và giọng điệu.
- **QUY TẮC MỚI V4.3 \- Khóa danh từ nghiêm ngặt trong VISUAL LOGIC:** Không bao giờ sử dụng đại từ hoặc danh từ chung chung (như "the skin" \- lớp vỏ, "the surface" \- bề mặt, "the branch" \- cành cây). Bạn phải gắn trực tiếp tên của \[Target_Crop\] để AI không nhầm lẫn nó với các loại trái cây khác.
  - ❌ **Sai:** VISUAL LOGIC: Hành vi bề mặt (nước bắn tung tóe sống động khỏi lớp vỏ)
  - ✅ **Đúng:** VISUAL LOGIC: Hành vi bề mặt (nước bắn tung tóe sống động khỏi lớp vỏ của \[Target_Crop\])
- **QUY TẮC MỚI V4.3 \- Định vị không gian tuyệt đối:** Khi 2 hoặc nhiều vật thể tương tác trong một cảnh (ví dụ: máy móc và nông sản), bạn PHẢI xác định rõ tọa độ không gian và vị trí của chúng so với nhau (Trái, Phải, Trên, Dưới, Trung tâm). Tránh để AI tự do sắp xếp khung hình.
  - ❌ **Sai:** \[Target_Crop\] lăn từ băng chuyền vào rơ-moóc. (AI sẽ ảo giác ra một băng chuyền đâm xuyên qua xe).
  - ✅ **Đúng:** \[Target_Crop\] lăn nhẹ nhàng từ một băng chuyền mềm đặt ở bên trái, thả xuống vào chính giữa rơ-moóc gắn phía sau.
- **QUY TẮC MỚI V4.3 \- Nguồn & Đích của Hành động Rõ ràng:** Phải mô tả cụ thể vật thể nào bắt đầu hành động và nó tác động lên cái gì, đặc biệt là với chất lỏng/chất khí, để tránh việc AI nhầm lẫn về "vật chất đến từ đâu".
  - ❌ **Sai:** Quạt công nghiệp thổi bay các giọt nước khỏi vỏ \[Target_Crop\]. (AI sẽ nhầm lẫn quạt đang phun ra nước).
  - ✅ **Đúng:** Quạt công nghiệp thổi luồng gió mạnh, vô hình trực tiếp vào \[Target_Crop\], bóc tách các giọt nước đọng ra khỏi vỏ của nó.

## **BƯỚC 2: THIẾT LẬP DANH SÁCH HÌNH ẢNH THAM KHẢO (BẮT BUỘC THAM KHẢO 100%)**

**Mục đích:** Tạo ra một Ngân hàng Hình ảnh tiêu chuẩn bằng tiếng Anh, tối ưu hóa hoàn toàn cho các công cụ AI (Midjourney/DALL-E). AI tạo video sẽ dựa vào hình ảnh để tạo video, nếu dùng các ảnh giống nhau, AI sẽ tạo ra các Video tương tự nhau gây nhàm chán, nên mỗi Scene sẽ có 1 ảnh tham chiếu khác nhau, trừ các ảnh dùng cho KỸ THUẬT MATCH-CUT.

### **CÁC QUY TẮC NGHIÊM NGẶT**

- **Bắt buộc 100%:** Tất cả các cảnh PHẢI sử dụng hình ảnh tham khảo.
- **Số lượng & Phạm vi bao phủ:** Ngân hàng hình ảnh (80-150 ảnh): Bao phủ mọi góc độ từ hạt giống, cây con, hoa, nụ, quả non, sần sùi của vỏ, quả chín, đến thu hoạch và đóng gói; Đảm bảo mỗi Scene là 1 ảnh thảm khảo.
- **Định dạng đầu ra:** Chỉ trả về danh sách hình ảnh mà không chia thành các phần. Mỗi mô tả hình ảnh phải nằm trên một dòng duy nhất.
- **Ngôn ngữ:** Sử dụng tiếng Anh.
- **Chi tiết tương tác:** Mọi hình ảnh có máy móc phải tuân thủ nghiêm ngặt các mô tả Nguồn-Đích và Định vị Không gian được định nghĩa ở Bước 1\.

### **CẤU TRÚC PROMPT & TỪ KHÓA THẨM MỸ**

- **Cú pháp tiêu chuẩn cho mỗi dòng:** Image XX: \[Mô tả chi tiết vật thể, màu sắc, ánh sáng, chất liệu, góc máy\]
- Để đảm bảo chất lượng hình ảnh điện ảnh khi sử dụng AI, mô tả phải tích hợp các từ khóa thẩm mỹ sau tùy theo nhóm cảnh:
  - **Cảnh Siêu cận/Trừu tượng (Vỏ/Hạt/Nước):** Sử dụng các từ khóa: extreme close-up, macro photography, high contrast, detailed texture, translucent.
  - **Cảnh Toàn cảnh/Vĩ mô (Cánh đồng/Máy móc):** Sử dụng các từ khóa: top-down view, bird-eye view, ultra-wide shot, cinematic lighting, cloud shadows.
  - **Cảnh Con người/Hữu cơ:** Sử dụng các từ khóa: golden hour, god rays, warm authentic tones, soft backlight.
  - _Ví dụ:_ Image 01: Extreme close-up macro shot of a single juicy strawberry cut in half, water droplets splashing, cinematic studio lighting, glowing red texture, shot on 100mm macro lens.

### **HÌNH ẢNH CƠ BẢN BẮT BUỘC**

Phải bao quát vòng đời và công cụ (áp dụng cho \[Target_Crop\]):

1. Hạt giống, Cây con trong bầu ươm (polybags), Cây trưởng thành.
2. Chi tiết bề mặt/gân lá, Hoa đang nở/nụ, Quả xanh/non, Quả chín trên cây, Quả cắt đôi.
3. Máy móc làm đất.
4. Drone phun thuốc DJI.
5. Công nhân/Kỹ sư (đồng phục chuẩn).
6. Nhà máy phân loại/Đóng gói.

### **LỰA CHỌN THIẾT BỊ**

- **Thương hiệu & Thiết bị:** Sử dụng chính xác DJI Agras T50, DJI Agras T25P, GlobalCheck G700 cho các thiết bị bay. Tương tự, nếu là máy kéo (tractor), ghi rõ máy kéo hạng nặng, thương hiệu, và gán hình ảnh tham khảo (John Deere 8RX Series, Kubota...). Không sử dụng tên cụ thể trong VOICE OVER.
- **Để tránh sự đơn điệu:** Nếu 2 cảnh không có nội dung liên tiếp nhau, nghĩa là chúng cách xa nhau, hãy sử dụng 2 hình ảnh minh họa khác nhau.

### **CÁC CẶP HÌNH ẢNH ĐẶC BIỆT CHO KỸ THUẬT MATCH-CUT (BẮT BUỘC)**

Để tạo ảo giác thị giác chuyển cảnh, bạn phải tạo các cặp hình ảnh có bố cục/kết cấu hình học giống hệt nhau:

- **Image 3 (Vỏ quả):** Cận cảnh macro bề mặt vỏ của \[Target_Crop\] (thấy rõ gân/gai/chấm).
- **Image 4 (Cánh đồng):** Cảnh rộng cánh đồng nhìn từ trên xuống góc 90 độ; các đường cày/hàng cây phải có đường nét và màu sắc giống hệt như kết cấu của Image 3\.
- **Image 5 (Quả non):** Quả non nằm ngay chính giữa khung hình, chiếm 10% diện tích.
- **Image 6 (Quả khổng lồ):** Quả chín khổng lồ nằm ngay chính giữa khung hình, chiếm 80% diện tích (Cùng góc máy, cùng phông nền với Image 5).

**\*Cách trình bày**:* nếu cần tham khảo ảnh từ ảnh khác, vui lòng *để “\* attached image” và thêm danh sách image tham khảo vào cuối “ | IMAGES: Image xx”

- Đúng: Image 34: Top-down bird-eye view 90-degree of agricultural field, plow lines perfectly matching the dimpled texture of **attached image**, cinematic lighting **| IMAGES: Image 33**
  - Sai: Image 34: Top-down bird-eye view 90-degree of agricultural field, plow lines perfectly matching the dimpled texture of Image 33, cinematic lighting.

### **HÌNH ẢNH CON NGƯỜI**

Nếu hình ảnh có chứa người, luôn sử dụng face less để tránh vi phạm quy tắc của AI.

## **BƯỚC 3: CẤU TRÚC CẢNH 9 LỚP (MẪU BẮT BUỘC)**

Mỗi cảnh phải nằm trên một dòng duy nhất, viết bằng tiếng Anh. Phân cách nhau bằng dấu gạch đứng |.

**Cú pháp tiêu chuẩn:**

SCENE \[Số thứ tự\]: \[Context Prompt\] | ACTION TITLE: \[Hành động có Nguồn-Đích/Định vị không gian rõ ràng\] | VISUAL LOGIC: \[Logic vật lý khóa tên Target_Crop\] | SOUND: \[Âm thanh\] | VOICE OVER: \[Văn bản thuyết minh\] | VOCAL TONE: \[Giọng điệu\] | CAMERA: \[Góc máy\] | IMAGES: \[Mã hình ảnh\]

- **SCENE XX:** Số thứ tự liên tiếp từ 01 đến 80\.
- **VISUAL PROMPT (Bối cảnh hình ảnh):** Phong cách (realistic agri-tech), Ánh sáng (golden hour/sunrise), Chủ thể chính.
- **ACTION TITLE (Tiêu đề hành động):** Mô tả ngắn gọn hành động cốt lõi của cảnh (Kéo dài chính xác 8s).
- **VISUAL LOGIC (Logic thị giác):** Phải trích dẫn nghiêm ngặt các quy tắc ở Bước 4\. Nếu thiếu một quy tắc nào đó cho một vật thể ở bước 4, vui lòng thêm vào để AI tạo video không bị nhầm lẫn.
- **SOUND (Âm thanh):** Âm thanh môi trường thực tế, chi tiết.
- **VOICE OVER (Thuyết minh):** Thuyết minh tiếng Anh (3 cảnh đầu và 2 cảnh cuối là bắt buộc. Tỷ lệ tối thiểu sau 2 cảnh là có 1 cảnh có thuyết minh; nếu cảnh đó thực sự cần thiết thì thêm vào). Nếu không có, ghi VOICE OVER: NO.
- **VOCAL TONE (Giọng điệu):** Luôn sử dụng: "deep American male, middle-aged, calm, precise, warm, instructional" (nam người Mỹ giọng trầm, trung niên, điềm tĩnh, chính xác, ấm áp, mang tính hướng dẫn). Nếu VOICE OVER: NO thì VOCAL TONE: NO.
- **CAMERA:** Trích dẫn chính xác prompt Camera ở Bước 7\.
- **IMAGES (CẬP NHẬT QUAN TRỌNG V4.2): BẮT BUỘC ĐIỀN 100%.** Tuyệt đối không để trống trường này ở bất kỳ cảnh nào.
  - _Sử dụng bình thường (Tạo tham khảo chủ thể):_ IMAGES: Image 01, Image 15 (Sử dụng ảnh mô tả chi tiết hoa, quả, lá, xe cộ để AI bám sát hình dạng).
  - _Sử dụng cho Image-to-Video (Chuyển cảnh Match-Cut):_ Phải viết cú pháp | the attach image as Start Frame IMAGES: \[Mã hình ảnh\] (Ví dụ: trong Cảnh 6, viết | the attach image as Start Frame | IMAGES: Image B).
  - _Để tránh đơn điệu,_ nếu 2 cảnh không có nội dung liên tiếp (cách xa nhau), dùng 2 ảnh minh họa khác nhau.

## **BƯỚC 4: THƯ VIỆN LOGIC VẬT LÝ NÂNG CẤP (THƯ VIỆN VẬT LÝ V3.1)**

_(Bắt buộc trích dẫn chính xác trong phần VISUAL LOGIC của mỗi cảnh)_

**Cây/Quả (Plant/Fruit)**

- **Sự gắn kết (Attachment):** Trái cây phải gắn chính xác vào vị trí mọc thực tế (cành/thân/gốc). Tuyệt đối không lơ lửng. Mỗi quả chỉ có 1 cuống.
- **Hành vi bề mặt (Surface Behavior):** Độ bóng đồng đều, gân vỏ, phản chiếu ánh sáng khi xoay/thu phóng.
- **Hư hại và Rơi (Damage and Fall):** Trái cây bị rụng/cắt phải rơi theo chiều dọc.

**Đất & Cánh đồng (Soil & Field)**

- **Sự tách biệt khi cày/xới (Ploughing/Tilling Isolation):** Cày trên vùng đất HOÀN TOÀN TRỐNG. Không có cây trồng sẵn, không có ống nước, không có dụng cụ nông nghiệp khác.
- **Sự nén (Compression):** Lốp xe đè lún xuống đất mềm.
- **Phản ứng độ ẩm (Moisture Response):** Đất chuyển sang màu tối/đậm hơn ngay lập tức khi tiếp xúc với tia nước.

**Nước/Tưới tiêu (Water/Irrigation)**

- **Giới hạn nguồn (Source Constraint):** Nước CHỈ phun ra từ các đầu vòi phun, ống tưới nhỏ giọt. KHÔNG chảy ra từ dây buộc, lá, quả, hay thân cây.
- **Đường đạn (Ballistics):** Các tia nước từ vòi phun xoay phải tạo thành các đường parabol vật lý.

**Máy móc & Vận chuyển (Machinery & Transport)**

- **Logic chạy theo hàng (Row Driving Logic):** Các phương tiện di chuyển CHÍNH XÁC Ở GIỮA khôngảng trống giữa 2 hàng cây. Không chạy nối đuôi nhau trên cùng một hàng.
- **Rơ-moóc kéo sau (Rear-mounted Trailers):** Rơ-moóc chứa quả/cây PHẢI nằm 100% phía sau máy kéo (được kết nối qua một khớp nối cơ học).
- **Tính toàn vẹn động học (Kinematic Integrity):** Khớp nối cơ học giữa máy kéo và rơ-moóc vẫn duy trì kết nối khi di chuyển/chuyển hướng.
- **Chuyển động tiến (Forward Movement):** Chuyển động tịnh tiến tự nhiên về phía trước.

**Drone & Robot (Drones & Robotics)**

- **Hiệu ứng cánh quạt (Propeller Effects):** Bóng mờ chuyển động trên cánh quạt, luồng gió giáng xuống (downdraft) làm LÁ RUNG LẮC bên dưới.
- **Giới hạn Vườn ươm/Nhà máy (Nursery/Factory Restriction):** Cánh tay robot CHỈ ở trong vườn ươm/nhà máy. KHÔNG đi ra ngoài cánh đồng.
- **Tiếp điểm kẹp (Gripper Contact):** Điểm tiếp xúc của tay gắp robot phải cực kỳ rõ ràng, không bị xuyên đâm (clipping) vào cây/quả.

**Khác (Miscellaneous)**

- **Màu ống nước (Pipe Color):** Ống nước tại trạm bơm có màu XANH LÁ (không thấy nước chảy bên trong). Ống nước ngoài trời có màu ĐEN. KHÔNG TRONG SUỐT.
- **Bàn tay người (Human Hands):** Khi cầm màn hình/trái cây, KHÔNG CÓ BÀN TAY THỨ BA xuất hiện.

**Logic Vật thể & Xếp chồng (Object & Stacking Logic) \- MỚI**

- **Tính toàn vẹn khi xếp chồng (Stacking Integrity):** Các vật thể xếp chồng lên nhau (thùng, khay, pallet) PHẢI vuông vức hoàn hảo, các cạnh thẳng hàng theo chiều dọc. TUYỆT ĐỐI KHÔNG lơ lửng, biến dạng, hoặc xuyên thủng vào không gian của nhau.
- **Tích tụ trọng lực (Gravity Accumulation):** Khi trái cây được đổ vào rổ, hộp, hoặc rơ-moóc, chúng phải tự nhiên xếp chồng lên nhau từ dưới lên trên. Điểm tiếp xúc giữa các quả phải rõ ràng, không bị "hòa tan/chảy" vào nhau.
- **Bàn tay người (Human Hands):** Bàn tay con người phải có đủ các ngón (tỷ lệ bình thường), không có bàn tay thứ ba cầm quả.

## **BƯỚC 5: CÔNG NGHỆ, MÔI TRƯỜNG & CÁC QUY TẮC LÂM NGHIỆP CỤ THỂ**

- **Thương hiệu & Thiết bị:** Sử dụng chính xác DJI Agras T50, DJI Agras T25P, GlobalCheck G700 cho drone. Tương tự, với máy kéo, ghi rõ máy kéo hạng nặng, thương hiệu, gán hình ảnh (John Deere 8RX Series, Kubota...).
- **Trình tự trồng tiêu chuẩn (TRÌNH TỰ BẮT BUỘC):**
  1. Đào hố.
  2. Đặt cây con \[Target_Crop\] vào hố. (Yêu cầu nghiêm ngặt: Hố phải vừa vặn hoàn hảo với bầu rễ và căn chỉnh thẳng hàng tuyệt đối với các cây khác).
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

## **BƯỚC 6: KHUNG KỊCH BẢN TỔNG THỂ (TỔNG CỘNG \~80 CẢNH \- HƠN 10 PHÚT)**

_Lưu ý về Mẫu:_ Đây là một khung động. Tùy thuộc vào đặc điểm của giống cây (vỏ cứng, quả mọng, cây có múi, rễ cọc, rễ chùm...), bạn sẽ chọn các "Biến thể" (Variants) và "Cảnh tự suy luận" (Self-deduced scenes) tương ứng.

_Quy tắc hình ảnh:_ 100% các cảnh cần được gán \[Reference Image: ...\]. Sử dụng linh hoạt các kỹ thuật Ultra-slow motion (Siêu chậm), Fast Crash Zoom (Phóng to cực nhanh), Match-Cut (Chuyển cảnh tương đồng).

**Định dạng đầu ra:** Chỉ trả về danh sách scene mà không chia thành các phần. Mỗi mô tả scene phải nằm trên một dòng duy nhất. Các dòng liền nhau, không có dòng trống.

### **PHẦN 1: MỞ ĐẦU (HOOK) \- TỪ BÌNH MINH TRÊN NÔNG TRẠI ĐẾN KỆ SIÊU THỊ (\~6 cảnh)**

**Mục tiêu:** Đưa người xem từ cảm giác nguyên sơ, tinh khiết của thiên nhiên đến sự hiện đại của siêu thị, sau đó sử dụng Người dẫn chương trình (Host) để làm cầu nối dẫn dắt họ vào hành trình khám phá.

- **Key Scene 1: Bình minh thức giấc (Góc rộng/Cảnh thiết lập):** Ánh nắng ban mai chiếu qua tán cây trên nông trại, tạo ra những tia sáng vàng rực rỡ (God rays). Âm thanh chim hót mộc mạc. \[Reference Image: Bình minh vàng rực chiếu qua tán cây nông trại\]
- **Key Scene 2: Hơi thở thiên nhiên (Macro/Slow-motion):** Cận cảnh cực nét những giọt sương đêm trong vắt, mát lạnh còn đọng trên những chiếc lá xanh và lăn nhẹ trên bề mặt quả non. \[Reference Image: Cận cảnh sương đọng trên lá và vỏ quả dưới nắng mai\]
- **Key Scene 3: Trượt không gian (Whip-pan/Speed Ramp):** Máy quay lướt nhanh giữa hai hàng cây \-\> Đột ngột tăng tốc đến mức làm mờ hậu cảnh (Motion blur) \-\> Xuyên qua không gian và dừng lại sắc nét tại một quầy trưng bày trái cây tươi sáng rực rỡ trong siêu thị. \[Reference Image: Chuyển cảnh mờ lướt nhanh từ hàng cây sang kệ trái cây siêu thị\]
- **Key Scene 4: Chạm sản phẩm (Góc trung):** Host xuất hiện, mỉm cười và nhấc quả \[Target_Crop\] tươi ngon nhất, bóng bẩy nhất trên kệ lên để ngắm nhìn. \[Reference Image: Host mỉm cười cầm trái cây tươi tại quầy siêu thị rực rỡ\]
- **Key Scene 5: Khẳng định (Cận cảnh Host):** Cận cảnh Host tương tác với trái cây (chỉ vào gân vỏ, hoặc đưa lên ngửi hương thơm) và bắt đầu giới thiệu về sức hấp dẫn của loại quả này. \[Reference Image: Cận cảnh tay Host chỉ vào chi tiết vỏ quả\]
- **Key Scene 6: Lời mời (Chuyển cảnh Portal / Backward Whip-pan):** Host nhìn thẳng vào ống kính dẫn dắt: "Để có được trái ngọt này... hãy cùng ngược dòng thời gian về lại nông trại\!". Host búng tay hoặc đưa quả lên che kín ống kính \-\> Chuyển cảnh Whip-pan mạnh mẽ đưa khán giả trở lại không gian nông trại bao la. \[Reference Image: Host đưa quả lại gần che khuất hoàn toàn ống kính máy quay\]

### **PHẦN 2: KHÔNG GIAN BAO LA & CHU KỲ CỦA THIÊN NHIÊN (\~5 cảnh)**

**Mục tiêu:** Mở rộng không gian sau phần intro của Host, khoe quy mô khổng lồ của vùng chuyên canh.

- **Key Scene 7: Chu kỳ thiên nhiên (Time-lapse & Deep Zoom):** Bắt nhịp từ chuyển cảnh siêu thị: Bắt đầu với Góc siêu rộng. Time-lapse (tua nhanh thời gian) những đám mây cuộn chảy di chuyển nhanh, in những bóng đen khổng lồ quét qua bề mặt nông trại rộng lớn \-\> 2s cuối Crash Zoom cực mạnh xuyên qua biển mây, nhắm thẳng xuống một khu vực canh tác. \[Reference Image: Mây in bóng di chuyển trên nông trại khổng lồ\]
- **Các cảnh tự suy luận:**
  - \[Reference Image: Drone bay xuyên qua lớp sương mù buổi sớm lướt sát mặt đồng\]
  - \[Reference Image: Tracking shot góc thấp lướt dọc theo các hàng cây bất tận\]
  - \[Reference Image: Pan 180 độ phô diễn quy mô của các nhà kính công nghệ cao san sát\]
  - \[Reference Image: Ánh sáng mặt trời quét qua thung lũng từ sáng sớm đến trưa, bóng cây đổ dài rồi thu ngắn lại\]

### **PHẦN 3: NỀN TẢNG SỰ SỐNG \- LÀM ĐẤT & TRỒNG CÂY (\~10 cảnh)**

**Mục tiêu:** Cho thấy sự chuẩn bị tỉ mỉ, từ cải tạo đất bằng máy móc đến việc ươm mầm sự sống từ bàn tay con người.

- **Key Scene 8: Sức mạnh cơ giới (Ultra-slow motion):** Cận cảnh lưỡi cày của một chiếc máy kéo khổng lồ xé sâu vào lòng đất, lật tung những tảng đất tơi xốp và tạo ra một màn sương bụi vàng óng. \[Reference Image: Lưỡi cày máy kéo lật tung lớp đất tơi xốp\]
- **Key Scene 9: Gieo mầm sự sống (Macro/Dolly in):** Đôi bàn tay chai sạn của người nông dân cẩn thận đặt một bầu ươm cây con xanh mướt (hoặc hạt giống) vào một lỗ đã đào sẵn, sau đó nhẹ nhàng vun lớp đất mùn mỡ màu mỡ xung quanh. \[Reference Image: Đôi bàn tay chai sạn trồng cây con vào lỗ đất tơi xốp\]
- **Các cảnh tự suy luận:**
  - \[Reference Image: Khu vực ươm giống trong nhà kính với hàng ngàn khay cây con xanh mướt trải dài\]
  - \[Reference Image: Góc máy từ trên xuống mặt đất cày xới tạo thành những đường vân song song hoàn hảo\]
  - \[Reference Image: Cận cảnh hệ thống cày chuyên dụng đặt các ống nước ngầm màu đen vào trong đất\]
  - \[Reference Image: Nông dân dùng dụng cụ chuyên dụng đào các lỗ thẳng tắp dọc theo hàng cây\]
  - \[Reference Image: Bàn tay rám nắng bốc một vốc đất mùn tơi xốp, để lộ một con giun đất khỏe mạnh\]
  - \[Reference Image: Cận cảnh một giọt sương đọng trên chiếc lá non mềm mại của cây giống vừa trồng\]

### **PHẦN 4: NUÔI DƯỠNG & BẢO VỆ TỰ NHIÊN (\~11 cảnh)**

**Mục tiêu:** Thể hiện các kỹ thuật chăm sóc tỉ mỉ: tưới tiêu, bón phân hữu cơ và kiểm soát dịch hại.

- **Key Scene 10: Hệ thống tưới tiêu khổng lồ (Wide Time-lapse):** Góc toàn cảnh rộng. Một hệ thống hàng ngàn vòi phun đồng loạt bật mở, tạo thành những vòng cung sương trắng xóa bao phủ cánh đồng. \[Reference Image: Góc nhìn toàn cảnh của hệ thống vòi phun sương vòng cung trên cánh đồng\]
- **Key Scene 11: Thiên địch bảo vệ mùa màng (Macro):** Một con bọ rùa đỏ rực bò chầm chậm để săn rệp trên phiến lá non (phương pháp thiên địch sinh học), chứng minh một môi trường canh tác an toàn. \[Reference Image: Bọ rùa đỏ rực bò trên phiến lá xanh tươi\]
- **Các cảnh tự suy luận:**
  - \[Reference Image: Giọt nước khổng lồ vỡ tung trên lá non tạo thành vương miện nước (Slow-mo 1000fps)\]
  - \[Reference Image: Khu vực ủ phân hữu cơ bốc khói nghi ngút trong sương sớm\]
  - \[Reference Image: Nông dân rải nhịp nhàng một lớp phân hữu cơ/vỏ trấu quanh gốc cây\]
  - \[Reference Image: Đồ họa 3D xuyên thấu lòng đất, rễ cây hút dinh dưỡng và ngậm nước từ tưới nhỏ giọt ngầm\]
  - \[Reference Image: Drone nông nghiệp bay thấp, xả ra một làn sương dưỡng chất sinh học\]
  - \[Reference Image: Cỏ dại và hoa dại mọc xen kẽ dưới các hàng cây để duy trì hệ sinh thái (Góc thấp)\]
  - \[Reference Image: Ánh sáng mặt trời xiên qua màn sương mù do hệ thống tưới tạo ra (Hiệu ứng God-rays)\]

### **PHẦN 5: ĐƠM HOA & SỰ CHUYỂN MÌNH KỲ DIỆU (\~10 cảnh)**

**Mục tiêu:** Thể hiện sự chuyển biến mạnh mẽ của thời gian từ nụ hoa thành quả chín.

- **Key Scene 12: Xuyên thấu tự nhiên (Crash Zoom to Locked Macro):** 1s bay nhanh xuyên qua các lớp lá dày đặc \-\> 7s khóa chặt vào một nụ hoa \[Target_Crop\] đang đọng sương mai, khẽ rung rinh trong gió. \[Reference Image: Máy quay xuyên qua lá khóa chặt vào nụ hoa đọng sương\]
- **Key Scene 13: Sự chuyển mình của thời gian (Slow pull-back & Time-lapse):** Khung hình khóa chặt vào một quả non. 1s tĩnh \-\> 7s từ từ zoom lùi kết hợp Time-lapse ngày/đêm chớp nhoáng. Quả phình to kích thước rõ rệt, trở nên căng bóng và chuyển màu (từ xanh sang chín rực rỡ). \[Reference Image: Quả phình to và chuyển màu qua hiệu ứng time-lapse\]
- **Các cảnh tự suy luận:**
  - \[Reference Image: Time-lapse siêu thực cảnh một bông hoa nở bung rực rỡ từ nụ\]
  - \[Reference Image: Cận cảnh đàn ong thò vòi hút mật trên hoa, chân lấm tấm phấn (Macro)\]
  - \[Reference Image: Gió thổi mạnh làm hàng chục cánh hoa mỏng manh lìa cuống và bay phấp phới trong không trung\]
  - \[Reference Image: Cận cảnh lớp phấn mỏng tự nhiên phủ trên bề mặt quả chín căng mọng\]
  - \[Reference Image: Cảm biến quang học công nghệ cao chiếu tia sáng xanh dương đo độ ngọt/brix mà không làm hỏng quả\]
  - \[Reference Image: (Wide Time-lapse) Cả cánh đồng đồng loạt khoác lên lớp áo màu sắc rực rỡ báo hiệu mùa thu hoạch\]

### **PHẦN 6: ĐỈNH ĐIỂM THU HOẠCH (\~12 cảnh)**

**Mục tiêu:** Đẩy nhịp độ video lên cao trào với sự hối hả của mùa gặt, công nghệ thu hoạch, và niềm vui của người nông dân.

- **Key Scene 14: Nụ cười thu hoạch (Dolly & Focus Pull):** Lấy nét sắc nét vào một chùm quả trĩu trịt. 3s sau chuyển nét nhẹ nhàng ra phía sau, hé lộ nụ cười rạng rỡ, lấm tấm mồ hôi của một người nông dân đang ngước nhìn. \[Reference Image: Nụ cười rạng rỡ của nông dân đứng phía sau chùm quả chín\]
- **Key Scene 15: Khoảnh khắc chia lìa (Ultra-slow motion):** Cánh tay đeo găng của nông dân, dùng kéo/kìm cắt cuống một cách dứt khoát. Quả nặng nhẹ nhàng rơi vào lòng bàn tay. \[Reference Image: Dụng cụ cắt cuống sắc bén, quả rơi nhẹ vào bàn tay đeo găng\]
- **Các cảnh tự suy luận:**
  - \[Reference Image: Dòng sông trái ngọt \- Thác trái cây đổ ào ạt vào thùng xe tải/băng chuyền (Top-down Slow-mo)\]
  - \[Reference Image: Cánh tay robot tích hợp camera AI vươn ra nhẹ nhàng hái chính xác một quả chín\]
  - \[Reference Image: (Time-lapse) Bóng dáng nông dân hái quả thoăn thoắt tạo thành những vệt mờ chuyển động\]
  - \[Reference Image: Cận cảnh đôi bàn tay chai sạn dùng lớp vải mỏng nâng niu lau sạch bụi trên bề mặt quả\]
  - \[Reference Image: Cận cảnh lớp túi lưới sinh học bảo vệ quả vừa được tháo ra\]
  - \[Reference Image: Drone bám theo một đoàn xe kéo thu hoạch khổng lồ di chuyển nối đuôi nhau qua các hàng cây\]

### **PHẦN 7: VẬN CHUYỂN & CHU KỲ MỚI (\~10 cảnh)**

**Mục tiêu:** Chuẩn bị đưa sản phẩm ra khỏi vườn, đồng thời khẳng định sức sống tiếp nối của nông trại.

- **Key Scene 16: Bùng nổ hương vị tại vườn (Close-up Slow-mo):** Lưỡi dao lướt qua chẻ đôi một quả chín. 6s cuối zoom siêu cận cảnh vào phần thịt/múi quả mọng nước, những tia nước nhỏ li ti bắn lên lấp lánh dưới ánh sáng tự nhiên. \[Reference Image: Zoom siêu cận cảnh vào thịt quả bị cắt rỉ nước ép\]
- **Key Scene 17: Rời vườn dưới ánh tà dương (Wide Tracking):** Hoàng hôn đổ bóng dài. Những rổ/thùng trái cây xếp vuông vức trên xe tải lăn bánh rời khỏi khu vườn, chở thành quả về thành phố. \[Reference Image: Xe tải chở đầy thùng trái cây lăn bánh khỏi nông trại dưới ánh hoàng hôn\]
- **Các cảnh tự suy luận:**
  - \[Reference Image: Máy quay xoay 360 độ (Orbit) quanh một nông dân đang đứng cười ôm giỏ trái cây\]
  - \[Reference Image: Hình ảnh một đứa trẻ ánh mắt sáng rỡ, cười tươi cắn ngập răng vào lát trái cây mọng nước\]
  - \[Reference Image: Cánh đồng sau thu hoạch, yên ả và gọn gàng trong ánh sáng buổi chiều tà\]
  - \[Reference Image: Một mầm non xanh non nớt vừa nhú lên từ mặt đất ngay cạnh rễ gốc của cây mẹ già (Biểu tượng chu kỳ)\]

### **PHẦN 8: KHÉP KÍN VÒNG LẶP \- TRỞ LẠI SIÊU THỊ & KẾT THÚC (\~6 cảnh)**

**Mục tiêu:** Đưa khán giả trở lại điểm xuất phát, gói gọn cảm xúc, truyền tải thông điệp cuối cùng và kêu gọi hành động (CTA).

- **Key Scene 18: Sự trở lại mượt mà (Match-Cut / Whip-pan):** Máy quay bám theo thùng xe tải đang di chuyển \-\> Một cú Whip-pan (quét ngang cực nhanh) biến thùng xe tải thành kệ siêu thị. Quả \[Target_Crop\] khổng lồ lúc này nằm ngay ngắn, tỏa sáng trên kệ. \[Reference Image: Cú lướt máy quay nhanh chuyển từ thùng xe tải sang kệ trái cây siêu thị\]
- **Các cảnh tự suy luận (Bổ sung nhịp điệu trước lời chào của Host):**
  - \[Reference Image: Bàn tay của một khách hàng khác vui vẻ nhặt trái cây vào giỏ hàng, thể hiện sự tin tưởng\]
- **Key Scene 19: Lời kết của Host & Kêu gọi Hành động (Medium Close-up):** Host đứng cạnh quầy siêu thị, cầm trên tay loại quả mà khán giả đã theo dõi từ đầu. Host mỉm cười, tóm tắt thông điệp: "Từ vùng đất lành đến tận tay bạn...". Quanh Host, các icon đồ họa 2D Like, Share, Subscribe bay lên mượt mà. \[Reference Image: Host mỉm cười cầm quả tại siêu thị, chỉ tay kêu gọi hành động cùng đồ họa Like/Sub hiện lên\]
- **Key Scene 20: Dấu ấn chữ ký (Fade to Typography):** Host đặt quả xuống, màn hình từ từ mờ dần sang đen. Từ trong bóng tối, dòng chữ _Inside farm_ hiện ra rực rỡ, sắc nét, đóng vai trò như Logo chính thức khép lại hoàn toàn video. \[Reference Image: Dòng chữ phát sáng "Inside farm" hiện lên trên nền đen\]

## **BƯỚC 7: HƯỚNG DẪN PROMPT CAMERA CHO AI**

**NHÓM MACRO & CẬN CẢNH (Sinh học & Chi tiết)**

- **Locked macro push-in:** Khóa nét, từ từ đẩy sát vào chủ thể.
- **Fixed repeat-framed macro:** Tĩnh, lặp lại khung hình (Time-lapse nở hoa/nảy mầm).
- **Locked close-up:** Cận cảnh hoàn toàn tĩnh.
- **Ultra-slow macro orbit:** Xoay 360 độ siêu chậm quanh vật thể macro.

**NHÓM CHUYỂN ĐỘNG MƯỢT MÀ (Dây chuyền & Bám đuổi)**

- **Tracking shot / Low side tracking:** Trượt bám theo (từ góc thấp).
- **Smooth glide:** Lướt mượt mà (phòng kính, không gian hẹp).
- **Slow dolly:** Trượt dọc theo hành lang/hàng cây.

**NHÓM TRÊN KHÔNG & GÓC CAO (Quy mô Vĩ mô)**

- **Vertical rise to top-down master:** Bay vút lên cao chĩa thẳng xuống 90 độ.
- **Elevated oblique tracking:** Trượt bám theo góc cao nghiêng chéo (theo dõi đội hình xe).
- **Top-down glide / Hover:** Lơ lửng lướt mặt hướng thẳng góc 90 độ.
- **Rising top-down pullaway:** Bay lùi ra xa và dần ngẩng lên cao (Kết video).

**NHÓM TĨNH, ĐỐI XỨNG & ÁNH SÁNG**

- **Static wide composition:** Bố cục góc rộng tĩnh.
- **Front-facing symmetrical shot:** Cảnh quay trực diện đối xứng uy lực.
- **Static wide composition with volumetric lighting:** Cảnh toàn diện tĩnh với ánh sáng xuyên thấu (God rays).

**NHÓM CHUYỂN ĐỘNG ĐỘT PHÁ & MATCH-CUT (MỚI)**

- **High-altitude to macro fast zoom:** Phóng to (Crash zoom) từ bầu trời lao thẳng xuống siêu cận cảnh.
- **Macro to high-altitude fast zoom-out:** Kéo lùi cực nhanh từ siêu cận cảnh ra toàn cảnh vĩ mô.
- **Fixed match-cut to slow pull-back:** Liên kết hình ảnh bằng ảnh Start Frame, sau đó từ từ kéo lùi ra xa.

## **BƯỚC 8: QUY TRÌNH ĐẢM BẢO CHẤT LƯỢNG (DANH SÁCH KIỂM TRA QA ĐẶC BIỆT V4.2)**

Trước khi nạp kịch bản vào AI, người duyệt kịch bản PHẢI kiểm tra các câu hỏi sau:

- \[ \] Từ khóa \[Target_Crop\] đã xuất hiện đồng bộ trong TẤT CẢ các cảnh chưa?
- \[ \] **BẮT BUỘC TUYỆT ĐỐI:** Đã có 100% (80/80) cảnh được gán ít nhất một mã hình ảnh tham khảo trong trường IMAGES chưa? Có cảnh nào bị bỏ trống không?
- \[ \] Đã xác định đầy đủ 30-80 hình ảnh tham khảo cơ bản bao quát các góc khó (hoa, quả non, vỏ sần sùi...) của cây chưa?
- \[ \] Đã tạo các cặp ảnh Match-Cut có chung kết cấu (texture) cho Cảnh 5-6 và Cảnh 33-34 chưa?
- \[ \] Trong các cảnh kết nối bằng kỹ thuật Image-to-Video (Cảnh 6, Cảnh 34), trường IMAGES có viết đúng cú pháp \[Mã hình ảnh\] as Start Frame chưa?
- \[ \] Các cảnh cày xới có đảm bảo bề mặt đất HOÀN TOÀN TRỐNG, không có cây trồng không?
- \[ \] Máy kéo có đảm bảo chạy chính xác ở giữa hàng, không nối đuôi nhau không?
- \[ \] Rơ-moóc (gắn phía sau) có nằm 100% phía sau máy kéo không?
- \[ \] Các cảnh có nước chảy đã áp dụng quy tắc Giới hạn Nguồn (chỉ chảy từ vòi, không từ lá/quả) chưa?
- \[ \] Bối cảnh nhà kính, giàn leo, và thời tiết có được duy trì nhất quán trên tất cả các cảnh không?
- \[ \] Các cảnh đóng gói, xếp pallet, rổ trái cây đã áp dụng quy tắc Tính toàn vẹn xếp chồng / Tích tụ trọng lực để cấm AI vẽ các vật thể bị méo mó, lơ lửng, đâm xuyên vào nhau chưa?
- \[ \] Hình ảnh tham khảo có nhắc đến người Mỹ (American person) khi có sự xuất hiện của con người không?
- \[ \] Các cảnh tham khảo có nhắc đến tên cây trồng (Target_Crop) đang làm việc không?
- \[ \] Các Cảnh (Scenes) có nhắc đến một người Mỹ khi có sự xuất hiện của con người không?
- \[ \] Các Cảnh có được trả về nguyên vẹn và không bị chia lẻ thành các phần riêng biệt không?
- \[ \] **BẮT BUỘC TUYỆT ĐỐI:**Các ảnh đã được bắt đầu bằng “Image xx: “chưa?
- \[ \] **BẮT BUỘC TUYỆT ĐỐI:** Các cảnh đã được bắt đầu bằng “Scene xx: ”chưa?
- \[ \] **BẮT BUỘC TUYỆT ĐỐI:** Các cảnh đã ẩn đi khuôn mặt con người chưa?
