/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useEffect, useState } from 'react';
import { useFieldSchema, useForm } from '@formily/react';
import { last, isEqual } from 'lodash';
import { uid } from '@formily/shared';
import { reaction } from '@formily/reactive';
import { useLocalVariables, useVariables } from '../../variables';
import { useReactiveLinkageEffect } from './utils';
import { useDesignable } from '../../';
import { forEachLinkageRule } from '../../schema-settings/LinkageRules/forEachLinkageRule';
import {
  getVariableValuesInCondition,
  getVariableValuesInExpression,
} from '../../schema-settings/LinkageRules/bindLinkageRulesToFiled';

const getLinkageRules = (fieldSchema) => {
  if (!fieldSchema) {
    return [];
  }
  let linkageRules = fieldSchema?.['x-block-linkage-rules'] || [];
  fieldSchema.mapProperties((schema) => {
    if (schema['x-block-linkage-rules']) {
      linkageRules = schema['x-block-linkage-rules'];
    }
  });
  return linkageRules?.filter((k) => !k.disabled);
};

export const BlockLinkageRuleProvider = (props) => {
  const schema = useFieldSchema();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const { designable } = useDesignable();
  const form = useForm();
  const linkageRules = useMemo(() => getLinkageRules(schema), [schema]);
  const [triggerLinkageUpdate, setTriggerLinkageUpdate] = useState(null);
  const displayResult = useReactiveLinkageEffect(linkageRules, variables, localVariables, triggerLinkageUpdate);
  const shouldCalculateFormLinkage = schema?.['x-decorator'] === 'FormItem' && !form.readPretty && linkageRules.length;

  useEffect(() => {
    if (shouldCalculateFormLinkage) {
      const id = uid();
      // 延迟执行，防止一开始获取到的 form.values 值是旧的
      setTimeout(() => {
        form.addEffects(id, () => {
          forEachLinkageRule(linkageRules, (action, rule) => {
            return reaction(
              () => {
                // 获取条件中的变量值
                const variableValuesInCondition = getVariableValuesInCondition({ linkageRules, localVariables });
                // 获取 value 表达式中的变量值
                const variableValuesInExpression = getVariableValuesInExpression({ action, localVariables });
                const result = [variableValuesInCondition, variableValuesInExpression]
                  .map((item) => JSON.stringify(item))
                  .join(',');
                return result;
              },
              () => {
                setTriggerLinkageUpdate(uid());
              },
              { fireImmediately: true, equals: isEqual },
            );
          });
        });
      });

      // 清理副作用
      return () => {
        form.removeEffects(id);
      };
    }
  }, [linkageRules, shouldCalculateFormLinkage]);
  if (!linkageRules.length) {
    return props.children;
  }

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
