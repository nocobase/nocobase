/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr, FlowModelContext, FlowModel, useFlowSettingsContext } from '@nocobase/flow-engine';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, Select, Cascader } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useField, useForm, useFormEffects } from '@formily/react';
import { onFieldValueChange } from '@formily/core';
import { FlowPage } from '../FlowPage';
import { VariableInput } from '@nocobase/flow-engine';
import { RootPageModel } from '../models';

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
  title: tExpr('Edit popup'),
  uiSchema: (ctx) => {
    return {
      mode: {
        type: 'string',
        title: tExpr('Open mode'),
        enum: [
          { label: tExpr('Drawer'), value: 'drawer' },
          { label: tExpr('Dialog'), value: 'dialog' },
          { label: tExpr('Page'), value: 'embed' },
        ],
        'x-decorator': 'FormItem',
        'x-component': 'Radio.Group',
      },
      size: {
        type: 'string',
        title: tExpr('Popup size'),
        enum: [
          { label: tExpr('Small'), value: 'small' },
          { label: tExpr('Medium'), value: 'medium' },
          { label: tExpr('Large'), value: 'large' },
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
        title: tExpr('Popup uid'),
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
      dataSourceKey: {
        type: 'string',
        title: tExpr('Data source key'),
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
        title: tExpr('Collection name'),
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
        title: tExpr('Association name'),
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
        title: tExpr('Tab uid'),
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
        title: tExpr('Source ID'),
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
        title: tExpr('Filter by TK'),
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
    };
  },
  /**
   * 通用的设置菜单可见性控制：
   * - 字段场景下，当未启用「点击打开」（clickToOpen=false）时，隐藏弹窗设置步骤；
   * - 其他场景默认不隐藏，保持向后兼容。
   */
  hideInSettings: async (ctx: FlowModelContext) => {
    const displayFieldSettingsFlow = ctx.model.getFlow('displayFieldSettings');
    if (!displayFieldSettingsFlow) {
      // 没有 displayFieldSettings 这个flow，就直接显示该配置
      return false;
    }
    const clickToOpen = ctx.model.getStepParams?.('displayFieldSettings', 'clickToOpen')?.clickToOpen;
    if (clickToOpen === undefined) {
      return !ctx.collectionField?.isAssociationField();
    }
    return clickToOpen === false;
  },
  defaultParams: async (ctx) => {
    const tree = ctx.getPropertyMetaTree() || [];
    const hasRecord = Array.isArray(tree) && tree.some((n: any) => String(n?.name) === 'record');
    // 决定主键字段：优先使用集合的 filterTargetKey；否则直接回退 'id'
    let recordKeyPath = ctx.collection?.filterTargetKey || 'id';

    // 如果是关系字段，这个需要获取关系字段对应的key
    if (ctx.blockModel?.resource?.resourceName) {
      const assocField = ctx.collection.dataSource.collectionManager.getAssociation(
        ctx.blockModel?.resource?.resourceName,
      );
      if (assocField?.interface !== 'm2m') {
        recordKeyPath = assocField?.targetKey || recordKeyPath;
      }
    }

    const filterByTkExpr = hasRecord ? `{{ ctx.record.${recordKeyPath} }}` : undefined;
    // 仅在“当前 resource.sourceId 有实际值”时设置默认值，
    let sourceIdExpr: string | undefined = undefined;
    try {
      const sid = ctx.resource?.getSourceId?.();
      if (sid !== undefined && sid !== null && String(sid) !== '') {
        sourceIdExpr = `{{ ctx.resource.sourceId }}`;
      }
    } catch (e) {
      // ignore
    }
    const defaultDSKey = ctx.collection?.dataSourceKey;
    const defaultCol = ctx.collection?.name;
    return {
      mode: 'drawer',
      size: 'medium',
      pageModelClass: 'ChildPageModel',
      uid: ctx.model?.uid,
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
    const inputArgs = ctx.inputArgs || {};
    const defineProperties = inputArgs.defineProperties ?? ctx.model.context?.inputArgs?.defineProperties ?? undefined;
    const defineMethods = inputArgs.defineMethods ?? ctx.model.context?.inputArgs?.defineMethods ?? undefined;
    const actionDefaults = (ctx.model as any)?.getInputArgs?.() || {};
    const defaultKeys: string[] = (inputArgs as any)?.defaultInputKeys || [];
    const pickWithDefault = (key: 'filterByTk' | 'sourceId') => {
      const hasInput = typeof inputArgs?.[key] !== 'undefined';
      const isDefault = defaultKeys.includes(key);
      // 优先级：显式传入的 inputArgs > 配置 params > 自动默认值
      if (hasInput && !isDefault) return inputArgs[key];
      if (typeof params?.[key] !== 'undefined') return params[key];
      // 如果 inputArgs 中的值被标记为默认，则它只在 params 未提供时兜底
      if (hasInput) return inputArgs[key];
      return actionDefaults?.[key];
    };
    const mergedFilterByTk = pickWithDefault('filterByTk');
    const mergedSourceId = pickWithDefault('sourceId');
    const mergedTabUid = typeof inputArgs.tabUid !== 'undefined' ? inputArgs.tabUid : params.tabUid;
    // 移动端中只需要显示子页面
    const openMode = ctx.inputArgs?.isMobileLayout ? 'embed' : ctx.inputArgs?.mode || params.mode || 'drawer';
    if (params?.uid && params.uid !== ctx.model.uid) {
      // 外部弹窗时应该以弹窗发起者为高优先级
      await ctx.openView(params.uid, {
        ...params,
        target: ctx.inputArgs.target || ctx.layoutContentElement,
        dataSourceKey:
          typeof inputArgs.dataSourceKey !== 'undefined'
            ? inputArgs.dataSourceKey
            : params.dataSourceKey ?? actionDefaults.dataSourceKey,
        collectionName:
          typeof inputArgs.collectionName !== 'undefined'
            ? inputArgs.collectionName
            : params.collectionName ?? actionDefaults.collectionName,
        associationName:
          typeof inputArgs.associationName !== 'undefined'
            ? inputArgs.associationName
            : params.associationName ?? actionDefaults.associationName,
        filterByTk: mergedFilterByTk,
        sourceId: mergedSourceId,
        tabUid: mergedTabUid,
        // 关键：把自定义上下文一并传递给 ctx.openView
        ...(defineProperties ? { defineProperties } : {}),
        ...(defineMethods ? { defineMethods } : {}),
      });
      return;
    }

    let navigation = typeof inputArgs.navigation !== 'undefined' ? inputArgs.navigation : params.navigation;

    // 传递了上下文就必须禁用路由，否则下次路由打开会缺少上下文
    if (defineProperties || defineMethods) {
      navigation = false;
    }

    if (navigation !== false) {
      if (!ctx.inputArgs.navigation && ctx.view?.navigation) {
        // 在路由跳转前注入 PendingView，统一首次 handler 阶段的 ctx.view 语义
        const pendingType = openMode;
        const pendingInputArgs = {
          ...ctx.inputArgs,
          dataSourceKey: inputArgs.dataSourceKey ?? params.dataSourceKey ?? ctx.inputArgs.dataSourceKey,
          collectionName: inputArgs.collectionName ?? params.collectionName ?? ctx.inputArgs.collectionName,
          associationName: inputArgs.associationName ?? params.associationName ?? ctx.inputArgs.associationName,
          filterByTk: mergedFilterByTk,
          sourceId: mergedSourceId,
          tabUid: mergedTabUid,
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
          filterByTk: mergedFilterByTk,
          sourceId: mergedSourceId,
          tabUid: mergedTabUid,
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
      tabUid: mergedTabUid,
      openerUids,
    };
    // Ensure runtime keys propagate to view.inputArgs
    finalInputArgs.filterByTk = mergedFilterByTk;
    finalInputArgs.sourceId = mergedSourceId;
    await ctx.viewer.open({
      type: openMode,
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

              if (pageModel instanceof RootPageModel) {
                // ctx.pageActive 是一个 observable.ref 对象，来自 RouteModel
                pageModel.context.defineProperty('pageActive', {
                  get: () => ctx.pageActive,
                });
              }

              Object.entries(defineProperties as Record<string, any>).forEach(([key, p]) => {
                pageModel.context.defineProperty(key, p);
              });
              Object.entries(defineMethods as Record<string, any>).forEach(([key, method]) => {
                pageModel.context.defineMethod(key, method);
              });

              pageModel.invalidateFlowCache('beforeRender', true);
              pageModel['_rerunLastAutoRun'](); // TODO: 临时做法，等上下文重构完成后去掉
            }}
            defaultTabTitle={ctx.model['defaultPopupTitle']}
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
          pageModel?.invalidateFlowCache('beforeRender', true);
        }
        if (navigation !== false) {
          if (nav?.back) {
            nav.back();
          }
        }
      },
      onOpen: ctx.inputArgs.onOpen,
    });
  },
});
