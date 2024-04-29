/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import { Tag } from 'antd';
import { useAntdToken } from 'antd-style';
import React, { useMemo } from 'react';
import { useCompile } from '../../../schema-component';

const Summary = observer(
  (props: { schema: any; label: string }) => {
    const { schema, label } = props;
    const compile = useCompile();
    const token = useAntdToken();
    const styles = useMemo(() => {
      return {
        container: {
          backgroundColor: token.colorFillAlter,
          marginBottom: token.marginLG,
          padding: token.paddingSM + token.paddingXXS,
        },
        title: {
          color: token.colorText,
        },
        description: {
          marginTop: token.marginXS,
          color: token.colorTextDescription,
        },
        tag: {
          background: 'none',
        },
      };
    }, [
      token.colorFillAlter,
      token.colorText,
      token.colorTextDescription,
      token.marginLG,
      token.marginXS,
      token.paddingSM,
      token.paddingXXS,
    ]);

    if (!schema) return null;

    return (
      <div style={styles.container}>
        <div style={styles.title}>
          {label}: <Tag style={styles.tag}>{compile(schema.title)}</Tag>
        </div>
        {schema.description ? <div style={styles.description}>{compile(schema.description)}</div> : null}
      </div>
    );
  },
  { displayName: 'Summary' },
);

export default Summary;
