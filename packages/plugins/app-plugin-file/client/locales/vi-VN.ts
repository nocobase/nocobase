import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  storage: {
    title: 'Lưu trữ tệp',
    navDescription: 'Nơi lưu các tệp đã tải lên và những tính năng lưu tệp',
    description:
      'Nơi lưu các tệp đã tải lên, kích thước tối đa của một tệp và những tính năng lưu tệp. Lưu trữ được thiết lập trong cấu hình ứng dụng (`drive`) và có hiệu lực sau khi triển khai lại; trang này hiển thị các thiết lập đang có hiệu lực và kiểm tra xem lưu trữ có thực sự đọc và ghi được hay không.',
    checkAction: 'Kiểm tra lưu trữ',
    loading: 'Đang tải lưu trữ tệp…',
    loadFailed: 'Không thể tải lưu trữ tệp.',
    retry: 'Thử lại',
    tabs: { disks: 'Lưu trữ', usages: 'Tính năng' },
    hints: {
      title_one: '{{count}} thông báo',
      title_other: '{{count}} thông báo',
      incomplete:
        'Đĩa {{disk}} chưa được cấu hình đầy đủ ({{problems}}): không ảnh hưởng gì khi chưa được dùng, và sẽ lỗi khi được chọn.',
      localDefault:
        'Lưu trữ mặc định là đĩa cục bộ: ứng dụng chỉ có thể chạy một phiên bản. Hãy dùng lưu trữ dùng chung cho nhiều phiên bản.',
      seeCluster: 'Xem Cụm và phân tán.',
    },
    columns: {
      name: 'Tên',
      type: 'Loại · vị trí',
      visibility: 'Phạm vi truy cập',
      maxFileSize: 'Kích thước tệp tối đa',
      usages: 'Tính năng',
      status: 'Trạng thái',
      feature: 'Tính năng',
      collection: 'Bảng tệp',
      disk: 'Lưu trên',
      download: 'Tải xuống',
      files: 'Tệp',
      setting: 'Thiết lập',
      value: 'Giá trị hiện tại',
      source: 'Nguồn',
    },
    default: 'Mặc định',
    details: 'Chi tiết',
    usageCount_one: '{{count}} tính năng',
    usageCount_other: '{{count}} tính năng',
    drivers: {
      fs: 'Đĩa cục bộ',
      s3: 'Lưu trữ tương thích S3',
      oss: 'Alibaba Cloud OSS',
      custom: 'Driver tùy chỉnh',
    },
    location: {
      inApp: '{{path}} (trong thư mục ứng dụng)',
      outsideApp: 'Ngoài thư mục ứng dụng',
      bucketMissing: 'chưa đặt bucket',
      unknown: 'Đặt trong mã',
    },
    visibility: {
      private: 'Riêng tư',
      public: 'Công khai',
      privateLong: 'Riêng tư: chỉ tải xuống qua ứng dụng',
      publicLong: 'Công khai: bất kỳ ai có URL đều tải xuống được',
      unknown: 'Do driver quyết định',
    },
    urls: {
      application: 'Do ứng dụng phục vụ (stream)',
      public: 'URL công khai',
      signed: 'URL có chữ ký, có thời hạn',
    },
    sizeMb: '{{size}} MB',
    status: {
      ok: 'Đọc ghi bình thường',
      failed: 'Kiểm tra thất bại',
      incomplete: 'Cấu hình chưa đầy đủ',
      unchecked: 'Chưa kiểm tra',
      checkedAgo: 'Đã kiểm tra {{time}}',
    },
    problems: {
      LOCATION_MISSING: 'location trống',
      BUCKET_MISSING: 'bucket trống',
      REGION_MISSING: 'region trống',
      CREDENTIALS_MISSING: 'thiếu thông tin xác thực',
      NOT_LOADED: 'chưa được ứng dụng tải',
    },
    sources: { code: 'Mã', config: 'Cấu hình', default: 'Giá trị mặc định' },
    settings: {
      driver: 'Loại',
      location: 'Vị trí',
      visibility: 'Phạm vi truy cập',
      maxFileSize: 'Kích thước tệp tối đa',
      urls: 'Liên kết tải xuống',
    },
    backToList: 'Lưu trữ tệp',
    defaultSubtitle: 'Các tệp mới tải lên được lưu ở đây theo mặc định.',
    notDefaultSubtitle: 'Chỉ được dùng bởi các tính năng chỉ định nó.',
    notFound: 'Đĩa {{disk}} chưa được cấu hình.',
    howToChange: 'Cách thay đổi',
    howToChangeNote:
      'Cũng hỗ trợ Alibaba Cloud OSS (`oss`) và driver tùy chỉnh. Triển khai lại sau khi thay đổi, và nâng giới hạn kích thước nội dung yêu cầu của reverse proxy lên ít nhất bằng kích thước tệp tối đa.',
    check: {
      title: 'Kiểm tra',
      run: 'Kiểm tra',
      rerun: 'Kiểm tra lại',
      running: 'Đang kiểm tra…',
      failed: 'Không thể chạy kiểm tra.',
      never:
        'Đĩa này chưa được kiểm tra trên phiên bản này kể từ khi khởi động.',
      scope:
        'Chỉ một tệp tạm trong thư mục `nocobase-check/` của đĩa được ghi, đọc và xóa; tệp nghiệp vụ không bị động đến. Khi có nhiều phiên bản, chỉ phiên bản này được kiểm tra.',
      steps: {
        write: 'Ghi tệp tạm',
        read: 'Đọc lại và đối chiếu',
        url: 'Tạo liên kết tải xuống',
        delete: 'Xóa tệp tạm',
      },
      details: {
        bytes: '{{bytes}} byte khớp',
        APPLICATION: 'Phục vụ qua ứng dụng',
        PUBLIC: 'Đã tạo URL công khai',
        SIGNED: 'Đã tạo URL có chữ ký',
        deleted: 'Đã xóa',
        skipped: 'Đã bỏ qua',
      },
      reasons: {
        CONFIG_INCOMPLETE: 'Cấu hình chưa đầy đủ: {{detail}}',
        DISK_UNAVAILABLE: 'Không thể mở đĩa',
        WRITE_FAILED: 'Ghi thất bại',
        READ_FAILED: 'Đọc thất bại',
        CONTENT_MISMATCH: 'Nội dung đọc lại không khớp',
        URL_FAILED: 'Không thể tạo liên kết',
        DELETE_FAILED: 'Xóa thất bại',
        unknown: 'Thất bại',
      },
    },
    usedBy: 'Các tính năng dùng đĩa này',
    noUsagesOnDisk: 'Không có tính năng nào lưu tệp trên đĩa này.',
    download: {
      authenticated: 'Cần đăng nhập và quyền',
      public: 'Liên kết công khai',
    },
    diskDefault: 'Mặc định ({{disk}})',
    diskConfig: '{{path}} → {{disk}}',
    diskConfigDefault: '{{path}} → Mặc định ({{disk}})',
    plugin: 'Plugin {{plugin}}',
    application: 'Ứng dụng',
    filesValue: '{{files}} tệp · {{size}}',
    filesUnavailable: 'Không thể đếm',
    empty: {
      title: 'Chưa có tính năng nào lưu tệp',
      description:
        'Bảng tệp do plugin hoặc mã ứng dụng tạo ra. Khi cài một plugin có tệp đính kèm (như dự án, cơ sở tri thức hoặc tác tử), nó sẽ xuất hiện ở đây mà không cần thiết lập thêm.',
      defaultDisk:
        'Thiết lập lưu trữ vẫn có hiệu lực: các bảng tệp thêm sau sẽ lưu tệp trên {{disk}} theo mặc định.',
    },
    notes: {
      title: 'Lưu ý',
      firstUse:
        'Lưu trữ chỉ được kết nối ở lần dùng đầu tiên, nên khởi động thành công không chứng minh rằng nó đọc và ghi được. Kiểm tra sẽ ghi, đọc và xóa một tệp tạm để xác nhận.',
      changeDefault:
        'Thay đổi lưu trữ mặc định chỉ ảnh hưởng đến các lần tải lên sau; tệp hiện có vẫn được đọc từ lưu trữ mà bản ghi của chúng chỉ định và không bị di chuyển.',
      deleteRecords: 'Xóa một bản ghi không xóa tệp của nó khỏi đĩa.',
      publicLinks:
        'Bất kỳ ai biết liên kết công khai đều mở được mà không cần đăng nhập. Tệp nhạy cảm nên được phục vụ qua các route có xác thực của chính plugin.',
      noBrowser:
        'Không có trình duyệt tệp toàn cục: tệp thuộc về tính năng của chúng và được xem theo quyền của từng tính năng.',
      readOnly:
        'Các tính năng được khai báo bởi mã plugin hoặc ứng dụng (bảng tệp, đĩa, cách tải xuống). Danh sách này chỉ đọc; không thể tạo bảng tệp tại đây.',
    },
  },
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

export default viVN;
