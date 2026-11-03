import type { FileUiResource } from './en-US.js';
const messages = {
  'files.ooxmlLoadFailed': 'Không thể hiển thị tệp Office Open XML này.',
  'files.ooxmlLoadTimedOut':
    'Bản xem trước không tải xong trong vòng {{minutes}} phút.',
  'files.previewRequestFailed':
    'Yêu cầu xem trước không thành công ({{status}}).',
  uploadFailed: 'Tải lên tệp không thành công.',
  fileLimitReached: 'Đã đạt đến số lượng tệp tối đa.',
  fileTooLarge: 'Tệp vượt quá kích thước tối đa.',
  fileTypeNotAllowed: 'Loại tệp không được phép.',
  removalFailed: 'Xóa tệp không thành công.',
  urlNotAllowed: 'Tệp URL không được phép.',
  downloadFailed: 'Tải xuống tệp không thành công.',
  invalidUrl: 'Tệp URL bị thiếu hoặc không được phép.',
  pdfPreviewFailed: 'Không thể tải bản xem trước PDF.',
  pdfPreviewMarkup: 'Tệp URL trả về HTML hoặc XML thay vì PDF.',
  previewFailed: 'Không thể tải bản xem trước tệp.',
  'files.empty': 'Không có tập tin.',
  'files.preview': 'Xem trước',
  'files.download': 'Tải xuống',
  'files.remove': 'Loại bỏ',
  'files.chooseMany': 'Chọn tập tin',
  'files.chooseOne': 'Chọn tập tin',
  'files.retry': 'Thử lại',
  'files.done': 'Hoàn thành',
  'files.uploading': 'Đang tải lên',
  'files.failed': 'Thất bại',
  'files.pending': 'Đang chờ',
  'files.previous': 'Tệp trước đó',
  'files.next': 'Tập tin tiếp theo',
  'files.loadingPreview': 'Đang tải bản xem trước...',
  'files.downloadFile': 'Tải tập tin',
  'files.previewUnavailable': 'Bản xem trước không khả dụng cho loại tệp này.',
  'files.imageFailed':
    'Không thể hiển thị hình ảnh này. Nó có thể bị hỏng hoặc ở định dạng không được hỗ trợ.',
  'files.officeFailed': 'Office Online không thể tải tệp này.',
  'files.officeUrl':
    'Office Online yêu cầu tệp tuyệt đối có thể truy cập internet URL.',
  'files.cancelFile': 'Hủy {{filename}}',
  'files.status.uploading': 'Đang tải lên',
  'files.status.pending': 'Đang chờ',
  'files.status.error': 'Thất bại',
};

const resource: FileUiResource = { fileUi: messages };
export default resource;
