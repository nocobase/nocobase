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
import { Space, TreeSelect } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import {
  FormButtonLinkageRuleAction,
  FormFieldLinkageRuleAction,
  FormStyleLinkageRuleAction,
} from './LinkageRuleAction';
import { RemoveActionContext } from './context';
import { useControllableValue } from 'ahooks';

const ActionSelect = (props) => {
  const { t } = useTranslation();
  const { definitions, className } = props;
  const [state, setState] = useControllableValue<String>(props, {
    defaultValue: undefined,
  });
  let treeData = definitions?.map((module) => ({
    value: module.name,
    title: module.title + ' - ' + module.uid,
    selectable: false,
    children:
      module?.events?.map((event) => ({
        value: module.name + '.' + event.name,
        title: event.title,
      })) || [],
  }));
  treeData = treeData?.filter((item) => item.children.length > 0);

  return (
    <TreeSelect
      value={state}
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
      placeholder="Please select"
      allowClear
      treeDefaultExpandAll
      onChange={(value) => {
        setState(value);
      }}
      treeData={treeData}
      className={className}
    />
  );
};

export const Action = observer(
  (props: any): any => {
    const { linkageOptions, category, elementType } = props;
    const field = useField<ArrayFieldModel>();
    const type = category === 'default' ? elementType : category;
    const componentMap: {
      [key: string]: any;
    } = {
      button: FormButtonLinkageRuleAction,
      field: FormFieldLinkageRuleAction,
      style: FormStyleLinkageRuleAction,
    };
    return field?.value?.map((item, index) => {
      return (
        <RemoveActionContext.Provider key={index} value={() => field.remove(index)}>
          <ObjectField name={index} component={[ActionSelect, { ...props, options: linkageOptions }]} />
        </RemoveActionContext.Provider>
      );
    });
  },
  { displayName: 'LinkageRuleActions' },
);
