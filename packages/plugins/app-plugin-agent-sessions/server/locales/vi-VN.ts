import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  errors: {
    retryUnavailable:
      'Gửi các nội dung đang chờ theo thứ tự. Chỉ có thể gửi lại nội dung bị gián đoạn cuối cùng hoặc nội dung đã rút tiếp theo.',
    stopTargetChanged: 'Lượt hiện tại đã thay đổi. Hãy làm mới trước khi dừng.',
    promptNotFound:
      'Không có tin nhắn nào có danh tính này tồn tại trong phiên.',
    promptStarted: 'Tin nhắn đã bắt đầu xử lý và không thể rút lại được.',
    withdrawalUnsupported:
      'Tin nhắn cũ hơn này không thể được rút lại một cách an toàn. Cập nhật dòng lệnh và khởi động lại kết nối máy tính.',
    bridgeReplaced:
      'Một cây cầu khác đã đăng ký máy tính này. Khởi động lại kết nối này.',
    submissionConflict: 'ID gửi này đã được sử dụng cho một yêu cầu khác.',
    authenticationRequired: 'Đăng nhập để sử dụng phiên đại lý.',
    computerNotFound:
      'Không có máy tính nào có id này được kết nối với tài khoản của bạn.',
    sessionNotFound: 'Không có phiên nào có id này là của bạn.',
    computerOffline:
      'Máy tính đang ngoại tuyến. Bắt đầu cầu trên đó, sau đó thử lại.',
    agentUnavailable: 'Máy tính không thể chạy tác nhân này.',
    directoryNotAllowed:
      'Các phiên trên máy tính này chỉ hoạt động trong các thư mục mà cầu nối của nó cho phép.',
    sessionArchived: 'Phiên được lưu trữ. Khôi phục nó trước.',
    permissionRequestNotFound:
      'Yêu cầu cấp phép này đã được trả lời hoặc không còn chờ đợi nữa.',
    choiceNotFound: 'Đại lý không đưa ra lựa chọn hoặc giá trị này.',
    linkNotFound:
      'Không có gì thuộc loại này với id này được gắn với phiên, hoặc công việc của nó không thể bắt đầu từ đây.',
    invalidPageToken: 'Mã thông báo trang không được danh sách này cấp.',
    upgradeRequired:
      'Cây cầu nói một phiên bản giao thức khác. Cập nhật dòng lệnh trên máy tính này.',
    computerNotAnswering:
      'Máy tính không trả lời kịp thời. Kiểm tra xem kết nối của nó có đang chạy không, sau đó thử lại.',
    folderUnavailable: 'Không thể mở được thư mục trên máy tính.',
    discoveryFailed:
      'Không thể tải cài đặt tác nhân. Hãy kiểm tra tác nhân trên máy tính này và thử lại.',
    projectNotFound: 'Không có dự án nào như vậy hoặc bạn không thể xem được.',
    referenceNotFound:
      'Nội dung được đề cập không tồn tại hoặc bạn không thể nhìn thấy nó.',
    imageNotFound:
      'Không có hình ảnh nào mang tên này được gửi trong phiên họp.',
    computerKeyInvalid:
      'Máy tính này không còn được kết nối nữa: nó đã bị xóa hoặc được kết nối lại từ nơi khác. Chạy `acp start` trên đó để kết nối lại.',
  },
};

export default viVN;
