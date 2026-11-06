import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  navTitle: 'Ví dụ in mẫu',
  title: 'Ví dụ in mẫu',
  description:
    'Hiển thị mẫu DOCX cố định có hóa đơn và dữ liệu báo giá được ủy quyền dưới dạng DOCX hoặc PDF. Chuyển đổi PDF yêu cầu LibreOffice trên máy chủ ứng dụng.',
  invoiceList: 'Hóa đơn',
  invoiceCount_one: 'Hóa đơn {{count}}',
  invoiceCount_other: 'Hóa đơn {{count}}',
  loading: 'Đang tải hóa đơn…',
  empty: 'Không có hóa đơn nào trong phạm vi truy cập báo giá của bạn.',
  emptyHint:
    'Chạy các tác vụ cơ sở dữ liệu Ví dụ và đăng nhập bằng sales_manager hoặc sử dụng tài khoản có thể xem Báo giá bán hàng được liên kết.',
  loadFailed: 'Không thể tải hóa đơn.',
  download: 'Tải xuống DOCX',
  downloading: 'Kết xuất…',
  downloadFailed: 'Không thể hiển thị hóa đơn.',
  invoice: 'Hóa đơn',
  customer: 'Khách hàng',
  issuedOn: 'Ban hành ngày',
  quote: 'Nguồn trích dẫn',
  amount: 'Tổng cộng',
  downloadActions: 'Hành động tải xuống',
  downloadPdf: 'Tải xuống bản PDF',
  pdfConverterUnavailable:
    'Chuyển đổi PDF không khả dụng vì không thể tìm thấy LibreOffice trên máy chủ ứng dụng. Cài đặt nó trên cùng một máy hoặc vùng chứa với NocoBase, đảm bảo quy trình máy chủ có thể tìm thấy tệp thực thi của nó và khởi động lại ứng dụng. Tải xuống DOCX vẫn có sẵn.',
  installLibreOffice: 'Tải xuống LibreOffice',
  retry: 'Thử lại',
};

export default viVN;
