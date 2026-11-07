import type { KnowledgeServerResource } from './en-US.js';

const zhTW: KnowledgeServerResource = {
  access: {
    businessSection: '知識',
    businesses: {
      knowledge: {
        title: '知識',
        description: '各個知識空間的檔案。',
        actions: {
          read: {
            title: '閱讀知識',
            description: '閱讀系統知識以及與其相關的空間知識',
            related: '閱讀知識（與之相關的空間）',
            relatedLabel: '與我相關的空間',
            relatedHint: '應用程式決定哪些空間與誰相關',
            all: '閱讀知識（全部）',
          },
          propose: {
            title: '提出知識',
            description: '提出更改，讓可能編輯的人做決定；可以給予什麼代理',
            related: '提出知識（與之相關的空間）',
            relatedLabel: '與我相關的空間',
            relatedHint: '應用程式決定哪些空間與誰相關',
            all: '提出知識（全部）',
          },
          edit: {
            title: '編輯知識',
            description: '編輯、歸檔並標記已驗證，並決定提案；系統知識需要全部',
            related: '編輯知識（與其相關的空間）',
            relatedLabel: '與我相關的空間',
            relatedHint: '應用程式決定哪些空間與誰相關',
            all: '編輯知識（全部）',
          },
          manage: {
            title: '管理知識訪問',
            description:
              '更改誰可以存取每個資料夾和文章，並保留對所有資料夾和文章的存取權；系統知識需要全部',
            related: '管理知識訪問（與其相關的空間）',
            relatedLabel: '與我相關的空間',
            relatedHint: '應用程式決定哪些空間與誰相關',
            all: '管理知識存取（全部）',
          },
        },
      },
    },
  },
};

export default zhTW;
