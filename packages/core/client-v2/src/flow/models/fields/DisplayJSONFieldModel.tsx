/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { DisplayItemModel } from '@nocobase/flow-engine';
import React, { useRef, useState, useEffect } from 'react';
import { Tooltip } from 'antd';
import { DisplayTitleFieldModel } from './DisplayTitleFieldModel';

const JSONClassName = css`
  margin-bottom: 0;
  line-height: 1.5;
  font-size: 90%;
  background: none !important;
  border: none !important;
`;

const EllipsisJSON = ({ content, style, className }) => {
  const ref = useRef(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      // 判断是否溢出
      setOverflow(el.scrollWidth > el.clientWidth);
    }
  }, [content]);

  const node = (
    <div
      ref={ref}
      style={{
        ...style,
        whiteSpace: 'nowrap',
        fontFamily: 'Consolas, Monaco, monospace',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {content}
    </div>
  );

  return overflow ? (
    <Tooltip
      title={
        <pre style={{ margin: 0, maxHeight: 400 }} className={className}>
          {content}
        </pre>
      }
      overlayInnerStyle={{
        background: '#fff',
        color: '#000',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        maxWidth: 500,
      }}
      color="#fff"
      overlayStyle={{
        maxWidth: 500, // 控制 tooltip 内容区域最大宽度
        whiteSpace: 'pre-wrap',
      }}
    >
      {node}
    </Tooltip>
  ) : (
    node
  );
};

export class DisplayJSONFieldModel extends DisplayTitleFieldModel {
  public renderComponent(value) {
    const { space, style, className, overflowMode } = this.props;
    let content = '';
    if (value !== undefined && value !== null) {
      try {
        content = JSON.stringify(value, null, space ?? 2);
      } catch (error) {
        content = this.flowEngine.translate('Invalid JSON format');
      }
    }

    if (overflowMode === 'ellipsis') {
      return <EllipsisJSON content={content} style={style} className={cx(className, JSONClassName)} />;
    }

    return (
      <pre className={cx(className, JSONClassName)} style={style}>
        {content}
      </pre>
    );
  }
}

DisplayItemModel.bindModelToInterface('DisplayJSONFieldModel', ['json'], {
  isDefault: true,
});
