/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { uid } from '@formily/shared';
import type { FilterGroupType } from '@nocobase/utils/client';
import { Button, Cascader, Collapse, Empty, Radio, Space, Switch, Tooltip } from 'antd';
import type { CascaderProps, CollapseProps } from 'antd';
import React from 'react';
import { ConditionBuilder } from './ConditionBuilder';
import { FieldAssignValueInput } from './FieldAssignValueInput';
import type { FieldAssignCascaderOption } from './fieldAssignOptions';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { isToManyAssociationField } from '../internal/utils/modelUtils';

export type AssignMode = 'default' | 'assign';

type CollectionFieldLike = {
  name?: unknown;
  title?: unknown;
  type?: unknown;
  interface?: unknown;
  targetCollection?: any;
  isAssociationField?: () => boolean;
};

export interface FieldAssignRuleItem {
  key: string;
  enable?: boolean;
  /** 赋值目标路径，例如 `title` / `users.nickname` / `user.name` */
  targetPath?: string;
  mode?: AssignMode;
  condition?: FilterGroupType;
  value?: any;
}

export interface FieldAssignRulesEditorProps {
  t: (key: string) => string;
  fieldOptions: FieldAssignCascaderOption[] | any[];
  /** 根集合（用于构建“上级对象/属性”变量树） */
  rootCollection?: any;
  value?: FieldAssignRuleItem[];
  onChange?: (value: FieldAssignRuleItem[]) => void;

  /** 默认 mode（新建条目时使用） */
  defaultMode?: AssignMode;
  /** 固定 mode：用于“仅默认值/仅赋值”的场景 */
  fixedMode?: AssignMode;
  /** 是否显示 condition */
  showCondition?: boolean;
  /** 是否显示 enable 开关 */
  showEnable?: boolean;
  /** 未选字段时也展示 Value 编辑器（用于表单设置里的占位体验） */
  showValueEditorWhenNoField?: boolean;
  /** 为 Value 编辑器补充额外 props（例如按筛选操作符适配输入组件） */
  getValueInputProps?: (
    item: FieldAssignRuleItem,
    index: number,
  ) => Partial<React.ComponentProps<typeof FieldAssignValueInput>>;
}

export const FieldAssignRulesEditor: React.FC<FieldAssignRulesEditorProps> = (props) => {
  const {
    t,
    fieldOptions,
    rootCollection,
    value: rawValue,
    onChange,
    defaultMode = 'assign',
    fixedMode,
    showCondition = true,
    showEnable = true,
    showValueEditorWhenNoField = false,
    getValueInputProps,
  } = props;

  const value = Array.isArray(rawValue) ? rawValue : [];
  const [cascaderOptions, setCascaderOptions] = React.useState<FieldAssignCascaderOption[]>(() =>
    Array.isArray(fieldOptions) ? (fieldOptions as FieldAssignCascaderOption[]) : [],
  );

  React.useEffect(() => {
    setCascaderOptions(Array.isArray(fieldOptions) ? (fieldOptions as FieldAssignCascaderOption[]) : []);
  }, [fieldOptions]);

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
        if (!fieldInterface) continue;
        if (fieldInterface === 'formula') continue;

        const name = String(f.name || '');
        if (!name) continue;
        const title = t(typeof f.title === 'string' ? f.title : name);
        const node: MetaTreeNode = {
          name,
          title,
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

      // levels: current item (target field if association) -> ... -> parent association chain
      const levels: Array<{ collection: any; toMany: boolean; viaLabel?: string }> = [];
      let current = rootCollection;
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i] as string;
        const field = current?.getField?.(seg);
        if (!field?.isAssociationField?.()) break;
        const toMany = isToManyAssociationField(field);
        const nextCollection = field?.targetCollection;
        if (!nextCollection) break;
        const viaLabel = t(
          typeof (field as CollectionFieldLike).title === 'string'
            ? ((field as CollectionFieldLike).title as string)
            : seg,
        );
        levels.push({ collection: nextCollection, toMany, viaLabel });
        current = nextCollection;
      }

      // 仅在“关系字段的子路径”场景下追加 item 变量树；
      // 顶层字段/非关联嵌套对象字段应使用 formValues（避免语义混淆）。
      if (levels.length <= 0) {
        return undefined;
      }

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
          // 直接把上级项节点作为子节点，避免出现 “Parent item / Parent item” 的重复层级
          children.push(buildObjectNode(idx - 1, [...basePaths, 'parentItem'], 'parentItem', 'Parent item'));
        }

        const viaLabel = level?.viaLabel;
        const titleWithSuffix = viaLabel ? `${t(titleKey)}（${viaLabel}）` : t(titleKey);

        return {
          title: titleWithSuffix,
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

  const patchItem = (index: number, patch: Partial<FieldAssignRuleItem>) => {
    const next = value.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange?.(next);
  };

  const removeItem = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onChange?.(next);
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
    const next: FieldAssignRuleItem[] = [
      ...value,
      {
        key: uid(),
        enable: true,
        mode: fixedMode || defaultMode,
        condition: { logic: '$and', items: [] },
        targetPath: undefined,
        value: undefined,
      },
    ];
    onChange?.(next);
  };

  const getEffectiveMode = (item: FieldAssignRuleItem): AssignMode => {
    if (fixedMode) return fixedMode;
    return item?.mode === 'default' ? 'default' : 'assign';
  };

  const renderAssignModeLabel = React.useCallback(
    (mode: AssignMode) => {
      const modeText = mode === 'default' ? t('Default value') : t('Fixed value');
      const modeHelpText =
        mode === 'default'
          ? t(
              'A pre-filled value. Editable, for new entries only, and won’t affect existing data (including empty values).',
            )
          : t('A system-set value. Read-only.');

      const preventModeToggle = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
      };

      return (
        <Space size={4}>
          <span>{modeText}</span>
          <Tooltip title={modeHelpText}>
            <QuestionCircleOutlined
              style={{ cursor: 'help', opacity: 0.65, fontSize: 12 }}
              onMouseDown={preventModeToggle}
              onClick={preventModeToggle}
            />
          </Tooltip>
        </Space>
      );
    },
    [t],
  );

  const parseTargetPathToSegments = React.useCallback((targetPath?: string): string[] => {
    const raw = String(targetPath || '');
    if (!raw) return [];
    return raw
      .split('.')
      .map((s) => s.trim())
      .filter(Boolean);
  }, []);

  const getFieldLabel = (targetPath?: string) => {
    const segs = parseTargetPathToSegments(targetPath);
    if (!segs.length) return undefined;
    if (!rootCollection?.getField) {
      return segs.join(' / ');
    }

    const labels: string[] = [];
    let collection = rootCollection;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i] as string;
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
        if (!field?.isAssociationField?.() || !field?.targetCollection) {
          return null;
        }
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
        if (!fieldInterface) continue;
        if (fieldInterface === 'formula') continue;

        const name = String(f.name || '');
        if (!name) continue;

        const title = t(typeof f.title === 'string' ? f.title : name);
        const isAssoc = !!f.isAssociationField?.();
        const hasTarget = !!f.targetCollection;
        out.push({
          label: title,
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
      if (!target) return;
      if (target.children && Array.isArray(target.children) && target.children.length) return;
      if (target.isLeaf) return;

      const segments = opts.map((o) => String(o?.value)).filter(Boolean);
      const targetCollection = resolveTargetCollectionBySegments(segments);
      if (!targetCollection) {
        target.isLeaf = true;
        setCascaderOptions((prev) => [...prev]);
        return;
      }

      const children = buildChildrenFromCollection(targetCollection);
      if (!children.length) {
        target.isLeaf = true;
      } else {
        target.children = children;
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
      if (!targetPath) continue;
      if (seen.has(targetPath)) continue;
      seen.add(targetPath);
      out.push(targetPath);
    }
    return out;
  }, [value]);

  // 预加载已选路径：确保编辑已保存的规则时，Cascader 能显示完整 label 路径。
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      for (const targetPath of selectedTargetPaths) {
        if (cancelled) return;
        const segs = parseTargetPathToSegments(targetPath);
        if (!segs.length) continue;
        await preloadCascaderPath(segs);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [parseTargetPathToSegments, preloadCascaderPath, selectedTargetPaths]);

  const renderPanelHeader = (item: FieldAssignRuleItem, index: number) => {
    const mode = getEffectiveMode(item);
    const modeText = mode === 'default' ? t('Default value') : t('Fixed value');
    const fieldLabel = getFieldLabel(item.targetPath);
    const title = fieldLabel ? String(fieldLabel) : t('Please select field');

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
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }} title={title}>
            {title}
          </div>
          <div style={{ opacity: 0.65, fontSize: 12, whiteSpace: 'nowrap' }}>{modeText}</div>
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
    const mode = getEffectiveMode(item);
    const extraMetaTree = buildItemMetaTree(item.targetPath);
    return {
      key: item.key || String(index),
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
              options={cascaderOptions}
              loadData={loadCascaderData}
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
                const changed = targetPath !== item.targetPath;
                patchItem(index, {
                  targetPath,
                  value: changed ? undefined : item.value,
                });
              }}
            />
          </div>

          {(showValueEditorWhenNoField || !!item.targetPath) && (
            <div>
              <div style={{ marginBottom: 4, fontSize: 14 }}>{t('Value')}</div>
              <FieldAssignValueInput
                key={item.targetPath || 'no-field'}
                targetPath={item.targetPath || ''}
                value={item.value}
                onChange={(v) => patchItem(index, { value: v })}
                extraMetaTree={extraMetaTree}
                {...(getValueInputProps?.(item, index) || {})}
              />
            </div>
          )}

          {!fixedMode && (
            <div>
              <div style={{ marginBottom: 4, fontSize: 14 }}>{t('Assignment mode')}</div>
              <Radio.Group
                value={mode}
                style={{ width: '100%' }}
                onChange={(event) => patchItem(index, { mode: event.target.value as AssignMode })}
              >
                <Space size={16}>
                  <Radio value="default">{renderAssignModeLabel('default')}</Radio>
                  <Radio value="assign">{renderAssignModeLabel('assign')}</Radio>
                </Space>
              </Radio.Group>
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

    // 默认展开最后一个启用项；若无启用项则回退第一项。
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
