/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Col, Row } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { ComponentDemo } from '../../interface';
import makeStyle from '../../utils/makeStyle';

const useStyle = makeStyle('GridDemo', (token) => ({
  '.previewer-grid-demo': {
    [`${token.rootCls}-row`]: {
      marginBottom: 16,
    },
    [`${token.rootCls}-row > div:not(.gutter-row)`]: {
      padding: '16px 0',
      background: '#0092ff',
      color: '#fff',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',

      '&:nth-child(2n + 1)': {
        background: 'rgba(0,146,255,.75)',
      },
    },
  },
}));

const Demo = () => {
  const [, hashId] = useStyle();

  return (
    <div className={classNames('previewer-grid-demo', hashId)}>
      <Row>
        <Col span={24}>col</Col>
      </Row>
      <Row>
        <Col span={12}>col-12</Col> <Col span={12}>col-12</Col>
      </Row>
      <Row>
        <Col span={8}>col-8</Col> <Col span={8}>col-8</Col>
        <Col span={8}>col-8</Col>
      </Row>
      <Row>
        <Col span={6}>col-6</Col> <Col span={6}>col-6</Col>
        <Col span={6}>col-6</Col>
        <Col span={6}>col-6</Col>
      </Row>
    </div>
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  key: 'default',
};

export default componentDemo;
