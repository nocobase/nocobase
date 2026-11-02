import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  navigation: {
    tasks: 'Ví dụ về thông báo',
    taskManagement: 'Tác vụ',
    taskDetail: 'Chi tiết nhiệm vụ',
  },
  common: {
    close: 'Đóng',
    loading: 'Đang tải…',
    saving: 'Tiết kiệm…',
  },
  fields: {
    title: 'Tiêu đề',
    description: 'Mô tả',
    status: 'Trạng thái',
    assignee: 'Người được giao',
    creator: 'Người sáng tạo',
    chooseAssignee: 'Chọn người dùng',
  },
  status: {
    open: 'Mở',
    'in-progress': 'Đang thực hiện',
    done: 'Hoàn thành',
  },
  tasks: {
    title: 'Tác vụ',
    description:
      'Giao một nhiệm vụ nhỏ cho người dùng khác. Người được giao nhận được thông báo trong ứng dụng kèm theo bản tóm tắt nhiệm vụ và có thể chỉnh sửa nhiệm vụ từ trang chi tiết. Sử dụng nút thông báo ở thanh trên cùng để mở thông báo tin nhắn của bạn.',
    listTitle: 'Tất cả nhiệm vụ',
    listDescription: 'Tất cả nhiệm vụ bạn đã tạo hoặc được giao.',
    count: 'Bản ghi {{count}}',
    empty: 'Chưa có nhiệm vụ nào.',
    assignee: 'Được giao cho',
    columns: {
      title: 'Tiêu đề',
      description: 'Mô tả',
      status: 'Trạng thái',
      creator: 'Người sáng tạo',
      assignee: 'Người được giao',
      updatedAt: 'Cập nhật lần cuối',
      actions: 'Thao tác',
    },
    view: 'Xem chi tiết',
    refresh: 'Làm mới',
    previous: 'Trước',
    next: 'Tiếp theo',
    page: 'Trang {{page}}',
    add: 'Nhiệm vụ mới',
    drawerTitle: 'Nhiệm vụ mới',
    drawerDescription:
      'Tạo một nhiệm vụ sẽ gửi thông tin cơ bản của nó cho người được giao.',
    create: 'Tạo nhiệm vụ',
    cancel: 'Hủy',
  },
  taskDetail: {
    title: 'Chi tiết nhiệm vụ',
    summary: 'Chi tiết nhiệm vụ',
    createdAt: 'Đã tạo',
    updatedAt: 'Cập nhật lần cuối',
    notificationHint:
      'Sau khi tác vụ được lưu, những người có liên quan ngoài người chỉnh sửa hiện tại sẽ được thông báo: người tạo và người được giao hiện tại. Nếu người được chuyển nhượng thay đổi, cả người được chuyển nhượng trước đó và mới đều được thông báo.',
    edit: 'Chỉnh sửa nhiệm vụ',
    refresh: 'Làm mới',
    save: 'Lưu thay đổi',
    cancel: 'Hủy',
    back: 'Quay lại nhiệm vụ',
  },
};

export default viVN;
