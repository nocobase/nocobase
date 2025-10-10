/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT, FlowModelContext, FlowModel, useFlowSettingsContext } from '@nocobase/flow-engine';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, Select, Cascader } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useField, useForm, useFormEffects } from '@formily/react';
import { onFieldValueChange } from '@formily/core';
import { FlowPage } from '../FlowPage';
import { VariableInput } from '@nocobase/flow-engine';

/**
 * 弹窗打开动作（openView）配置
 * 主要逻辑说明：
 * - UID 规则：
 *   - 默认使用当前模型 uid；必填。
 *   - 当 uid 与当前模型不同：调用 ctx.openView(uid, …) 打开“其它弹窗”。
 *   - 当 uid 与当前模型相同：在当前上下文打开“自身弹窗”。
 * - 数据源/集合：
 *   - 顶层只读展示（使用级联），底层字段 dataSourceKey / collectionName 永远禁用。
 *   - 默认取当前集合的数据源/集合；若从他弹窗回填则以回填为准。
 * - 关联名/来源主键：
 *   - 当关联名无值时隐藏；有默认值时禁用。
 *   - Source ID 在关联名不存在时隐藏；在关联场景默认使用 {{ ctx.resource.sourceId }}。
 * - Filter by TK：默认使用 {{ ctx.record.<filterTargetKey> }}。
 * - 变量选择：仅暴露 record/resource，避免误选 view/collection。
 */

export const openView = defineAction({
  name: 'openView',
  title: escapeT('Edit popup'),
  uiSchema: {
    mode: {
      type: 'string',
      title: escapeT('Open mode'),
      enum: [
        { label: escapeT('Drawer'), value: 'drawer' },
        { label: escapeT('Dialog'), value: 'dialog' },
        { label: escapeT('Page'), value: 'embed' },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
    },
    size: {
      type: 'string',
      title: escapeT('Popup size'),
      enum: [
        { label: escapeT('Small'), value: 'small' },
        { label: escapeT('Medium'), value: 'medium' },
        { label: escapeT('Large'), value: 'large' },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-reactions': {
        dependencies: ['mode'],
        fulfill: {
          state: {
            hidden: '{{$deps[0] === "embed"}}',
          },
        },
      },
    },
    uid: {
      type: 'string',
      title: escapeT('Popup uid'),
      required: true,
      'x-decorator': 'FormItem',
      'x-component': function UidInput(props) {
        const { value, onChange } = props as { value?: string; onChange?: (v: string) => void };
        const ctx = useFlowSettingsContext();
        const field: any = useField();
        const form = useForm();

        const setFieldDisabled = useCallback(
          (name: string, disabled: boolean) => {
            form.setFieldState(name, (state: any) => {
              state.disabled = disabled;
            });
          },
          [form],
        );

        const updateParamsAndDisable = useCallback(
          (params: Record<string, any> | null, shouldDisable: boolean) => {
            const keys = ['dataSourceKey', 'collectionName', 'associationName', 'sourceId', 'filterByTk'] as const;
            // clear / enable all when null
            if (!params) {
              keys.forEach((k) => setFieldDisabled(k, false));
              setFieldDisabled('tabUid', false);
              return;
            }
            const readParam = (k: string) => params[k];
            keys.forEach((k) => {
              const v = readParam(k as string);
              if (v !== undefined) {
                form.setValuesIn(k, v);
                // dataSourceKey & collectionName are always read-only
                if (k === 'dataSourceKey' || k === 'collectionName') {
                  setFieldDisabled(k, true);
                } else {
                  setFieldDisabled(k, !!shouldDisable);
                }
              } else {
                setFieldDisabled(k, false);
              }
            });
            const tab = readParam('tabUid');
            if (tab !== undefined) {
              form.setValuesIn('tabUid', tab);
              setFieldDisabled('tabUid', !!shouldDisable);
            } else {
              setFieldDisabled('tabUid', false);
            }
          },
          [form, setFieldDisabled],
        );

        useEffect(() => {
          let alive = true;
          const run = async () => {
            // uid 是必填的且有默认值，不处理空值分支
            form.setFieldState(field.props?.name, (state: any) => {
              state.loading = true;
            });
            try {
              const engine = ctx.engine;
              let model = engine.getModel(value);
              if (!model) {
                model = await engine.loadModel({ uid: value });
              }
              if (!alive) return;
              if (!model) {
                field.setFeedback({ type: 'error', code: 'NotFound', messages: [ctx.t('Popup UID not exists')] });
                updateParamsAndDisable(null, false);
                return;
              }
              field.setFeedback({});
              const params = model.getStepParams('popupSettings', 'openView') || {};
              const isSelf = model.uid === ctx.model.uid;
              updateParamsAndDisable(params || null, !isSelf);
            } catch (err) {
              if (!alive) return;
              field.setFeedback({
                type: 'error',
                code: 'LoadFailed',
                messages: [ctx.t('Failed to load popup by UID')],
              });
              updateParamsAndDisable(null, false);
            } finally {
              if (alive) {
                form.setFieldState(field.props?.name, (state: any) => {
                  state.loading = false;
                });
              }
            }
          };
          run();
          return () => {
            alive = false;
          };
        }, [value, ctx, field, form, updateParamsAndDisable]);

        return (
          <Input
            value={value}
            onChange={(e) => onChange?.(e?.target?.value)}
            suffix={<span>{field?.loading || field.validating ? <LoadingOutlined /> : null}</span>}
          />
        );
      },
    },
    dsAndCollection: {
      type: 'array',
      title: escapeT('Data source / Collection'),
      'x-decorator': 'FormItem',
      'x-component': function DSCollCascader(props) {
        const { disabled, placeholder } = props;
        const ctx = useFlowSettingsContext();
        const form = useForm();
        const [dsKey, setDsKey] = useState(() => form?.values?.dataSourceKey);
        const [collName, setCollName] = useState(() => form?.values?.collectionName);
        useFormEffects(() => {
          onFieldValueChange('dataSourceKey', (f) => setDsKey(f.value));
          onFieldValueChange('collectionName', (f) => setCollName(f.value));
        });
        useEffect(() => {
          setDsKey(form?.values?.dataSourceKey);
          setCollName(form?.values?.collectionName);
        }, [form]);
        const cascaderValue = useMemo(() => (dsKey && collName ? [dsKey, collName] : undefined), [dsKey, collName]);
        const options = useMemo(() => {
          const dsList = ctx?.dataSourceManager?.getDataSources?.() || [];
          return dsList.map((ds) => ({
            label: ds.displayName,
            value: ds.key,
            children: (ds.getCollections?.() || []).map((c) => ({ label: c.title, value: c.name })),
          }));
        }, [ctx]);
        const mergedDisabled = true; // dataSourceKey & collectionName are read-only
        const handleChange = useCallback(
          (arr: any[]) => {
            if (!arr || arr.length < 2) {
              form.setValuesIn('dataSourceKey', undefined);
              form.setValuesIn('collectionName', undefined);
              return;
            }
            const [newDs, newCol] = arr;
            form.setValuesIn('dataSourceKey', newDs);
            form.setValuesIn('collectionName', newCol);
            // 切换集合时，清空关联名，避免冲突
            form.setValuesIn('associationName', undefined);
          },
          [form],
        );
        return (
          <Cascader
            options={options}
            value={cascaderValue}
            onChange={handleChange}
            disabled={mergedDisabled}
            placeholder={placeholder}
            allowClear
            showSearch
            style={{ width: '100%' }}
          />
        );
      },
    },
    dataSourceKey: {
      type: 'string',
      title: escapeT('Data source key'),
      'x-decorator': 'FormItem',
      'x-component': function DSKeySelect(props) {
        const { value, onChange, disabled, placeholder } = props;
        const ctx = useFlowSettingsContext();
        const form = useForm();
        const options = useMemo(() => {
          const dsList = ctx?.dataSourceManager?.getDataSources?.() || [];
          return dsList.map((ds) => ({ label: ds.displayName, value: ds.key }));
        }, [ctx]);
        const handleChange = useCallback(
          (val) => {
            // 切换数据源时清空 collectionName 与 associationName
            if (val !== value) {
              form.setValuesIn('collectionName', undefined);
              form.setValuesIn('associationName', undefined);
            }
            onChange?.(val);
          },
          [onChange, form, value],
        );
        return (
          <Select
            showSearch
            allowClear
            options={options}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder}
            optionFilterProp="label"
            style={{ width: '100%' }}
          />
        );
      },
      'x-reactions': {
        fulfill: {
          state: { hidden: true },
        },
      },
    },
    collectionName: {
      type: 'string',
      title: escapeT('Collection name'),
      'x-decorator': 'FormItem',
      'x-component': function CollNameSelect(props) {
        const { value, onChange, disabled, placeholder } = props;
        const ctx = useFlowSettingsContext();
        const form = useForm();
        const [dsKey, setDsKey] = useState(() => form?.values?.dataSourceKey);
        useFormEffects(() => {
          onFieldValueChange('dataSourceKey', (f) => setDsKey(f.value));
        });
        useEffect(() => {
          setDsKey(form?.values?.dataSourceKey);
        }, [form]);

        const options = useMemo(() => {
          if (!dsKey) return [];
          const ds = ctx?.dataSourceManager?.getDataSource?.(dsKey);
          const cols = ds?.getCollections?.() || [];
          return cols.map((c) => ({ label: c.title, value: c.name }));
        }, [ctx, dsKey]);
        return (
          <Select
            showSearch
            allowClear
            options={options}
            value={value}
            onChange={(v) => {
              // 切换集合时清空 associationName
              if (v !== value) {
                form.setValuesIn('associationName', undefined);
              }
              onChange?.(v);
            }}
            disabled={disabled || !dsKey}
            placeholder={placeholder || (!dsKey ? ctx.t('Please select data source first') : undefined)}
            optionFilterProp="label"
            style={{ width: '100%' }}
          />
        );
      },
      'x-reactions': {
        fulfill: {
          state: { hidden: true },
        },
      },
    },
    associationName: {
      type: 'string',
      title: escapeT('Association name'),
      'x-decorator': 'FormItem',
      'x-component': function AssociationSelect(props) {
        const { value, onChange, disabled, placeholder } = props;
        const ctx = useFlowSettingsContext();
        const form = useForm();
        const [dsKey, setDsKey] = useState(() => form?.values?.dataSourceKey);
        const [collName, setCollName] = useState(() => form?.values?.collectionName);
        useFormEffects(() => {
          onFieldValueChange('dataSourceKey', (f) => setDsKey(f.value));
          onFieldValueChange('collectionName', (f) => setCollName(f.value));
        });
        useEffect(() => {
          setDsKey(form?.values?.dataSourceKey);
          setCollName(form?.values?.collectionName);
        }, [form]);

        const options = useMemo(() => {
          if (!dsKey || !collName) return [];
          const ds = ctx?.dataSourceManager?.getDataSource?.(dsKey);
          const collection = ds?.getCollection?.(collName);
          if (!collection) return [];
          const assocFields = collection.getAssociationFields?.(['many', 'one']) || [];
          const items = [
            { label: collection.title, value: collection.name },
            ...assocFields.map((f) => ({
              label: `${collection.title}.${f.title || f.name}`,
              value: `${collection.name}.${f.name}`,
            })),
          ];
          return items;
        }, [ctx, dsKey, collName]);

        return (
          <Select
            showSearch
            allowClear
            options={options}
            value={value}
            onChange={onChange}
            disabled={disabled || !dsKey || !collName}
            placeholder={
              placeholder ||
              (!dsKey
                ? ctx.t('Please select data source first')
                : !collName
                  ? ctx.t('Please select collection first')
                  : undefined)
            }
            optionFilterProp="label"
            style={{ width: '100%' }}
          />
        );
      },
      'x-reactions': {
        fulfill: {
          state: {
            // 没有值则隐藏；有默认值（initialValue）则禁用
            hidden: '{{!$self.value}}',
            disabled: '{{ $self.initialValue != null && $self.initialValue !== "" }}',
          },
        },
      },
    },
    tabUid: {
      type: 'string',
      title: escapeT('Tab uid'),
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-reactions': {
        fulfill: {
          state: {
            hidden: true,
          },
        },
      },
    },
    sourceId: {
      type: 'string',
      title: escapeT('Source ID'),
      'x-decorator': 'FormItem',
      'x-component': function SourceIdVariable(props) {
        const ctx = useFlowSettingsContext();
        const metaTree = useMemo(() => {
          try {
            const full = ctx.getPropertyMetaTree();
            const nodes = (full || []).filter((n: any) => ['record', 'resource'].includes(String(n?.name)));
            const hasResourceNode = nodes.some((n: any) => String(n?.name) === 'resource');
            let hasSourceIdValue = false;
            try {
              const sid = ctx?.resource?.getSourceId?.();
              hasSourceIdValue = sid !== undefined && sid !== null && String(sid) !== '';
            } catch (_) {
              // ignore
            }
            // 仅当存在实际的 sourceId 值且树中没有 resource 时，注入 Resource -> Source ID
            if (!hasResourceNode && hasSourceIdValue) {
              nodes.push({
                name: 'resource',
                title: ctx.t('Resource'),
                type: 'object',
                paths: ['resource'],
                children: [
                  {
                    name: 'sourceId',
                    title: ctx.t('Source ID'),
                    type: 'string',
                    paths: ['resource', 'sourceId'],
                  },
                ],
              });
            }
            return nodes.filter((n: any) => String(n?.name) === 'record' || String(n?.name) === 'resource');
          } catch (e) {
            return ctx.getPropertyMetaTree();
          }
        }, [ctx]);
        return (
          <VariableInput
            value={props.value}
            onChange={props.onChange}
            disabled={props.disabled}
            placeholder={props.placeholder}
            metaTree={() => metaTree}
          />
        );
      },
      'x-reactions': {
        dependencies: ['associationName'],
        fulfill: {
          state: {
            hidden: '{{!$deps[0]}}',
          },
        },
      },
    },
    filterByTk: {
      type: 'string',
      title: escapeT('Filter by TK'),
      'x-decorator': 'FormItem',
      'x-component': function FilterByTkVariable(props) {
        const ctx = useFlowSettingsContext();
        const metaTree = useMemo(() => {
          try {
            const full = ctx.getPropertyMetaTree();
            // 仅保留 record，隐藏 Resource 相关变量
            return (full || []).filter((n: any) => String(n?.name) === 'record');
          } catch (e) {
            return ctx.getPropertyMetaTree();
          }
        }, [ctx]);
        return (
          <VariableInput
            value={props.value}
            onChange={props.onChange}
            disabled={props.disabled}
            placeholder={props.placeholder}
            metaTree={() => metaTree}
          />
        );
      },
    },
  },
  defaultParams: async (ctx) => {
    // 当存在 ctx.record 上下文时提供默认 filterByTk；否则不提供
    const tree = ctx.getPropertyMetaTree() || [];
    const hasRecord = Array.isArray(tree) && tree.some((n: any) => String(n?.name) === 'record');
    const col = (ctx as any)?.collection;

    // 决定主键字段：优先使用集合的 filterTargetKey；否则直接回退 'id'
    const recordKeyPath =
      hasRecord && col && typeof col.filterTargetKey === 'string' && col.filterTargetKey ? col.filterTargetKey : 'id';
    const filterByTkExpr = hasRecord ? `{{ ctx.record.${recordKeyPath} }}` : undefined;
    // 仅在“当前 resource.sourceId 有实际值”时设置默认值，
    // 否则不设置，避免出现无效的默认变量。
    let sourceIdExpr: string | undefined = undefined;
    try {
      const sid = (ctx as any)?.resource?.getSourceId?.();
      if (sid !== undefined && sid !== null && String(sid) !== '') {
        sourceIdExpr = `{{ ctx.resource.sourceId }}`;
      }
    } catch (_) {
      // ignore
    }
    const defaultDSKey = col?.dataSourceKey;
    const defaultCol = col?.name;
    return {
      mode: 'drawer',
      size: 'medium',
      pageModelClass: 'ChildPageModel',
      uid: ctx.model?.uid,
      // 当存在 ctx.record 时提供默认 filterByTk
      ...(filterByTkExpr ? { filterByTk: filterByTkExpr } : {}),
      ...(sourceIdExpr ? { sourceId: sourceIdExpr } : {}),
      ...(defaultDSKey ? { dataSourceKey: defaultDSKey } : {}),
      ...(defaultCol ? { collectionName: defaultCol } : {}),
    };
  },
  async beforeParamsSave(ctx, params) {
    if (params?.uid) {
      const engine = ctx.engine;
      const model = engine.getModel(params.uid) || (await engine.loadModel({ uid: params.uid }));
      if (!model) {
        throw new Error(ctx.t('Popup UID not exists'));
      }
    }
  },
  async handler(ctx: FlowModelContext, params) {
    // If uid differs from current model, delegate to ctx.openView to open that popup
    if (params?.uid && params.uid !== ctx.model.uid) {
      const actionDefaults = (ctx.model as any)?.getInputArgs?.() || {};
      // 外部弹窗时应该以弹窗发起者为高优先级
      await ctx.openView(params.uid, {
        ...params,
        target: ctx.inputArgs.target || ctx.layoutContentElement,
        dataSourceKey: params.dataSourceKey ?? actionDefaults.dataSourceKey,
        collectionName: params.collectionName ?? actionDefaults.collectionName,
        associationName: params.associationName ?? actionDefaults.associationName,
        filterByTk: params.filterByTk ?? actionDefaults.filterByTk,
        sourceId: params.sourceId ?? actionDefaults.sourceId,
        tabUid: params.tabUid,
      });
      return;
    }
    const inputArgs = ctx.inputArgs || {};

    const viewInputArgs = ctx.view?.inputArgs as Record<string, any> | undefined;

    inputArgs.filterByTk = inputArgs.filterByTk || params.filterByTk || viewInputArgs?.filterByTk;

    inputArgs.sourceId = inputArgs.sourceId || params.sourceId || viewInputArgs?.sourceId;

    inputArgs.tabUid = inputArgs.tabuid || params.tabUid || viewInputArgs?.tabUid;

    const navigation = inputArgs.navigation ?? params.navigation;

    if (navigation !== false) {
      if (!ctx.inputArgs.navigation && ctx.view?.navigation) {
        // 在路由跳转前注入 PendingView，统一首次 handler 阶段的 ctx.view 语义
        const pendingType = (
          ctx.inputArgs?.isMobileLayout ? 'embed' : ctx.inputArgs?.mode || params?.mode || 'drawer'
        ) as any;
        const pendingInputArgs = {
          ...ctx.inputArgs,
          dataSourceKey: params.dataSourceKey ?? ctx.inputArgs.dataSourceKey,
          collectionName: params.collectionName ?? ctx.inputArgs.collectionName,
          associationName: params.associationName ?? ctx.inputArgs.associationName,
          filterByTk: inputArgs.filterByTk ?? params.filterByTk,
          sourceId: inputArgs.sourceId ?? params.sourceId,
          tabUid: inputArgs.tabUid ?? params.tabUid,
          viewUid: ctx.model.context?.inputArgs?.viewUid || ctx.model.uid,
        } as Record<string, unknown>;
        const pendingView = {
          type: pendingType,
          inputArgs: pendingInputArgs,
          navigation: ctx.view?.navigation,
          preventClose: !!params?.preventClose,
          engineCtx: ctx.engine.context,
        };
        ctx.model.context.defineProperty('view', { value: pendingView });

        const nextView = {
          viewUid: ctx.model.context?.inputArgs?.viewUid || ctx.model.uid,
          filterByTk: inputArgs.filterByTk ?? params.filterByTk,
          sourceId: inputArgs.sourceId ?? params.sourceId,
          tabUid: inputArgs.tabUid ?? params.tabUid,
        };
        ctx.view.navigation.navigateTo(nextView);
        return;
      }
    }

    const sizeToWidthMap: Record<string, Record<string, string | undefined>> = {
      drawer: {
        small: '30%',
        medium: '50%',
        large: '70%',
      },
      dialog: {
        small: '40%',
        medium: '50%',
        large: '80%',
      },
      embed: {},
    };

    const pageModelClass = ctx.inputArgs.pageModelClass || params.pageModelClass || 'ChildPageModel';

    const openMode = ctx.inputArgs.mode || params.mode || 'drawer';
    const size = ctx.inputArgs.size || params.size || 'medium';
    let pageModelUid: string | null = null;
    let pageModelRef: FlowModel | null = null;

    // If subModelKey is provided, create or load a container FlowModel under current ctx.model
    // and use it as the parent for the child page content.
    let parentIdForChild = ctx.model.uid;
    if (params.subModelKey) {
      const container = await ctx.engine.loadOrCreateModel({
        async: true,
        parentId: ctx.model.uid,
        subKey: params.subModelKey,
        subType: 'object',
        use: 'FlowModel',
      });
      if (container?.uid) {
        parentIdForChild = container.uid;
      }
    }

    // Build openerUids information (a list of view uids from root -> immediate opener)
    const isRouteManaged = !!ctx.inputArgs?.navigation;
    const parentOpenerUids =
      (ctx.view?.inputArgs?.openerUids as string[] | undefined) || (inputArgs.openerUids as string[] | undefined) || [];
    const openerUids: string[] = isRouteManaged
      ? (inputArgs.openerUids as string[] | undefined) || parentOpenerUids
      : [...parentOpenerUids, (ctx.model.context?.inputArgs?.viewUid as string) || ctx.model.uid];

    const finalInputArgs: Record<string, unknown> = {
      ...ctx.inputArgs,
      ...inputArgs,
      dataSourceKey: params.dataSourceKey,
      collectionName: params.collectionName,
      associationName: params.associationName,
      tabUid: inputArgs.tabUid ?? params.tabUid,
      openerUids,
    };
    // Ensure runtime keys propagate to view.inputArgs
    finalInputArgs.filterByTk = inputArgs.filterByTk ?? params.filterByTk;
    finalInputArgs.sourceId = inputArgs.sourceId ?? params.sourceId;
    await ctx.viewer.open({
      type: ctx.inputArgs.isMobileLayout ? 'embed' : openMode, // 移动端中只需要显示子页面
      inputArgs: finalInputArgs,
      preventClose: !!params.preventClose,
      destroyOnClose: true,
      inheritContext: false,
      target: ctx.inputArgs.target || ctx.layoutContentElement,
      width: sizeToWidthMap[openMode][size],
      content: (currentView) => {
        if (ctx.inputArgs.closeRef) {
          ctx.inputArgs.closeRef.current = currentView.close;
        }
        if (ctx.inputArgs.updateRef) {
          ctx.inputArgs.updateRef.current = currentView.update;
        }
        return (
          <FlowPage
            parentId={parentIdForChild}
            pageModelClass={pageModelClass}
            onModelLoaded={(uid, model) => {
              pageModelUid = uid;
              const pageModel = (model as FlowModel) || (ctx.engine.getModel(pageModelUid) as FlowModel | undefined);
              pageModelRef = pageModel || null;
              const defineProperties =
                inputArgs.defineProperties ?? ctx.model.context?.inputArgs?.defineProperties ?? {};
              const defineMethods = inputArgs.defineMethods ?? ctx.model.context?.inputArgs?.defineMethods ?? {};

              pageModel.context.defineProperty('currentView', {
                get: () => currentView,
              });
              // 统一视图上下文：无论内部还是外部弹窗，页面内的 ctx.view 都指向“当前视图”
              // 这样在路由模式下，外部弹窗（通过 ctx.openView 触发）与内部弹窗拥有一致的 ctx.view 行为
              pageModel.context.defineProperty('view', {
                get: () => currentView,
              });
              pageModel.context.defineProperty('closable', {
                get: () => openMode !== 'embed',
              });

              Object.entries(defineProperties as Record<string, any>).forEach(([key, p]) => {
                pageModel.context.defineProperty(key, p);
              });
              Object.entries(defineMethods as Record<string, any>).forEach(([key, method]) => {
                pageModel.context.defineMethod(key, method);
              });

              pageModel.invalidateAutoFlowCache(true);
              pageModel['_rerunLastAutoRun'](); // TODO: 临时做法，等上下文重构完成后去掉
            }}
          />
        );
      },
      styles: {
        content: {
          padding: 0,
          backgroundColor: ctx.model.flowEngine.context.themeToken.colorBgLayout,
          ...(openMode === 'embed' ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : {}),
        },
        body: {
          padding: 0,
        },
      },
      onClose: () => {
        const nav = ctx.inputArgs?.navigation || ctx.view?.navigation;
        if (pageModelUid) {
          const pageModel = pageModelRef || ctx.model.flowEngine.getModel(pageModelUid);
          pageModel?.invalidateAutoFlowCache(true);
        }
        if (navigation !== false) {
          if (nav?.back) {
            nav.back();
          }
        }
      },
      onOpen: ctx.inputArgs.onOpen,
    });

    // Automatically refresh the current block's data when the popup is closed
    await ctx.resource?.refresh();
  },
});
