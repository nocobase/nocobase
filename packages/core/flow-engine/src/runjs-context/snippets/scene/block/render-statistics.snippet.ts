/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSBlockRunJSContext } from '../../../contexts/JSBlockRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSBlockRunJSContext],
  prefix: 'sn-jsb-stats',
  label: 'Render statistics cards',
  description: 'Display multiple statistic cards with numbers from API',
  locales: {
    'zh-CN': {
      label: '渲染统计卡片',
      description: '显示多个统计数字卡片（从 API 获取数据）',
    },
  },
  content: `
const { Card, Statistic, Row, Col } = ctx.libs.antd;

const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 100,
    appends: ['roles'],
  },
});

const users = res?.data?.data || [];

const total = users.length;
const adminCount = users.filter((user) =>
  Array.isArray(user?.roles) && user.roles.some((role) => role?.name === 'admin')
).length;
const withEmail = users.filter((user) => !!user?.email).length;
const distinctRoles = new Set(
  users
    .flatMap((user) => (Array.isArray(user?.roles) ? user.roles.map((role) => role?.name) : []))
    .filter(Boolean),
).size;

ctx.render(
  <Row gutter={16}>
    <Col span={6}>
      <Card>
        <Statistic title={ctx.t('Total users')} value={total} valueStyle={{ color: '#3f8600' }} />
      </Card>
    </Col>
    <Col span={6}>
      <Card>
        <Statistic title={ctx.t('Administrators')} value={adminCount} valueStyle={{ color: '#1890ff' }} />
      </Card>
    </Col>
    <Col span={6}>
      <Card>
        <Statistic title={ctx.t('Users with email')} value={withEmail} valueStyle={{ color: '#faad14' }} />
      </Card>
    </Col>
    <Col span={6}>
      <Card>
        <Statistic title={ctx.t('Distinct roles')} value={distinctRoles} valueStyle={{ color: '#cf1322' }} />
      </Card>
    </Col>
  </Row>
);
`,
};

export default snippet;
