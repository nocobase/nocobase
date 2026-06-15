/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined, QuestionCircleOutlined, SyncOutlined, UpOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { isRunJSValue, isVariableExpression } from '@nocobase/flow-engine';
import type { FilterGroupType } from '@nocobase/utils/client';
import { Button, Popconfirm, Popover, Radio, Select, Space, Tooltip } from 'antd';
import React from 'react';
import { FieldAssignValueInput } from './FieldAssignValueInput';
import {
  FieldRuleItemsEditor,
  parseFieldRuleTargetPath,
  type FieldRuleItemBase,
  type FieldRuleItemRenderContext,
} from './FieldRuleItemsEditor';
import type { FieldAssignCascaderOption } from './fieldAssignOptions';

export type AssignMode = 'default' | 'assign';

type CollectionFieldLike = {
  name?: unknown;
  title?: unknown;
  interface?: unknown;
  target?: unknown;
  targetKey?: unknown;
  targetCollectionTitleFieldName?: unknown;
  targetCollection?: {
    filterByTk?: unknown;
    filterTargetKey?: unknown;
    getField?: (name: string) => { title?: unknown } | undefined;
    getFields?: () => unknown[];
    options?: { titleField?: unknown };
    titleField?: unknown;
  };
  isAssociationField?: () => boolean;
};

type AssociationTitleFieldCandidate = {
  label: string;
  value: string;
};

type AssociationFieldQuickContext = {
  associationField: CollectionFieldLike;
  targetCollection: NonNullable<CollectionFieldLike['targetCollection']>;
  currentTitleField?: string;
  valueKey: string;
  candidates: AssociationTitleFieldCandidate[];
};

export interface FieldAssignRuleItem extends FieldRuleItemBase {
  /** 赋值目标路径，例如 `title` / `users.nickname` / `user.name` */
  targetPath?: string;
  /** 仅当前规则生效的 title field 覆盖（不改 collection 全局配置） */
  valueTitleField?: string;
  mode?: AssignMode;
  condition?: FilterGroupType;
  value?: unknown;
}

export type SyncAssociationTitleFieldParams = {
  ruleItem: FieldAssignRuleItem;
  ruleIndex: number;
  targetPath?: string;
  associationField: CollectionFieldLike;
  targetCollection: NonNullable<CollectionFieldLike['targetCollection']>;
  titleField: string;
};

export interface FieldAssignRulesEditorProps {
  t: (key: string) => string;
  fieldOptions: FieldAssignCascaderOption[] | unknown[];
  /** 根集合（用于构建“上级对象/属性”变量树） */
  rootCollection?: {
    getField?: (name: string) => unknown;
    getFields?: () => unknown[];
  };
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
  /** 可选：用于筛选关系集合中可作为 Title field 的候选字段 */
  isTitleFieldCandidate?: (field: unknown, targetCollection: unknown) => boolean;
  /** 可选：点击同步按钮后，将选中的 title field 持久化到关系集合 */
  onSyncAssociationTitleField?: (params: SyncAssociationTitleFieldParams) => Promise<void> | void;
  /** 在日期字段下启用“日期变量替换 Constant 位”。 */
  enableDateVariableAsConstant?: boolean;
  maxAssociationFieldDepth?: number;
}

function isAssociationFieldLike(field?: CollectionFieldLike | null) {
  return !!(field?.isAssociationField?.() || field?.target || field?.targetCollection);
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
    isTitleFieldCandidate,
    onSyncAssociationTitleField,
    enableDateVariableAsConstant = false,
    maxAssociationFieldDepth = 2,
  } = props;

  const value = React.useMemo(() => (Array.isArray(rawValue) ? rawValue : []), [rawValue]);
  const getRuleKey = React.useCallback((item: FieldAssignRuleItem, index: number) => item?.key || String(index), []);
  const [titleFieldDraftMap, setTitleFieldDraftMap] = React.useState<Record<string, string | undefined>>({});
  const [advancedOpenMap, setAdvancedOpenMap] = React.useState<Record<string, boolean>>({});
  const [syncingRuleKey, setSyncingRuleKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    const validKeys = new Set(value.map((item, index) => getRuleKey(item, index)));
    setTitleFieldDraftMap((prev) => {
      const next: Record<string, string | undefined> = {};
      let changed = false;
      for (const [key, val] of Object.entries(prev)) {
        if (validKeys.has(key)) {
          next[key] = val;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setAdvancedOpenMap((prev) => {
      const next: Record<string, boolean> = {};
      let changed = false;
      for (const [key, val] of Object.entries(prev)) {
        if (validKeys.has(key)) {
          next[key] = !!val;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    if (syncingRuleKey && !validKeys.has(syncingRuleKey)) {
      setSyncingRuleKey(null);
    }
  }, [getRuleKey, syncingRuleKey, value]);

  const getEffectiveMode = React.useCallback(
    (item: FieldAssignRuleItem): AssignMode => {
      if (fixedMode) return fixedMode;
      return item?.mode === 'default' ? 'default' : 'assign';
    },
    [fixedMode],
  );

  const renderAssignModeLabel = React.useCallback(
    (mode: AssignMode) => {
      const modeText = mode === 'default' ? t('Default value') : t('Fixed value');
      const modeHelpText =
        mode === 'default'
          ? t(
              'A pre-filled value. Editable, for new entries only, and won’t affect existing data (including empty values).',
            )
          : t('A system-set value. Read-only.');

      const preventModeToggle = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
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

  const resolveAssociationFieldQuickContext = React.useCallback(
    (targetPath?: string): AssociationFieldQuickContext | null => {
      const segments = parseFieldRuleTargetPath(targetPath);
      if (!segments.length) return null;
      if (!rootCollection?.getField) return null;

      let collection: { getField?: (name: string) => unknown } | undefined = rootCollection;
      let field: CollectionFieldLike | null = null;
      for (let i = 0; i < segments.length; i++) {
        const segment = String(segments[i]);
        field = (collection?.getField?.(segment) as CollectionFieldLike | null) || null;
        if (!field) return null;

        const isLast = i === segments.length - 1;
        if (isLast) {
          if (!isAssociationFieldLike(field) || !field?.targetCollection) return null;

          const targetCollection = field.targetCollection;
          const targetFields =
            typeof targetCollection?.getFields === 'function' ? targetCollection.getFields() || [] : [];
          const candidates = targetFields
            .filter((rawField) => {
              if (!rawField || typeof rawField !== 'object') return false;
              if (typeof isTitleFieldCandidate === 'function') {
                return !!isTitleFieldCandidate(rawField, targetCollection);
              }
              const iface =
                typeof (rawField as { interface?: unknown }).interface === 'string'
                  ? (rawField as { interface?: string }).interface
                  : undefined;
              return !!iface && iface !== 'formula';
            })
            .map((rawField) => {
              const fieldRecord = rawField as { name?: unknown; title?: unknown };
              const name = String(fieldRecord?.name || '');
              if (!name) return null;
              return {
                value: name,
                label: t(typeof fieldRecord?.title === 'string' ? fieldRecord.title : name),
              } as AssociationTitleFieldCandidate;
            })
            .filter(Boolean) as AssociationTitleFieldCandidate[];

          const titleFromCollection =
            typeof targetCollection.titleField === 'string' && targetCollection.titleField
              ? targetCollection.titleField
              : undefined;
          const titleFromCollectionOptions =
            typeof targetCollection.options?.titleField === 'string' && targetCollection.options.titleField
              ? targetCollection.options.titleField
              : undefined;
          const titleFromAssociationField =
            typeof field?.targetCollectionTitleFieldName === 'string' && field.targetCollectionTitleFieldName
              ? field.targetCollectionTitleFieldName
              : undefined;
          const currentTitleField = titleFromCollection || titleFromCollectionOptions || titleFromAssociationField;

          if (currentTitleField && !candidates.some((option) => option.value === currentTitleField)) {
            const currentFieldTitle =
              typeof targetCollection?.getField === 'function'
                ? targetCollection.getField(currentTitleField)?.title || currentTitleField
                : currentTitleField;
            candidates.unshift({
              value: currentTitleField,
              label: t(typeof currentFieldTitle === 'string' ? currentFieldTitle : currentTitleField),
            });
          }

          const valueKey =
            (typeof field?.targetKey === 'string' && field.targetKey) ||
            (typeof targetCollection?.filterTargetKey === 'string' && targetCollection.filterTargetKey) ||
            (typeof targetCollection?.filterByTk === 'string' && targetCollection.filterByTk) ||
            'id';

          return {
            associationField: field,
            targetCollection,
            currentTitleField,
            valueKey,
            candidates,
          };
        }

        if (!isAssociationFieldLike(field) || !field?.targetCollection) {
          return null;
        }
        collection = field.targetCollection;
      }

      return null;
    },
    [isTitleFieldCandidate, rootCollection, t],
  );

  const renderItemContent = React.useCallback(
    ({ item, index, ruleKey, extraMetaTree, patchItem }: FieldRuleItemRenderContext<FieldAssignRuleItem>) => {
      const mode = getEffectiveMode(item);
      const associationQuickContext = resolveAssociationFieldQuickContext(item.targetPath);
      const draftTitleField = titleFieldDraftMap[ruleKey];
      const rawPreviewTitleField =
        (typeof draftTitleField === 'string' && draftTitleField) ||
        (typeof item?.valueTitleField === 'string' && item.valueTitleField) ||
        associationQuickContext?.currentTitleField ||
        undefined;
      const isPreviewTitleFieldValid =
        !rawPreviewTitleField ||
        !associationQuickContext ||
        !!associationQuickContext.candidates.some((option) => option.value === rawPreviewTitleField);
      const previewTitleField = isPreviewTitleFieldValid
        ? rawPreviewTitleField
        : associationQuickContext?.currentTitleField || undefined;
      const hasQuickSync = !!associationQuickContext;
      const hasCandidate = !!associationQuickContext?.candidates?.length;
      const isSyncing = syncingRuleKey === ruleKey;
      const canSync =
        !!onSyncAssociationTitleField &&
        hasQuickSync &&
        hasCandidate &&
        isPreviewTitleFieldValid &&
        !!previewTitleField &&
        previewTitleField !== associationQuickContext?.currentTitleField &&
        !isSyncing;
      const isConstantValue = !isVariableExpression(item?.value) && !isRunJSValue(item?.value) && item?.value !== null;
      const shouldShowAdvanced = hasQuickSync && isConstantValue;
      const isAdvancedOpen = shouldShowAdvanced && !!advancedOpenMap[ruleKey];

      const quickSyncControl = hasQuickSync ? (
        <Space.Compact size="small" onClick={(event) => event.stopPropagation()}>
          <Select
            size="small"
            style={{ minWidth: 160 }}
            value={previewTitleField}
            placeholder={hasCandidate ? t('Please select field') : t('No available title fields')}
            options={associationQuickContext?.candidates || []}
            disabled={!hasCandidate || isSyncing}
            allowClear={false}
            onChange={(nextValue) => {
              const next = String(nextValue || '');
              const normalized = !next || next === associationQuickContext?.currentTitleField ? undefined : next;
              setTitleFieldDraftMap((prev) => {
                const hasPrev = Object.prototype.hasOwnProperty.call(prev, ruleKey);
                if (!normalized) {
                  if (!hasPrev) return prev;
                  const changed = { ...prev };
                  delete changed[ruleKey];
                  return changed;
                }
                if (prev[ruleKey] === normalized) return prev;
                return { ...prev, [ruleKey]: normalized };
              });
              patchItem(index, { valueTitleField: normalized });
            }}
          />
          <Tooltip
            title={
              canSync
                ? t('Sync selected title field to collection')
                : t('Please choose a different title field before syncing')
            }
          >
            <Popconfirm
              title={t('Sync title field')}
              description={t('This will update the collection title field globally. Continue?')}
              okText={t('OK')}
              cancelText={t('Cancel')}
              disabled={!canSync}
              onConfirm={async () => {
                if (
                  !associationQuickContext ||
                  !previewTitleField ||
                  typeof onSyncAssociationTitleField !== 'function'
                ) {
                  return;
                }
                const isValidSelection = associationQuickContext.candidates.some(
                  (option) => option.value === previewTitleField,
                );
                if (!isValidSelection) {
                  return;
                }
                setSyncingRuleKey(ruleKey);
                try {
                  await onSyncAssociationTitleField({
                    ruleItem: item,
                    ruleIndex: index,
                    targetPath: item.targetPath,
                    associationField: associationQuickContext.associationField,
                    targetCollection: associationQuickContext.targetCollection,
                    titleField: previewTitleField,
                  });
                  setTitleFieldDraftMap((prev) => {
                    if (!(ruleKey in prev)) return prev;
                    const next = { ...prev };
                    delete next[ruleKey];
                    return next;
                  });
                  patchItem(index, { valueTitleField: undefined });
                } catch (error) {
                  console.warn('[FieldAssignRulesEditor] Failed to sync title field', error);
                } finally {
                  setSyncingRuleKey((prev) => (prev === ruleKey ? null : prev));
                }
              }}
            >
              <Button
                size="small"
                icon={<SyncOutlined spin={isSyncing} />}
                disabled={!canSync}
                aria-label={t('Sync title field')}
              />
            </Popconfirm>
          </Tooltip>
        </Space.Compact>
      ) : null;

      return (
        <>
          {(showValueEditorWhenNoField || !!item.targetPath) && (
            <div>
              <div style={{ marginBottom: 4, fontSize: 14 }}>{t('Value')}</div>
              <FieldAssignValueInput
                key={`${item.targetPath || 'no-field'}::${previewTitleField || ''}`}
                targetPath={item.targetPath || ''}
                value={item.value}
                onChange={(nextValue) => patchItem(index, { value: nextValue })}
                extraMetaTree={extraMetaTree}
                maxAssociationFieldDepth={maxAssociationFieldDepth}
                {...(getValueInputProps?.(item, index) || {})}
                enableDateVariableAsConstant={enableDateVariableAsConstant}
                associationFieldNamesOverride={
                  associationQuickContext && previewTitleField
                    ? {
                        label: previewTitleField,
                        value: associationQuickContext.valueKey,
                      }
                    : undefined
                }
              />
              {shouldShowAdvanced && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                  <Popover
                    trigger="click"
                    open={isAdvancedOpen}
                    onOpenChange={(open) => {
                      setAdvancedOpenMap((prev) => ({
                        ...prev,
                        [ruleKey]: open,
                      }));
                    }}
                    placement="bottomRight"
                    title={t('Advanced')}
                    content={
                      <div style={{ minWidth: 280 }}>
                        <Space size={8} align="center" wrap>
                          <span style={{ fontSize: 12, opacity: 0.75 }}>{t('Title field')}</span>
                          {quickSyncControl}
                        </Space>
                      </div>
                    }
                  >
                    <Button
                      type="link"
                      size="small"
                      style={{ paddingInline: 0, height: 'auto' }}
                      icon={isAdvancedOpen ? <UpOutlined /> : <DownOutlined />}
                    >
                      {t('Advanced')}
                    </Button>
                  </Popover>
                </div>
              )}
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
        </>
      );
    },
    [
      advancedOpenMap,
      enableDateVariableAsConstant,
      fixedMode,
      getEffectiveMode,
      getValueInputProps,
      maxAssociationFieldDepth,
      onSyncAssociationTitleField,
      renderAssignModeLabel,
      resolveAssociationFieldQuickContext,
      showValueEditorWhenNoField,
      syncingRuleKey,
      t,
      titleFieldDraftMap,
    ],
  );

  return (
    <FieldRuleItemsEditor<FieldAssignRuleItem>
      t={t}
      fieldOptions={fieldOptions as FieldAssignCascaderOption[]}
      rootCollection={rootCollection}
      value={value}
      onChange={onChange}
      createItem={() => ({
        key: uid(),
        enable: true,
        mode: fixedMode || defaultMode,
        condition: { logic: '$and', items: [] },
        targetPath: undefined,
        value: undefined,
      })}
      getHeaderExtra={(item) => {
        const mode = getEffectiveMode(item);
        return mode === 'default' ? t('Default value') : t('Fixed value');
      }}
      onTargetPathChange={({ item, ruleKey, targetPath, changed }) => {
        if (changed) {
          setTitleFieldDraftMap((prev) => {
            if (!(ruleKey in prev)) return prev;
            const next = { ...prev };
            delete next[ruleKey];
            return next;
          });
          setAdvancedOpenMap((prev) => {
            if (!(ruleKey in prev)) return prev;
            const next = { ...prev };
            delete next[ruleKey];
            return next;
          });
        }
        return {
          valueTitleField: changed ? undefined : item.valueTitleField,
          value: changed ? undefined : item.value,
          targetPath,
        };
      }}
      renderItemContent={renderItemContent}
      showCondition={showCondition}
      showEnable={showEnable}
      maxAssociationFieldDepth={maxAssociationFieldDepth}
    />
  );
};
