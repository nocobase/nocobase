const messages = {
  navigation: {
    tasks: '通知示例',
    taskManagement: '任务',
    taskDetail: '任务详情',
  },
  common: {
    close: '关闭',
    loading: '加载中…',
    saving: '保存中…',
  },
  fields: {
    title: '标题',
    description: '描述',
    status: '状态',
    assignee: '负责人',
    creator: '创建人',
    chooseAssignee: '选择用户',
  },
  status: {
    open: '待处理',
    'in-progress': '进行中',
    done: '已完成',
  },
  tasks: {
    title: '任务',
    description:
      '将一个简单任务分配给其他用户。负责人会收到包含任务摘要的站内通知，并可从详情页调整任务。点击页面顶部的通知按钮，可前往消息通知页面。',
    listTitle: '全部任务',
    listDescription: '这里展示你创建或被分配的全部任务。',
    count: '{{count}} 条记录',
    empty: '暂时还没有任务。',
    assignee: '负责人',
    columns: {
      title: '标题',
      description: '描述',
      status: '状态',
      creator: '创建人',
      assignee: '负责人',
      updatedAt: '最近更新',
      actions: '操作',
    },
    view: '查看详情',
    refresh: '刷新',
    previous: '上一页',
    next: '下一页',
    page: '第 {{page}} 页',
    add: '新增任务',
    drawerTitle: '新增任务',
    drawerDescription: '创建任务后，负责人会收到包含任务基本信息的站内通知。',
    create: '创建任务',
    cancel: '取消',
  },
  taskDetail: {
    title: '任务详情',
    summary: '任务详情',
    createdAt: '创建时间',
    updatedAt: '最近更新',
    notificationHint:
      '任务保存成功后，除当前操作者外，会通知相关人员：创建人和当前负责人。若负责人发生变更，原负责人和新负责人都会收到通知。',
    edit: '编辑任务',
    refresh: '刷新',
    save: '保存修改',
    cancel: '取消',
    back: '返回任务列表',
  },
};

export default messages;
