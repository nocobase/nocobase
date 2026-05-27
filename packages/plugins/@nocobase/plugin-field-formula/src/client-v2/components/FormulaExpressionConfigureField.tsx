/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FieldConfigurePropertyComponentProps } from '@nocobase/client-v2';
import { SlateVariableEditor, type MetaTreeNode, useFlowContext } from '@nocobase/flow-engine';
import { Form } from 'antd';
import React, { useCallback } from 'react';

const formulaExpressionFieldInterfaces = [
  'bigInt',
  'boolean',
  'chinaRegion',
  'createdAt',
  'createdBy',
  'date',
  'datetime',
  'decimal',
  'double',
  'email',
  'float',
  'id',
  'integer',
  'json',
  'number',
  'percent',
  'phone',
  'radioGroup',
  'select',
  'string',
  'text',
  'time',
  'updatedAt',
  'updatedBy',
  'url',
];

function normalizePathOptionsToMetaTree(
  options: Array<Record<string, any>> | undefined,
  parentTitles: string[] = [],
  parentPaths: string[] = [],
): MetaTreeNode[] {
  if (!Array.isArray(options)) {
    return [];
  }
  return options
    .map((option) => {
      const name = option?.value ?? option?.name ?? option?.key;
      if (name == null) {
        return null;
      }
      const title = String(option.label ?? option.title ?? name);
      const paths = parentPaths.concat(String(name));
      const node: MetaTreeNode = {
        name: String(name),
        title,
        type: option.type || 'field',
        interface: option.interface,
        options: option.options,
        uiSchema: option.uiSchema,
        paths,
        parentTitles,
      };
      if (Array.isArray(option.children)) {
        node.children = normalizePathOptionsToMetaTree(option.children, parentTitles.concat(title), paths);
      }
      return node;
    })
    .filter(Boolean) as MetaTreeNode[];
}

function FormulaExpressionEditor(props: {
  value?: string;
  onChange?: (value: string) => void;
  collection?: Record<string, any>;
}) {
  const ctx = useFlowContext();
  const interfaces = ctx.dataSourceManager.collectionFieldInterfaceManager;
  const expressionFields = ctx.flowEngine?.context?.fieldFormula?.expressionFields || formulaExpressionFieldInterfaces;

  const metaTree = useCallback(async () => {
    const currentFields = props.collection?.fields || [];
    return currentFields
      .filter((field: Record<string, any>) => field?.interface && expressionFields.includes(field.interface))
      .map((field: Record<string, any>) => {
        const interfaceInstance = interfaces?.getFieldInterface?.(field.interface);
        const getPathOptions = interfaceInstance?.usePathOptions as undefined | ((field: Record<string, any>) => any);
        const pathOptions = typeof getPathOptions === 'function' ? getPathOptions(field) : undefined;
        const title = String(field?.uiSchema?.title ?? field?.name ?? '');
        const children = normalizePathOptionsToMetaTree(pathOptions, [title], [String(field?.name ?? '')]);
        return {
          name: String(field?.name ?? ''),
          title,
          type: 'field',
          interface: field?.interface,
          uiSchema: field?.uiSchema,
          paths: [String(field?.name ?? '')],
          parentTitles: [],
          children: children.length ? children : undefined,
        } as MetaTreeNode;
      });
  }, [expressionFields, interfaces, props.collection?.fields]);

  return (
    <SlateVariableEditor
      value={props.value || ''}
      onChange={(value) => props.onChange?.(value)}
      metaTree={metaTree}
      placeholder={ctx.t('Input text, use {{ to insert variables')}
      multiline
    />
  );
}

export function FormulaExpressionConfigureField(props: FieldConfigurePropertyComponentProps) {
  return (
    <Form.Item
      name={props.namePath}
      label={props.title}
      tooltip={props.tooltip}
      rules={props.schema?.required ? [{ required: true }] : undefined}
    >
      <FormulaExpressionEditor collection={props.collection} />
    </Form.Item>
  );
}
