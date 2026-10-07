import type { ServicesLocale } from './services.en-US.js';

const servicesZhCN: ServicesLocale = {
  models: {
    title: '模型',
    description:
      '在线 Agent 调用的模型服务，以及每个服务提供的模型：对话模型供 Agent 使用，向量模型和重排序模型供搜索使用。',
  },
  defaultModel: {
    title: '默认对话模型',
    description:
      '没有指定模型的在线 Agent 使用它回答，例如新建的 Agent 或应用自带的 Agent。',
    none: '还没有启用的对话模型。添加模型服务并启用一个对话模型后，第一个会成为默认模型。',
    saved: '默认对话模型已改为 {{model}}。',
  },
  services: {
    list: '模型服务',
    columns: {
      name: '名称',
      provider: '服务商',
      status: '状态',
    },
    loadFailed: '无法加载模型服务',
    empty: {
      title: '还没有模型服务',
      description: '添加模型服务后，在线 Agent 就能通过它回答。',
      readOnly: '请联系管理员添加模型服务。',
    },
    add: {
      open: '添加服务',
      title: '添加模型服务',
      provider: '服务商类型',
      created: '已添加 {{title}}。',
    },
    status: {
      on: '已启用',
      off: '已停用',
      noKey: '未设置 API 密钥',
      noModels: '未启用模型',
    },
    service: {
      edit: '编辑 {{title}}',
      defaultHost: '服务商默认地址',
      actions: '{{title}} 的更多操作',
      turnOn: '启用',
      turnOff: '停用',
      turnedOn: '已启用 {{title}}。',
      turnedOff: '已停用 {{title}}。',
      name: '名称',
      enabled: '启用',
      enabledHint: '只有启用时，在线 Agent 才能使用它的模型。',
      saved: '已保存 {{title}}。',
      delete: '删除',
      deleteTitle: '删除 {{title}}？',
      deleteDescription:
        '使用它的模型的 Agent 将停止回答，直到改用其他模型；它的模型价格也会被删除。',
      deleted: '已删除 {{title}}。',
    },
    connection: {
      apiKey: 'API 密钥',
      keyPlaceholder: '粘贴 API 密钥',
      baseUrl: 'Base URL',
      baseUrlHint: '留空使用服务商默认地址 {{url}}。',
      baseUrlRequired: '服务商 API 的地址。',
      baseUrlInvalid: 'Base URL 需以 http:// 或 https:// 开头。',
      test: '测试连接',
      testing: '正在测试…',
      testOk: '连接成功：{{model}} 有回应。',
      testFailed: '{{model}} 没有回应：{{message}}',
      testNeedsModel: '勾选一个模型后才能测试连接。',
    },
    models: {
      title: '模型',
      description:
        '勾选这个服务提供的模型，并说明每个模型的用途：对话模型供 Agent 回答，向量模型为搜索建立文本索引，重排序模型为搜索结果排序。向量模型可以指定向量维度。',
      fetching: '正在获取服务商的模型…',
      fetchFailed: '服务商没有返回模型列表：{{message}}',
      fetch: '获取模型',
      search: '搜索模型',
      noMatch: '没有匹配的模型。',
      empty: '还没有模型。可以从服务商获取，也可以按 ID 添加。',
      add: '添加模型',
      addPlaceholder: '模型 ID',
      kind: '{{model}} 的用途',
      kinds: {
        chat: '对话',
        embedding: '向量',
        rerank: '重排序',
      },
      test: '测试 {{model}}',
      testOk: '已按{{kind}}应答。',
      testFailed: '没有应答：{{message}}',
      notKind: {
        chat: '这个模型看起来不是对话模型',
        embedding: '这个模型看起来不是向量模型',
        rerank: '这个模型看起来不是重排序模型',
      },
      looksLike: '{{notKind}}：它按{{kind}}应答。',
      kindNouns: {
        chat: '对话模型',
        embedding: '向量模型',
        rerank: '重排序模型',
      },
      dimensions: '{{model}} 的向量维度',
      dimensionsPlaceholder: '默认',
      counts: {
        chat: '{{count}} 个对话',
        embedding: '{{count}} 个向量',
        rerank: '{{count}} 个重排序',
      },
    },
  },
};

export default servicesZhCN;
