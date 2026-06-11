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
import type { MetaTreeNode } from '@nocobase/flow-engine';
import type { FilterGroupType } from '@nocobase/utils/client';
import { Button, Cascader, Collapse, Empty, Select, Space, Switch, Tooltip } from 'antd';
import type { CascaderProps, CollapseProps } from 'antd';
import React from 'react';
import { isToManyAssociationField } from '../internal/utils/modelUtils';
import { ConditionBuilder } from './ConditionBuilder';
import type { FieldAssignCascaderOption } from './fieldAssignOptions';

type CollectionFieldLike = {
  name?: unknown;
  title?: unknown;
  type?: unknown;
  interface?: unknown;
  targetCollection?: any;
  isAssociationField?: () => boolean;
};

export type FieldStateValue =
  | 'visible'
  | 'hidden'
  | 'hiddenReservedValue'
  | 'required'
  | 'notRequired'
  | 'disabled'
  | 'enabled'
  | 'limitOptions';

export type FieldStateOption = {
  label: string;
  value: FieldStateValue;
};

export interface FieldStateRuleItem {
  key: string;
  enable?: boolean;
  targetPath?: string;
  state?: FieldStateValue;
  selectedOptions?: any[];
  condition?: FilterGroupType;
  /** Legacy uid from the old multi-select format. Runtime only. */
  fieldUid?: string;
}

export interface FieldStateRulesEditorProps {
  t: (key: string) => string;
  fieldOptions: FieldAssignCascaderOption[] | any[];
  rootCollection?: any;
  value?: FieldStateRuleItem[];
  onChange?: (value: FieldStateRuleItem[]) => void;
  stateOptions: FieldStateOption[];
  getOptionsForTargetPath?: (targetPath?: string) => any[];
  showCondition?: boolean;
  showEnable?: boolean;
}

function parseTargetPathToSegments(targetPath?: string): string[] {
  const raw = String(targetPath || '');
  if (!raw) return [];
  return raw
    .split('.')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isVisibilityFieldState(state?: FieldStateValue): boolean {
  return state === 'visible' || state === 'hidden' || state === 'hiddenReservedValue';
}

export function isTopLevelFieldStateTargetPath(targetPath?: string): boolean {
  return parseTargetPathToSegments(targetPath).length <= 1;
}

export function isFieldStateTargetPathAllowed(state?: FieldStateValue, targetPath?: string): boolean {
  return !isVisibilityFieldState(state) || isTopLevelFieldStateTargetPath(targetPath);
}

function getTopLevelTargetPath(targetPath?: string): string | undefined {
  const [root] = parseTargetPathToSegments(targetPath);
  return root || undefined;
}

export function normalizeFieldStateRuleTargetForState(item: FieldStateRuleItem): FieldStateRuleItem {
  if (isFieldStateTargetPathAllowed(item?.state, item?.targetPath)) {
    return item;
  }

  return {
    ...item,
    targetPath: getTopLevelTargetPath(item?.targetPath),
    fieldUid: undefined,
  };
}

export function getFieldStateCascaderOptionsForState(
  options: FieldAssignCascaderOption[],
  state?: FieldStateValue,
): FieldAssignCascaderOption[] {
  if (!isVisibilityFieldState(state)) return options;
  return (Array.isArray(options) ? options : []).map((option) => ({
    ...option,
    children: undefined,
    loading: false,
    isLeaf: true,
  }));
}

function isExplicitIndexSegment(segment?: string): boolean {
  return typeof segment === 'string' && /^\d+$/.test(segment);
}

export function shouldUseFieldStateCurrentItemVariables(
  rootCollection: any,
  targetPath?: string,
  state?: FieldStateValue,
): boolean {
  if (!rootCollection?.getField || !targetPath || isVisibilityFieldState(state)) return false;

  const segs = parseTargetPathToSegments(targetPath);
  if (segs.length < 2) return false;

  let collection = rootCollection;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i];
    const field = collection?.getField?.(seg);
    if (!field?.isAssociationField?.()) break;

    const isToMany = isToManyAssociationField(field);
    if (isToMany) {
      const next = segs[i + 1];
      if (!isExplicitIndexSegment(next)) {
        return true;
      }
      i += 1;
    }

    collection = field?.targetCollection;
    if (!collection?.getField) break;
  }

  return false;
}

export const FieldStateRulesEditor: React.FC<FieldStateRulesEditorProps> = (props) => {
  const {
    t,
    fieldOptions,
    rootCollection,
    value: rawValue,
    onChange,
    stateOptions,
    getOptionsForTargetPath,
    showCondition = true,
    showEnable = true,
  } = props;

  const normalizedValueState = React.useMemo(() => {
    const raw = Array.isArray(rawValue) ? rawValue : [];
    let changed = false;
    const next = raw.map((item) => {
      const normalized = normalizeFieldStateRuleTargetForState(item);
      if (normalized !== item) changed = true;
      return normalized;
    });
    return { value: next, changed };
  }, [rawValue]);
  const value = normalizedValueState.value;
  const syncedNormalizedValueRef = React.useRef<FieldStateRuleItem[] | null>(null);
  const [cascaderOptions, setCascaderOptions] = React.useState<FieldAssignCascaderOption[]>(() =>
    Array.isArray(fieldOptions) ? (fieldOptions as FieldAssignCascaderOption[]) : [],
  );

  React.useEffect(() => {
    setCascaderOptions(Array.isArray(fieldOptions) ? (fieldOptions as FieldAssignCascaderOption[]) : []);
  }, [fieldOptions]);

  React.useEffect(() => {
    if (normalizedValueState.changed && syncedNormalizedValueRef.current !== normalizedValueState.value) {
      syncedNormalizedValueRef.current = normalizedValueState.value;
      onChange?.(normalizedValueState.value);
    }
  }, [normalizedValueState, onChange]);

  const getRuleKey = React.useCallback((item: FieldStateRuleItem, index: number) => item?.key || String(index), []);

  const buildCollectionMetaTreeNodes = React.useCallback(
    (collection: any, basePaths: string[], visited: Set<any>): MetaTreeNode[] => {
      if (!collection?.getFields) return [];
      if (visited.has(collection)) return [];
      const nextVisited = new Set(visited);
      nextVisited.add(collection);

      const fields = (typeof collection.getFields === 'function' ? collection.getFields() : []) || [];
      const nodes: MetaTreeNode[] = [];
      for (const rawField of fields) {
        if (!rawField) continue;
        const f = rawField as CollectionFieldLike;
        const fieldInterface = typeof f.interface === 'string' ? f.interface : undefined;
        if (!fieldInterface || fieldInterface === 'formula') continue;

        const name = String(f.name || '');
        if (!name) continue;

        const node: MetaTreeNode = {
          name,
          title: t(typeof f.title === 'string' ? f.title : name),
          type: String(f.type || 'string'),
          interface: fieldInterface,
          paths: [...basePaths, name],
        };

        const isAssoc = !!f.isAssociationField?.();
        const isToMany = isToManyAssociationField(f);
        if (isAssoc && !isToMany && f.targetCollection) {
          node.children = async () =>
            buildCollectionMetaTreeNodes(f.targetCollection, [...basePaths, name], nextVisited);
        }

        nodes.push(node);
      }

      return nodes;
    },
    [t],
  );

  const buildItemMetaTree = React.useCallback(
    (targetPath?: string): MetaTreeNode[] | undefined => {
      if (!rootCollection?.getField) return undefined;
      const segs = parseTargetPathToSegments(targetPath);
      if (!segs.length) return undefined;

      const levels: Array<{ collection: any; toMany: boolean; viaLabel?: string }> = [];
      let current = rootCollection;
      for (const seg of segs) {
        const field = current?.getField?.(seg);
        if (!field?.isAssociationField?.()) break;
        const targetCollection = field?.targetCollection;
        if (!targetCollection) break;
        const viaLabel = t(
          typeof (field as CollectionFieldLike).title === 'string'
            ? ((field as CollectionFieldLike).title as string)
            : seg,
        );
        levels.push({ collection: targetCollection, toMany: isToManyAssociationField(field), viaLabel });
        current = targetCollection;
      }

      if (!levels.length) return undefined;

      const buildObjectNode = (idx: number, basePaths: string[], nodeName: string, titleKey: string): MetaTreeNode => {
        const level = levels[idx] || levels[0];
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
          children: async () => buildCollectionMetaTreeNodes(level.collection, [...basePaths, 'value'], new Set()),
        });

        if (idx - 1 >= 0) {
          children.push(buildObjectNode(idx - 1, [...basePaths, 'parentItem'], 'parentItem', 'Parent item'));
        }

        const title = level?.viaLabel ? `${t(titleKey)} (${level.viaLabel})` : t(titleKey);

        return {
          title,
          name: nodeName,
          type: 'object',
          paths: basePaths,
          children,
        };
      };

      return [buildObjectNode(levels.length - 1, ['item'], 'item', 'Current item')];
    },
    [buildCollectionMetaTreeNodes, rootCollection, t],
  );

  const patchItem = (index: number, patch: Partial<FieldStateRuleItem>) => {
    const next = value.map((it, i) => (i === index ? normalizeFieldStateRuleTargetForState({ ...it, ...patch }) : it));
    onChange?.(next);
  };

  const getSelectableOptions = React.useCallback(
    (targetPath?: string) => {
      const options = getOptionsForTargetPath?.(targetPath);
      return Array.isArray(options) ? options : [];
    },
    [getOptionsForTargetPath],
  );

  const removeItem = (index: number) => {
    onChange?.(value.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const next = [...value];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    onChange?.(next);
  };

  const addItem = () => {
    onChange?.([
      ...value,
      {
        key: uid(),
        enable: true,
        targetPath: undefined,
        state: undefined,
        condition: { logic: '$and', items: [] },
      },
    ]);
  };

  const getFieldLabel = (targetPath?: string) => {
    const segs = parseTargetPathToSegments(targetPath);
    if (!segs.length) return undefined;
    if (!rootCollection?.getField) return segs.join(' / ');

    const labels: string[] = [];
    let collection = rootCollection;
    for (const seg of segs) {
      const field = collection?.getField?.(seg);
      if (!field) {
        labels.push(seg);
        continue;
      }
      labels.push(
        t(
          typeof (field as CollectionFieldLike).title === 'string'
            ? ((field as CollectionFieldLike).title as string)
            : seg,
        ),
      );
      if (field?.isAssociationField?.() && field?.targetCollection) {
        collection = field.targetCollection;
      }
    }
    return labels.filter(Boolean).join(' / ');
  };

  const resolveTargetCollectionBySegments = React.useCallback(
    (segments: string[]): any | null => {
      if (!rootCollection?.getField) return null;
      let collection = rootCollection;
      for (const seg of segments) {
        const field = collection?.getField?.(seg);
        if (!field?.isAssociationField?.() || !field?.targetCollection) return null;
        collection = field.targetCollection;
      }
      return collection || null;
    },
    [rootCollection],
  );

  const buildChildrenFromCollection = React.useCallback(
    (collection: any): FieldAssignCascaderOption[] => {
      const fields = typeof collection?.getFields === 'function' ? collection.getFields() || [] : [];
      const out: FieldAssignCascaderOption[] = [];
      for (const rawField of fields) {
        if (!rawField) continue;
        const f = rawField as CollectionFieldLike;
        const fieldInterface = typeof f.interface === 'string' ? f.interface : undefined;
        if (!fieldInterface || fieldInterface === 'formula') continue;

        const name = String(f.name || '');
        if (!name) continue;

        const isAssoc = !!f.isAssociationField?.();
        const hasTarget = !!f.targetCollection;
        out.push({
          label: t(typeof f.title === 'string' ? f.title : name),
          value: name,
          isLeaf: !(isAssoc && hasTarget),
        });
      }
      return out;
    },
    [t],
  );

  const loadCascaderData = React.useCallback<NonNullable<CascaderProps<FieldAssignCascaderOption>['loadData']>>(
    async (selectedOptions?: FieldAssignCascaderOption[]) => {
      const opts = selectedOptions || [];
      const target = opts[opts.length - 1];
      if (!target || target.children?.length || target.isLeaf) return;

      const segments = opts.map((o) => String(o?.value)).filter(Boolean);
      const targetCollection = resolveTargetCollectionBySegments(segments);
      if (!targetCollection) {
        target.isLeaf = true;
        setCascaderOptions((prev) => [...prev]);
        return;
      }

      const children = buildChildrenFromCollection(targetCollection);
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
        const seg = String(segments[i]);
        const hit = options.find((o) => String(o?.value) === seg);
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
    for (const it of value) {
      const targetPath = it?.targetPath ? String(it.targetPath) : '';
      if (!targetPath || seen.has(targetPath)) continue;
      seen.add(targetPath);
      out.push(targetPath);
    }
    return out;
  }, [value]);

  const topLevelCascaderOptions = React.useMemo(
    () => getFieldStateCascaderOptionsForState(cascaderOptions, 'hidden'),
    [cascaderOptions],
  );

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      for (const targetPath of selectedTargetPaths) {
        if (cancelled) return;
        await preloadCascaderPath(parseTargetPathToSegments(targetPath));
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [preloadCascaderPath, selectedTargetPaths]);

  const renderPanelHeader = (item: FieldStateRuleItem, index: number) => {
    const fieldLabel = getFieldLabel(item.targetPath);
    const stateLabel = stateOptions.find((option) => option.value === item.state)?.label;
    const title = fieldLabel ? String(fieldLabel) : t('Please select field');

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ flex: 1, marginRight: 16, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }} title={title}>
            {title}
          </div>
          <div style={{ opacity: 0.65, fontSize: 12, whiteSpace: 'nowrap' }}>
            {stateLabel || t('Please select state')}
          </div>
        </div>
        <Space onClick={(e) => e.stopPropagation()}>
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
          {showEnable && (
            <Switch
              size="small"
              checked={item.enable !== false}
              onChange={(checked) => patchItem(index, { enable: checked })}
              checkedChildren={t('Enable')}
              unCheckedChildren={t('Disable')}
            />
          )}
        </Space>
      </div>
    );
  };

  const collapseItems: CollapseProps['items'] = value.map((item, index) => {
    const isVisibilityState = isVisibilityFieldState(item.state);
    const extraMetaTree = shouldUseFieldStateCurrentItemVariables(rootCollection, item.targetPath, item.state)
      ? buildItemMetaTree(item.targetPath)
      : undefined;
    const fieldOptionsForState = isVisibilityState ? topLevelCascaderOptions : cascaderOptions;
    const selectableOptions = getSelectableOptions(item.targetPath);
    const canConfigureLimitOptions = selectableOptions.length > 0;
    const stateOptionsForItem = stateOptions.filter(
      (option) => option.value !== 'limitOptions' || canConfigureLimitOptions || item.state === 'limitOptions',
    );

    return {
      key: getRuleKey(item, index),
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
              value={parseTargetPathToSegments(item.targetPath)}
              placeholder={t('Please select field')}
              style={{ width: '100%' }}
              options={fieldOptionsForState}
              loadData={isVisibilityState ? undefined : loadCascaderData}
              changeOnSelect
              showSearch={{
                filter: (inputValue, path) => {
                  const kw = String(inputValue || '').toLowerCase();
                  if (!kw) return true;
                  return (path || []).some((o) =>
                    String(o?.label ?? '')
                      .toLowerCase()
                      .includes(kw),
                  );
                },
              }}
              allowClear
              onChange={(segments) => {
                const arr = Array.isArray(segments) ? segments.map((s) => String(s)).filter(Boolean) : [];
                const targetPath = arr.length ? arr.join('.') : undefined;
                const nextOptions = getSelectableOptions(targetPath);
                patchItem(index, {
                  targetPath,
                  fieldUid: undefined,
                  state: item.state === 'limitOptions' && !nextOptions.length ? undefined : item.state,
                  selectedOptions: item.state === 'limitOptions' ? [] : item.selectedOptions,
                });
              }}
            />
          </div>

          <div>
            <div style={{ marginBottom: 4, fontSize: 14 }}>{t('State')}</div>
            <Select
              value={item.state}
              onChange={(state) =>
                patchItem(index, {
                  state,
                  selectedOptions: state === 'limitOptions' ? item.selectedOptions || [] : undefined,
                })
              }
              placeholder={t('Please select state')}
              style={{ width: '100%' }}
              options={stateOptionsForItem}
              allowClear
            />
          </div>

          {item.state === 'limitOptions' && canConfigureLimitOptions && (
            <div>
              <div style={{ marginBottom: 4, fontSize: 14 }}>{t('Options')}</div>
              <Select
                mode="multiple"
                value={(item.selectedOptions || []).map((option: any) => option.value)}
                onChange={(selectedValues) => {
                  patchItem(index, {
                    selectedOptions: selectableOptions.filter((option: any) => selectedValues.includes(option.value)),
                  });
                }}
                placeholder={t('Please select options')}
                style={{ width: '100%' }}
                options={selectableOptions}
                showSearch
                // @ts-ignore
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(String(input || '').toLowerCase())
                }
                allowClear
              />
            </div>
          )}

          {showCondition && (
            <div>
              <div style={{ marginBottom: 4, fontSize: 14 }}>{t('Condition')}</div>
              <ConditionBuilder
                value={item.condition || { logic: '$and', items: [] }}
                onChange={(condition) => patchItem(index, { condition })}
                extraMetaTree={extraMetaTree}
              />
            </div>
          )}
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
    const key = getRuleKey(value[indexToOpen], indexToOpen);
    return key ? [key] : [];
  }, [getRuleKey, value]);

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
