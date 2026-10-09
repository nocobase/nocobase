import type { OfficeFlowsExampleResource } from './en-US.js';

const zhCN: OfficeFlowsExampleResource = {
  navigation: {
    group: '办公流程示例',
    dataRequests: '数据使用申请',
    incoming: '收文',
    tasks: '我的待办',
    configuration: '配置',
  },
  dataRequests: {
    title: '数据使用申请',
    description:
      '申请人提交数据使用申请，经一级、二级、三级主管审批后进入抽数受理分析和分派。抽数子单按频次定期生成，遇周末和法定节假日顺延。',
    list: '申请',
    create: '新建申请',
    submit: '保存并提交',
  },
  extractions: { create: '创建抽数子流程' },
  incoming: {
    title: '收文',
    description:
      '办公室录入收文，经办公室部门主管、分管领导审批后由申请人派发到各部门；办事人员可再派发执行团队和执行人。每个人在每一层只收到一次提醒。',
    list: '收文',
    create: '录入收文',
    submit: '保存并提交',
  },
  tasks: {
    title: '我的待办',
    description: '所扮演人员的办事人员、执行团队、执行人子单，以及收到的提醒。',
    mine: '待办',
    none: '这个人员没有待办。',
    pick: '选择一张子单开始处理。',
    notices: '提醒',
    noticesNote: '同一收文的同一层，无论出现在多少行，只提醒一次。',
    noNotices: '还没有提醒。',
  },
  configuration: {
    title: '配置',
    description:
      '流程读取的演示数据：各部门带入的人员、公司管理层群组，以及 2026 年工作日历。',
  },
  common: {
    created: '创建',
    actAs: '扮演',
    save: '保存',
    delete: '删除',
    reason: '原因',
    notAllowed: '当前人员现在不能执行此操作。',
    final: '当前环节没有可执行的操作。',
    history: '审批记录',
    noHistory: '还没有记录。',
    empty: '还没有记录。',
    pick: '选择一条记录，或新建一条。',
    loading: '加载中…',
    remove: '移除 {{name}}',
  },
  rows: {
    department: '分发部门',
    clerks: '办事人员',
    heads: '抄送人员（部门主管及其他）',
    leaders: '抄送人员（分管领导）',
    dispatched: '是否派发',
    yes: '是',
    no: '否',
    empty: '暂无办事人员',
    pickDepartment: '选择部门',
    assist: '（协助）',
    assistOther: '派发其他部门协助',
    add: '添加行',
    addAssist: '保存并创建协助子单',
  },
  processing: {
    number: '单据号',
    node: '节点',
    assignees: '审批人',
    feedback: '反馈信息',
    attachments: '反馈附件',
    empty: '这一层还没有子单。',
  },
  trace: {
    departments: '派发部门',
    groups: '群组',
    notified: '已提醒',
    skipped: '已提醒过，本次跳过',
  },
  runs: {
    queued: '排队中',
    running: '执行中',
    succeeded: '成功',
    failed: '失败',
    dead: '已放弃',
    cancelled: '已取消',
  },
};

export default zhCN;
