import type { KnowledgeServerResource } from './en-US.js';

const viVN: KnowledgeServerResource = {
  access: {
    businessSection: 'Kiến thức',
    businesses: {
      knowledge: {
        title: 'Kiến thức',
        description: 'Tài liệu của từng không gian tri thức.',
        actions: {
          read: {
            title: 'Đọc kiến thức',
            description:
              'Đọc kiến thức hệ thống và các không gian liên quan đến chúng',
            related: 'Đọc kiến thức (các không gian liên quan đến chúng)',
            relatedLabel: 'Không gian liên quan đến tôi',
            relatedHint: 'Ứng dụng quyết định không gian nào liên quan đến ai',
            all: 'Đọc kiến thức (tất cả)',
          },
          propose: {
            title: 'Đề xuất kiến thức',
            description:
              'Đề xuất thay đổi để người có thể chỉnh sửa quyết định; những đại lý nào có thể được cung cấp',
            related: 'Đề xuất kiến thức (không gian liên quan đến chúng)',
            relatedLabel: 'Không gian liên quan đến tôi',
            relatedHint: 'Ứng dụng quyết định không gian nào liên quan đến ai',
            all: 'Đề xuất kiến thức (tất cả)',
          },
          edit: {
            title: 'Chỉnh sửa kiến thức',
            description:
              'Chỉnh sửa, lưu trữ và đánh dấu đã xác minh và quyết định các đề xuất; kiến thức hệ thống cần tất cả',
            related: 'Chỉnh sửa kiến thức (không gian liên quan đến chúng)',
            relatedLabel: 'Không gian liên quan đến tôi',
            relatedHint: 'Ứng dụng quyết định không gian nào liên quan đến ai',
            all: 'Chỉnh sửa kiến thức (tất cả)',
          },
          manage: {
            title: 'Quản lý truy cập kiến thức',
            description:
              'Thay đổi người có thể truy cập từng thư mục và bài viết, đồng thời giữ quyền truy cập vào tất cả chúng; kiến thức hệ thống cần tất cả',
            related:
              'Quản lý truy cập tri thức (không gian liên quan đến chúng)',
            relatedLabel: 'Không gian liên quan đến tôi',
            relatedHint: 'Ứng dụng quyết định không gian nào liên quan đến ai',
            all: 'Quản lý truy cập tri thức (tất cả)',
          },
        },
      },
    },
  },
};

export default viVN;
