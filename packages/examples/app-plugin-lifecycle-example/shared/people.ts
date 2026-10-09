/**
 * The people the pages let you switch between, so one person can try every
 * role. A real application takes the actor from the signed-in user.
 */
export type Role =
  'agent' | 'customer' | 'applicant' | 'manager' | 'director' | 'finance';

export interface Person {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly role: Role;
  readonly email: string;
}

export const PEOPLE: readonly Person[] = [
  {
    id: 'agent-zhou',
    name: '周宁',
    title: '客服专员',
    role: 'agent',
    email: 'zhou.ning@example.com',
  },
  {
    id: 'agent-qian',
    name: '钱峰',
    title: '客服主管',
    role: 'agent',
    email: 'qian.feng@example.com',
  },
  {
    id: 'customer-li',
    name: '李先生',
    title: '星河科技',
    role: 'customer',
    email: 'li@xinghe.example.com',
  },
  {
    id: 'customer-wang',
    name: '王女士',
    title: '晨光书店',
    role: 'customer',
    email: 'wang@chenguang.example.com',
  },
  {
    id: 'lin',
    name: '林晓',
    title: '市场部 · 专员',
    role: 'applicant',
    email: 'lin.xiao@example.com',
  },
  {
    id: 'he',
    name: '何东',
    title: '研发部 · 工程师',
    role: 'applicant',
    email: 'he.dong@example.com',
  },
  {
    id: 'chen',
    name: '陈明',
    title: '市场部经理',
    role: 'manager',
    email: 'chen.ming@example.com',
  },
  {
    id: 'sun',
    name: '孙磊',
    title: '研发部经理',
    role: 'manager',
    email: 'sun.lei@example.com',
  },
  {
    id: 'wang',
    name: '王丽',
    title: '副总经理',
    role: 'director',
    email: 'wang.li@example.com',
  },
  {
    id: 'zhao',
    name: '赵静',
    title: '财务总监',
    role: 'finance',
    email: 'zhao.jing@example.com',
  },
];

const BY_ID: ReadonlyMap<string, Person> = new Map(
  PEOPLE.map((person) => [person.id, person]),
);

export function person(id: unknown): Person | undefined {
  return typeof id === 'string' ? BY_ID.get(id) : undefined;
}

export function personName(id: unknown): string {
  return person(id)?.name ?? (typeof id === 'string' ? id : '');
}

/** Each applicant's manager, and each manager's; the director is the top. */
export const MANAGERS: Readonly<Record<string, string>> = {
  lin: 'chen',
  he: 'sun',
  chen: 'wang',
  sun: 'wang',
};

export const FINANCE_DIRECTOR = 'zhao';
