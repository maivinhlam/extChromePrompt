```markdown
# Khung Logic 75 Cảnh cho Nông nghiệp Công nghệ Cao

Khung này được thiết kế để tạo kịch bản video AI với **độ chính xác kỹ thuật cao**, **tính nhất quán hình ảnh**, và **sản xuất nông nghiệp công nghệ cao quy mô công nghiệp** (precision agriculture, agri‑tech, smart farming).

---

## 1. Nguyên tắc cốt lõi: Khóa định danh (Identity Locking)

**Mục tiêu:** Ngăn AI tự ý thay đổi hình dạng hoặc nhận dạng đối tượng (ví dụ: quay quả táo nhưng lại thành cà chua).  
**Quy tắc:** Từ khóa chính của sản phẩm (ví dụ **red apple fruit**, **green pear tree**) **PHẢI** xuất hiện trong mọi thành phần của một Scene:

- Trong mô tả hình ảnh
- Trong mô tả hành động
- Trong lời bình (VO)
- Trong mô tả bối cảnh

---

## 2. Mẫu 7 lớp cho mỗi phân cảnh (The 7-Layer Scene Template)

Mỗi phân cảnh phải theo cấu trúc chuẩn để AI hiểu sâu bối cảnh và kỹ thuật.  
**Lưu ý:** một phân cảnh trên một dòng, 75 phân cảnh = 75 dòng. Các phần cách nhau bằng `" | "`, tên thành phần viết HOA (ví dụ `VO abc | VOCAL TONE: xyz`):

1. **SCENE X:** Số thứ tự (phân cách bằng dấu hai chấm).
2. **Visual Prompt:** Mô tả bối cảnh tổng quát (Style: realistic high‑tech agricultural / agri‑tech, Lighting: sunrise/golden hour, Subject: mature fruit).
3. **Action Title:** Tên hành động ngắn (ví dụ _Extreme macro growth montage_).
4. **Visual Logic:** **[QUAN TRỌNG]** Ràng buộc vật lý chi tiết — **xem Mục 3 Visual Logic & Object Physics Library** để biết quy tắc đầy đủ và ràng buộc theo đối tượng. Tham chiếu các thuật ngữ công nghệ khi cần (ví dụ _edge AI scanner_, _UAV sprayer_, _fertigation controller_).
5. **SOUND:** Mô tả âm thanh môi trường (Foley) chi tiết (ví dụ soft breeze, distant birds, mechanical hum).
6. **VO:** Nội dung lời bình.
7. **Vocal Tone:** Đặc điểm giọng đọc (ví dụ deep American male, middle-aged, calm, precise). Nếu VO trống thì để trống phần này.
8. **CAMERA:** Thuật ngữ điện ảnh chuyên nghiệp (ví dụ locked macro push-in, vertical rise to top-down master).
9. **IMAGES:** Danh sách ảnh tham khảo (tối đa 3). Dùng từ danh sách đã tạo sẵn.

---

## 3. Visual Logic & Object Physics Library

**Mục đích:** Tập trung các quy tắc chuẩn về cách mỗi loại đối tượng hành xử về mặt hình ảnh và vật lý. Mọi trường `Visual Logic` ở cấp Scene phải tham chiếu và tuân thủ các quy tắc dưới đây.

**Bảng thuật ngữ công nghệ (dùng trong prompt khi phù hợp):** _precision sensors, IoT node, edge AI, telemetry, UAV (drone) sprayer, fertigation controller, optical sorter, machine vision, robotic gripper, autonomous rover, cold chain pre-cooler._

### Cách sử dụng

- Khi viết phân cảnh, **trích dẫn toàn bộ mục con tương ứng** (ví dụ `VISUAL LOGIC: Drones and Aerial Systems: downdraft bends fronds`).
- Dùng thư viện như checklist để tránh lỗi phổ biến khi sinh ảnh AI (clipping, vật thể nổi, bóng không nhất quán, chuyển động phi lý).

### Quy tắc Visual Logic theo nhóm đối tượng

#### Cây trồng và quả

- **Gắn kết:** Quả phải gắn vào cuống trừ khi bị cắt; quả nặng làm cuống/cành võng xuống.
- **Hành vi bề mặt:** Điểm sáng (specular) và phản xạ tuân theo pháp tuyến bề mặt; phản xạ không làm biến dạng hình học.
- **Tổn thương và rơi:** Quả chỉ rơi khi cuống bị cắt hoặc lực vượt ngưỡng thực tế; chuyển động rơi tuân theo trọng lực, bật/nảy/luân chuyển hợp lý.
- **Tăng trưởng:** Thay đổi kích thước/hình dạng phải diễn ra dần hoặc rõ ràng là time‑lapse; giữ nhận dạng liên tục.
- **Tương tác cảm biến:** Khi quét bằng machine vision hoặc laser profiling, tia/overlay là thành phần UI; quả vật lý không phát sáng hay biến dạng.

#### Đất và mặt nền

- **Nén:** Lốp và xích nén đất; độ sâu vết bánh tỳ theo trọng lượng.
- **Phản ứng độ ẩm:** Đất tối ngay khi nước chạm; vũng nước hình thành ở chỗ lõm.
- **Dời đất:** Lưỡi cày/auger văng đất theo quỹ đạo; cục đất vỡ vụn và lắng xuống theo trọng lực.
- **Dấu hiệu telemetry:** Cọc đánh dấu hay tag RFID là vật tĩnh; không phát tín hiệu nhìn thấy trừ khi hiển thị UI.

#### Nước và hệ tưới

- **Nguồn:** Nước chỉ chảy từ vòi, đầu phun, ống; không xuất hiện từ lá hoặc thân.
- **Quỹ đạo:** Giọt tuân theo quỹ đạo ballistic; nón phun rộng dần theo khoảng cách và áp lực.
- **Hiệu ứng áp lực:** Ống phồng khi có áp lực; tia áp lực cao tạo bắn và sương phù hợp với loại đầu phun.
- **Tương tác đất:** Giọt chạm bụi làm đất tối và bắn bẩn.
- **Fertigation:** Khi bơm dinh dưỡng, chất lỏng trộn trong ống; nếu dùng chất màu minh họa, phải hòa loãng và khuếch tán thực tế.

#### Máy móc lớn (máy kéo, cày, súng tưới, máy cắt)

- **Tính kinematik:** Các bộ phận chuyển động quay/dịch chuyển quanh điểm quay thực tế; lưỡi, đĩa có vết mài/ma sát.
- **Phản ứng lực:** Vật liệu phản ứng chỉ ở vùng tiếp xúc (ví dụ đất lật sau lưỡi cày).
- **Khói/khí thải:** Khói/bốc hơi phát ra từ ống xả/van; mật độ khói tỉ lệ với tải động cơ.
- **Hiệu ứng quy mô:** Máy lớn tạo nhiều bụi, rung, biến dạng mặt đất tương ứng.
- **Hệ điều khiển:** Bảng điều khiển, anten telemetry, hộp CANbus là phần cứng tĩnh; đèn trạng thái nhấp nháy hợp lý.

#### Robot và băng chuyền

- **Chuyển động khớp:** Khớp robot chuyển động quanh trục cơ khí; giới hạn góc được tôn trọng.
- **Tiếp xúc kẹp:** Bàn kẹp chạm tại điểm rõ ràng; vật mềm lõm, vật cứng không bị xuyên.
- **Vật lý băng chuyền:** Vật chuyển theo tốc độ băng; không tự lăn ngược dốc nếu không có chặn.
- **Machine vision:** Camera và đèn cho phân loại tạo điểm sáng thực tế; overlay phát hiện là UI.

#### Drone và hệ bay

- **Hiệu ứng cánh quạt:** Cánh quạt có motion blur; luồng gió (downdraft) làm lá rung và cuốn bụi tỉ lệ với kích thước rotor và độ cao.
- **Quỹ đạo bay:** Đường bay mượt, hợp lý; tránh dịch chuyển tức thời hoặc xuyên qua tán cây.
- **Phun:** Sương bị đẩy xuống bởi downdraft; giọt phân tán theo gió và rơi theo trọng lực.
- **Hiện tượng hình ảnh:** Bóng drone và phản chiếu phải phù hợp hướng mặt trời và độ cao.
- **Dấu hiệu tự chủ:** Khi thể hiện bay tự động, thêm kiểm tra trước bay, đèn trạng thái, overlay telemetry làm UI.

#### Rovers và robot đồng ruộng

- **Độ bám:** Xích/bánh bám đất và để lại vết; probe gặp lực cản khi xuyên đất.
- **Ổn định:** Hành động lấy mẫu có ổn định (chân chống, hạ chân) và robot đứng yên khi lấy mẫu.
- **UI nhất quán:** Màn hình onboard cập nhật hợp lý tương ứng hành động cảm biến.
- **Edge AI:** Nếu hiển thị inference tại edge, thể hiện kết quả dưới dạng UI; không làm phần cứng “suy nghĩ” bằng hoạt ảnh.

#### Phương tiện và xe nâng

- **Ổn định tải:** Pallet/hàng ngồi vững trên càng; nâng làm lốp nén và thay đổi trọng tâm.
- **Hiệu ứng chuyển động:** Xe trên đất tạo bụi; khung gầm nhún khi qua gồ ghề.
- **Tương tác càng:** Càng chui vào khe pallet sạch sẽ; không xuyên qua gỗ hoặc hàng.
- **Luồng logistics:** Quy trình bốc xếp tuân theo thời gian thực tế và phối hợp người/máy.

#### Người lao động

- **Điểm tiếp xúc:** Tay/găng chạm rõ ràng công cụ và cây; găng biến dạng và nhăn hợp lý.
- **Cơ sinh học:** Tư thế phù hợp hành động (khom, nâng, với); chuyển động tuân giới hạn khớp người.
- **Phản ứng đồ bảo hộ:** Quần áo bảo hộ có vết xước, nếp nhăn và chống gai.
- **Tương tác người‑công nghệ:** Khi dùng tablet, máy quét cầm tay, bảng điều khiển, hiển thị thao tác chạm và phản hồi màn hình thực tế.

#### Hậu cần và hậu thu hoạch

- **Phân loại băng chuyền:** Quả chuyển theo băng; máy phân loại quang học phát sáng và đẩy bằng cơ cấu.
- **Kho lạnh:** Hơi lạnh chỉ thấy ở cửa mở; thùng xếp chồng theo trọng lực và tiếp xúc thực tế.
- **Đóng gói:** Thùng gấp theo nếp; băng dính dính và nhăn.
- **Telemetry chuỗi lạnh:** Cảm biến nhiệt độ, data logger là phần cứng; hiển thị số liệu dưới dạng overlay UI.

#### Cảm biến và mạng lưới

- **Gắn:** Cột cảm biến cứng; anemometer quay theo gió; đèn LED nhấp nháy theo chu kỳ.
- **Không có tia dữ liệu vô hình:** Không hiển thị truyền dữ liệu trừ khi là overlay UI.
- **Nút IoT:** Chỉ số pin, hướng anten, tấm pin mặt trời hoạt động thực tế; đèn trạng thái phản ánh tình trạng thiết bị.

#### Môi trường và ánh sáng

- **Bóng:** Ánh sáng định hướng tạo bóng nhất quán về hướng và độ dài trong cảnh.
- **Phản chiếu:** Bề mặt ướt/óng phản chiếu môi trường; điểm sáng di chuyển theo máy quay.
- **Motion blur:** Bộ phận chuyển động nhanh có blur phù hợp.
- **Nhất quán thời gian trong ngày:** Ánh sáng sunrise/golden hour/sunset phải có nhiệt màu và bóng dài nhất quán giữa các cảnh cùng chuỗi.

---

## 4. Cấu trúc nội dung theo vòng đời (đã điều chỉnh cho Nông nghiệp Công nghệ Cao)

Một kịch bản 75 cảnh chuyên nghiệp thường theo trình tự logic sau:

| Giai đoạn                | Nội dung chính                                                     |
| ------------------------ | ------------------------------------------------------------------ |
| 1 Hook (Cảnh 1–3)        | Những cảnh đẹp nhất, cận cảnh quả chín để gây ấn tượng             |
| 2 Propagation (Vườn ươm) | Hạt giống, băng chuyền, kiểm tra quang học, ghép cành              |
| 3 Infrastructure         | Cày, lắp đặt tưới, cọc chống                                       |
| 4 Establishment          | Trồng tự động, lần tưới đầu                                        |
| 5 Maintenance            | Drone giám sát, cắt cỏ tự động, fertigation                        |
| 6 Growth                 | Mầm, nụ, hoa, đậu quả, quả lớn dần                                 |
| 7 Harvest                | Chuẩn bị thùng, máy thu hoạch hỗ trợ, lưu kho                      |
| 8 Post-harvest           | Pre-cooling, rửa, phân loại quang học, đóng gói, vận chuyển        |
| 9 Conclusion             | Toàn cảnh trang trại lúc hoàng hôn, nhấn mạnh bền vững và hệ thống |

---

## 5. Quy tắc hỗ trợ kỹ thuật

**a. Quy tắc Số lượng (Multiplicity Rule)**  
Dùng số cụ thể cho máy móc để thể hiện quy mô.

- Sai: “A tractor is working in the field.”
- Đúng: “Seven tractors working in parallel across a marked planting block.”

**b. Tập trung hành động (Single Action Focus)**  
Mỗi cảnh ~8 giây chỉ mô tả một hành động kỹ thuật duy nhất. Tránh ghép nhiều hành động phức tạp.

**c. Thuật ngữ camera ưu tiên**  
Dùng các thuật ngữ ổn định cho AI Video:

- Locked macro (cận cực tĩnh)
- Smooth backward glide (lùi máy mượt)
- High drone establishing shot (toàn cảnh drone)
- Ultra-low close tracking (theo sát mặt đất)

---

## 6. Hình ảnh tham khảo

Trước khi viết 75 cảnh, tạo danh sách ảnh tham khảo và prompt để đảm bảo đồng nhất hình ảnh.

- Mỗi cảnh chọn ảnh từ danh sách này.
- Định dạng: `Image 1: xxx`
- Một ảnh có thể dùng cho nhiều cảnh (ví dụ: người, lá, cành, hoa, quả chín, quả xanh).

---

## Ghi chú triển khai nhanh

- **Khi điền Visual Logic cho cảnh:** luôn tham chiếu mục con tương ứng trong **Mục 3 Visual Logic & Object Physics Library** (ví dụ `VISUAL LOGIC: Drones and Aerial Systems: downdraft bends fronds`).
- **Checklist trước khi hoàn thiện cảnh:** Identity Locking; Single Action Focus; tuân Visual Logic; Multiplicity; có điểm tiếp xúc; bóng và phản xạ nhất quán.
- **Phòng tránh lỗi:** thêm bước “scene QA”: kiểm tra không clipping, không vật nổi, bóng nhất quán, điểm tiếp xúc chính xác, và hành vi UI/telemetry hợp lý.

---
```
