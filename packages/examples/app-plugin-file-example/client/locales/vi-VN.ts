import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  officePreviewTitle: 'Xem trước văn phòng địa phương',
  officePreviewDescription:
    'Tải lên tệp DOCX, XLSX hoặc PPTX bên dưới rồi chọn Xem trước. Tài liệu hiển thị trong trình duyệt của bạn mà không cần Office Online hoặc dịch vụ xem trước bên ngoài. Tệp đính kèm đơn đặt hàng sử dụng cùng một bản xem trước.',
  officePreviewLimits:
    'Không cần kết nối Internet khi có thể truy cập ứng dụng và dịch vụ tệp trên mạng cục bộ của bạn. Đây không phải là chế độ ngắt kết nối hoàn toàn. Các tệp DOC, XLS, PPT và OpenDocument kế thừa vẫn ở chế độ chỉ tải xuống trong ví dụ này.',
  title: 'Tệp đính kèm',
  description:
    'Tải lên một hoặc nhiều tệp và xem trước chúng tại chỗ. Các bản ghi được lưu trữ thông qua Kho lưu trữ tệp API.',
  apiHint:
    'Trang này giữ nguyên luồng kho lưu trữ thô: kiểm soát tải lên gọi uploadOne cho một tệp duy nhất và uploadMany cho một lô.',
  retention:
    'Việc xóa một bản ghi chỉ xóa siêu dữ liệu của nó; đối tượng được lưu trữ vẫn còn trên đĩa.',
  choose: 'Chọn tập tin',
  uploading: 'Đang tải lên…',
  dropHint: 'hoặc thả file vào đây',
  tooLarge: 'Tệp vượt quá kích thước tối đa',
  rejected: 'Loại tệp không được phép',
  uploadFailed: 'Tải lên không thành công',
  preview: 'Xem trước',
  download: 'Tải xuống',
  remove: 'Xóa',
  unlink: 'Xóa khỏi đơn hàng',
  empty: 'Chưa có tập tin nào.',
  close: 'Đóng',
  previous: 'Trước',
  next: 'Tiếp theo',
  loading: 'Đang tải…',
  previewUnsupported:
    'Loại tệp này không có bản xem trước nội tuyến. Thay vào đó hãy tải xuống.',
  previewFailed: 'Không thể tải tệp.',
  navGroup: 'Ví dụ về tệp',
  navAttachments: 'Tệp đính kèm',
  navProfiles: 'Hình đại diện hồ sơ',
  navOrders: 'Đơn hàng đính kèm',
  profilesTitle: 'Hình đại diện hồ sơ (một-một)',
  profilesDescription:
    'Một hồ sơ có tối đa một hình đại diện. Tải lên hình đại diện mới sẽ thay thế tệp trước đó.',
  profilesRelationHint:
    'Mối quan hệ: fileExampleProfiles.avatar là mối quan hệ hasOne với fileExampleProfileAvatars, giữ một profileId duy nhất.',
  noAvatar: 'Không có hình đại diện',
  profilesNoFile: 'Không có tập tin avatar nào được kết nối',
  profilesEmpty:
    'Không tìm thấy hồ sơ nào. Chạy hạt giống ví dụ để tạo bản ghi demo.',
  uploadAvatar: 'Tải lên hình đại diện',
  replaceAvatar: 'Thay thế hình đại diện',
  removeAvatar: 'Xóa hình đại diện',
  avatarHint:
    'Tải lên sẽ lưu trữ tệp và sau đó kết nối nó thông qua quan hệ hồ sơ; loại bỏ chỉ xóa mối quan hệ.',
  ordersTitle: 'Tệp đính kèm đơn hàng (một-nhiều)',
  ordersDescription:
    'Một đơn hàng sở hữu số lượng tài liệu đính kèm bất kỳ. Chọn nhiều tệp cùng lúc để tải chúng lên hàng loạt.',
  ordersRelationHint:
    'Mối quan hệ: fileExampleOrders.attachments là mối quan hệ hasMany với fileExampleOrderAttachments thông qua orderId.',
  ordersNoFiles: 'Không có tài liệu đính kèm theo đơn đặt hàng này.',
  ordersEmpty:
    'Không tìm thấy đơn hàng nào. Chạy hạt giống ví dụ để tạo bản ghi demo.',
  ordersHint:
    'Việc xóa phần đính kèm sẽ xóa mối quan hệ thứ tự. Bản ghi tệp vẫn có sẵn trong Kho lưu trữ tệp.',
  'status.draft': 'Bản nháp',
  'status.submitted': 'Đã gửi',
  'status.archived': 'Đã lưu trữ',
};

export default viVN;
