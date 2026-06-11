/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useField } from '@formily/react';
import { SlateVariableEditor, type MetaTreeNode, useFlowEngine, useFlowContext } from '@nocobase/flow-engine';

type FieldOption = {
  name: string;
  interface: string;
  uiSchema?: any;
};

const toMetaTreeNode = (
  field: FieldOption,
  parentTitles: string[],
  children?: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>),
): MetaTreeNode => {
  const title = String(field?.uiSchema?.title ?? field?.name ?? '');
  return {
    name: String(field?.name ?? ''),
    title,
    type: 'field',
    interface: field?.interface,
    uiSchema: field?.uiSchema,
    paths: [String(field?.name ?? '')],
    parentTitles,
    children,
  };
};

const normalizePathOptionsToMetaTree = (
  options: any,
  parentTitles: string[] = [],
  parentPaths: string[] = [],
): MetaTreeNode[] => {
  if (!Array.isArray(options)) return [];
  return options
    .map((opt) => {
      if (!opt) return null;
      const name = opt.value ?? opt.name ?? opt.key;
      if (name == null) return null;
      const title = String(opt.label ?? opt.title ?? name);
      const currentPaths = parentPaths.concat(String(name));
      const node: MetaTreeNode = {
        name: String(name),
        title,
        type: opt.type || 'field',
        interface: opt.interface,
        options: opt.options,
        uiSchema: opt.uiSchema,
        paths: currentPaths,
        parentTitles,
      };
      if (Array.isArray(opt.children)) {
        node.children = normalizePathOptionsToMetaTree(opt.children, parentTitles.concat(title), currentPaths);
      } else if (typeof opt.children === 'function') {
        node.children = async () => {
          const resolved = await opt.children();
          return normalizePathOptionsToMetaTree(resolved, parentTitles.concat(title), currentPaths);
        };
      }
      return node;
    })
    .filter(Boolean) as MetaTreeNode[];
};

export const Expression = (props: any) => {
  const { value = '', onChange, useCurrentFields } = props;
  const field = useField();
  const flowEngine = useFlowEngine();
  const { t } = useFlowContext();

  const runtime = flowEngine.context?.fieldFormula;
  const expressionFields: string[] = runtime?.expressionFields || [];

  const currentFields: FieldOption[] = useMemo(() => {
    try {
      const getCurrentFields = useCurrentFields as unknown as undefined | (() => FieldOption[]);
      const list = (getCurrentFields?.() ?? []) as FieldOption[];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }, [useCurrentFields]);

  const metaTree = useMemo(() => {
    return async () => {
      const interfaces = flowEngine.context?.dataSourceManager?.collectionFieldInterfaceManager;
      const nodes: MetaTreeNode[] = [];

      for (const f of currentFields) {
        if (!f?.interface || !expressionFields.includes(f.interface)) {
          continue;
        }

        const interfaceInstance = interfaces?.getFieldInterface?.(f.interface);
        const getPathOptions = (interfaceInstance as any)?.usePathOptions as undefined | ((field: any) => any);
        const pathOptions = typeof getPathOptions === 'function' ? getPathOptions(f) : undefined;
        const children = normalizePathOptionsToMetaTree(
          pathOptions,
          [String(f?.uiSchema?.title ?? f?.name ?? '')],
          [String(f?.name ?? '')],
        );

        nodes.push(toMetaTreeNode(f, [], children.length ? children : undefined));
      }

      return nodes;
    };
  }, [currentFields, expressionFields, flowEngine.context?.dataSourceManager?.collectionFieldInterfaceManager]);

  const placeholder = String(props?.placeholder ?? t('Input text, use {{ to insert variables'));

  return (
    <SlateVariableEditor
      value={value}
      onChange={(next) => {
        onChange?.(next);
        if (field && typeof (field as any).setValue === 'function') {
          (field as any).setValue(next);
        }
      }}
      metaTree={metaTree}
      placeholder={placeholder}
      multiline
    />
  );
};

export default Expression;
