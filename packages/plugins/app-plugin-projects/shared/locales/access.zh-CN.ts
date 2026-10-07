import type { AccessLocale } from './access.en-US.js';

const accessZhCN: AccessLocale = {
  roles: { owner: '所有者', admin: '管理员', member: '成员' },
  access: {
    sections: {
      projects: '项目',
      issues: '任务',
      settings: '项目设置',
      members: '成员与角色',
    },
    businesses: {
      projects: {
        title: '项目',
        description: '项目、项目成员、代码仓库和进度。',
        actions: {
          view: {
            title: '查看项目',
            description: '看到项目、项目概览和进度',
            related: '查看项目（能看到的）',
            relatedLabel: '我能查看的',
            relatedHint: '公开项目，以及我负责或加入的私有项目',
            all: '查看项目（全部）',
          },
          create: {
            title: '创建项目',
            description: '新建项目并担任负责人',
            all: '创建项目',
          },
          manage: {
            title: '管理项目',
            description: '改名、改状态、日期和负责人，管理项目成员和代码仓库',
            related: '管理项目（自己负责的）',
            relatedLabel: '我负责的',
            relatedHint: '我担任负责人的项目',
            all: '管理项目（全部）',
          },
          delete: {
            title: '删除项目',
            description: '删除项目，并可恢复已删除的项目',
            all: '删除项目',
          },
        },
      },
      issues: {
        title: '任务',
        description: '任务及其评论，可以在项目里，也可以独立存在。',
        actions: {
          view: {
            title: '查看任务',
            description: '在列表、看板和详情里看到任务',
            related: '查看任务（能看到的）',
            relatedLabel: '我能查看的项目里的',
            relatedHint: '不属于任何项目的任务，以及我能查看的项目里的任务',
            all: '查看任务（全部）',
          },
          create: {
            title: '创建任务',
            description: '新建任务，包括在项目里新建',
            related: '创建任务（在能看到的项目里）',
            relatedLabel: '在我能查看的项目里',
            relatedHint: '不属于任何项目的任务，或在我能查看的项目里新建',
            all: '创建任务（全部）',
          },
          edit: {
            title: '编辑任务',
            description:
              '标题、描述、优先级、日期、标签、执行人，以及未关闭的状态',
            related: '编辑任务（能看到的）',
            relatedLabel: '我能查看的项目里的',
            relatedHint: '不属于任何项目的任务，以及我能查看的项目里的任务',
            all: '编辑任务（全部）',
          },
          comment: {
            title: '评论任务',
            description: '评论、回复和解决讨论；编辑和删除自己的评论',
            related: '评论任务（能看到的）',
            relatedLabel: '我能查看的项目里的',
            relatedHint: '不属于任何项目的任务，以及我能查看的项目里的任务',
            all: '评论任务（全部）',
          },
          moderateComments: {
            title: '管理评论',
            description: '删除其他人的评论',
            related: '管理评论（自己负责的任务或项目）',
            relatedLabel: '我负责的任务或项目里的',
            relatedHint:
              '我负责的任务上的评论，以及我负责的项目里的任务上的评论',
            all: '管理评论（全部）',
          },
          close: {
            title: '关闭任务',
            description: '把任务改为已完成或已取消',
            related: '关闭任务（自己负责的任务或项目）',
            relatedLabel: '我负责的任务或项目里的',
            relatedHint: '我负责的任务，以及我负责的项目里的任务',
            all: '关闭任务（全部）',
          },
          changeOwner: {
            title: '变更负责人',
            description: '把任务交给另一个人负责',
            related: '变更负责人（自己负责的任务或项目）',
            relatedLabel: '我负责的任务或项目里的',
            relatedHint: '我负责的任务，以及我负责的项目里的任务',
            all: '变更负责人（全部）',
          },
          delete: {
            title: '删除和恢复任务',
            description: '删除任务，并可恢复已删除的任务',
            all: '删除和恢复任务',
          },
        },
      },
      attachments: {
        title: '附件',
        description: '任务和评论的附件。',
        actions: {
          upload: {
            title: '上传附件',
            description: '给能编辑的任务和自己的评论添加附件',
            related: '上传附件（能看到的任务）',
            relatedLabel: '我能查看的项目里的任务上',
            relatedHint: '不属于任何项目的任务，以及我能查看的项目里的任务',
            all: '上传附件（全部）',
          },
        },
      },
    },
    collections: { pmProjects: '项目', pmIssues: '任务' },
    recordAccess: {
      visible: '可见的项目和任务',
      managed: '负责的项目和任务',
    },
    settings: {
      pm: {
        general: '常规',
        labels: '标签',
        workflows: '流程模板',
        members: '成员',
      },
    },
    keyScopes: {
      projects: {
        title: '项目',
        description: '查看项目；管理项目；创建和删除项目。',
        objects: '项目',
      },
      issues: {
        title: '任务',
        description:
          '查看任务；创建、编辑、评论、关闭和转交任务；管理评论和删除任务。',
      },
      settings: {
        title: '项目设置',
        description: '常规设置、标签和流程模板。',
      },
    },
    actions: {
      view: '查看',
      create: '创建',
      manage: '管理',
      edit: '编辑',
      close: '关闭',
      comment: '评论',
      moderateComments: '管理评论',
      changeOwner: '变更负责人',
      delete: '删除',
      upload: '上传',
      read: '查看',
      update: '编辑',
      invite: '邀请',
      assign: '分配角色',
      'define-roles': '定义角色',
    },
  },
};

export default accessZhCN;
