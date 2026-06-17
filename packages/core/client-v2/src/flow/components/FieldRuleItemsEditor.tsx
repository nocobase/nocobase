/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { type MetaTreeNode } from '@nocobase/flow-engine';
import type { FilterGroupType } from '@nocobase/utils/client';
import { Button, Cascader, Collapse, Empty, Space, Switch, Tooltip } from 'antd';
import type { CascaderProps, CollapseProps } from 'antd';
import React from 'react';
import { isToManyAssociationField } from '../internal/utils/modelUtils';
import { ConditionBuilder } from './ConditionBuilder';
import { buildFieldAssignCascaderOptionsFromCollection, type FieldAssignCascaderOption } from './fieldAssignOptions';

export interface FieldRuleItemBase {
  key: string;
  enable?: boolean;
  targetPath?: string;
  condition?: FilterGroupType;
}

type CollectionFieldLike = {
  name?: unknown;
  title?: unknown;
  type?: unknown;
  interface?: unknown;
  uiSchema?: unknown;
  target?: unknown;
  targetCollection?: CollectionLike;
  isAssociationField?: () => boolean;
};

type CollectionLike = {
  getField?: (name: string) => unknown;
  getFields?: () => unknown[];
};

export type FieldRuleItemRenderContext<T extends FieldRuleItemBase> = {
  item: T;
  index: number;
  ruleKey: string;
  extraMetaTree?: MetaTreeNode[];
  patchItem: (index: number, patch: Partial<T>) => void;
};

type TargetPathChangeContext<T extends FieldRuleItemBase> = {
  item: T;
  index: number;
  ruleKey: string;
  targetPath?: string;
  previousTargetPath?: string;
  changed: boolean;
};

export interface FieldRuleItemsEditorProps<T extends FieldRuleItemBase> {
  t: (key: string) => string;
  fieldOptions: FieldAssignCascaderOption[];
  rootCollection?: CollectionLike;
  value?: T[];
  onChange?: (value: T[]) => void;
  createItem?: () => T;
  renderItemContent: (context: FieldRuleItemRenderContext<T>) => React.ReactNode;
  getHeaderExtra?: (item: T, index: number) => React.ReactNode;
  onTargetPathChange?: (context: TargetPathChangeContext<T>) => Partial<T>;
  showCondition?: boolean;
  showEnable?: boolean;
  maxAssociationFieldDepth?: number;
}

export function parseFieldRuleTargetPath(targetPath?: string): string[] {
  const raw = String(targetPath || '');
  if (!raw) return [];
  return raw
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function isAssociationFieldLike(field?: CollectionFieldLike | null) {
  return !!(field?.isAssociationField?.() || field?.target || field?.targetCollection);
}

function getCascaderPathLabel(options: FieldAssignCascaderOption[], segments: string[]) {
  if (!segments.length) return undefined;

  const labels: string[] = [];
  let currentOptions = options;
  for (const segment of segments) {
    const hit = currentOptions.find((option) => String(option.value) === segment);
    if (!hit) return undefined;
    labels.push(String(hit.label || segment));
    currentOptions = hit.children || [];
  }

  return labels.length ? labels.join(' / ') : undefined;
}

function getCollectionPathLabel(
  collection: CollectionLike | undefined,
  segments: string[],
  t: (key: string) => string,
) {
  if (!collection?.getField || !segments.length) return undefined;

  const labels: string[] = [];
  let currentCollection: CollectionLike | undefined = collection;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const field = currentCollection?.getField?.(segment) as CollectionFieldLike | null;
    if (!field) return undefined;

    labels.push(t(typeof field.title === 'string' ? field.title : segment));

    if (i < segments.length - 1) {
      if (!isAssociationFieldLike(field) || !field.targetCollection) {
        return undefined;
      }
      currentCollection = field.targetCollection;
    }
  }

  return labels.filter(Boolean).join(' / ');
}

function getFieldLabel(
  rootCollection: CollectionLike | undefined,
  cascaderOptions: FieldAssignCascaderOption[],
  targetPath: string | undefined,
  t: (key: string) => string,
) {
  const segments = parseFieldRuleTargetPath(targetPath);
  if (!segments.length) return undefined;

  return (
    getCollectionPathLabel(rootCollection, segments, t) ||
    getCascaderPathLabel(cascaderOptions, segments) ||
    segments.join(' / ')
  );
}

function buildCollectionMetaTreeNodes(
  collection: CollectionLike | undefined,
  basePaths: string[],
  visited: Set<CollectionLike>,
  t: (key: string) => string,
): MetaTreeNode[] {
  if (!collection?.getFields) return [];
  if (visited.has(collection)) return [];
  const nextVisited = new Set(visited);
  nextVisited.add(collection);

  const fields = collection.getFields() || [];
  const nodes: MetaTreeNode[] = [];
  for (const rawField of fields) {
    if (!rawField) continue;
    const field = rawField as CollectionFieldLike;
    const fieldInterface = typeof field.interface === 'string' ? field.interface : undefined;
    if (!fieldInterface) continue;
    if (fieldInterface === 'formula') continue;

    const name = String(field.name || '');
    if (!name) continue;

    const node: MetaTreeNode = {
      name,
      title: t(typeof field.title === 'string' ? field.title : name),
      type: String(field.type || 'string'),
      interface: fieldInterface,
      uiSchema: field.uiSchema,
      paths: [...basePaths, name],
    };

    const isAssociation = isAssociationFieldLike(field);
    const isToMany = isToManyAssociationField(field);
    if (isAssociation && !isToMany && field.targetCollection) {
      node.children = async () =>
        buildCollectionMetaTreeNodes(field.targetCollection, [...basePaths, name], nextVisited, t);
    }

    nodes.push(node);
  }

  return nodes;
}

function buildItemMetaTree(
  rootCollection: CollectionLike | undefined,
  targetPath: string | undefined,
  t: (key: string) => string,
): MetaTreeNode[] | undefined {
  if (!rootCollection?.getField) return undefined;
  const segments = parseFieldRuleTargetPath(targetPath);
  if (!segments.length) return undefined;

  const levels: Array<{ collection: CollectionLike; toMany: boolean; viaLabel?: string }> = [];
  let currentCollection: CollectionLike | undefined = rootCollection;
  for (const segment of segments) {
    const field = currentCollection?.getField?.(segment) as CollectionFieldLike | null;
    if (!isAssociationFieldLike(field)) break;
    const nextCollection = field?.targetCollection;
    if (!nextCollection) break;

    levels.push({
      collection: nextCollection,
      toMany: isToManyAssociationField(field),
      viaLabel: t(typeof field.title === 'string' ? field.title : segment),
    });
    currentCollection = nextCollection;
  }

  if (!levels.length) return undefined;

  const buildObjectNode = (index: number, basePaths: string[], nodeName: string, titleKey: string): MetaTreeNode => {
    const level = levels[index] || levels[0];
    const children: MetaTreeNode[] = [];

    if (level.toMany) {
      children.push({
        title: t('Index (starts from 0)'),
        name: 'index',
        type: 'number',
        paths: [...basePaths, 'index'],
      });
      children.push({
        title: t('Total count'),
        name: 'length',
        type: 'number',
        paths: [...basePaths, 'length'],
      });
    }

    children.push({
      title: t('Attributes'),
      name: 'value',
      type: 'object',
      paths: [...basePaths, 'value'],
      children: async () => buildCollectionMetaTreeNodes(level.collection, [...basePaths, 'value'], new Set(), t),
    });

    if (index - 1 >= 0) {
      children.push(buildObjectNode(index - 1, [...basePaths, 'parentItem'], 'parentItem', 'Parent item'));
    }

    const title = level?.viaLabel ? `${t(titleKey)}（${level.viaLabel}）` : t(titleKey);
    return {
      title,
      name: nodeName,
      type: 'object',
      paths: basePaths,
      children,
    };
  };

  return [buildObjectNode(levels.length - 1, ['item'], 'item', 'Current item')];
}

export const FieldRuleItemsEditor = <T extends FieldRuleItemBase>(props: FieldRuleItemsEditorProps<T>) => {
  const {
    t,
    fieldOptions,
    rootCollection,
    value: rawValue,
    onChange,
    createItem,
    renderItemContent,
    getHeaderExtra,
    onTargetPathChange,
    showCondition = true,
    showEnable = true,
    maxAssociationFieldDepth = 2,
  } = props;
  const value = React.useMemo(() => (Array.isArray(rawValue) ? rawValue : []), [rawValue]);
  const [cascaderOptions, setCascaderOptions] = React.useState<FieldAssignCascaderOption[]>(() =>
    Array.isArray(fieldOptions) ? fieldOptions : [],
  );

  React.useEffect(() => {
    setCascaderOptions(Array.isArray(fieldOptions) ? fieldOptions : []);
  }, [fieldOptions]);

  const resolveTargetCollectionBySegments = React.useCallback(
    (segments: string[]): CollectionLike | null => {
      if (!rootCollection?.getField) return null;
      let collection: CollectionLike | undefined = rootCollection;
      for (const segment of segments) {
        const field = collection?.getField?.(segment) as CollectionFieldLike | null;
        if (!isAssociationFieldLike(field) || !field?.targetCollection) {
          return null;
        }
        collection = field.targetCollection;
      }
      return collection || null;
    },
    [rootCollection],
  );

  const buildChildrenFromCollection = React.useCallback(
    (collection: CollectionLike, associationDepth: number): FieldAssignCascaderOption[] => {
      return buildFieldAssignCascaderOptionsFromCollection(collection, t, {
        associationDepth,
        maxAssociationFieldDepth,
      });
    },
    [maxAssociationFieldDepth, t],
  );

  const loadCascaderData = React.useCallback<NonNullable<CascaderProps<FieldAssignCascaderOption>['loadData']>>(
    async (selectedOptions?: FieldAssignCascaderOption[]) => {
      const options = selectedOptions || [];
      const target = options[options.length - 1];
      if (!target) return;
      if (target.children?.length) return;
      if (target.isLeaf) return;

      const segments = options.map((option) => String(option?.value)).filter(Boolean);
      const targetCollection = resolveTargetCollectionBySegments(segments);
      if (!targetCollection) {
        target.isLeaf = true;
        setCascaderOptions((prev) => [...prev]);
        return;
      }

      const children = buildChildrenFromCollection(targetCollection, segments.length);
      if (children.length) {
        target.children = children;
      } else {
        target.isLeaf = true;
      }
      setCascaderOptions((prev) => [...prev]);
    },
    [buildChildrenFromCollection, resolveTargetCollectionBySegments],
  );

  const preloadCascaderPath = React.useCallback(
    async (segments: string[]) => {
      if (!segments.length) return;
      let options = cascaderOptions;
      const selected: FieldAssignCascaderOption[] = [];
      for (let i = 0; i < segments.length - 1; i++) {
        const segment = String(segments[i]);
        const hit = options.find((option) => String(option?.value) === segment);
        if (!hit) return;
        selected.push(hit);
        if (hit.children?.length) {
          options = hit.children;
          continue;
        }
        if (hit.isLeaf) return;
        await loadCascaderData(selected);
        options = hit.children || [];
      }
    },
    [cascaderOptions, loadCascaderData],
  );

  const selectedTargetPaths = React.useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of value) {
      const targetPath = item?.targetPath ? String(item.targetPath) : '';
      if (!targetPath || seen.has(targetPath)) continue;
      seen.add(targetPath);
      out.push(targetPath);
    }
    return out;
  }, [value]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      for (const targetPath of selectedTargetPaths) {
        if (cancelled) return;
        const segments = parseFieldRuleTargetPath(targetPath);
        if (!segments.length) continue;
        await preloadCascaderPath(segments);
      }
    };
    run().catch((error) => {
      console.warn('[FieldRuleItemsEditor] Failed to preload field cascader path', error);
    });
    return () => {
      cancelled = true;
    };
  }, [preloadCascaderPath, selectedTargetPaths]);

  const getRuleKey = React.useCallback((item: T, index: number) => item?.key || String(index), []);

  const patchItem = React.useCallback(
    (index: number, patch: Partial<T>) => {
      onChange?.(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    },
    [onChange, value],
  );

  const removeItem = React.useCallback(
    (index: number) => {
      onChange?.(value.filter((_, i) => i !== index));
    },
    [onChange, value],
  );

  const moveItem = React.useCallback(
    (index: number, direction: 'up' | 'down') => {
      const next = [...value];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return;
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      onChange?.(next);
    },
    [onChange, value],
  );

  const addItem = React.useCallback(() => {
    onChange?.([
      ...value,
      createItem?.() ||
        ({
          key: uid(),
          enable: true,
          targetPath: undefined,
          condition: { logic: '$and', items: [] },
        } as T),
    ]);
  }, [createItem, onChange, value]);

  const renderPanelHeader = (item: T, index: number) => {
    const targetLabel = getFieldLabel(rootCollection, cascaderOptions, item.targetPath, t) || t('Please select field');
    const headerExtra = getHeaderExtra?.(item, index);

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div
          style={{
            flex: 1,
            marginRight: 16,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }} title={targetLabel}>
            {targetLabel}
          </div>
          {headerExtra ? <div style={{ opacity: 0.65, fontSize: 12, whiteSpace: 'nowrap' }}>{headerExtra}</div> : null}
        </div>
        <Space onClick={(event) => event.stopPropagation()}>
          <Tooltip title={t('Delete')}>
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => removeItem(index)}
              aria-label={t('Delete')}
            />
          </Tooltip>
          <Tooltip title={t('Move up')}>
            <Button
              type="text"
              size="small"
              icon={<ArrowUpOutlined />}
              onClick={() => moveItem(index, 'up')}
              disabled={index === 0}
              aria-label={t('Move up')}
            />
          </Tooltip>
          <Tooltip title={t('Move down')}>
            <Button
              type="text"
              size="small"
              icon={<ArrowDownOutlined />}
              onClick={() => moveItem(index, 'down')}
              disabled={index === value.length - 1}
              aria-label={t('Move down')}
            />
          </Tooltip>
          {showEnable ? (
            <Switch
              size="small"
              checked={item.enable !== false}
              onChange={(checked) => patchItem(index, { enable: checked } as Partial<T>)}
              checkedChildren={t('Enable')}
              unCheckedChildren={t('Disable')}
            />
          ) : null}
        </Space>
      </div>
    );
  };

  const collapseItems: CollapseProps['items'] = value.map((item, index) => {
    const ruleKey = getRuleKey(item, index);
    const extraMetaTree = buildItemMetaTree(rootCollection, item.targetPath, t);
    return {
      key: ruleKey,
      label: renderPanelHeader(item, index),
      styles: {
        header: {
          display: 'flex',
          alignItems: 'center',
        },
      },
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 4, fontSize: 14 }}>{t('Field')}</div>
            <Cascader
              value={parseFieldRuleTargetPath(item.targetPath)}
              placeholder={t('Please select field')}
              style={{ width: '100%' }}
              options={cascaderOptions}
              loadData={loadCascaderData}
              changeOnSelect
              showSearch={{
                filter: (inputValue, path) => {
                  const keyword = String(inputValue || '').toLowerCase();
                  if (!keyword) return true;
                  return (path || []).some((option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(keyword),
                  );
                },
              }}
              allowClear
              onChange={(segments) => {
                const arr = Array.isArray(segments) ? segments.map((segment) => String(segment)).filter(Boolean) : [];
                const targetPath = arr.length ? arr.join('.') : undefined;
                const changed = targetPath !== item.targetPath;
                patchItem(index, {
                  targetPath,
                  ...(onTargetPathChange?.({
                    item,
                    index,
                    ruleKey,
                    targetPath,
                    previousTargetPath: item.targetPath,
                    changed,
                  }) || {}),
                } as Partial<T>);
              }}
            />
          </div>

          {renderItemContent({ item, index, ruleKey, extraMetaTree, patchItem })}

          {showCondition ? (
            <div>
              <div style={{ marginBottom: 4, fontSize: 14 }}>{t('Condition')}</div>
              <ConditionBuilder
                value={item.condition || { logic: '$and', items: [] }}
                onChange={(condition) => patchItem(index, { condition } as Partial<T>)}
                extraMetaTree={extraMetaTree}
                maxAssociationFieldDepth={maxAssociationFieldDepth}
              />
            </div>
          ) : null}
        </div>
      ),
    };
  });

  const defaultActiveKey = React.useMemo(() => {
    if (!value.length) return [];
    let enabledIndex = -1;
    for (let i = value.length - 1; i >= 0; i--) {
      if (value[i]?.enable !== false) {
        enabledIndex = i;
        break;
      }
    }
    const indexToOpen = enabledIndex >= 0 ? enabledIndex : 0;
    const item = value[indexToOpen];
    const key = item?.key || String(indexToOpen);
    return key ? [key] : [];
  }, [value]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {value.length ? (
        <Collapse
          items={collapseItems}
          size="small"
          style={{ marginBottom: 8 }}
          defaultActiveKey={defaultActiveKey}
          accordion
        />
      ) : (
        <div
          style={{
            border: '1px dashed #d9d9d9',
            borderRadius: 6,
            backgroundColor: '#fafafa',
            marginBottom: 8,
          }}
        >
          <Empty description={t('No data')} style={{ margin: '20px 0' }} />
        </div>
      )}

      <Button type="dashed" icon={<PlusOutlined />} onClick={addItem} style={{ width: '100%' }}>
        {t('Add')}
      </Button>
    </div>
  );
};
