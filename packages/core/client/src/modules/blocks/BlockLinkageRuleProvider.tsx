/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useFieldSchema } from '@formily/react';
import { last } from 'lodash';
import { useLocalVariables, useVariables } from '../../variables';
import { useLinkageDisplayResult } from './utils';
import { useDesignable } from '../../';

const getLinkageRules = (fieldSchema) => {
  let linkageRules = fieldSchema['x-block-linkage-rules'] || [];
  fieldSchema.mapProperties((schema) => {
    if (schema['x-block-linkage-rules']) {
      linkageRules = schema['x-block-linkage-rules'];
    }
  });
  return linkageRules?.filter((k) => !k.disabled);
};

export const BlockLinkageRuleProvider = (props) => {
  const schema = useFieldSchema();
  const linkageRules = getLinkageRules(schema);
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const { designable } = useDesignable();
  const displayResult = useLinkageDisplayResult(linkageRules, variables, localVariables);
  // 还在加载中，避免闪烁
  if (displayResult === null) return null;

  if (last(displayResult) === 'hidden') {
    if (designable) {
      return <div style={{ opacity: 0.3 }}>{props.children}</div>;
    } else {
      return null;
    }
  }

  return props.children;
};
