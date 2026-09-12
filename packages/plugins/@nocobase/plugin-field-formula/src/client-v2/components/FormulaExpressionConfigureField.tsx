/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FieldConfigurePropertyComponentProps } from '@nocobase/client-v2';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import {
  type MetaTreeNode,
  useFlowContext,
  VariableHybridInput,
  type VariableHybridInputConverters,
} from '@nocobase/flow-engine';
import { Registry } from '@nocobase/utils/client';
import { Form } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useT } from '../locale';

const formulaExpressionFieldInterfaces = [
  'checkbox',
  'number',
  'percent',
  'integer',
  'input',
  'textarea',
  'email',
  'phone',
  'date',
  'datetime',
  'datetimeNoTz',
  'unixTimestamp',
  'createdAt',
  'updatedAt',
  'radioGroup',
  'checkboxGroup',
  'select',
  'multipleSelect',
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
  currentFieldName?: string;
}) {
  const ctx = useFlowContext();
  const interfaces = ctx.dataSourceManager.collectionFieldInterfaceManager;
  const expressionFields =
    ctx.fieldFormula?.expressionFields ||
    ctx.flowEngine?.context?.fieldFormula?.expressionFields ||
    formulaExpressionFieldInterfaces;
  const converters = useMemo<VariableHybridInputConverters>(
    () => ({
      formatPathToValue: (meta) => (meta?.paths?.length ? `{{${meta.paths.join('.')}}}` : undefined),
      parseValueToPath: (value) => {
        const match = value?.trim().match(/^\{\{\s*(.+?)\s*\}\}$/);
        return match?.[1] ? match[1].split('.') : undefined;
      },
    }),
    [],
  );
  const foreignKeyNames = useMemo(() => {
    return new Set(
      (props.collection?.fields || [])
        .map((field: Record<string, any>) => field?.foreignKey)
        .filter((foreignKey: unknown): foreignKey is string => typeof foreignKey === 'string' && !!foreignKey),
    );
  }, [props.collection?.fields]);

  const metaTree = useCallback(async () => {
    const currentFields = props.collection?.fields || [];
    return currentFields
      .filter((field: Record<string, any>) => {
        if (!field?.name || field.name === props.currentFieldName || foreignKeyNames.has(field.name)) {
          return false;
        }
        return field?.interface && expressionFields.includes(field.interface);
      })
      .map((field: Record<string, any>) => {
        const interfaceInstance = interfaces?.getFieldInterface?.(field.interface);
        const getPathOptions = interfaceInstance?.usePathOptions as undefined | ((field: Record<string, any>) => any);
        const pathOptions = typeof getPathOptions === 'function' ? getPathOptions(field) : undefined;
        const title = String(field?.uiSchema?.title ?? field?.title ?? field?.name ?? '');
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
  }, [expressionFields, foreignKeyNames, interfaces, props.collection?.fields, props.currentFieldName]);

  return (
    <VariableHybridInput
      value={props.value || ''}
      onChange={(value) => props.onChange?.(value)}
      metaTree={metaTree}
      converters={converters}
      placeholder={ctx.t('Input text, use {{ to insert variables')}
    />
  );
}

function FormulaExpressionSyntaxReference(props: { engine?: string }) {
  const t = useT();
  const engine = props.engine ? (evaluators as Registry<Evaluator>).get(props.engine) : undefined;

  if (!engine?.link) {
    return null;
  }

  return (
    <span>
      {t('Syntax references')}:&nbsp;
      <a href={t(engine.link)} target="_blank" rel="noreferrer">
        {engine.label}
      </a>
    </span>
  );
}

export function FormulaExpressionConfigureField(props: FieldConfigurePropertyComponentProps) {
  const engine = Form.useWatch('engine', props.form);
  const currentFieldName = Form.useWatch('name', props.form);
  const extra = useMemo(() => <FormulaExpressionSyntaxReference engine={engine || 'formula.js'} />, [engine]);

  return (
    <Form.Item
      name={props.namePath}
      label={props.title}
      extra={extra}
      rules={props.schema?.required ? [{ required: true }] : undefined}
    >
      <FormulaExpressionEditor collection={props.collection} currentFieldName={currentFieldName} />
    </Form.Item>
  );
}
