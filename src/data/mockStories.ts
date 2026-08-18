import { Story } from '../types/story';

export const MOCK_STORIES: Story[] = [
  {
    id: 'pham-nhan-tu-tien',
    title: 'Phàm Nhân Tu Tiên',
    author: 'Vong Ngữ',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    genres: ['Tiên Hiệp', 'Kiếm Hiệp'],
    status: 'Hoàn thành',
    rating: 4.9,
    ratingCount: 12450,
    views: 8920400,
    favorites: 34200,
    featured: true,
    hot: true,
    description: 'Một thiếu niên bình thường nơi sơn thôn nghèo khó, tên là Hàn Lập, tình cờ gia nhập giang hồ tiểu môn phái Thất Huyền Môn. Thân thế bình phàm, tư chất tầm thường, liệu hắn có thể dựa vào sự cẩn trọng, tâm cơ cẩn mật và một chiếc bình nhỏ thần bí để bước trên con đường tu tiên đầy máu lửa, tranh đấu với nhật nguyệt, nghịch thiên cải mệnh?',
    updatedAt: '2026-08-15',
    volumes: [
      {
        id: 'pn-vol-1',
        number: 1,
        title: 'Quyển 1: Thiếu Niên Xuất Sơn',
        description: 'Hàn Lập gia nhập Thất Huyền Môn, cơ duyên bái Mặc đại phu làm thầy và phát hiện bí mật bình Chưởng Thiên Bình.',
        chapters: [
          {
            id: 'pn-c1',
            number: 1,
            title: 'Chương 1: Sơn thôn thiếu niên',
            wordCount: 2850,
            updatedAt: '2026-08-10',
            volumeId: 'pn-vol-1',
            volumeTitle: 'Quyển 1: Thiếu Niên Xuất Sơn',
            content: `Thanh Ngưu trấn nằm ở phía nam Kính Châu của Việt Quốc.

Nơi này non xanh nước biếc, phong cảnh tú lệ, nhưng đại đa số dân cư đều là những nông phu chất phác kiếm sống dựa vào đất đai.

Hàn Lập ngồi trên mỏm đá bên sườn đồi, trong miệng ngậm một cọng cỏ đuôi gà, ánh mắt lơ đãng nhìn xuống cánh đồng bậc thang vàng óng phía dưới. Gió chiều mùa hạ thổi qua mang theo hơi đất nồng và mùi lúa chín thoang thoảng.

Hắn năm nay vừa tròn mười tuổi, nước da hơi ngăm đen, dáng người gầy gò, đôi mắt sáng nhưng luôn phảng phất nét trầm tĩnh vượt xa lứa tuổi đồng trang lứa. Trong nhà hắn có bảy miệng ăn, hắn là con thứ tư, bình thường trong thôn người ta quen gọi hắn là "Nhị Lăng Tử".

"Nhị Lăng Tử! Về nhà mau, Tam thúc của ngươi từ trên huyện về thăm rồi kìa!"

Tiếng gọi vang vọng từ phía lũy tre đầu làng. Hàn Lập bật dậy, nhổ cọng cỏ ra khỏi miệng rồi nhanh thoăn thoắt nhảy xuống đồi.

Hắn biết Tam thúc là người có bản lĩnh nhất trong gia tộc, nghe đâu làm chưởng quỹ cho một hiệu buôn lớn trên huyện thành, quanh năm áo lụa quần the, mỗi lần về làng đều mang theo đường phèn ngọt lịm cùng vô số câu chuyện ly kỳ về thế giới giang hồ bên ngoài.

Khi Hàn Lập bước chân vào căn nhà tranh xiêu vẹo, khói bếp đã bắt đầu nghi ngút. Cha mẹ hắn cùng Tam thúc đang ngồi quanh chiếc bàn gỗ cũ kỹ, sắc mặt người lớn ai nấy đều có vẻ nghiêm trang khác thường.

"Đại ca, Nhị ca, lần này Thất Huyền Môn mở đợt tuyển chọn đệ tử ngoại môn quy mô lớn. Thất Huyền Môn là đại môn phái danh tiếng lẫy lừng khắp vùng Kính Châu. Nếu Lập nhi có thể trúng tuyển, không chỉ được bao ăn bao ở, học võ công hộ thân, mà mỗi tháng còn gửi được bạc về phụng dưỡng gia đình."

Tam thúc vuốt chòm râu dê, nhìn Hàn Lập từ đầu đến chân rồi gật đầu tán thưởng:
"Thằng bé tuy hơi gầy nhưng ánh mắt lanh lợi, tính tình điềm đạm. Ngày mai theo ta lên huyện tham gia khảo thí!"

Cha mẹ Hàn Lập nhìn nhau, trong mắt thoáng nét lo âu nhưng nhiều hơn là sự kỳ vọng. Đối với một gia đình nông dân nghèo, đây có lẽ là cơ hội duy nhất để đổi đời.

Đêm đó, Hàn Lập trằn trọc không ngủ. Hắn ngắm nhìn vầng trăng khuyết qua khe hở của mái tranh, trong lòng rạo rực những mường tượng mơ hồ về giang hồ, đao kiếm và một chân trời rộng lớn phía trước.`
          },
          {
            id: 'pn-c2',
            number: 2,
            title: 'Chương 2: Thất Huyền Môn khảo thí',
            wordCount: 3120,
            updatedAt: '2026-08-11',
            volumeId: 'pn-vol-1',
            volumeTitle: 'Quyển 1: Thiếu Niên Xuất Sơn',
            content: `Sau ba ngày ngồi xe ngựa xóc nảy, Hàn Lập cùng Tam thúc rốt cuộc cũng đặt chân đến Thái Nhạc sơn mạch, nơi sơn môn của Thất Huyền Môn tọa lạc.

Từ xa nhìn lại, dãy núi trùng điệp ẩn hiện trong làn sương mây huyền ảo, đỉnh Lạc Nhật ngạo nghễ đâm thẳng vào tầng mây. Hàng trăm bậc thang đá xanh trải dài từ chân núi lên tận cổng sơn môn uy nghiêm, khắc ba chữ lớn bằng vàng ròng: "Thất Huyền Môn".

Quảng trường phía trước cổng đông nghẹt người. Hàng trăm hài đồng trạc tuổi Hàn Lập từ khắp các phủ huyện đổ về, ai nấy đều hồi hộp chờ đợi.

Một vị trung niên chấp sự mặc áo choàng xanh lam sẫm, lưng đeo trường kiếm, ánh mắt sắc như chim ưng bước ra cất giọng sang sảng:
"Quy tắc khảo hạch rất đơn giản: leo lên đỉnh Mộc Nhai trước giờ Ngọ! Kẻ nào vượt qua được đợt kiểm tra thể lực và ý chí mới có tư cách bước vào vòng trong!"

Hiệu lệnh vừa dứt, hàng trăm đứa trẻ bắt đầu hò hét lao lên sườn dốc đá dựng đứng.

Đoạn đường đầu dốc thoai thoải, nhưng càng lên cao gió núi rít gào càng dữ dội, vách đá trơn trượt bởi rêu xanh. Nhiều đứa trẻ đã kiệt sức bỏ cuộc, tiếng khóc lóc vang vọng khắp triền núi.

Hàn Lập hai tay trầy xước rướm máu, đôi giày vải rách toạc để lộ ngón chân tím tái. Hắn không chen lấn với đám đông mà lẳng lặng bám vào từng khe nứt của tảng đá, nhịp thở đều đặn và kiên trì từng bước một.

"Không thể bỏ cuộc... Ta phải giúp cha mẹ bớt khổ..."

Khi mặt trời vừa lên đỉnh đầu, ngón tay run rẩy của Hàn Lập chạm được vào mỏm đá đỉnh Mộc Nhai. Hắn nằm vật ra đất, ngực phập phồng kịch liệt, nhưng khóe môi nở một nụ cười nhẹ nhõm.

Hắn là người thứ ba mươi cán đích vừa kịp thời khắc then chốt!`
          },
          {
            id: 'pn-c3',
            number: 3,
            title: 'Chương 3: Thần bí Mặc đại phu',
            wordCount: 3400,
            updatedAt: '2026-08-12',
            volumeId: 'pn-vol-1',
            volumeTitle: 'Quyển 1: Thiếu Niên Xuất Sơn',
            content: `Tuy vượt qua khảo nghiệm thể lực, nhưng trong đợt kiểm tra cốt cách căn cơ tiếp theo, các vị đường chủ Thất Huyền Môn đều lắc đầu ngán ngẩm trước tư chất của Hàn Lập:
"Căn cốt bình thường, kinh mạch bế tắc, khó lòng tu luyện võ công thượng thừa giang hồ."

Tưởng chừng như giấc mộng hiệp khách đã tan thành mây khói, thì một lão nhân ho khan từng cơn từ phía góc viện bước tới.

Lão nhân này lưng hơi còng, tóc hoa râm, khuôn mặt gầy gò nhợt nhạt nhưng đôi mắt sâu thẳm lóe lên những tia sáng kỳ dị.

"Nhạc Môn chủ, lão phu ở Thần Thủ Cốc đang thiếu một dược đồng chăm sóc thảo dược và thử thuốc. Nếu chư vị không nhận đứa nhỏ này, chi bằng giao cho lão phu đi."

Người này chính là Mặc đại phu, thần y lừng danh của Thất Huyền Môn. Dù không dạy võ công môn phái nhưng ngay cả Môn chủ cũng phải kính trọng ông ta ba phần vì y thuật kinh thế hãi tục.

Hàn Lập cứ như vậy đi theo Mặc đại phu vào Thần Thủ Cốc - một thung lũng biệt lập, bốn bề hoa thơm cỏ lạ ngát hương.

Mặc đại phu ném cho hắn một cuốn bí kíp da thú ngả vàng:
"Đây là 'Trường Xuân Công'. Trong vòng nửa năm, nếu ngươi tu luyện sinh ra được một luồng khí cảm chân khí đầu tiên trong đan điền, ngươi sẽ chính thức trở thành đệ tử chân truyền của ta. Nếu không... hãy cuốn gói rời khỏi cốc!"

Hàn Lập ôm chặt cuốn khẩu quyết, bắt đầu những ngày tháng ngồi xếp bằng đả tọa trong tĩnh thất thanh u.`
          },
          {
            id: 'pn-c4',
            number: 4,
            title: 'Chương 4: Chưởng Thiên Bình hiện thế',
            wordCount: 3600,
            updatedAt: '2026-08-13',
            volumeId: 'pn-vol-1',
            volumeTitle: 'Quyển 1: Thiếu Niên Xuất Sơn',
            content: `Thấm thoát ba tháng trôi qua. Hàn Lập ngày đêm chuyên tâm tu luyện khẩu quyết Trường Xuân Công, thế nhưng đan điền vẫn như mặt hồ phẳng lặng, không hề có chút động tĩnh nào của chân khí.

Một buổi tối hè oi bức, sau buổi luyện công bế tắc, Hàn Lập đi dạo vào sâu trong rừng trúc sau cốc để hóng gió giải tỏa tâm trí.

Bỗng nhiên, chân hắn vấp phải một vật cứng chôn vùi nửa phần dưới lớp đất ẩm.

Cúi xuống gạt đi lớp lá mục, một chiếc bình nhỏ bằng ngọc màu xanh lục chỉ cỡ nắm tay lộ ra trước mắt. Bình có hình dáng hồ lô cổ kính, trên bề mặt chạm khắc những hoa văn tinh xảo không thuộc về văn tự phàm trần.

Điều kỳ lạ là chiếc bình không hề dính một hạt bụi đất nào, khi cầm lên cảm giác mát lạnh thấu xương lan tỏa khắp lòng bàn tay.

Hàn Lập tò mò định mở nút bình ra xem bên trong có gì, nhưng nút bình như được đúc liền khối, dẫu hắn dùng hết sức bình sinh cũng không suy suyển mảy may.

Đêm đó, Hàn Lập đặt chiếc bình ngọc nhỏ trên bậu cửa sổ phòng ngủ rồi chìm vào giấc ngủ sâu.

Nửa đêm, một luồng ánh sáng dịu nhẹ đánh thức hắn.

Khi mở mắt ra, cảnh tượng trước mắt khiến Hàn Lập sững sờ: Vô số đốm sáng màu xanh lục như đom đóm từ bốn phương tám hướng giữa trời đêm bay tới, tụ lại thành từng dải ngân hà thu nhỏ cuồn cuộn rót vào chiếc bình lục bảo!

Bên trong bình, một giọt chất lỏng màu ngọc bích phát ra linh khí nồng đậm đang từ từ ngưng tụ...`
          }
        ]
      },
      {
        id: 'pn-vol-2',
        number: 2,
        title: 'Quyển 2: Giang Hồ Phong Ba',
        description: 'Bí mật của Mặc đại phu phơi bày, Hàn Lập bước chân vào giang hồ và đại khai sát giới tại Dã Lang Bang.',
        chapters: [
          {
            id: 'pn-c5',
            number: 5,
            title: 'Chương 5: Lục dịch diệu dụng',
            wordCount: 3200,
            updatedAt: '2026-08-14',
            volumeId: 'pn-vol-2',
            volumeTitle: 'Quyển 2: Giang Hồ Phong Ba',
            content: `Sau khi phát hiện khả năng hấp thu tinh hoa nhật nguyệt của tiểu bình, Hàn Lập bắt đầu tiến hành hàng loạt thí nghiệm cẩn trọng.

Hắn phát hiện chất lỏng màu lục bên trong bình có một công năng nghịch thiên: khi nhỏ một giọt vào rễ cây thảo dược, một gốc linh thảo chỉ mới gieo trồng vài ngày có thể sinh trưởng thần tốc tương đương với dược thảo sinh trưởng hàng trăm năm!

Nhờ có những cọng dược thảo trăm năm này luyện thành đan dược trợ giúp tu luyện, Trường Xuân Công của Hàn Lập đột phá liên tiếp từ tầng thứ nhất lên tầng thứ ba.

Tuy nhiên, hắn cũng nhận ra ánh mắt Mặc đại phu nhìn mình ngày càng trở nên quái đản và tham lam đến rợn người...`
          },
          {
            id: 'pn-c6',
            number: 6,
            title: 'Chương 6: Tử sinh đối quyết',
            wordCount: 3800,
            updatedAt: '2026-08-15',
            volumeId: 'pn-vol-2',
            volumeTitle: 'Quyển 2: Giang Hồ Phong Ba',
            content: `Màn đêm buông xuống Thần Thủ Cốc u tịch. Mặc đại phu rốt cuộc đã lộ rõ dã tâm chiếm đoạt thân xác (Đoạt Xá) của Hàn Lập sau khi hắn đạt tới tầng thứ tư Trường Xuân Công.

Một trận tử chiến ngấm ngầm giữa hai thầy trò nổ ra trong mật thất. Bằng sự quyết đoán, mưu lược và bảo vật hộ thân, Hàn Lập đã nghịch chuyển càn khôn tiêu diệt tàn hồn của Mặc đại phu.

Rời khỏi Thần Thủ Cốc, Hàn Lập dấn thân vào giang hồ hiểm ác, mở ra một chương mới đầy sóng gió trên con đường truy tìm tiên đạo...`
          }
        ]
      },
      {
        id: 'pn-vol-3',
        number: 3,
        title: 'Quyển 3: Hoàng Phong Cốc Nhập Môn',
        description: 'Rời bỏ phàm trần, bước chân vào giới tu tiên chân chính tại Thái Nhạc sơn mạch Việt Quốc.',
        chapters: [
          {
            id: 'pn-c7',
            number: 7,
            title: 'Chương 7: Thái Nam tiểu hội',
            wordCount: 4100,
            updatedAt: '2026-08-16',
            volumeId: 'pn-vol-3',
            volumeTitle: 'Quyển 3: Hoàng Phong Cốc Nhập Môn',
            content: `Thái Nam Cốc mây mù che phủ, nơi đây đang diễn ra phiên chợ tu tiên bí mật dành cho tán tu thập phương.

Lần đầu tiên Hàn Lập được chiêm ngưỡng pháp khí bay lượn trên không trung, bùa chú phù lục đủ sắc màu và các loại đan dược thần kỳ.

Hắn sử dụng danh nghĩa đệ tử Mặc gia để tiếp cận Lệnh bài Thăng Tiên, quyết tâm bái nhập Hoàng Phong Cốc - một trong Thất Đại Tông Môn của Việt Quốc.`
          },
          {
            id: 'pn-c8',
            number: 8,
            title: 'Chương 8: Thăng Tiên Lệnh Phong Ba',
            wordCount: 4500,
            updatedAt: '2026-08-17',
            volumeId: 'pn-vol-3',
            volumeTitle: 'Quyển 3: Hoàng Phong Cốc Nhập Môn',
            content: `Cầm trên tay Thăng Tiên Lệnh danh giá kèm theo một viên Trúc Cơ Đan quý báu, Hàn Lập trở thành tâm điểm dòm ngó của vô số đệ tử Luyện Khí kỳ đỉnh phong trong môn phái.

Để bảo toàn tính mạng, hắn chấp nhận trao đổi viên Trúc Cơ Đan lấy quyền quản lý một phiến Dược Viên hẻo lánh dưới chân núi Nhạc Lộc.

Từ đây, một vị "Dược Viên Tiểu Quản Sự" âm thầm dùng Chưởng Thiên Bình gieo trồng thiên niên linh dược, từng bước tích lũy tài nguyên kinh người...`
          }
        ]
      }
    ]
  },
  {
    id: 'quy-bi-chi-chu',
    title: 'Quỷ Bí Chi Chủ (Lord of the Mysteries)',
    author: 'Ái Tiềm Thủy Đích Ô Tặc',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    genres: ['Huyền Huyễn', 'Trinh Thám', 'Khoa Huyễn'],
    status: 'Hoàn thành',
    rating: 5.0,
    ratingCount: 28900,
    views: 15400200,
    favorites: 65400,
    featured: true,
    hot: true,
    description: 'Thời đại hơi nước và máy móc gầm rú, sương mù Luân Đôn cổ kính che phủ những bí mật cổ xưa. Ma dược, bói toán, nguyền rủa, phong ấn vật... Chu Minh Thụy xuyên không vào thân xác Klein Moretti tại Vương quốc Loen, thức tỉnh trên bàn họp sương mù xám bí ẩn, trở thành "Kẻ Khờ" thống lĩnh vận mệnh.',
    updatedAt: '2026-08-16',
    volumes: [
      {
        id: 'qb-vol-1',
        number: 1,
        title: 'Quyển 1: Chú Hề',
        description: 'Klein Moretti thức tỉnh tại thành phố Tingen, gia nhập Đội Kẻ Gác Đêm và bắt đầu hành trình Danh sách Ma Dược.',
        chapters: [
          {
            id: 'qb-c1',
            number: 1,
            title: 'Chương 1: Đỏ thẫm và Thức tỉnh',
            wordCount: 3300,
            updatedAt: '2026-08-01',
            volumeId: 'qb-vol-1',
            volumeTitle: 'Quyển 1: Chú Hề',
            content: `Cơn đau nhức nhối như muốn bổ đôi hộp sọ khiến Chu Minh Thụy từ từ tỉnh lại.

Trước mắt hắn là một căn phòng ngập tràn ánh sáng đỏ thẫm kỳ dị. Mặt trăng máu ngoài cửa sổ treo lơ lửng trên bầu trời đêm đầy sương khói của thời đại công nghiệp hơi nước.

Hắn đưa tay sờ lên thái dương bên phải, ngón tay chạm phải một lỗ thủng nhớp nháp dịch não và máu đông.

"Mình... bị bắn vào đầu?"

Bên cạnh hắn là một khẩu súng lục ổ quay nòng ngắn kiểu cổ, một cuốn nhật ký bìa da màu đen và một chiếc đèn dầu bằng đồng thau đã tắt lịm.

Ký ức của nguyên chủ thân xác - Klein Moretti, một cử nhân lịch sử vừa tốt nghiệp Đại học Hoy thuộc Vương quốc Loen - ào ạt ùa về như thủy triều.

Trên trang nhật ký mở sẵn còn lưu lại dòng chữ viết bằng mực đen run rẩy:
"Tất cả mọi người đều sẽ chết, kể cả tôi."`
          },
          {
            id: 'qb-c2',
            number: 2,
            title: 'Chương 2: Sương Mù Xám Vô Tận',
            wordCount: 3750,
            updatedAt: '2026-08-02',
            volumeId: 'qb-vol-1',
            volumeTitle: 'Quyển 1: Chú Hề',
            content: `Sau khi dọn dẹp hiện trường và dùng nghi thức chuyển vận bốn góc phòng bằng cơm nếp và bánh mì, một lực hút kinh hoàng bỗng nhiên xé toạc linh hồn Klein khỏi thể xác.

Hắn thấy mình đứng lơ lửng giữa một biển sương mù màu xám trắng vô tận, cổ xưa và hùng vĩ như tồn tại từ thuở khai thiên lập địa.

Phía trên sương mù là một tòa cung điện nguy nga tráng lệ chống đỡ bởi hàng chục cột đá khổng lồ.

Ở giữa cung điện đặt một chiếc bàn dài bằng đá đồng cổ xưa, xung quanh xếp hai mươi hai chiếc ghế lưng cao khắc những biểu tượng bí ẩn của bài Tarot.

Klein ngồi vào vị trí ghế chủ tọa cao nhất, gõ nhẹ ngón tay lên mặt bàn:
"Từ hôm nay, ta sẽ là 'Kẻ Khờ' (The Fool)..."`
          }
        ]
      },
      {
        id: 'qb-vol-2',
        number: 2,
        title: 'Quyển 2: Người Không Mặt',
        description: 'Rời Tingen tới thủ đô Backlund ngập tràn sương mù ô nhiễm, hóa thân thành thám tử Sherlock Moriarty.',
        chapters: [
          {
            id: 'qb-c3',
            number: 3,
            title: 'Chương 3: Thám tử phố Minsk',
            wordCount: 3900,
            updatedAt: '2026-08-05',
            volumeId: 'qb-vol-2',
            volumeTitle: 'Quyển 2: Người Không Mặt',
            content: `Backlund - thành phố của hy vọng và cũng là địa ngục của những kẻ bần hàn.

Khoác lên mình chiếc áo măng tô đen, đội mũ phớt dạ lịch lãm và cầm cây gậy batoong đầu khảm bạc, Sherlock Moriarty - thân phận mới của Klein - mở cánh cửa văn phòng thám tử số 15 phố Minsk.

Lời cầu nguyện từ sương mù xám lại vang lên trong tâm trí hắn...`
          }
        ]
      }
    ]
  },
  {
    id: 'dai-phung-da-can-nhan',
    title: 'Đại Phụng Đả Canh Nhân',
    author: 'Mại Báo Tiểu Lang Quân',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    genres: ['Tiên Hiệp', 'Trinh Thám', 'Lịch Sử'],
    status: 'Hoàn thành',
    rating: 4.8,
    ratingCount: 19800,
    views: 11200000,
    favorites: 48900,
    featured: true,
    hot: false,
    description: 'Hứa Thất An tốt nghiệp trường cảnh sát, bất ngờ xuyên không trở thành một tiểu bổ khoái ngục tốt tại Đại Phụng vương triều. Bằng tư duy phá án hiện đại, tài làm thơ chấn động kinh thành và phong cách hài hước vô sỉ, hắn từng bước quấy đảo triều đình, chấn hưng Nho gia, đạp bằng thần phật!',
    updatedAt: '2026-08-14',
    volumes: [
      {
        id: 'dp-vol-1',
        number: 1,
        title: 'Quyển 1: Kinh Thành Phá Án Ký',
        description: 'Vụ án trộm bạc thuế kinh hoàng và bước ngoặt gia nhập nha môn Đả Canh Nhân.',
        chapters: [
          {
            id: 'dp-c1',
            number: 1,
            title: 'Chương 1: Mở màn trong ngục tối',
            wordCount: 3100,
            updatedAt: '2026-08-05',
            volumeId: 'dp-vol-1',
            volumeTitle: 'Quyển 1: Kinh Thành Phá Án Ký',
            content: `Hứa Thất An mở mắt ra, đập vào mắt là trần ngục tối tăm ẩm mốc bốc mùi hôi thối nồng nặc.

Cổ hắn đang đeo gông xiềng bằng gỗ nặng trĩu.

"Khốn kiếp, người ta xuyên không làm hoàng tử vương gia, còn ta vừa mở mắt đã thành tử tù chuẩn bị lưu đày ba ngàn dặm?"

Nguyên nhân là do nhị thúc của hắn làm sai lệch vụ vận chuyển bạc thuế của hộ bộ, toàn bộ Hứa gia bị liên lụy tống giam. Muốn tự cứu lấy mình và gia đình, hắn chỉ có ba ngày để tìm ra chân tướng vụ án kỳ bí này bằng kiến thức hóa học và kỹ năng giám định dấu vết thời hiện đại!`
          },
          {
            id: 'dp-c2',
            number: 2,
            title: 'Chương 2: Hóa học phá kỳ án',
            wordCount: 3500,
            updatedAt: '2026-08-06',
            volumeId: 'dp-vol-1',
            volumeTitle: 'Quyển 1: Kinh Thành Phá Án Ký',
            content: `Tại công đường phủ doãn, Hứa Thất An bình tĩnh yêu cầu một chậu nước giếng trong vắt và vài thỏi bạc vụn.

Trước sự chứng kiến của các vị đại thần tam phẩm và thủ lĩnh Đả Canh Nhân Ngụy Uyên, hắn biểu diễn phản ứng hóa học bóc trần thủ đoạn hoán đổi bạc thật bằng bạc giả tráng thủy ngân của kẻ chủ mưu...`
          }
        ]
      }
    ]
  },
  {
    id: 'kiem-lai',
    title: 'Kiếm Lai',
    author: 'Phong Hỏa Hí Chư Hầu',
    coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    genres: ['Kiếm Hiệp', 'Tiên Hiệp'],
    status: 'Đang ra',
    rating: 4.9,
    ratingCount: 16500,
    views: 9800000,
    favorites: 51200,
    featured: false,
    hot: true,
    description: 'Thế giới bao la vạn dặm, có kiếm tiên nhất kiếm đoạn giang sơn, có nho sĩ đọc sách mà dưỡng hạo nhiên chính khí. Trần Bình An, một thiếu niên giày cỏ nghèo khó tại trấn Ly Châu, gánh trên vai lời ước hẹn, tay cầm trúc trượng, từng bước một đi ra thiên hạ kiếm đạo vô song.',
    updatedAt: '2026-08-17',
    volumes: [
      {
        id: 'kl-vol-1',
        number: 1,
        title: 'Quyển 1: Thiếu Niên Giày Cỏ',
        description: 'Trấn Ly Châu ngàn năm phong bế, rồng chìm đáy giếng và sự lựa chọn của Trần Bình An.',
        chapters: [
          {
            id: 'kl-c1',
            number: 1,
            title: 'Chương 1: Trấn nhỏ mưa phùn',
            wordCount: 3600,
            updatedAt: '2026-08-08',
            volumeId: 'kl-vol-1',
            volumeTitle: 'Quyển 1: Thiếu Niên Giày Cỏ',
            content: `Trời đổ cơn mưa phùn lất phất trên những mái ngói rêu phong của trấn Ly Châu.

Trần Bình An mang đôi giày cỏ cũ mòn, vai vác chiếc sọt thuốc nhỏ men theo con ngõ hẹp. Hắn mồ côi cha mẹ từ nhỏ, sống dựa vào nghề nung gốm và hái thuốc cỏ.

Trong con mắt của người dân trấn nhỏ, hắn chỉ là một đứa trẻ chất phác, lương thiện đến mức ngốc nghếch. Thế nhưng không ai hay biết, mảnh đất này chính là nơi chôn giấu long mạch cuối cùng của nhân gian.`
          },
          {
            id: 'kl-c2',
            number: 2,
            title: 'Chương 2: Ngũ Thập Thất Tự Khẩu Quyết',
            wordCount: 3800,
            updatedAt: '2026-08-09',
            volumeId: 'kl-vol-1',
            volumeTitle: 'Quyển 1: Thiếu Niên Giày Cỏ',
            content: `Tề tiên sinh của học đường Tây Sơn trao cho thiếu niên một cuốn thẻ tre mộc mạc.

"Bình An, đạo lý của thế gian rất lớn, nhưng tâm của con người có thể còn lớn hơn. Hãy giữ vững tâm niệm thiện lương ban đầu, kiếm đạo của ngươi sẽ không bao giờ gãy."`
          }
        ]
      }
    ]
  },
  {
    id: 'toan-chuc-cao-thu',
    title: 'Toàn Chức Cao Thủ',
    author: 'Hồ Điệp Lam',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    genres: ['Võng Du', 'Đô Thị'],
    status: 'Hoàn thành',
    rating: 4.9,
    ratingCount: 22100,
    views: 14800000,
    favorites: 59000,
    featured: false,
    hot: true,
    description: 'Diệp Tu - cao thủ đứng đầu game Vinh Quang bị câu lạc bộ ép buộc giải nghệ. Rời khỏi đấu trường chuyên nghiệp, hắn vào làm nhân viên coi quán net Hưng Hân. Khi máy chủ thứ 10 mở cửa, với mười năm kinh nghiệm và vũ khí tự chế Ô Thiên Cơ, hắn bắt đầu hành trình trở lại ngai vàng đỉnh cao!',
    updatedAt: '2026-08-12',
    volumes: [
      {
        id: 'tc-vol-1',
        number: 1,
        title: 'Quyển 1: Tiệm Net Hưng Hân & Khu 10 Khởi Đầu',
        description: 'Rời Gia Thế trong đêm tuyết rơi, lập tài khoản Quân Mạc Tiếu tại máy chủ mới.',
        chapters: [
          {
            id: 'tc-c1',
            number: 1,
            title: 'Chương 1: Rời khỏi Gia Thế',
            wordCount: 3100,
            updatedAt: '2026-08-01',
            volumeId: 'tc-vol-1',
            volumeTitle: 'Quyển 1: Tiệm Net Hưng Hân & Khu 10 Khởi Đầu',
            content: `Tuyết mùa đông rơi dày đặc trên con phố Hàng Châu lạnh buốt.

Diệp Tu kéo cao cổ áo khoác, ngậm điếu thuốc chưa châm lửa, quay đầu nhìn lại tòa nhà câu lạc bộ Gia Thế lần cuối. Thẻ tài khoản "Nhất Diệp Chi Thu" - Đấu Thần huyền thoại mà hắn gắn bó suốt mười năm qua đã bị tước đoạt trao cho người khác.

Băng qua ngã tư đường, ánh đèn neon ấm áp của tiệm net Hưng Hân hiện ra trước mắt...`
          },
          {
            id: 'tc-c2',
            number: 2,
            title: 'Chương 2: Quân Mạc Tiếu & Ô Thiên Cơ',
            wordCount: 3400,
            updatedAt: '2026-08-02',
            volumeId: 'tc-vol-1',
            volumeTitle: 'Quyển 1: Tiệm Net Hưng Hân & Khu 10 Khởi Đầu',
            content: `Đúng 0h00, máy chủ thứ 10 của game Vinh Quang chính thức khai mở.

Một nhân vật mang tên "Quân Mạc Tiếu" - chức nghiệp Tán Nhân không chuyển chức, tay cầm cây dù màu bạc mang tên Ô Thiên Cơ xuất hiện tại Tân Thủ Thôn, chuẩn bị khuynh đảo toàn bộ giới eSports...`
          }
        ]
      }
    ]
  },
  {
    id: 'sieu-than-co-gioi-su',
    title: 'Siêu Thần Cơ Giới Sư',
    author: 'Tề Bội Giáp',
    coverImage: 'https://images.unsplash.com/photo-1535378620166-273708d44e4c?auto=format&fit=crop&w=600&q=80',
    genres: ['Khoa Huyễn', 'Võng Du'],
    status: 'Hoàn thành',
    rating: 4.7,
    ratingCount: 14200,
    views: 7600000,
    favorites: 31000,
    featured: false,
    hot: false,
    description: 'Hàn Tiêu xuyên không vào tựa game bom tấn "Tinh Hải", trở thành một NPC thí nghiệm của tổ chức phản diện Manh Nha trước ngày game mở cửa Closed Beta. Nắm giữ kiến thức tương lai, hắn chuyển chức thành Cơ Giới Sư, chế tạo quân đoàn cơ giáp, biến người chơi thành công cụ thăng cấp của mình!',
    updatedAt: '2026-08-10',
    volumes: [
      {
        id: 'st-vol-1',
        number: 1,
        title: 'Quyển 1: Hải Lam Tinh Phá Vòng Vây',
        description: 'Trốn thoát khỏi phòng thí nghiệm Manh Nha và dựng nghiệp tại Tinh Cầu Hải Lam.',
        chapters: [
          {
            id: 'st-c1',
            number: 1,
            title: 'Chương 1: Thân phận NPC thí nghiệm Zero',
            wordCount: 3000,
            updatedAt: '2026-08-01',
            volumeId: 'st-vol-1',
            volumeTitle: 'Quyển 1: Hải Lam Tinh Phá Vòng Vây',
            content: `Hàn Tiêu tỉnh dậy trong một lồng ấp dịch dinh dưỡng trong suốt bằng kính cường lực.

Giao diện bảng thuộc tính quen thuộc của game Tinh Hải hiện lên trước võng mạc của hắn:
[Tên: Hàn Tiêu]
[Thân phận: NPC thí nghiệm Zero]
[Đẳng cấp: Cấp 1]
[Thời gian đếm ngược người chơi Closed Beta đổ bộ: 365 ngày...]

"Làm NPC thì sao chứ? Ta sẽ biến các ngươi thành leek (hành tây) để thu hoạch!"`
          }
        ]
      }
    ]
  }
];
