import type enUS from './file-overview-en-US.js';

const fileOverview: typeof enUS = {
  current: {
    storageTitle: '文件存储',
    default: '默认存储',
    disks: '已配置存储数量',
    storageUnavailable: '存储清单待获取，暂时无法确认当前配置。',
    tablesTitle: '文件表',
    count: '已配置文件表数量',
    tablesUnavailable: '文件表清单待获取，暂时无法确认已配置数量。',
    unknown: '待获取',
    scope:
      '配置情况不代表存储连接可用。同一文件表中的文件记录可以来自不同存储。',
  },
  actionsTitle: '通过 Agent 配置',
  exampleTitle: 'config.yml 配置示例',
  exampleHint:
    '示例仅供参考，请合并到现有 drive 配置中，并将示例目录换为可访问的绝对路径。切换默认存储不会移动已有文件。',
  fileConfigTitle: '文件表配置示例',
  fileConfigHint:
    '通过新的应用迁移创建文件表，并在应用代码中声明 File Repository 资源。仅在 config.yml 中增加 drive 存储不会创建文件表。',
  fields: {
    diskName: '存储名称',
    driver: '类型',
    visibility: '可见性',
    connection: '数据库连接',
    collection: '文件表',
    disk: '上传存储',
    resource: '接口资源',
  },
  actions: {
    drive: {
      title: '配置文件存储（drive）',
      description:
        '配置本地目录、S3 兼容存储或阿里云 OSS，增加存储或切换默认存储。',
      prompt:
        '帮我为应用添加【阿里云 OSS】文件存储，用于保存【合同附件】。请结合现有配置完成设置，并告诉我还需要提供哪些信息。',
      inspect:
        '核对 drive.default、drive.disks 及默认值和覆盖配置，确认目标存储类型，保留已有文件记录使用的存储名称。',
      configure:
        '本地 fs 配置可访问的绝对目录；s3 或 oss 按对应 Skill 配置存储桶、区域、凭据及支持的选项。凭据不展示在概览中，使用支持的环境变量映射或凭据提供方式。',
      apply:
        '重启应用使配置生效，确认实际使用的存储配置。已有文件迁移单独处理；配置为私有不能代替内容下载接口的权限检查。',
    },
    collection: {
      title: '新增或配置文件表',
      description:
        '选择数据库连接和上传存储，配置文件记录、接口资源及访问规则。',
      prompt:
        '帮我为【合同附件】配置文件表，使用【当前默认数据库】保存文件记录，文件存放在【local 存储】。允许【合同相关人员】上传、查看和下载。已有合适的文件表时优先复用。',
      inspect:
        '确认连接、逻辑表名、接口资源名称和已有存储。优先复用合适的文件表，区分一张文件表与多个接口资源。',
      configure:
        '新增迁移，按文件插件要求定义 id、disk、key、filename、ext、mimeType、size、createdAt、updatedAt 及对应类型，通过应用迁移流程生效。contentUrl 由接口生成，不作为字段保存。',
      apply:
        '声明 File Repository 的资源映射、上传限制、必要操作和 policy；为 API 与内容路径分别添加限定范围的认证和授权，复用应用已有的业务关联流程。',
    },
  },
};

export default fileOverview;
