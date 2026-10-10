import { SYSTEM_ACTOR, type JsonObject } from '@nocobase/lifecycle';

import type { ExpenseItem } from '../shared/expense.js';
import { text } from '../shared/text.js';
import type { DurableFlowService } from './services/durable-flows.js';
import type { LifecycleExampleService } from './services/lifecycle-example.js';

/** Recorded in the seed history as `sample-data:<name>`. */
export const SAMPLE_DATA_NAME: string = 'lifecycle-example/records';

/**
 * Sample records, so each page opens on something to look at instead of an
 * empty list. They are built the way a person would build them — created
 * through the service and moved on with `runtime.fire()` — so their logs,
 * versions and effect runs are the real thing rather than rows written to
 * look like it. The system's own steps, such as closing a silent ticket,
 * are fired as the system would fire them.
 *
 * Each record stops where it has something to show and nothing would move
 * it on by itself before someone looks: no ticket is left waiting on its
 * customer and no report waiting on a manager, since their triggers would
 * close or escalate them minutes later. The durable flows' records stay in
 * their first state, where the page's outside card takes over; there is no
 * subscription, because creating one charges the card at once.
 */
export async function buildSampleRecords(
  examples: LifecycleExampleService,
  flows: DurableFlowService,
): Promise<void> {
  const { runtime } = examples;
  const fire = async (
    lifecycle: string,
    record: { readonly id?: unknown },
    transition: string,
    actor: string,
    input: JsonObject = {},
  ): Promise<void> => {
    await runtime.fire(lifecycle, text(record.id), transition, {
      actor: actor === SYSTEM_ACTOR.id ? SYSTEM_ACTOR : { id: actor },
      input,
    });
  };

  // Help desk: one ticket in each state a ticket rests in.
  const incident = await examples.createTicket(
    {
      subject: '页面偶尔报 502 错误',
      description:
        '下午三点左右打开订单列表时连续出现两次 502，刷新后恢复，想确认是不是服务端的问题。',
      category: 'incident',
      priority: 'urgent',
      failNotifications: 0,
    },
    'customer-wang',
  );
  await fire('tickets', incident, 'accept', 'agent-zhou');
  await fire('tickets', incident, 'reply', 'agent-zhou', {
    message:
      '您好，那个时段网关做过一次滚动发布，可能造成了短暂的 502。请问现在还能复现吗？',
  });
  // What the closeSilent trigger does once the customer stays silent.
  await fire('tickets', incident, 'autoClose', SYSTEM_ACTOR.id);

  const howTo = await examples.createTicket(
    {
      subject: '如何导出本月的订单报表？',
      description: '在报表页面没有找到导出按钮，想把本月订单导出成 Excel。',
      category: 'howto',
      priority: 'low',
      failNotifications: 0,
    },
    'customer-li',
  );
  await fire('tickets', howTo, 'reply', 'agent-qian', {
    message:
      '您好，在「报表 → 订单」页面右上角的「更多」菜单里可以找到「导出」，选择本月即可。',
  });
  await fire('tickets', howTo, 'customerReply', 'customer-li', {
    message: '找到了，已经导出成功，谢谢！',
  });
  await fire('tickets', howTo, 'resolve', 'agent-qian');

  const invoice = await examples.createTicket(
    {
      subject: '发票抬头填错了，能否重开？',
      description:
        '上周的发票抬头写成了个人姓名，需要改成公司抬头，麻烦帮忙重开一张。',
      category: 'billing',
      priority: 'normal',
      failNotifications: 0,
    },
    'customer-wang',
  );
  await fire('tickets', invoice, 'accept', 'agent-zhou');
  await fire('tickets', invoice, 'reply', 'agent-zhou', {
    message: '可以重开，请提供正确的公司抬头和税号。',
  });
  await fire('tickets', invoice, 'customerReply', 'customer-wang', {
    message: '抬头：晨光书店有限公司，税号：91310000MA1K000000。',
  });

  await examples.createTicket(
    {
      subject: '无法登录管理后台',
      description:
        '今天早上开始输入正确的密码也提示「账号或密码错误」，重置密码的邮件也没有收到。',
      category: 'account',
      priority: 'high',
      failNotifications: 0,
    },
    'customer-li',
  );

  // Expense reports, with amounts chosen to take each route: up to 5,000
  // is approved automatically, above it the manager approves, and above
  // 50,000 the finance director too.
  const line = (
    date: string,
    category: string,
    description: string,
    yuan: number,
  ): ExpenseItem => ({ date, category, description, amountCents: yuan * 100 });

  const materials = await examples.createExpense(
    {
      title: 'Q3 市场活动物料',
      purpose: '9 月线下沙龙的易拉宝、宣传册和伴手礼。',
      items: [
        line('2026-09-08', 'office', '易拉宝及宣传册印刷', 4_600),
        line('2026-09-10', 'other', '沙龙伴手礼 60 份', 8_200),
      ],
      failPayments: 0,
    },
    'lin',
  );
  await fire('expenses', materials, 'submit', 'lin');
  // Approved, it is paid by the payment effect and then marked paid.
  await fire('expenses', materials, 'approve', 'chen', {
    comment: '同意，活动效果不错。',
  });

  const teamDinner = await examples.createExpense(
    {
      title: '团队建设聚餐',
      purpose: '研发部季度团建。',
      items: [line('2026-09-26', 'entertainment', '团建聚餐 16 人', 6_400)],
      failPayments: 0,
    },
    'he',
  );
  await fire('expenses', teamDinner, 'submit', 'he');
  await fire('expenses', teamDinner, 'reject', 'sun', {
    reason: '团建费用走部门预算，不在个人报销范围内。',
  });

  const onSite = await examples.createExpense(
    {
      title: '北京客户现场支持',
      purpose: '为北京客户上线提供三天现场支持。',
      items: [
        line('2026-10-05', 'transport', '上海—北京往返高铁', 1_176),
        line('2026-10-05', 'lodging', '酒店 3 晚', 1_860),
        line('2026-10-07', 'meals', '出差餐补 3 天', 300),
        line('2026-10-07', 'entertainment', '客户工作餐', 4_524),
      ],
      failPayments: 0,
    },
    'he',
  );
  await fire('expenses', onSite, 'submit', 'he');
  await fire('expenses', onSite, 'requestInfo', 'sun', {
    reason: '客户工作餐请补充参与人员和发票。',
  });

  const tradeFair = await examples.createExpense(
    {
      title: '法兰克福展会参展',
      purpose: '10 月法兰克福行业展会的展位与差旅。',
      items: [
        line('2026-09-20', 'other', '展位费', 42_000),
        line('2026-09-22', 'transport', '上海—法兰克福往返机票 2 人', 18_600),
        line('2026-09-22', 'lodging', '酒店 5 晚 × 2 间', 9_000),
      ],
      failPayments: 0,
    },
    'lin',
  );
  await fire('expenses', tradeFair, 'submit', 'lin');
  await fire('expenses', tradeFair, 'approve', 'chen', {
    comment: '展会是今年的重点，同意。',
  });

  await examples.createExpense(
    {
      title: '杭州客户拜访',
      purpose: '拜访杭州两家渠道客户。',
      items: [
        line('2026-10-08', 'transport', '上海—杭州往返高铁', 292),
        line('2026-10-08', 'lodging', '酒店 1 晚', 580),
      ],
      failPayments: 0,
    },
    'lin',
  );

  // Durable flows: a record or two in its first state, where nothing runs
  // until someone acts; the page's outside card plays the rest.
  const by = SYSTEM_ACTOR.id;
  await flows.createOrder(
    {
      customerId: 'customer-li',
      title: '降噪耳机 × 1',
      amountCents: 39_900,
      failCheckouts: 0,
      failRefunds: 0,
    },
    by,
  );
  await flows.createOrder(
    {
      customerId: 'customer-wang',
      title: '机械键盘 × 1',
      amountCents: 59_900,
      failCheckouts: 1,
      failRefunds: 0,
    },
    by,
  );
  await flows.createExport(
    { title: '9 月订单明细', durationSeconds: 30, vendorOutcome: 'success' },
    by,
  );
  await flows.createExport(
    { title: '全年客户名单', durationSeconds: 60, vendorOutcome: 'stuck' },
    by,
  );
  await flows.createPurchase(
    {
      customerId: 'customer-li',
      sku: 'lamp',
      quantity: 2,
      declineCharge: false,
      failReleases: 0,
    },
    by,
  );
  await flows.createPurchase(
    {
      customerId: 'customer-wang',
      sku: 'keyboard',
      quantity: 1,
      declineCharge: true,
      failReleases: 0,
    },
    by,
  );
  await flows.createFulfilment(
    { title: '订单 #1024 · 降噪耳机', customerId: 'customer-li' },
    by,
  );
}
