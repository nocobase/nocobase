/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form } from '@formily/core';
// @ts-ignore
import { Schema } from '@formily/json-schema';
import _ from 'lodash';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions_deprecated } from '../../collection-manager';
import { Variable, useVariableScope } from '../../schema-component';
import { useValues } from '../../schema-component/antd/filter/useValues';
import { VariableOption, VariablesContextType } from '../../variables/types';
import { isVariable } from '../../variables/utils/isVariable';
import { useBlockCollection } from './hooks/useBlockCollection';
import { useContextAssociationFields } from './hooks/useContextAssociationFields';
import { useCurrentRecordVariable } from './hooks/useRecordVariable';
import { useCurrentUserVariable } from './hooks/useUserVariable';
import { useVariableOptions } from './hooks/useVariableOptions';
import { Option } from './type';

interface GetShouldChangeProps {
  collectionField: CollectionFieldOptions_deprecated;
  variables: VariablesContextType;
  localVariables: VariableOption | VariableOption[];
  /** `useCollectionManager_deprecated` 返回的 */
  getAllCollectionsInheritChain: (collectionName: string) => string[];
}

interface RenderSchemaComponentProps {
  value: any;
  onChange: (value: any) => void;
}

type Props = {
  value: any;
  onChange: (value: any, optionPath?: any[]) => void;
  renderSchemaComponent: (props: RenderSchemaComponentProps) => any;
  schema?: any;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
  children?: any;
  className?: string;
  style?: React.CSSProperties;
  collectionField: CollectionFieldOptions_deprecated;
  contextCollectionName?: string;
  /**
   * 根据 `onChange` 的第一个参数，判断是否需要触发 `onChange`
   * @param value `onChange` 的第一个参数
   * @returns 返回为 `true` 时，才会触发 `onChange`
   */
  shouldChange?: (value: any, optionPath?: any[]) => Promise<boolean>;
  form?: Form;
  /**
   * 当前表单的记录，数据来自数据库
   */
  record?: Record<string, any>;
  /**
   * 可以用该方法对内部的 scope 进行筛选和修改
   * @param scope
   * @returns
   */
  returnScope?: (scope: Option[]) => any[];
  /**
   * 不需要禁用选项，一般会在表达式中使用
   */
  noDisabled?: boolean;
  hideVariableButton?: boolean;
  setScopes?: any; //更新scopes
  nullable?: boolean;
  constantAbel?: boolean;
  changeOnSelect?: boolean;
};

/**
 * 注意：该组件存在以下问题：
 * - 在选中选项的时候该组件不能触发重渲染
 * - 如果触发重渲染可能会导致无法展开子选项列表
 * @param props
 * @returns
 */
export const VariableInput = (props: Props) => {
  const {
    value,
    onChange,
    renderSchemaComponent: RenderSchemaComponent,
    style,
    schema,
    className,
    contextCollectionName,
    collectionField,
    shouldChange,
    form,
    record,
    returnScope = _.identity,
    targetFieldSchema,
    noDisabled,
    hideVariableButton,
    setScopes,
    nullable = true,
    constantAbel = true,
    changeOnSelect = true,
  } = props;
  const { name: blockCollectionName } = useBlockCollection();
  const scope = useVariableScope();
  const { operator, schema: uiSchema = collectionField?.uiSchema } = useValues();

  const variableOptions = useVariableOptions({
    collectionField,
    form,
    record,
    operator,
    uiSchema,
    targetFieldSchema,
    noDisabled,
  });
  const contextVariable = useContextAssociationFields({ schema, maxDepth: 2, contextCollectionName, collectionField });
  const { compatOldVariables } = useCompatOldVariables({
    collectionField,
    uiSchema,
    targetFieldSchema,
    blockCollectionName,
  });

  if (contextCollectionName && variableOptions.every((item) => item.value !== contextVariable.value)) {
    variableOptions.push(contextVariable);
  }

  const handleChange = useCallback(
    (value: any, optionPath: any[]) => {
      if (!shouldChange) {
        return onChange(value, optionPath);
      }

      // `shouldChange` 这个函数的运算量比较大，会导致展开变量列表时有明显的卡顿感，在这里加个延迟能有效解决这个问题
      setTimeout(async () => {
        if (await shouldChange(value, optionPath)) {
          onChange(value, optionPath);
        }
      });
    },
    [onChange, shouldChange],
  );
  const scopes = returnScope(
    compatOldVariables(_.isEmpty(scope) ? variableOptions : scope, {
      value,
    }),
  );
  useEffect(() => {
    setScopes?.(scopes);
  }, [value, scope]);
  return (
    <Variable.Input
      className={className}
      value={value}
      onChange={handleChange}
      scope={scopes}
      style={style}
      changeOnSelect={changeOnSelect}
      hideVariableButton={hideVariableButton}
      nullable={nullable}
      constantAbel={constantAbel}
    >
      <RenderSchemaComponent value={value} onChange={onChange} />
    </Variable.Input>
  );
};

/**
 * 通过限制用户的选择，来防止用户选择错误的变量
 */
export const getShouldChange = ({
  collectionField,
  variables,
  localVariables,
  getAllCollectionsInheritChain,
}: GetShouldChangeProps) => {
  const collectionsInheritChain = collectionField ? getAllCollectionsInheritChain(collectionField.target) : [];

  return async (value: any, optionPath: any[]) => {
    // 导致了一些 BUG，暂时先弃用
    return true;

    if (_.isString(value) && value.includes('$nRole')) {
      return true;
    }

    if (!isVariable(value) || !variables || !collectionField) {
      return true;
    }

    // `json` 可以选择任意类型的变量，详见：https://nocobase.feishu.cn/docx/EmNEdEBOnoQohUx2UmBcqIQ5nyh#FPLfdSRDEoXR65xW0mBcdfL5n0c
    if (collectionField.interface === 'json') {
      return true;
    }

    const lastOption = optionPath[optionPath.length - 1];

    // 点击叶子节点时，必须更新 value
    if (lastOption && _.isEmpty(lastOption.children) && !lastOption.loadChildren) {
      return true;
    }

    const collectionFieldOfVariable = await variables.getCollectionField(value, localVariables);

    if (!collectionField) {
      return false;
    }

    // `一对一` 和 `一对多` 的不能用于设置默认值，因为其具有唯一性
    if (['o2o', 'o2m', 'oho'].includes(collectionFieldOfVariable?.interface)) {
      return false;
    }
    // if (!collectionField.target && collectionFieldOfVariable?.target) {
    //   return false;
    // }
    // if (collectionField.target && !collectionFieldOfVariable?.target) {
    //   return false;
    // }
    if (
      collectionField.target &&
      collectionFieldOfVariable?.target &&
      !collectionsInheritChain.includes(collectionFieldOfVariable?.target)
    ) {
      return false;
    }

    return true;
  };
};

export interface FormatVariableScopeParam {
  children: any[];
  disabled: boolean;
  name: string;
  title: string;
}

export interface FormatVariableScopeReturn {
  value: string;
  key: string;
  label: string;
  disabled: boolean;
  children?: any[];
}

/**
 * 兼容老版本的变量
 * @param variables
 */
export function useCompatOldVariables(props: {
  uiSchema: any;
  collectionField: CollectionFieldOptions_deprecated;
  blockCollectionName: string;
  noDisabled?: boolean;
  targetFieldSchema?: Schema;
}) {
  const { uiSchema, collectionField, noDisabled, targetFieldSchema, blockCollectionName } = props;
  const { t } = useTranslation();
  const { currentUserSettings } = useCurrentUserVariable({
    maxDepth: 1,
    uiSchema: uiSchema,
    collectionField,
    noDisabled,
    targetFieldSchema,
  });
  const { currentRecordSettings } = useCurrentRecordVariable({
    schema: uiSchema,
    collectionField,
    noDisabled,
    targetFieldSchema,
  });

  const compatOldVariables = useCallback(
    (variables: Option[], { value }) => {
      if (!isVariable(value)) {
        return variables;
      }

      variables = [...variables];

      const systemVariable: Option = {
        value: '$system',
        key: '$system',
        label: t('System variables'),
        isLeaf: false,
        children: [
          {
            value: 'now',
            key: 'now',
            label: t('Current time'),
            isLeaf: true,
            depth: 1,
          },
        ],
        depth: 0,
      };
      const currentTime = {
        value: 'currentTime',
        label: t('Current time'),
        children: null,
      };

      if (value.includes('$system')) {
        variables.push(systemVariable);
      }

      if (value.includes(`${blockCollectionName}.`)) {
        const variable = variables.find((item) => item.value === '$nForm' || item.value === '$nRecord');
        if (variable) {
          variable.value = blockCollectionName;
        }
      }

      if (value.includes('$form')) {
        const variable = variables.find((item) => item.value === '$nForm');
        if (variable) {
          variable.value = '$form';
        }
      }

      if (value.includes('currentUser')) {
        const userVariable = variables.find((item) => item.value === '$user');
        if (userVariable) {
          userVariable.value = 'currentUser';
        } else {
          variables.unshift({ ...currentUserSettings, value: 'currentUser' });
        }
      }

      if (value.includes('currentRecord')) {
        const formVariable = variables.find((item) => item.value === '$nRecord');
        if (formVariable) {
          formVariable.value = 'currentRecord';
        } else {
          variables.unshift({ ...currentRecordSettings, value: 'currentRecord' });
        }
      }

      if (value.includes('currentTime')) {
        variables.push(currentTime);
      }

      if (value.includes('$date')) {
        const formVariable = variables.find((item) => item.value === '$nDate');
        if (formVariable) {
          formVariable.value = '$date';
        }
      }

      return variables;
    },
    [blockCollectionName],
  );

  return { compatOldVariables };
}
