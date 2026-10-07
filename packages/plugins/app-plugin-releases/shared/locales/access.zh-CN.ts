import type accessEnUS from './access.en-US.js';

const accessZhCN: typeof accessEnUS = {
  access: {
    section: '发布',
    pages: { 'rel-apps': '应用' },
    businessSection: '发布',
    businesses: {
      apps: {
        title: '应用',
        description: '应用及其版本、部署和运行。',
        actions: {
          view: {
            title: '查看应用',
            description: '看到应用、版本、部署记录和运行状态',
            related: '查看应用（与自己相关的）',
            relatedLabel: '我创建的',
            relatedHint: '我创建的应用，以及系统另外关联给我的应用',
            all: '查看应用（全部）',
          },
          readLogs: {
            title: '查看日志',
            description: '查看应用日志和部署日志',
            related: '查看日志（与自己相关的）',
            relatedLabel: '我创建的',
            relatedHint: '我创建的应用，以及系统另外关联给我的应用',
            all: '查看日志（全部）',
          },
          create: {
            title: '创建应用',
            description: '在环境里创建应用',
            all: '创建应用',
          },
          configure: {
            title: '配置应用',
            description: '读取和修改应用配置，配置里可能有密钥',
            related: '配置应用（与自己相关的）',
            relatedLabel: '我创建的',
            relatedHint: '我创建的应用，以及系统另外关联给我的应用',
            all: '配置应用（全部）',
          },
          upload: {
            title: '上传版本',
            description: '上传和晋升版本',
            related: '上传版本（与自己相关的）',
            relatedLabel: '我创建的',
            relatedHint: '我创建的应用，以及系统另外关联给我的应用',
            all: '上传版本（全部）',
          },
          deploy: {
            title: '部署',
            description: '在未受保护的环境部署和回滚，申请部署到受保护环境',
            related: '部署（与自己相关的）',
            relatedLabel: '我创建的',
            relatedHint: '我创建的应用，以及系统另外关联给我的应用',
            all: '部署（全部）',
          },
          deployProtected: {
            title: '审批受保护环境的部署',
            description: '在未指定审批人的受保护环境审批部署，仅限人',
            related: '审批受保护环境的部署（与自己相关的）',
            relatedLabel: '我创建的',
            relatedHint: '我创建的应用，以及系统另外关联给我的应用',
            all: '审批受保护环境的部署（全部）',
          },
          operate: {
            title: '启停',
            description: '启动、停止和重启应用',
            related: '启停（与自己相关的）',
            relatedLabel: '我创建的',
            relatedHint: '我创建的应用，以及系统另外关联给我的应用',
            all: '启停（全部）',
          },
          delete: {
            title: '删除应用',
            description: '删除应用及其数据',
            related: '删除应用（与自己相关的）',
            relatedLabel: '我创建的',
            relatedHint: '我创建的应用，以及系统另外关联给我的应用',
            all: '删除应用（全部）',
          },
        },
      },
    },
    recordAccess: { owned: '自己创建的应用' },
    settings: {
      rel: { environments: '部署环境' },
    },
    keyScopes: {
      apps: {
        title: '应用与部署',
        description:
          '只读：查看应用、版本、部署和日志。读写：还可上传版本。管理：还可部署、启动或停止应用。',
        objects: '应用',
      },
      environments: {
        title: '部署环境',
        description: '只读：查看环境列表。读写：管理环境。',
      },
      presets: {
        ciDeploy: {
          title: 'CI 部署',
          description: '向选定的应用上传版本并部署，有效期 90 天。',
        },
        ciUpload: {
          title: 'CI 上传',
          description: '向选定的应用上传版本但不部署，有效期 90 天。',
        },
      },
    },
    actions: {
      read: '查看',
      manage: '管理',
      view: '查看',
      'read-logs': '读取日志',
      create: '创建',
      configure: '配置',
      upload: '上传版本',
      deploy: '部署',
      'deploy-protected': '审批受保护环境的部署',
      operate: '启动和停止',
      delete: '删除',
    },
  },
  drivers: {
    host: '本服务器',
  },
};

export default accessZhCN;
