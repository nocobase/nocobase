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
      issues: '議題',
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
        title: '議題',
        description: '專案中或自己的議題及其評論。',
        actions: {
          view: {
            title: '檢視議題',
            description: '檢視清單、看板中的議題及其詳細資訊',
            related: '檢視議題（他們可以看到的議題）',
            relatedLabel: '在專案中我可以看到',
            relatedHint: '沒有專案的議題，以及我可以看到的專案中的議題',
            all: '檢視議題（全部）',
          },
          create: {
            title: '建立議題',
            description: '在專案中或自行建立議題',
            related: '建立議題（在他們可以看到的專案中）',
            relatedLabel: '在專案中我可以看到',
            relatedHint: '沒有專案的議題，或者在我可以看到的專案中的議題',
            all: '建立議題（全部）',
          },
          edit: {
            title: '編輯議題',
            description: '標題、描述、優先順序、日期、標籤、執行者和開放狀態',
            related: '編輯議題（他們可以看到的議題）',
            relatedLabel: '在專案中我可以看到',
            relatedHint: '沒有專案的議題，以及我可以看到的專案中的議題',
            all: '編輯議題（全部）',
          },
          comment: {
            title: '對議題發表評論',
            description: '評論、回覆和解決主題；編輯和刪除自己的評論',
            related: '對議題發表評論（他們可以看到的議題）',
            relatedLabel: '在專案中我可以看到',
            relatedHint: '沒有專案的議題，以及我可以看到的專案中的議題',
            all: '對議題的評論（全部）',
          },
          moderateComments: {
            title: '適度評論',
            description: '刪除其他人的評論',
            related: '適度評論（關於他們擁有的議題或他們領導的專案）',
            relatedLabel: '關於我自己的議題或我領導的專案',
            relatedHint: '對我自己的議題以及我領導的專案中的議題發表評論',
            all: '溫和評論（全部）',
          },
          close: {
            title: '關閉議題',
            description: '將議題標記為已完成或已取消',
            related: '關閉議題（他們擁有的議題或他們領導的專案）',
            relatedLabel: '我擁有或領導的專案',
            relatedHint: '我自己的議題以及我所領導的專案中的議題',
            all: '關閉議題（全部）',
          },
          changeOwner: {
            title: '更改所有者',
            description: '將議題交給其他人負責',
            related: '更改所有者（他們擁有的人或他們領導的專案）',
            relatedLabel: '我擁有或領導的專案',
            relatedHint: '我自己的議題以及我所領導的專案中的議題',
            all: '更改所有者（全部）',
          },
          delete: {
            title: '刪除與復原議題',
            description: '刪除議題並恢復已刪除的議題',
            all: '刪除與復原議題',
          },
        },
      },
      attachments: {
        title: '附件',
        description: '議題和評論所附的檔案。',
        actions: {
          upload: {
            title: '上傳附件',
            description: '將檔案附加到他們可以編輯的議題和評論中',
            related: '上傳附件（關於他們可以看到的議題）',
            relatedLabel: '關於專案中的議題我可以看到',
            relatedHint:
              '關於沒有專案的議題的檔案，以及我可以看到的專案中的議題的檔案',
            all: '上傳附件（全部）',
          },
        },
      },
    },
    collections: {
      pmProjects: '專案',
      pmIssues: '議題',
    },
    recordAccess: {
      visible: '他們可以看到的專案和議題',
      managed: '他們所領導的專案和他們擁有的議題',
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
        title: '議題',
        description:
          '檢視議題；建立、編輯、評論、關閉和重新分配它們；審核評論並刪除議題。',
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
    batchDone: '{{identifier}}所有子期已完結',
    batchDoneStage: '{{identifier}} 子議題的階段 {{stage}} 已完成',
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
    backlog: '積壓',
    blocked: '受阻',
    cancelled: '已取消',
    done: '已完成',
    in_progress: '進行中',
    in_review: '審查中',
  },
};

export default zhTW;
