import type { AccountSwitcherResource } from './en-US.js';

const viVN: AccountSwitcherResource = {
  menu: {
    switchAccount: 'Chuyển tài khoản',
    search: 'Tìm theo tên hoặc email',
    loading: 'Đang tải tài khoản…',
    empty: 'Không có tài khoản phù hợp',
    more: 'Còn {{count}} tài khoản. Hãy tìm kiếm để thu hẹp danh sách.',
    loadFailed: 'Không thể tải tài khoản.',
  },
  banner: {
    actingAs: 'Đang thao tác với tư cách {{name}}',
    description: 'Các thay đổi được ghi nhận dưới tài khoản này.',
    return: 'Quay lại {{name}}',
  },
  errors: {
    switchFailed: 'Không thể chuyển tài khoản. Vui lòng thử lại.',
    returnFailed: 'Không thể quay lại tài khoản của bạn. Vui lòng thử lại.',
  },
};

export default viVN;
