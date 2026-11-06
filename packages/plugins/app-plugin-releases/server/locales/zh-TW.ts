import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  access: {
    section: '版本',
    pages: {
      'rel-apps': '應用程式',
    },
    businessSection: '版本',
    businesses: {
      apps: {
        title: '應用程式',
        description: '應用程式、其版本、部署和執行環境。',
        actions: {
          view: {
            title: '檢視應用程式',
            description: '檢視應用程式、其版本、部署和執行環境狀態',
            related: '檢視應用程式（與其相關的應用程式）',
            relatedLabel: '我建立的',
            relatedHint: '我建立的應用程式，以及任何與我相關的應用程式',
            all: '檢視應用程式（全部）',
          },
          readLogs: {
            title: '讀取日誌',
            description: '讀取應用程式和部署日誌',
            related: '讀取日誌（與之相關的日誌）',
            relatedLabel: '我建立的',
            relatedHint: '我建立的應用程式，以及任何與我相關的應用程式',
            all: '讀取日誌（全部）',
          },
          create: {
            title: '建立應用程式',
            description: '在環境中建立應用程式',
            all: '建立應用程式',
          },
          configure: {
            title: '配置應用程式',
            description: '讀取和更改應用程式的配置，這可能包含秘密',
            related: '設定應用程式（與其相關的應用程式）',
            relatedLabel: '我建立的',
            relatedHint: '我建立的應用程式，以及任何與我相關的應用程式',
            all: '設定應用程式（全部）',
          },
          upload: {
            title: '上傳版本',
            description: '上傳推廣版本',
            related: '上傳版本（與其相關的版本）',
            relatedLabel: '我建立的',
            relatedHint: '我建立的應用程式，以及任何與我相關的應用程式',
            all: '上傳版本（全部）',
          },
          deploy: {
            title: '部署',
            description: '在不受保護的環境上部署和回滾，請求部署到受保護的環境',
            related: '部署（與其相關的）',
            relatedLabel: '我建立的',
            relatedHint: '我建立的應用程式，以及任何與我相關的應用程式',
            all: '部署（全部）',
          },
          deployProtected: {
            title: '批准受保護的部署',
            description: '批准部署到沒有指定批准者的受保護環境；僅限人',
            related: '批准受保護的部署（與其相關的部署）',
            relatedLabel: '我建立的',
            relatedHint: '我建立的應用程式，以及任何與我相關的應用程式',
            all: '批准受保護的部署（全部）',
          },
          operate: {
            title: '啟動與停止',
            description: '啟動、停止和重新啟動應用程式',
            related: '啟動和停止（相關的）',
            relatedLabel: '我建立的',
            relatedHint: '我建立的應用程式，以及任何與我相關的應用程式',
            all: '啟動與停止（全部）',
          },
          delete: {
            title: '刪除應用程式',
            description: '刪除應用程式及其資料',
            related: '刪除應用程式（與其相關的應用程式）',
            relatedLabel: '我建立的',
            relatedHint: '我建立的應用程式，以及任何與我相關的應用程式',
            all: '刪除應用程式（全部）',
          },
        },
      },
    },
    recordAccess: {
      owned: '他們建立的應用程式',
    },
    settings: {
      rel: {
        environments: '部署環境',
      },
    },
    keyScopes: {
      apps: {
        title: '應用程式和部署',
        description:
          '閱讀：檢視應用程式、版本、部署和日誌。讀寫：還可以上傳版本。管理員：也可以部署並啟動或停止應用程式。',
        objects: '應用程式',
      },
      environments: {
        title: '部署環境',
        description: '閱讀：列出環境。讀和寫：管理它們。',
      },
      presets: {
        ciDeploy: {
          title: 'CI 部署',
          description: '將版本上傳到所選應用程式並部署它們，為期 90 天。',
        },
        ciUpload: {
          title: 'CI上傳',
          description: '將版本上傳到所選應用程式而不部署它們，為期 90 天。',
        },
      },
    },
    actions: {
      read: '檢視',
      manage: '管理',
      view: '檢視',
      'read-logs': '讀取日誌',
      create: '建立',
      configure: '配置',
      upload: '上傳版本',
      deploy: '部署',
      'deploy-protected': '批准受保護的部署',
      operate: '啟動與停止',
      delete: '刪除',
    },
  },
  drivers: {
    host: '此伺服器',
  },
};

export default zhTW;
