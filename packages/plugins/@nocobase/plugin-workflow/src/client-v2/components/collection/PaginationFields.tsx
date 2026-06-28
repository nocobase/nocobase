/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Col, Form, Row } from 'antd';
import React from 'react';
import { WorkflowTypedVariableInput } from '../../canvas/WorkflowTypedVariableInput';
import { useT } from '../../locale';

export function PaginationFields({
  pageName = 'page',
  pageSizeName = 'pageSize',
}: {
  pageName?: string | number | (string | number)[];
  pageSizeName?: string | number | (string | number)[];
}) {
  const t = useT();

  return (
    <Row gutter={12}>
      <Col span={12}>
        <Form.Item name={pageName as any} label={t('Page number')} initialValue={1}>
          <WorkflowTypedVariableInput nullable={false} variableOptions={{ types: ['number'] }} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name={pageSizeName as any} label={t('Page size')} initialValue={20}>
          <WorkflowTypedVariableInput nullable={false} variableOptions={{ types: ['number'] }} />
        </Form.Item>
      </Col>
    </Row>
  );
}

export default PaginationFields;
