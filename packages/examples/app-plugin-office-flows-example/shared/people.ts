/**
 * The people the example's pages let you act as. A real application takes
 * the actor from the signed-in user and its organization; the example keeps
 * a fixed cast so one person can play every role.
 */
export interface Person {
  readonly id: string;
  readonly name: string;
  readonly title: string;
}

export const PEOPLE: readonly Person[] = [
  // Data usage request
  { id: 'zhangwei', name: '张伟', title: '业务部门 · 申请人' },
  { id: 'lina', name: '李娜', title: '一级主管' },
  { id: 'wangqiang', name: '王强', title: '二级主管' },
  { id: 'zhaomin', name: '赵敏', title: '三级主管' },
  { id: 'chenjing', name: '陈静', title: '数据管理 · 抽数受理' },
  { id: 'liuyang', name: '刘洋', title: '抽数执行人' },
  { id: 'sunli', name: '孙丽', title: '抽数执行人' },
  // Incoming documents: the office
  { id: 'zhoujie', name: '周杰', title: '办公室 · 收文员' },
  { id: 'wuhua', name: '吴华', title: '办公室部门主管' },
  { id: 'zhengkai', name: '郑凯', title: '办公室分管领导' },
  // Incoming documents: departments
  { id: 'huangtao', name: '黄涛', title: '信息技术部 · 办事人员' },
  { id: 'xulei', name: '徐磊', title: '信息技术部 · 部门主管' },
  { id: 'gaoyan', name: '高燕', title: '财务部 · 办事人员' },
  { id: 'linfeng', name: '林峰', title: '财务部 · 办事人员' },
  { id: 'heming', name: '何明', title: '财务部、工会 · 部门主管' },
  { id: 'mahui', name: '马慧', title: '分管领导' },
  { id: 'luoxin', name: '罗欣', title: '工会 · 办事人员' },
  { id: 'songyu', name: '宋雨', title: '分管领导' },
  { id: 'tangjun', name: '唐军', title: '董事会办公室 · 办事人员' },
  { id: 'fanqing', name: '范青', title: '董事会办公室 · 部门主管' },
  { id: 'guoning', name: '郭宁', title: '风险管理部 · 办事人员' },
  { id: 'denghui', name: '邓辉', title: '风险管理部 · 部门主管' },
  // Company management
  { id: 'yeqing', name: '叶青', title: '公司管理层' },
  { id: 'caobin', name: '曹斌', title: '公司管理层' },
  { id: 'jiangli', name: '江丽', title: '公司管理层' },
];

const BY_ID: ReadonlyMap<string, Person> = new Map(
  PEOPLE.map((person) => [person.id, person]),
);

export function isPerson(id: unknown): id is string {
  return typeof id === 'string' && BY_ID.has(id);
}

export function personName(id: string): string {
  return BY_ID.get(id)?.name ?? id;
}

/** The fixed approval chain of a data usage request. */
export const DATA_REQUEST_ROLES: {
  readonly applicant: string;
  readonly level1: string;
  readonly level2: string;
  readonly level3: string;
  readonly acceptor: string;
  readonly executors: readonly string[];
} = Object.freeze({
  applicant: 'zhangwei',
  level1: 'lina',
  level2: 'wangqiang',
  level3: 'zhaomin',
  acceptor: 'chenjing',
  executors: ['liuyang', 'sunli'],
});

/** The office roles of an incoming document. */
export const INCOMING_ROLES: {
  readonly registrar: string;
  readonly officeHead: string;
  readonly officeLeader: string;
} = Object.freeze({
  registrar: 'zhoujie',
  officeHead: 'wuhua',
  officeLeader: 'zhengkai',
});
