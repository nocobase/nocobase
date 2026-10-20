import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  closeDialog: 'Đóng',
  sortTitle: 'Sắp xếp ví dụ',
  sortIntro:
    'Chạy các ví dụ sắp xếp chỉ đọc bằng ứng dụng khách HTTP Kho lưu trữ. Đoạn mã trình tạo đi kèm với các yêu cầu được tuần tự hóa thực tế; bảng duy trì thứ tự phản hồi của máy chủ. Các truy vấn trả về tối đa 10 gốc và sử dụng lại các hạt giống mối quan hệ và CRM hiện có.',
  sortLimits:
    'Sử dụng tên trường logic. Nhiều đường dẫn yêu cầu tổng hợp; to-one bao gồm không chấp nhận sắp xếp cục bộ. Con trỏ yêu cầu các trục vô hướng trực tiếp không thể rỗng và một dấu ngắt kết nối duy nhất; khác biệt chỉ chấp nhận sắp xếp vô hướng trực tiếp với một tie-break duy nhất. Không thể sắp xếp văn bản và JSON.',
  sortRequest: 'Yêu cầu thực tế · JSON AST',
  sortResultHint:
    'Hàng giữ nguyên thứ tự máy chủ. Các giá trị quan hệ được chọn rõ ràng; bản xem trước bản ghi có thể ngắn hơn số lượng tổng hợp.',
  sortExpectedError: 'Lỗi xác thực dự kiến',
  sortUnexpectedSuccess: 'Truy vấn không hợp lệ này đã thành công bất ngờ.',
  sort_default_title: 'Thứ tự khóa chính mặc định',
  sort_default_description:
    'Bỏ qua sắp xếp: khách hàng được trả về theo khóa chính tăng dần.',
  sort_asc_title: 'Giá sản phẩm tăng dần',
  sort_asc_description:
    'Trả về một biểu thức tăng dần duy nhất cho unitPriceCents; giá là xu nguyên.',
  sort_desc_title: 'Giá sản phẩm giảm dần',
  sort_desc_description:
    'Trả về một biểu thức giảm dần cho unitPriceCents; giá là xu nguyên.',
  sort_multi_title: 'Nhiều trường và ngắt kết nối tự động',
  sort_multi_description:
    'Số lượng giảm dần, sau đó giá chụp nhanh tăng dần. Các cặp bằng nhau sử dụng ID được nối thêm theo thứ tự tăng dần; demo-item-3 và demo-item-7 thể hiện sự hòa nhau.',
  'sort_nulls-first_title': 'Giá trị NULL đầu tiên',
  'sort_nulls-first_description':
    'Id người được chuyển nhượng có thể vô hiệu tăng dần với NULL trước tiên. Nhiệm vụ chưa được giao vẫn hiển thị và ID phá vỡ mối quan hệ.',
  'sort_nulls-last_title': 'Giá trị NULL cuối cùng',
  'sort_nulls-last_description':
    'Id người được chuyển nhượng có thể vô hiệu tăng dần với NULL cuối cùng. Vị trí rõ ràng tránh các giá trị mặc định NULL dành riêng cho cơ sở dữ liệu.',
  'sort_to-one_title': 'Sắp xếp theo quan hệ một-một',
  'sort_to-one_description':
    'Tên người được chuyển nhượng giảm dần, người được chuyển nhượng thiếu ở cuối cùng. Một include riêng biệt trả về tên được sử dụng để sắp xếp.',
  sort_count_title: 'Số lượng quan hệ và lựa chọn được lọc',
  sort_count_description:
    'Xếp hạng theo tất cả các đơn đặt hàng, bao gồm cả số 0. PaymentCount chỉ chọn các đơn hàng đã thanh toán; bộ lọc của nó không ảnh hưởng đến việc sắp xếp gốc.',
  sort_include_title: 'Thứ tự bao gồm độc lập',
  sort_include_description:
    'Khách hàng tăng dần theo ID trong khi đơn hàng của mỗi khách hàng giảm dần theo số lượng. Giới hạn hai bản ghi áp dụng cho mỗi khách hàng.',
  sort_duplicate_title: 'Bị từ chối: mục tiêu sắp xếp trùng lặp',
  sort_duplicate_description:
    'Cùng một trường không thể xuất hiện hai lần, ngay cả với các hướng khác nhau. Chạy để kiểm tra INVALID_SORT.',
  'sort_to-many_title': 'Bị từ chối: đường dẫn trường trực tiếp đến nhiều',
  'sort_to-many_description':
    'items.quantity có nhiều giá trị cho mỗi sản phẩm. Thay vào đó, hãy sử dụng tổng hợp quan hệ rõ ràng.',
  sort_sum_title: 'Xếp hạng SUM mối quan hệ',
  sort_sum_description:
    'Xếp hạng sản phẩm theo TỔNG số lượng mặt hàng, giảm dần bằng NULL trước. Các mối quan hệ trống được sắp xếp là 0, mặc dù SUM được chọn là NULL. Các hàng chỉ số và mục được chọn rõ ràng.',
  sort_avg_title: 'Mối quan hệ xếp hạng AVG',
  sort_avg_description:
    'Xếp hạng sản phẩm theo AVG về số lượng mặt hàng, giảm dần với NULL trước. Các mối quan hệ trống được sắp xếp thành NULL. Các hàng chỉ số và mục được chọn rõ ràng.',
  sort_min_title: 'Mối quan hệ xếp hạng MIN',
  sort_min_description:
    'Xếp hạng sản phẩm theo MIN của số lượng mặt hàng, giảm dần bằng NULL trước. Các mối quan hệ trống được sắp xếp thành NULL. Các hàng chỉ số và mục được chọn rõ ràng.',
  sort_max_title: 'Mối quan hệ Xếp hạng MAX',
  sort_max_description:
    'Xếp hạng sản phẩm theo MAX số lượng mặt hàng, giảm dần với NULL trước. Các mối quan hệ trống được sắp xếp thành NULL. Các hàng chỉ số và mục được chọn rõ ràng.',
  selectCombineTitle: 'Chọn kết hợp',
  selectCombineIntro:
    'Trả về danh sách bản ghi được đặt tên và tập hợp vô hướng từ cùng một mối quan hệ với select.combine. Mỗi ví dụ chạy một yêu cầu findMany Kho lưu trữ chỉ đọc.',
  combineScopeHint:
    'Hiển thị 10 bản ghi gốc đầu tiên theo ID. Giới hạn mối quan hệ áp dụng cho mỗi công ty mẹ và mỗi chi nhánh. Chạy quá trình di chuyển và hạt giống ứng dụng nếu không có bản ghi ví dụ nào tồn tại.',
  combineRequest: 'Yêu cầu · chọn AST',
  combineTable: 'Bảng dữ liệu',
  combineJson: 'JSON thô',
  combineNoRelated: 'Không có hồ sơ liên quan',
  combineTableHint:
    'Các cột dùng đường dẫn trường trong phản hồi. Các nhánh bản ghi hiển thị dưới dạng bảng lồng nhau; NULL khác với 0 và danh sách rỗng.',
  combineRun: 'Chạy truy vấn',
  combineResult: 'Kết quả truy vấn',
  combineResultHint:
    'Phản hồi thực tế: các nhánh được đặt tên nằm bên trong mỗi đối tượng quan hệ.',
  combineEmpty:
    'Không có hồ sơ gốc. Chạy quá trình di chuyển và hạt giống ứng dụng hoặc tạo bản ghi mẫu.',
  combine_preview_title: 'Xem trước đơn hàng và các nhánh độc lập',
  combine_preview_description:
    'Một đơn hàng được xem trước, số lượng đơn hàng đầy đủ, số lượng đã thanh toán và các bản ghi bị hủy. Giới hạn xem trước không giới hạn các nhánh anh chị em. Khách hàng không có đơn đặt hàng sẽ giữ danh sách trống và số lượng bằng 0.',
  combine_statistics_title: 'Bản ghi mục và nhiều tập hợp',
  combine_statistics_description:
    'Hai hàng mục cùng với COUNT, số lượng SUM và đơn giá ảnh chụp nhanh AVG/MIN/MAX tính bằng xu. AVG không có trọng số; một mối quan hệ trống trả về số 0 và null cho các tập hợp khác.',
  combine_nested_title: 'Đơn hàng, vật phẩm và sản phẩm lồng nhau',
  combine_nested_description:
    'Mỗi khách hàng được xem trước và đếm đơn hàng. Mỗi đơn hàng được xem trước kết hợp bản xem trước mặt hàng, số lượng và tổng số lượng; hồ sơ mặt hàng cũng bao gồm tên sản phẩm của họ.',
  combine_scoped_title: 'Bộ lọc chia sẻ và bộ lọc chi nhánh cục bộ',
  combine_scoped_description:
    'Bộ lọc nhiệm vụ dự thảo áp dụng cho mọi chi nhánh. COUNT(người được chuyển nhượngId) đếm những người được chuyển nhượng không có giá trị rỗng; chưa được chỉ định thêm người được giaoId = null. Bản xem trước một hàng không thay đổi số lượng.',
  combine_tags_title: 'Kết hợp thẻ nhiều-nhiều',
  combine_tags_description:
    'Trả về các thẻ được liên kết của mỗi dự án, tổng số lượng và số lượng Tài liệu. Bộ lọc nhánh nằm trong mối quan hệ của dự án đó; các thẻ không được liên kết sẽ bị loại trừ.',
  apiExamples: 'Ví dụ về kho lưu trữ',
  labIntro:
    'Khám phá một hoạt động mối quan hệ tại một thời điểm. Chọn một mối quan hệ, chuẩn bị một ví dụ độc lập, sau đó sử dụng biểu mẫu và bảng của nó. Mỗi thẻ sở hữu dự án và mục tiêu của nó; tải trang này không viết gì cả.',
  labOperations: 'Hoạt động quan hệ',
  labBoth: 'tới một / tới nhiều',
  labManyOnly: 'chỉ với nhiều người',
  labRelation: 'Kiểu quan hệ',
  labPrepare: 'Chuẩn bị ví dụ',
  labPrepareAgain: 'Chuẩn bị một ví dụ mới',
  labRefresh: 'Làm mới bảng',
  labPrepareHint:
    'Sự chuẩn bị tạo ra một dự án và bốn mục tiêu riêng. Sự chuẩn bị mới bảo tồn các ví dụ trước đó. Chuẩn bị sử dụng nhiều yêu cầu; mỗi cá nhân viết là giao dịch.',
  labProject: 'Dự án mẫu',
  labDefaultContent: 'Ví dụ {{operation}} {{id}}',
  labSummary: 'Tóm tắt hồ sơ',
  labLabel: 'Nhãn thẻ',
  labTitle: 'Tiêu đề nhiệm vụ',
  labPoints: 'Điểm',
  labTarget: 'Bản ghi mục tiêu',
  labChoose: 'Chọn bản ghi',
  labNewTarget: 'Tạo mục tiêu mới trong lần chạy đầu tiên',
  labNoEligible:
    'Không có mục tiêu đủ điều kiện. Chuẩn bị một ví dụ mới để thử lại.',
  labSetTargets: 'Giữ các mục tiêu này được liên kết',
  labSetEmpty:
    'Bỏ chọn tất cả để gửi bộ: []. Các mục tiêu đã xóa vẫn còn trong bảng mục tiêu.',
  labThroughRole: 'Vai trò trên liên kết này (thông qua.role)',
  labCurrentProfile: 'Hồ sơ hiện tại',
  labNoProfile: 'Hiện tại không có hồ sơ nào được liên kết.',
  labDeleteHint:
    'Thao tác này sẽ xóa bản ghi mục tiêu mẫu đã chọn. Nó không phải là sự ngắt kết nối; hàng bên dưới sẽ vẫn là kết quả xóa.',
  labUpsertHint:
    'Lần chạy đầu tiên có thể tạo mục tiêu; các lần chạy tiếp theo với cùng mục tiêu đó sẽ cập nhật nó. Các mục tiêu nằm ngoài mối quan hệ này không đủ điều kiện.',
  labExecute: 'Thực thi {{operation}}',
  labRequest: 'Xem trước yêu cầu của thao tác này',
  labSaved: 'Ghi {{operation}} thành công.',
  labRefreshFailed:
    'Việc ghi thành công nhưng việc làm mới bảng không thành công. Sử dụng bảng Làm mới trước khi viết khác.',
  labTargets: 'Mục tiêu và trạng thái mối quan hệ',
  labTableHint:
    'Mỗi mục tiêu được đọc độc lập: ngắt kết nối/đặt giữ mục tiêu, trong khi xóa sẽ xóa chúng. Chỉ mục tiêu của thẻ này được liệt kê.',
  labRecord: 'Bản ghi',
  labLinked: 'Được liên kết với dự án này',
  labExists: 'Mục tiêu tồn tại',
  labDeleted: 'Đã xóa mục tiêu',
  labYes: 'Có',
  labNo: 'Không',
  labLastCall: 'Yêu cầu và phản hồi được thực hiện lần cuối',
  lab_create_title: 'Tạo và liên kết',
  lab_create_description:
    'Tạo mục tiêu thông qua mối quan hệ. Kho lưu trữ điền vào các khóa mối quan hệ. Việc tạo hasOne yêu cầu một mối quan hệ trống trong ví dụ này.',
  lab_connect_title: 'Liên kết một mục tiêu hiện có',
  lab_connect_description:
    'Chọn một mục tiêu không liên kết được chuẩn bị cho lá bài này. Không có mục tiêu nào được tạo bằng cách kết nối. Mục tiêu hasOne phải có sẵn.',
  lab_disconnect_title: 'Hủy liên kết và giữ mục tiêu',
  lab_disconnect_description:
    'Xóa liên kết hasOne không thể rỗng, tách mục tiêu hasMany hoặc xóa liên kết bảng nối. Mục tiêu vẫn còn.',
  lab_set_title: 'Thay thế bộ mối quan hệ',
  lab_set_description:
    'Giữ chính xác các mục tiêu hiện có đã chọn. Chỉ có bộ hỗ trợ nhiều mối quan hệ; nullable hasMany khóa cho phép loại bỏ.',
  lab_update_title: 'Chỉnh sửa mục tiêu được liên kết',
  lab_update_description:
    'Chỉnh sửa một mục tiêu trong mối quan hệ hiện tại. Bản cập nhật to-one sử dụng mục tiêu hiện tại của nó mà không có bộ chọn.',
  lab_upsert_title: 'Cập nhật hoặc tạo trong phạm vi quan hệ',
  lab_upsert_description:
    'Tạo khi không có mục tiêu phù hợp nào được liên kết, nếu không thì hãy cập nhật nó. To-many sử dụng một ID duy nhất ổn định cho cả việc tra cứu và tạo.',
  lab_delete_title: 'Xóa bản ghi mục tiêu',
  lab_delete_description:
    'Xóa mục tiêu được liên kết, tuân theo các ràng buộc. Chỉ sử dụng các mục tiêu chuyên dụng được chuẩn bị cho thẻ này; mục tiêu chung có thể ảnh hưởng đến các mối quan hệ khác.',
  relationMutationsTitle: 'Mối quan hệ viết',
  relationMutationsIntro:
    'Chạy quy trình làm việc hoàn chỉnh của mối quan hệ Kho lưu trữ HTTP trên các thuộc về, hasOne, hasMany và thuộc vềToMany. Mọi nút đều sử dụng api.repository(name); không có điểm cuối đột biến cụ thể cho ví dụ nào có liên quan.',
  relationBaselineTitle: 'Đường cơ sở của mối quan hệ hạt giống',
  relationBaselineDescription:
    'Các bản ghi xác định phản ánh tài liệu ghi mối quan hệ Kho lưu trữ trong khi sử dụng tên bộ sưu tập có tiền tố plugin.',
  relationSeedHint:
    'Chạy di chuyển ứng dụng và hạt giống để tạo bản ghi ví dụ về mối quan hệ.',
  relationRunTitle: 'Hoàn thành hướng dẫn đột biến',
  relationRunDescription:
    'Tạo một biểu đồ dự án bị cô lập, áp dụng các hoạt động mối quan hệ gia tăng, sau đó thay thế bộ thẻ của nó. Mỗi đột biến gốc là giao dịch.',
  relationRunButton: 'Chạy mối quan hệ hoàn chỉnh viết',
  relationRunIsolation:
    'Mỗi lần chạy đều sử dụng ID mới, vì vậy các mẫu trước đó vẫn có sẵn để kiểm tra.',
  relationResultTitle: 'Trạng thái quan hệ cuối cùng',
  relationResultDescription:
    'Chủ sở hữu và hồ sơ đã được cập nhật, các thao tác tác vụ được áp dụng trong phạm vi quan hệ và tập hợp chỉ giữ lại các thẻ đã chọn.',
  relationLifetimeTitle: 'Kiểm tra thời gian tồn tại của mục tiêu',
  relationLifetimeDescription:
    'ngắt kết nối và đặt xóa liên kết nhưng vẫn giữ mục tiêu; xóa xóa bản ghi mục tiêu.',
  relationTraceHint:
    'Tên Kho lưu trữ thực tế, tải trọng createOne/updateOne và các phản hồi do lần chạy này đưa ra.',
  relationOwnerLabel: 'thuộc về · chủ sở hữu',
  relationProfileLabel: 'hasOne · hồ sơ',
  relationTasksLabel: 'hasMany · nhiệm vụ',
  relationTagsLabel: 'thuộcToMany · tags',
  relationTasks: 'Nhiệm vụ liên quan',
  relationPoints: 'Điểm',
  relationAssignee: 'Người được giao',
  relationDisconnectCheck:
    'ngắt kết nối: tác vụ tồn tại={{exists}}, projectId={{projectId}}',
  relationDeleteCheck: 'xóa: tác vụ tồn tại={{exists}}',
  relationSetCheck: 'được đặt: thẻ đã xóa tồn tại={{exists}}',
  findManyTitle: 'findMany: mảng và luồng',
  findManyIntro:
    'Chạy cùng một truy vấn Kho lưu trữ ở hai chế độ sử dụng. Chờ giải quyết một lần với mảng hoàn chỉnh; Phép lặp không đồng bộ sẽ đọc các bản ghi NDJSON được đóng khung khi chúng đến. Truy vấn cơ sở dữ liệu, bộ lọc, sắp xếp và giới hạn vẫn giữ nguyên.',
  findManyArrayTitle: 'Chờ một mảng',
  findManyArrayDescription:
    'Đang chờ findMany gửi yêu cầu JSON bình thường và giải quyết bằng tất cả các bản ghi khớp.',
  findManyStreamTitle: 'Lặp lại một luồng',
  findManyStreamDescription:
    'Sử dụng for wait sẽ gửi yêu cầu NDJSON và thêm từng bản ghi được giải mã vào bảng kết quả.',
  findManyProtocol: 'Phản hồi HTTP',
  findManyRunArray: 'Chạy truy vấn mảng',
  findManyRunStream: 'Chạy truy vấn luồng',
  findManyReceived: 'Hồ sơ nhận được',
  findManyReceivedCount: 'Đã nhận được bản ghi {{count}}',
  findManyResults: 'Kết quả',
  findManyRecordTitle: 'Tiêu đề',
  findManyCategory: 'Thể loại',
  findManyDescription: 'Mô tả',
  findManyEmpty: 'Chạy truy vấn này để tải các bản ghi ví dụ được chọn.',
  atomicTitle: 'Cập nhật số nguyên tử',
  atomicIntro:
    'Cập nhật số trực tiếp trong cơ sở dữ liệu với mức tăng, giảm và nhân. Yêu cầu gửi thao tác, không bao giờ là giá trị được tính từ ảnh chụp nhanh trình duyệt có thể đã cũ. Tất cả người dùng đã đăng nhập đều chia sẻ các bộ đếm mẫu này.',
  atomicStock: 'Kho hàng',
  atomicStockHint:
    'Nhận hoặc trừ đơn vị. Khấu trừ kiểm tra hàng tồn kho có sẵn trong cùng một bản cập nhật, ngăn chặn hàng tồn kho âm.',
  atomicWallet: 'Số dư tài khoản (cent)',
  atomicWalletHint:
    'Nạp tiền hoặc chi số xu nguyên. Điều kiện cân bằng và phép trừ được đánh giá cùng nhau trong cơ sở dữ liệu.',
  atomicPoints: 'Điểm thưởng',
  atomicPointsHint:
    'Thêm điểm hoặc nhân đôi số điểm hiện tại bằng cách sử dụng nhân: 2. Nhân đôi sử dụng giá trị cơ sở dữ liệu hiện tại.',
  atomicVisits: 'Ghé thăm quầy',
  atomicVisitsHint:
    'Tăng một lần hoặc gửi 10 lần tăng đồng thời: 1 yêu cầu. Những người dùng khác cũng có thể thay đổi bộ đếm chung này.',
  atomicAmount: 'Số tiền',
  atomic_increment: 'Tăng',
  atomic_decrement: 'Giảm (bảo vệ)',
  atomic_multiply: 'Gấp đôi ×2',
  atomic_concurrent: '10 đồng thời +1',
  atomicSeedHint:
    'Chạy di chuyển ứng dụng và hạt giống để tạo bộ đếm ví dụ này.',
  atomicInsufficient:
    'Bộ đếm đã bị xóa hoặc giá trị hiện tại của nó không đủ. Không có gì được khấu trừ.',
  atomicUpdated: 'Cơ sở dữ liệu trả về giá trị mới: {{value}}.',
  atomicConcurrentResult:
    '{{count}} gồm 10 lần tăng đồng thời đã thành công. Giá trị hiển thị được đọc lại từ cơ sở dữ liệu.',
  atomicPartial:
    'Một số lần tăng không thành công. Yêu cầu thành công vẫn được cam kết; kiểm tra kết quả trước khi thử lại.',
  atomicTraceHint:
    'Cập nhật thực tếMột đầu vào và phản hồi, bao gồm cả các cập nhật bị từ chối. Không có lần thử lại tự động nào được thực hiện.',
  groupByExamples: 'Thêm ví dụ về nhómBy',
  groupByMinimumCount: 'Hàng tối thiểu cho mỗi nhóm (ví dụ mới)',
  groupByEmpty:
    'Không có nhóm nào phù hợp với các bộ lọc này. Giảm số lượng tối thiểu hoặc thay đổi trạng thái.',
  groupBy_customerRanking: 'Xếp hạng đơn hàng của khách hàng',
  groupBy_customerRankingHint:
    'NHÓM THEO customerId · COUNT(*) · CÓ số lượng ≥ tối thiểu · đếm DESC, customerId ASC. Khách hàng không khớp đơn hàng sẽ không tạo thành nhóm.',
  groupBy_customerStatus: 'Khách hàng × tình trạng đơn hàng',
  groupBy_customerStatusHint:
    'NHÓM THEO Id khách hàng, trạng thái. Cùng một khách hàng có thể xuất hiện trong nhiều nhóm trạng thái. HAVING áp dụng cho từng sự kết hợp, không áp dụng cho tổng số khách hàng. Các nhóm Enum bảo toàn các giá trị chính xác; sắp xếp sử dụng số lượng và ID khách hàng.',
  groupBy_productPrice: 'Đơn giá sản phẩm × mặt hàng',
  groupBy_productPriceHint:
    'NHÓM THEO ID sản phẩm, unitPriceCents · COUNT(*) và SUM(quantity). Giá chụp nhanh mặt hàng khác nhau vẫn tách biệt ngay cả đối với cùng một sản phẩm. Sắp xếp theo số lượng DESC, id sản phẩm ASC, giá ASC. Giá là xu; COUNT đo các hàng mục chứ không phải đơn vị.',
  aggregateApply: 'Áp dụng',
  aggregateTitle: 'Truy vấn tổng hợp',
  aggregateIntro:
    'Số liệu thống kê phía cơ sở dữ liệu về các đơn đặt hàng và mặt hàng hiện có: tổng hợp, nhómBy với HAVING và số lượng mối quan hệ trên mỗi khách hàng. Bộ lọc trạng thái áp dụng cho tất cả các bảng; số lượng tối thiểu chỉ áp dụng cho các nhóm sản phẩm. Số lượng hàng tối thiểu áp dụng cho ba ví dụ groupBy bổ sung.',
  aggregateAll: 'Tất cả trạng thái',
  aggregateHaving: 'Số lượng nhóm tối thiểu (HAVING)',
  aggregateMetrics: 'Mục tổng hợp',
  aggregate_count: 'COUNT · hàng mục',
  aggregate_quantity: 'TỔNG · số lượng',
  aggregate_averagePrice: 'AVG · đơn giá (xu)',
  aggregate_minimumPrice: 'MIN · đơn giá (cent)',
  aggregate_maximumPrice: 'MAX · đơn giá (xu)',
  aggregateSemantics:
    'Giá trung bình là mức trung bình không có trọng số của đơn giá mặt hàng, không phải là tổng đơn hàng hoặc giá tính theo số lượng. Bộ trống trả về số 0 và NULL cho SUM/AVG/MIN/MAX. Bảng điều khiển chạy các truy vấn riêng biệt và có thể quan sát các chỉnh sửa đồng thời.',
  aggregateStatuses: 'Đơn hàng được nhóm theo trạng thái · groupBy',
  aggregateCustomers: 'Tổng hợp quan hệ khách hàng',
  aggregateCustomerHint:
    'Khách hàng {{count}} đầu tiên theo ID, bao gồm cả những khách hàng không có đơn hàng phù hợp. Đếm sử dụng trạng thái đã chọn.',
  aggregateProducts: 'Các mặt hàng được nhóm theo sản phẩm',
  aggregateTraceHint:
    'Gọi các hành động tổng hợp/nhóm HTTP của Kho lưu trữ đã được định cấu hình với các AST JSON; số lượng khách hàng sử dụng các lựa chọn liên quan findMany. Mở rộng các yêu cầu để kiểm tra các biểu thức thực tế.',
  crm: 'Ví dụ về CRM',
  ordersTitle: 'Ví dụ về đơn đặt hàng',
  subtitle:
    'Khách hàng, mối quan hệ và đơn đặt hàng, được cung cấp bởi API Kho lưu trữ.',
  customer: 'Khách hàng',
  contact: 'Liên hệ',
  product: 'Sản phẩm',
  order: 'Đơn hàng',
  orderItem: 'Mặt hàng đặt hàng',
  customers: 'Khách hàng',
  contacts: 'Liên hệ',
  products: 'Sản phẩm',
  orders: 'Đơn hàng',
  items: 'Đặt hàng các mặt hàng',
  name: 'Tên',
  company: 'Công ty',
  email: 'Email',
  phone: 'Điện thoại',
  status: 'Trạng thái',
  sku: 'Mã hàng',
  unitPriceCents: 'Đơn giá (cent)',
  number: 'Mã đơn hàng',
  customerId: 'Khách hàng',
  orderId: 'Đơn hàng',
  productId: 'Sản phẩm',
  quantity: 'Số lượng',
  lead: 'Khách hàng tiềm năng',
  active: 'Đang hoạt động',
  inactive: 'Không hoạt động',
  draft: 'Bản nháp',
  confirmed: 'Đã xác nhận',
  paid: 'Đã trả tiền',
  cancelled: 'Đã hủy',
  new: 'Kỷ lục mới',
  edit: 'Chỉnh sửa',
  view: 'Xem chi tiết',
  delete: 'Xóa',
  save: 'Lưu',
  cancel: 'Hủy',
  search: 'Tìm kiếm theo tên/số/ID',
  apply: 'Tìm kiếm',
  refresh: 'Làm mới',
  previous: 'Trước',
  next: 'Tiếp theo',
  page: 'Trang {{page}}',
  count: 'Bản ghi {{count}}',
  empty: 'Chưa có hồ sơ nào. Tạo bản ghi đầu tiên để bắt đầu.',
  loading: 'Đang tải…',
  select: 'Chọn bản ghi',
  createTitle: 'Tạo {{entity}}',
  editTitle: 'Chỉnh sửa {{entity}}',
  details: 'Ghi lại chi tiết',
  relations: 'Hồ sơ liên quan',
  none: 'Không có',
  lookup: 'Tra cứu theo ID',
  check: 'Kiểm tra và mở',
  notFound: 'Không có bản ghi nào có ID này.',
  found: 'Bản ghi tồn tại.',
  saved: 'Đã lưu bản ghi.',
  deleted: 'Bản ghi đã bị xóa.',
  confirmDelete:
    'Xóa bản ghi này? Các liên hệ liên quan hoặc các mục đặt hàng cũng sẽ bị xóa. Không thể xóa khách hàng có đơn hàng và sản phẩm được sử dụng theo mục đơn hàng.',
  confirm: 'Xác nhận xóa',
  trace: 'Cuộc gọi kho lưu trữ',
  traceHint:
    'Yêu cầu và kết quả mới nhất hiển thị API được màn hình này sử dụng.',
  error: 'Thao tác không thành công.',
  loadError: 'Không thể tải bản ghi. Thử lại bằng Làm mới.',
  conflict:
    'Thứ tự này đã thay đổi kể từ khi bạn mở nó. Làm mới và mở lại nó trước khi chỉnh sửa.',
  choicesHint:
    'Tạo khách hàng và sản phẩm trước, sau đó tạo đơn hàng và mặt hàng của họ.',
  moneyHint:
    'Giá là xu nguyên. Tổng dòng = số lượng × đơn giá; không có phép toán tiền tệ dấu phẩy động.',
  version: 'Phiên bản',
  addItem: 'Thêm mục',
  removeItem: 'Xóa mục',
  orderTotal: 'Tổng số đơn hàng (xu)',
  noItems: 'Không có đơn đặt hàng nào.',
  itemRow: 'Vật phẩm {{number}}',
  lineTotal: 'Tổng số dòng (xu)',
  id: 'ID',
  back: 'Quay lại danh sách',
  close: 'Đóng chi tiết',
  request: 'Yêu cầu',
  response: 'Phản hồi',
  loadingChoices: 'Đang tải các bản ghi liên quan…',
};

export default viVN;
