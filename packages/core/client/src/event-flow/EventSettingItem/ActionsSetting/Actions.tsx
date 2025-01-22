/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayField as ArrayFieldModel, VoidField } from '@formily/core';
import { ArrayField, ObjectField, observer, useField } from '@formily/react';
import { Space } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { Action } from './Action';
import { ArrayBase } from '@formily/antd-v5';

interface LinkageRuleActionGroupProps {
  type: 'button' | 'field' | 'style';
  linkageOptions: any;
  collectionName: string;
}

export const Actions = withDynamicSchemaProps(
  (props: LinkageRuleActionGroupProps) => {
    const { t } = useTranslation();
    const field = useField<VoidField>();
    const { category, elementType, linkageOptions, collectionName } = props;

    const components = useMemo(
      () => [Action, { category, elementType, linkageOptions, collectionName }],
      [collectionName, linkageOptions, category, elementType],
    );
    const spaceStyle = useMemo(() => ({ marginTop: 8, marginBottom: 8 }), []);
    const style = useMemo(() => ({ marginLeft: 10 }), []);
    const onClick = useCallback(() => {
      const f = field.query('.actions').take() as ArrayFieldModel;
      const items = f.value || [];
      items.push({});
      f.value = items;
      f.initialValue = items;
    }, [field]);

    return (
      <div style={style}>
        <ArrayField name={'actions'} component={components} disabled={false} />
        <Space size={16} style={spaceStyle}>
          <a onClick={onClick}>{t('添加动作')}</a>
        </Space>
      </div>
    );
  },
  { displayName: 'Actions' },
);
