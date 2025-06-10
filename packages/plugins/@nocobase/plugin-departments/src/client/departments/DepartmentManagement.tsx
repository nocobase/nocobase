/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React from 'react';
import { Col, Row } from 'antd';
import { Department } from './Department';
import { Member } from './Member';
import { SchemaComponentOptions } from '@nocobase/client';
import { SuperiorDepartmentSelect, DepartmentSelect } from './DepartmentTreeSelect';
import { DepartmentsListProvider, UsersListProvider } from '../ResourcesProvider';

export const DepartmentManagement: React.FC = () => {
  return (
    <SchemaComponentOptions components={{ SuperiorDepartmentSelect, DepartmentSelect }}>
      <Row gutter={48} style={{ flexWrap: 'nowrap' }}>
        <Col span={6} style={{ borderRight: '1px solid #eee', minWidth: '300px' }}>
          <DepartmentsListProvider>
            <Department />
          </DepartmentsListProvider>
        </Col>
        <Col flex="auto" style={{ overflow: 'hidden' }}>
          <UsersListProvider>
            <Member />
          </UsersListProvider>
        </Col>
      </Row>
    </SchemaComponentOptions>
  );
};
