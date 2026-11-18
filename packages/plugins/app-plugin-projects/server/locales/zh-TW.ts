import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  roles: {
    owner: '負責人',
    admin: '管理員',
    member: '成員',
  },
  access: {
    sections: {
      projects: '專案',
      issues: '任務',
      settings: '專案設定',
      members: '成員和角色',
    },
    businesses: {
      projects: {
        title: '專案',
        description: '專案、其成員、儲存庫和進度。',
        actions: {
          view: {
            title: '檢視專案',
            description: '檢視專案及其概述與進度',
            related: '檢視專案（他們可以看到的專案）',
            relatedLabel: '我看得到的',
            relatedHint: '我所領導或參與的公共專案和私人專案',
            all: '檢視專案（全部）',
          },
          create: {
            title: '建立專案',
            description: '啟動一個新專案並領導它',
            all: '建立專案',
          },
          manage: {
            title: '管理專案',
            description: '重新命名、更改狀態、日期和線索、管理成員和儲存庫',
            related: '管理專案（他們領導的專案）',
            relatedLabel: '我所領導的人',
            relatedHint: '我負責的專案',
            all: '管理專案（全部）',
          },
          delete: {
            title: '刪除專案',
            description: '刪除專案和恢復已刪除的專案',
            all: '刪除專案',
          },
        },
      },
      issues: {
        title: '任務',
        description: '專案中或單獨的任務及其留言。',
        actions: {
          view: {
            title: '檢視任務',
            description: '在列表、看板與詳情中檢視任務',
            related: '檢視任務（其可見的）',
            relatedLabel: '在專案中我可以看到',
            relatedHint: '沒有專案的任務，以及我可見專案中的任務',
            all: '檢視任務（全部）',
          },
          create: {
            title: '建立任務',
            description: '在專案中或單獨建立任務',
            related: '建立任務（在其可見的專案中）',
            relatedLabel: '在專案中我可以看到',
            relatedHint: '沒有專案的任務，或我可見專案中的任務',
            all: '建立任務（全部）',
          },
          edit: {
            title: '編輯任務',
            description: '標題、描述、優先順序、日期、標籤、執行者和開放狀態',
            related: '編輯任務（其可見的）',
            relatedLabel: '在專案中我可以看到',
            relatedHint: '沒有專案的任務，以及我可見專案中的任務',
            all: '編輯任務（全部）',
          },
          comment: {
            title: '留言任務',
            description: '評論、回覆和解決主題；編輯和刪除自己的評論',
            related: '留言任務（其可見的）',
            relatedLabel: '在專案中我可以看到',
            relatedHint: '沒有專案的任務，以及我可見專案中的任務',
            all: '留言任務（全部）',
          },
          moderateComments: {
            title: '適度評論',
            description: '刪除其他人的評論',
            related: '管理留言（其負責的任務或其主導專案中的任務）',
            relatedLabel: '我負責的任務或我主導的專案',
            relatedHint: '我負責的任務，以及我主導專案中任務的留言',
            all: '溫和評論（全部）',
          },
          close: {
            title: '關閉任務',
            description: '將任務標記為完成或取消',
            related: '關閉任務（其負責的或其主導專案中的）',
            relatedLabel: '我擁有或領導的專案',
            relatedHint: '我負責的任務，以及我主導專案中的任務',
            all: '關閉任務（全部）',
          },
          changeOwner: {
            title: '更改所有者',
            description: '將任務交給其他人負責',
            related: '更改所有者（他們擁有的人或他們領導的專案）',
            relatedLabel: '我擁有或領導的專案',
            relatedHint: '我負責的任務，以及我主導專案中的任務',
            all: '更改所有者（全部）',
          },
          delete: {
            title: '刪除與還原任務',
            description: '刪除任務並還原已刪除的任務',
            all: '刪除與還原任務',
          },
        },
      },
      attachments: {
        title: '附件',
        description: '附加在任務與留言上的檔案。',
        actions: {
          upload: {
            title: '上傳附件',
            description: '將檔案附加到其可編輯的任務與其留言',
            related: '上傳附件（在其可見的任務上）',
            relatedLabel: '我可見專案中的任務',
            relatedHint: '沒有專案的任務，以及我可見專案中任務上的檔案',
            all: '上傳附件（全部）',
          },
        },
      },
    },
    collections: {
      pmProjects: '專案',
      pmIssues: '任務',
    },
    recordAccess: {
      visible: '其可見的專案與任務',
      managed: '其主導的專案與其負責的任務',
    },
    settings: {
      pm: {
        general: '一般',
        labels: '標籤',
        members: '成員',
      },
    },
    keyScopes: {
      projects: {
        title: '專案',
        description: '檢視專案；管理他們；建立和刪除它們。',
        objects: '專案',
      },
      issues: {
        title: '任務',
        description:
          '檢視任務；建立、編輯、留言、關閉與重新指派任務；管理留言並刪除任務。',
      },
      settings: {
        title: '專案設定',
        description: '常規設定和標籤。',
      },
    },
    actions: {
      view: '檢視',
      create: '建立',
      manage: '管理',
      edit: '編輯',
      close: '關閉',
      comment: '評論',
      moderateComments: '適度評論',
      changeOwner: '更換所有者',
      delete: '刪除',
      upload: '上傳',
      read: '檢視',
      update: '編輯',
      invite: '邀請',
      assign: '分配角色',
      'define-roles': '定義角色',
    },
  },
  notifications: {
    batchDone: '{{identifier}} 的所有子任務都已完成',
    batchDoneStage: '{{identifier}} 子任務的第 {{stage}} 階段已完成',
    commented: '{{actor}} 評論了 {{identifier}}',
    dependencyReleased: '{{releasedBy}} 完成，所以 {{identifier}} 可以啟動',
    executorAssigned: '{{actor}} 已將 {{identifier}} 指派給您',
    mentioned: {
      comment: '{{actor}} 在 {{identifier}} 上提到了你',
      description: '{{actor}} 在 {{identifier}} 中提到了你',
    },
    ownerAssigned: '{{actor}} 讓您成為 {{identifier}} 的擁有者',
    someone: '有人',
    statusChanged: '{{identifier}} 移至 {{status}}',
    ownerNotified: '{{identifier}} 現在是 {{status}}',
  },
  status: {
    backlog: '待規劃',
    blocked: '受阻',
    cancelled: '已取消',
    done: '已完成',
    in_progress: '進行中',
    in_review: '審查中',
  },
};

export default zhTW;
