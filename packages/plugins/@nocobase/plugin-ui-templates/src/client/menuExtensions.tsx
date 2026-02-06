/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Button, Form, Input, Modal, Radio, Space, Tooltip, Typography } from 'antd';
import { ExclamationCircleFilled, QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { FlowModel, createBlockScopedEngine } from '@nocobase/flow-engine';
import { BlockModel } from '@nocobase/client';
import { ReferenceBlockModel } from './models/ReferenceBlockModel';
import { NAMESPACE, tStr, getPluginT } from './locale';
import {
  extractPopupTemplateContextFlagsFromParams,
  inferPopupTemplateContextFlags,
  normalizeStr,
  resolveActionScene,
  type PopupTemplateContextFlags,
} from './utils/templateCompatibility';
import { patchGridOptionsFromTemplateRoot } from './utils/templateCopy';

type MenuItem = {
  key: string;
  label: React.ReactNode;
  group?: string;
  sort?: number;
  onClick?: () => void;
};

const unwrapData = (val: any) => val?.data?.data ?? val?.data ?? val;

const normalizeTitle = (val?: string) => {
  if (!val) return '';
  return String(val).replace(/\s+/g, ' ').trim();
};

const openConvertDialogs = new WeakSet<FlowModel>();
const openCopyDialogs = new WeakSet<FlowModel>();
const openFieldsCopyDialogs = new WeakSet<FlowModel>();
const openSavePopupTemplateDialogs = new Set<string>();
const openConvertPopupTemplateDialogs = new Set<string>();

const GRID_REF_FLOW_KEY = 'referenceSettings';
const GRID_REF_STEP_KEY = 'useTemplate';

type ReferenceFormGridTargetSettings = {
  templateUid: string;
  templateName?: string;
  targetUid: string;
  targetPath?: string;
};

function getReferenceFormGridSettings(
  block: FlowModel,
): { grid: FlowModel; settings: ReferenceFormGridTargetSettings } | null {
  const grid = (block.subModels as any)?.grid as FlowModel | undefined;
  if (!grid) return null;
  if (grid.use !== 'ReferenceFormGridModel') return null;
  const raw = grid.getStepParams(GRID_REF_FLOW_KEY, GRID_REF_STEP_KEY);
  if (!raw || typeof raw !== 'object') return null;
  const templateUid = String((raw as any).templateUid || '').trim();
  const targetUid = String((raw as any).targetUid || '').trim();
  if (!templateUid || !targetUid) return null;
  const templateName = String((raw as any).templateName || '').trim() || undefined;
  const targetPath = String((raw as any).targetPath || '').trim() || undefined;
  return { grid, settings: { templateUid, templateName, targetUid, targetPath } };
}

async function handleConvertToTemplate(model: FlowModel, _t: (k: string, opt?: any) => string) {
  const t = getPluginT(model);
  const api = model.context.api;
  const viewer = model.context.viewer;
  if (!api?.resource || !viewer?.dialog) {
    model.context.message?.error?.('[block-reference] api/viewer is unavailable.');
    return;
  }
  if (openConvertDialogs.has(model)) {
    return;
  }
  openConvertDialogs.add(model);
  const viewArgs = model.context.view?.inputArgs || {};
  const resourceCtx = model.context.resource || {};
  const resourceInit = model.getStepParams('resourceSettings', 'init') || {};

  const getResourceVal = (key: string) =>
    resourceCtx?.[key] ||
    (typeof resourceCtx?.[`get${_.upperFirst(key)}`] === 'function'
      ? resourceCtx[`get${_.upperFirst(key)}`]()
      : undefined) ||
    viewArgs?.[key];

  const getRawInitVal = (key: string) => {
    const val = resourceInit?.[key];
    if (val === undefined || val === null) return undefined;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed ? trimmed : undefined;
    }
    return val;
  };

  const release = () => openConvertDialogs.delete(model);

  const TemplateDialogContent: React.FC<{ currentDialog: any }> = ({ currentDialog }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [closed, setClosed] = useState(false);

    const handleSubmit = async () => {
      const values = await form.validateFields();
      const isConvertMode = values.saveMode === 'convert';
      let targetUid = model.uid;
      if (!isConvertMode) {
        const duplicated = await api.resource('flowModels').duplicate({ uid: model.uid });
        const dupBody = unwrapData(duplicated);
        const duplicatedUid =
          (dupBody && typeof dupBody === 'object' && (dupBody.uid || dupBody.data?.uid)) ||
          (typeof dupBody === 'string' ? dupBody : undefined);
        if (!duplicatedUid) {
          throw new Error('[block-reference] Duplicate block failed.');
        }
        targetUid = duplicatedUid;
      }
      const payload = {
        name: values.name,
        description: values.description,
        targetUid,
        useModel: model.use,
        type: 'block',
        dataSourceKey: getResourceVal('dataSourceKey') || getResourceVal('dataSource') || resourceInit?.dataSourceKey,
        collectionName: getResourceVal('collectionName') || resourceInit?.collectionName,
        associationName: getResourceVal('associationName') || resourceInit?.associationName,
        filterByTk: getRawInitVal('filterByTk') ?? getResourceVal('filterByTk'),
        sourceId: getRawInitVal('sourceId') ?? getResourceVal('sourceId'),
        detachParent: isConvertMode,
      };
      const res = await api.resource('flowModelTemplates').create({
        values: payload,
      });
      const tpl = unwrapData(res);
      const tplUid = tpl?.uid || tpl?.data?.uid || tpl?.data?.data?.uid || targetUid;
      model.context.message?.success?.(t('Template created'));

      if (isConvertMode) {
        const parent = model.parent as FlowModel | undefined;
        const subKey = model.subKey;
        const subType = model.subType;
        const engine = model.flowEngine;
        if (!parent || !subKey || !engine) {
          model.context.message?.error?.(t('Parent not found, cannot replace block'));
        } else {
          const newModel = engine.createModel<FlowModel>({
            use: 'ReferenceBlockModel',
            parentId: parent.uid,
            subKey,
            subType,
          });
          newModel.setParent(parent);
          newModel.setStepParams('referenceSettings', 'target', {
            targetUid,
            mode: 'reference',
          });
          newModel.setStepParams('referenceSettings', 'useTemplate', {
            templateUid: tplUid,
            templateName: tpl?.name || tpl?.data?.name || values.name,
            templateDescription: tpl?.description || tpl?.data?.description || values.description,
            targetUid,
            mode: 'reference',
          });

          if (subType === 'array') {
            let arr = ((parent.subModels as any)[subKey] || []) as FlowModel[];
            if (!Array.isArray(arr)) {
              (parent.subModels as any)[subKey] = [];
              arr = (parent.subModels as any)[subKey] as FlowModel[];
            }
            const idx = arr.findIndex((m) => m?.uid === model.uid);
            const insertIndex = idx >= 0 ? idx : arr.length;
            arr.splice(insertIndex, idx >= 0 ? 1 : 0, newModel);
            arr.forEach((m, i) => (m.sortIndex = i));

            const gridParams = parent.getStepParams('gridSettings', 'grid') || {};
            if (gridParams?.rows && typeof gridParams.rows === 'object') {
              const newRows = _.cloneDeep(gridParams.rows);
              for (const rowId of Object.keys(newRows)) {
                const columns = newRows[rowId];
                if (Array.isArray(columns)) {
                  for (let ci = 0; ci < columns.length; ci++) {
                    const col = columns[ci];
                    if (Array.isArray(col)) {
                      for (let ii = 0; ii < col.length; ii++) {
                        if (col[ii] === model.uid) {
                          col[ii] = newModel.uid;
                        }
                      }
                    }
                  }
                }
              }
              parent.setStepParams('gridSettings', 'grid', { rows: newRows, sizes: gridParams.sizes || {} });
              parent.setProps('rows', newRows);
            }
            newModel.sortIndex = insertIndex;
            await newModel.afterAddAsSubModel();
          } else {
            parent.setSubModel(subKey, newModel);
            await newModel.afterAddAsSubModel();
          }

          await newModel.save();
          await parent.saveStepParams();
          model.context.message?.success?.(t('Replaced with template block'));
        }
      }
    };

    const handleConfirm = async () => {
      if (submitting) return;
      try {
        setSubmitting(true);
        await handleSubmit();
        setTimeout(() => {
          if (closed) return;
          setClosed(true);
          release();
          currentDialog.close();
        }, 0);
      } catch (err) {
        if ((err as any)?.errorFields) return;
        console.error(err);
        model.context.message?.error?.(err instanceof Error ? err.message : String(err));
        return;
      } finally {
        // 保持 loading 直到关闭，避免用户重复点击
        if (!closed) {
          setSubmitting(false);
        }
      }
    };

    const handleCancel = () => {
      release();
      currentDialog.close();
    };

    return (
      <>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: normalizeTitle(model.title),
            description: '',
            saveMode: 'convert',
          }}
        >
          <Form.Item
            name="name"
            label={<Typography.Text strong>{t('Template name')}</Typography.Text>}
            rules={[{ required: true, message: t('Template name is required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label={<Typography.Text strong>{t('Template description')}</Typography.Text>}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="saveMode" label={<Typography.Text strong>{t('Save mode')}</Typography.Text>}>
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="convert">
                  {t('Convert current block to template')}
                  <Tooltip title={t('Convert current block to template description')}>
                    <QuestionCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                  </Tooltip>
                </Radio>
                <Radio value="duplicate">
                  {t('Duplicate current block as template')}
                  <Tooltip title={t('Duplicate current block as template description')}>
                    <QuestionCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                  </Tooltip>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </Form>
        <currentDialog.Footer>
          <Space align="end">
            <Button onClick={handleCancel}>{t('Cancel')}</Button>
            <Button type="primary" loading={submitting} disabled={submitting} onClick={handleConfirm}>
              {t('Confirm')}
            </Button>
          </Space>
        </currentDialog.Footer>
      </>
    );
  };

  const dialog = viewer.dialog({
    title: t('Save as template'),
    width: 600,
    destroyOnClose: true,
    content: (currentDialog: any) => <TemplateDialogContent currentDialog={currentDialog} />,
    onClose: release,
  });

  return dialog;
}

async function handleConvertToCopy(model: FlowModel, _t: (k: string, opt?: any) => string) {
  const t = getPluginT(model);
  const flow = (model.constructor as typeof FlowModel).globalFlowRegistry.getFlow('referenceSettings');
  const stepDef = flow?.steps?.target as any;
  if (!stepDef?.beforeParamsSave) {
    model.context.message?.error?.(t('Convert reference to duplicate is unavailable'));
    return;
  }
  const viewer = model.context.viewer;
  if (!viewer || typeof viewer.dialog !== 'function') {
    model.context.message?.error?.('[block-reference] viewer is unavailable.');
    return;
  }
  if (openCopyDialogs.has(model)) {
    return;
  }
  openCopyDialogs.add(model);
  const release = () => openCopyDialogs.delete(model);

  Modal.confirm({
    title: t('Are you sure to convert this template block to copy mode?'),
    icon: <ExclamationCircleFilled />,
    content: t('Duplicate mode description'),
    okText: t('Confirm'),
    cancelText: t('Cancel'),
    onOk: async () => {
      try {
        const targetStep = model.getStepParams('referenceSettings', 'target') || {};
        const params = { ...targetStep, mode: 'copy' };
        await stepDef.beforeParamsSave({ engine: model.flowEngine, model, exit: () => {} } as any, params);
      } catch (e) {
        console.error(e);
        model.context.message?.error?.(e instanceof Error ? e.message : String(e));
        throw e;
      } finally {
        release();
      }
    },
    onCancel: release,
  });
}

async function handleConvertFieldsToCopy(model: FlowModel, _t: (k: string, opt?: any) => string) {
  const t = getPluginT(model);
  const resolved = getReferenceFormGridSettings(model);
  if (!resolved) {
    return;
  }
  const { grid: currentGrid, settings } = resolved;
  const viewer = model.context.viewer;
  if (openFieldsCopyDialogs.has(model)) return;
  openFieldsCopyDialogs.add(model);

  const release = () => openFieldsCopyDialogs.delete(model);

  const doConvert = async () => {
    try {
      // 收集当前区块已持久化的 grid 子模型（避免 object subModel 多份导致刷新后随机选中旧 grid）
      const existingGridUids: string[] = [];
      model.flowEngine.forEachModel((m: any) => {
        if (!m || m.uid === model.uid) return;
        if (m.subKey === 'grid' && m.parent?.uid === model.uid) {
          existingGridUids.push(String(m.uid));
        }
      });

      const targetUid = settings.targetUid;
      const targetPath = settings.targetPath?.trim() || 'subModels.grid';
      if (targetPath !== 'subModels.grid') {
        throw new Error(`[block-reference] Only 'subModels.grid' is supported (got '${targetPath}').`);
      }
      const scoped = createBlockScopedEngine(model.flowEngine);
      const root = await scoped.loadModel<FlowModel>({ uid: targetUid });
      const gridModel = _.get(root, targetPath) as FlowModel;
      if (!gridModel) {
        throw new Error(t('Target block is invalid'));
      }

      const duplicated = await model.flowEngine.duplicateModel(gridModel.uid);
      const merged = patchGridOptionsFromTemplateRoot(root, duplicated);

      // 将复制出的 grid（默认脱离父级）移动到当前表单 grid 位置，避免再走 save 重建整棵树
      await model.flowEngine.modelRepository.move(duplicated.uid, currentGrid.uid, 'after');

      const newGrid = model.flowEngine.createModel<FlowModel>({
        ...(merged.options as any),
        parentId: model.uid,
        subKey: 'grid',
        subType: 'object',
      });
      model.setSubModel('grid', newGrid);
      await newGrid.afterAddAsSubModel();
      if (merged.patched) {
        await newGrid.saveStepParams();
      }

      // 引用已清理，回退临时标题（移除“字段模板”标记）
      const clearTemplateTitle = (m: FlowModel) => {
        const curTitle = m.title || '';
        const labelCandidates = [t('Field template'), 'Field template', '字段模板', '字段模板']
          .concat(tStr('Field template'))
          .map((s) => (s ? String(s) : ''))
          .filter(Boolean);
        const union = labelCandidates.map((s) => _.escapeRegExp(s)).join('|');
        const reg = new RegExp(`\\s*\\((${union})[：:]?[^)]*\\)\\s*$`);
        if (!reg.test(curTitle)) return;
        const nextTitle = curTitle.replace(reg, '').trim();
        m.setTitle(nextTitle || '');
      };
      const masterModel: any = (model as any)?.isFork ? (model as any).master || model : model;
      clearTemplateTitle(model);
      clearTemplateTitle(masterModel);
      masterModel?.forks?.forEach?.((f: any) => f instanceof FlowModel && clearTemplateTitle(f));

      // 删除旧的 grid（若存在）
      for (const oldUid of existingGridUids) {
        if (oldUid && oldUid !== newGrid.uid) {
          await model.flowEngine.destroyModel(oldUid);
        }
      }

      model.context.message?.success?.(t('Saved'));
    } catch (e) {
      console.error(e);
      model.context.message?.error?.(
        e instanceof Error ? e.message : t('Convert reference to duplicate is unavailable'),
      );
    } finally {
      release();
    }
  };

  if (!viewer || typeof viewer.dialog !== 'function') {
    const ok = window.confirm(t('Are you sure to convert referenced fields to copy mode?'));
    if (ok) await doConvert();
    release();
    return;
  }

  Modal.confirm({
    title: t('Are you sure to convert referenced fields to copy mode?'),
    icon: <ExclamationCircleFilled />,
    content: t('Duplicate mode description'),
    okText: t('Confirm'),
    cancelText: t('Cancel'),
    onOk: async () => {
      try {
        await doConvert();
      } catch (e) {
        console.error(e);
        model.context.message?.error?.(e instanceof Error ? e.message : String(e));
        throw e;
      } finally {
        release();
      }
    },
    onCancel: release,
  });
}

async function handleSavePopupAsTemplate(model: FlowModel, _t: (k: string, opt?: any) => string) {
  const api = model.context.api;
  const viewer = model.context.viewer;
  const pluginT = getPluginT(model);
  const tNs = (key: string, opt?: Record<string, any>) => {
    const tt = (model.context as any)?.t;
    if (typeof tt !== 'function') return pluginT(key, opt);
    return tt(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback', ...(opt || {}) });
  };
  const tClient = (key: string, opt?: Record<string, any>) => {
    const tt = (model.context as any)?.t;
    if (typeof tt !== 'function') return pluginT(key, opt);
    return tt(key, { ns: ['client'], nsMode: 'fallback', ...(opt || {}) });
  };

  const dialogKey = model?.uid || '';
  if (dialogKey && openSavePopupTemplateDialogs.has(dialogKey)) {
    return;
  }
  if (dialogKey) {
    openSavePopupTemplateDialogs.add(dialogKey);
  }
  const release = () => {
    if (dialogKey) {
      openSavePopupTemplateDialogs.delete(dialogKey);
    }
  };

  if (!api?.resource) {
    model.context.message?.error?.('[block-reference] api is unavailable.');
    release();
    return;
  }
  const popupFlow = model.getFlow?.('popupSettings');
  if (!popupFlow) {
    model.context.message?.error?.(tNs('Only Popup can be saved as popup template'));
    release();
    return;
  }

  // Try to get field title for field popup templates
  const collectionField = (model.context as any)?.collectionField;
  const fieldTitle = collectionField?.title ? normalizeTitle(collectionField.title) : '';
  const defaultName =
    fieldTitle ||
    normalizeTitle((model as any)?.getTitle?.()) ||
    normalizeTitle((model as any)?.title) ||
    normalizeTitle(model.uid);
  const resolveOpenViewStepKey = (flow: any): string | undefined => {
    const steps = flow?.steps || {};
    if (steps?.openView) return 'openView';
    const found = Object.entries(steps).find(([, def]) => (def as any)?.use === 'openView');
    return found?.[0];
  };
  const openViewStepKey =
    (model.getStepParams('popupSettings', 'openView') !== undefined && 'openView') ||
    resolveOpenViewStepKey(popupFlow) ||
    'openView';
  const openViewParams = model.getStepParams('popupSettings', openViewStepKey) || {};

  const toNonEmptyString = (val: any): string | undefined => {
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim();
    return s ? s : undefined;
  };
  const resolveDefaultOpenViewResource = (): {
    dataSourceKey?: string;
    collectionName?: string;
    associationName?: string;
  } => {
    const ctx = model.context;
    const field = ctx.collectionField;
    const associationPathName = model.parent?.['associationPathName'];
    const blockModel = ctx.blockModel;
    const fieldCollection = ctx.collection || blockModel?.collection;
    const isAssociationField = (f): boolean => !!f?.isAssociationField?.();
    const associationField =
      !isAssociationField(field) && associationPathName && typeof fieldCollection?.getFieldByPath === 'function'
        ? fieldCollection.getFieldByPath(associationPathName)
        : undefined;
    const assocField = isAssociationField(field) ? field : associationField;

    if (isAssociationField(assocField)) {
      const targetCollection = assocField?.targetCollection;
      return {
        dataSourceKey: toNonEmptyString(targetCollection?.dataSourceKey),
        collectionName: toNonEmptyString(targetCollection?.name),
        associationName: toNonEmptyString(assocField?.resourceName),
      };
    }

    const collection = ctx.collection;
    const association = ctx.association;
    return {
      dataSourceKey: toNonEmptyString(collection?.dataSourceKey),
      collectionName: toNonEmptyString(collection?.name),
      associationName: toNonEmptyString(field?.target || association?.resourceName),
    };
  };

  // 兼容历史数据：openViewParams 里固化的 associationName 可能是错的。
  // 当能从上下文推导出 associationName 时（关联字段/关联字段属性），优先使用推导值。
  const defaultOpenViewResource = resolveDefaultOpenViewResource();
  const templateDataSourceKey =
    defaultOpenViewResource.dataSourceKey || toNonEmptyString(openViewParams?.dataSourceKey);
  const templateCollectionName =
    defaultOpenViewResource.collectionName || toNonEmptyString(openViewParams?.collectionName);
  const templateAssociationName = defaultOpenViewResource.associationName;
  const getDefaultFilterByTkExpr = (): string | undefined => {
    // 与 openView 默认行为对齐：尽量落表达式而非具体值
    const recordKeyPath = model.context?.collection?.filterTargetKey || 'id';
    return `{{ ctx.record.${recordKeyPath} }}`;
  };
  const getDefaultSourceIdExpr = (): string | undefined => {
    // 如果有 associationName，说明是关系资源弹窗，默认需要 sourceId
    if (templateAssociationName) {
      return `{{ ctx.resource.sourceId }}`;
    }
    try {
      const sid = model.context?.resource?.getSourceId?.();
      if (sid !== undefined && sid !== null && String(sid) !== '') {
        return `{{ ctx.resource.sourceId }}`;
      }
    } catch (e) {
      // ignore
    }
    return undefined;
  };
  const templateFilterByTk = toNonEmptyString(openViewParams?.filterByTk) || getDefaultFilterByTkExpr();
  const templateSourceId = toNonEmptyString(openViewParams?.sourceId) || getDefaultSourceIdExpr();

  const getUidFromAny = (obj: any): string | undefined => {
    const candidates = [
      obj?.uid,
      obj?.data?.uid,
      obj?.data?.data?.uid,
      obj?.data?.data?.data?.uid,
      obj?.data?.data?.data?.data?.uid,
    ];
    for (const c of candidates) {
      const v = toNonEmptyString(c);
      if (v) return v;
    }
    return undefined;
  };

  const duplicatePopupTarget = async (): Promise<string> => {
    const duplicated = await model.flowEngine?.duplicateModel?.(model.uid);
    const newUid = getUidFromAny(duplicated);
    if (!newUid) {
      throw new Error(tNs('Failed to duplicate pop-up'));
    }
    return newUid;
  };

  const doCreate = async (values: { name: string; description?: string; targetUid: string }) => {
    const payload = {
      name: values.name,
      description: values.description,
      targetUid: values.targetUid,
      useModel: model.use,
      type: 'popup',
      dataSourceKey: templateDataSourceKey,
      collectionName: templateCollectionName,
      associationName: templateAssociationName,
      filterByTk: templateFilterByTk,
      sourceId: templateSourceId,
    };
    const res = await api.resource('flowModelTemplates').create({ values: payload });
    return unwrapData(res);
  };

  if (!viewer || typeof viewer.dialog !== 'function') {
    try {
      const name = window.prompt(tNs('Template name'), defaultName || '') || '';
      const trimmed = normalizeTitle(name);
      if (!trimmed) return;
      const targetUid = await duplicatePopupTarget();
      await doCreate({ name: trimmed, targetUid });
      model.context.message?.success?.(tNs('Saved'));
    } catch (err) {
      console.error(err);
      model.context.message?.error?.(err instanceof Error ? err.message : String(err));
    } finally {
      release();
    }
    return;
  }

  viewer.dialog({
    title: tNs('Save as template'),
    width: 520,
    destroyOnClose: true,
    content: (currentDialog: any) => {
      const TemplateDialogContent: React.FC = () => {
        const [form] = Form.useForm();
        const [submitting, setSubmitting] = useState(false);

        const handleSubmit = async () => {
          const values = await form.validateFields();
          const name = normalizeTitle(values?.name);
          if (!name) {
            model.context.message?.error?.(tNs('Template name is required'));
            return;
          }
          setSubmitting(true);
          try {
            // 无论是否选择 replace，都需要先复制弹窗作为模板的 target
            // 这样可以保证模板和原弹窗是独立的
            const targetUid = await duplicatePopupTarget();
            const tpl = await doCreate({
              name,
              description: normalizeTitle(values?.description) || undefined,
              targetUid,
            });
            const tplUid = getUidFromAny(tpl);

            if (values?.saveMode === 'convert' && tplUid) {
              // 选择替换时，当前弹窗改为引用新创建的模板
              const nextOpenView: any = { ...(openViewParams || {}) };
              nextOpenView.uid = targetUid;
              nextOpenView.popupTemplateUid = tplUid;
              delete nextOpenView.popupTemplateContext;
              // 推断模板"是否需要 record/source 上下文"，避免 collection 模板被误判为 record 模板（尤其是默认值里带 `{{ ctx.record.* }}` 的情况）。
              // 注：这里使用 model.constructor.name 推断 scene（当前正在配置的 action 类型），
              // 而 inferFromTemplateRow 使用 tplRow.useModel（模板保存时的 action 类型）。两者语义相同：都是获取触发弹窗的 action 场景。
              const ctor: any = (model as any)?.constructor;
              const scene = resolveActionScene((use: string) => model.flowEngine?.getModelClass?.(use), ctor?.name);
              const inferred = inferPopupTemplateContextFlags(
                scene,
                openViewParams?.filterByTk,
                openViewParams?.sourceId,
              );

              if (inferred.hasFilterByTk) {
                if (!toNonEmptyString(nextOpenView.filterByTk) && templateFilterByTk) {
                  nextOpenView.filterByTk = templateFilterByTk;
                }
              } else if ('filterByTk' in nextOpenView) {
                delete nextOpenView.filterByTk;
              }

              // sourceId 是否需要完全由 inferred.hasSourceId 决定
              if (inferred.hasSourceId) {
                if (!toNonEmptyString(nextOpenView.sourceId) && templateSourceId) {
                  nextOpenView.sourceId = templateSourceId;
                }
              } else if ('sourceId' in nextOpenView) {
                delete nextOpenView.sourceId;
              }

              // 保存模板侧的 filterByTk/sourceId 可用性：运行时可能解析为空/undefined，需用布尔标记避免误判为"模板未提供"
              nextOpenView.popupTemplateHasFilterByTk = inferred.hasFilterByTk;
              nextOpenView.popupTemplateHasSourceId = inferred.hasSourceId;
              model.setStepParams('popupSettings', { [openViewStepKey]: nextOpenView });
              await model.saveStepParams();
            }

            model.context.message?.success?.(tNs('Saved'));
            currentDialog.close();
          } catch (err) {
            console.error(err);
            model.context.message?.error?.(err instanceof Error ? err.message : String(err));
          } finally {
            setSubmitting(false);
          }
        };

        return (
          <>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                name: defaultName,
                description: '',
                saveMode: 'convert',
              }}
            >
              <Form.Item
                name="name"
                label={tNs('Template name')}
                rules={[{ required: true, message: tNs('Template name is required') }]}
              >
                <Input autoFocus />
              </Form.Item>
              <Form.Item name="description" label={tNs('Template description')}>
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="saveMode" label={<Typography.Text strong>{tNs('Save mode')}</Typography.Text>}>
                <Radio.Group>
                  <Space direction="vertical">
                    <Radio value="convert">
                      {tNs('Convert current popup to template')}
                      <Tooltip title={tNs('Convert current popup to template description')}>
                        <QuestionCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                      </Tooltip>
                    </Radio>
                    <Radio value="duplicate">
                      {tNs('Duplicate current popup as template')}
                      <Tooltip title={tNs('Duplicate current popup as template description')}>
                        <QuestionCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                      </Tooltip>
                    </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
            </Form>
            <currentDialog.Footer>
              <Space align="end">
                <Button
                  onClick={() => {
                    currentDialog.close();
                  }}
                >
                  {tClient('Cancel')}
                </Button>
                <Button type="primary" loading={submitting} onClick={handleSubmit}>
                  {tClient('Confirm')}
                </Button>
              </Space>
            </currentDialog.Footer>
          </>
        );
      };

      return <TemplateDialogContent />;
    },
    onClose: release,
  });
}

async function handleConvertPopupTemplateToCopy(model: FlowModel, _t: (k: string, opt?: any) => string) {
  const api = model.context.api;
  const viewer = model.context.viewer;
  const pluginT = getPluginT(model);
  const tNs = (key: string, opt?: Record<string, any>) => {
    const tt = (model.context as any)?.t;
    if (typeof tt !== 'function') return pluginT(key, opt);
    return tt(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback', ...(opt || {}) });
  };
  const tClient = (key: string, opt?: Record<string, any>) => {
    const tt = (model.context as any)?.t;
    if (typeof tt !== 'function') return pluginT(key, opt);
    return tt(key, { ns: ['client'], nsMode: 'fallback', ...(opt || {}) });
  };

  const dialogKey = model?.uid || '';
  if (dialogKey && openConvertPopupTemplateDialogs.has(dialogKey)) {
    return;
  }
  if (dialogKey) {
    openConvertPopupTemplateDialogs.add(dialogKey);
  }
  const release = () => {
    if (dialogKey) {
      openConvertPopupTemplateDialogs.delete(dialogKey);
    }
  };

  const popupFlow = model.getFlow?.('popupSettings');
  if (!popupFlow) {
    model.context.message?.error?.(tNs('Only Popup can be saved as popup template'));
    release();
    return;
  }
  const resolveOpenViewStepKey = (flow: any): string | undefined => {
    const steps = flow?.steps || {};
    if (steps?.openView) return 'openView';
    const found = Object.entries(steps).find(([, def]) => (def as any)?.use === 'openView');
    return found?.[0];
  };
  const openViewStepKey =
    (model.getStepParams('popupSettings', 'openView') !== undefined && 'openView') ||
    resolveOpenViewStepKey(popupFlow) ||
    'openView';
  const openViewParams = model.getStepParams('popupSettings', openViewStepKey) || {};
  const templateUid =
    typeof openViewParams?.popupTemplateUid === 'string' ? openViewParams.popupTemplateUid.trim() : '';
  if (!templateUid) {
    model.context.message?.error?.(tNs('This pop-up is not using a popup template'));
    release();
    return;
  }

  const unwrap = (val: any) => val?.data?.data ?? val?.data ?? val;
  const fetchTemplateRow = async (): Promise<Record<string, any> | null> => {
    if (!api?.resource) {
      return null;
    }
    const res = await api.resource('flowModelTemplates').get({ filterByTk: templateUid });
    const row = unwrap(res);
    return row && typeof row === 'object' ? (row as Record<string, any>) : null;
  };

  const inferFromTemplateRow = (tplRow: Record<string, any>): PopupTemplateContextFlags => {
    const scene = resolveActionScene((use: string) => model.flowEngine?.getModelClass?.(use), tplRow?.useModel);
    return inferPopupTemplateContextFlags(scene, tplRow?.filterByTk, tplRow?.sourceId);
  };

  const doConvert = async () => {
    const tplRow = await fetchTemplateRow();
    const targetUid = normalizeStr(tplRow?.targetUid) || normalizeStr(openViewParams?.uid);
    if (!targetUid) {
      throw new Error(tNs('Popup template not found'));
    }
    const duplicated = await model.flowEngine.duplicateModel(targetUid);
    const newUid = duplicated?.uid || duplicated?.data?.uid || duplicated?.data?.data?.uid;
    if (!newUid) {
      throw new Error(tNs('Failed to copy popup from template'));
    }
    const inferred: PopupTemplateContextFlags = tplRow
      ? inferFromTemplateRow(tplRow)
      : extractPopupTemplateContextFlagsFromParams(openViewParams);

    const nextOpenView: any = { ...(openViewParams || {}), uid: newUid };
    delete (nextOpenView as any).popupTemplateUid;
    // 保持与"模板引用"一致的运行时上下文覆写逻辑（特别是关联字段复用非关系弹窗时 filterByTk<-sourceId）
    (nextOpenView as any).popupTemplateContext = true;
    // sourceId 是否需要完全由 inferred.hasSourceId 决定
    // 关键：copy 模式下不再有 popupTemplateUid 可用于运行时推断，因此这里要把"模板是否需要 record/source 上下文"固化下来。
    nextOpenView.popupTemplateHasFilterByTk = inferred.hasFilterByTk;
    nextOpenView.popupTemplateHasSourceId = inferred.hasSourceId;
    // 同步清理 params 侧的 filterByTk/sourceId，避免 record action 复用 collection 弹窗时泄漏 filterByTk
    if (!inferred.hasFilterByTk && 'filterByTk' in nextOpenView) {
      delete nextOpenView.filterByTk;
    }
    if (!inferred.hasSourceId && 'sourceId' in nextOpenView) {
      delete nextOpenView.sourceId;
    }
    model.setStepParams('popupSettings', { [openViewStepKey]: nextOpenView });
    await model.saveStepParams();
    model.context.message?.success?.(tNs('Converted'));
  };

  if (!viewer || typeof viewer.dialog !== 'function') {
    const ok = window.confirm(tNs('Are you sure to convert this pop-up to copy mode?'));
    if (ok) {
      try {
        await doConvert();
      } catch (e) {
        console.error(e);
        model.context.message?.error?.(e instanceof Error ? e.message : String(e));
      }
    }
    release();
    return;
  }

  Modal.confirm({
    title: tNs('Are you sure to convert this pop-up to copy mode?'),
    icon: <ExclamationCircleFilled />,
    content: tNs('Duplicate mode description'),
    okText: tClient('Confirm'),
    cancelText: tClient('Cancel'),
    onOk: async () => {
      try {
        await doConvert();
      } catch (e) {
        console.error(e);
        model.context.message?.error?.(e instanceof Error ? e.message : String(e));
        throw e;
      } finally {
        release();
      }
    },
    onCancel: release,
  });
}

/**
 * Check if the model is used as a reference target (either is a ReferenceBlockModel
 * or its parent is a ReferenceBlockModel)
 */
function isReferenceTarget(model: FlowModel): boolean {
  if (model instanceof ReferenceBlockModel) {
    return true;
  }
  // Check if model's parent is a ReferenceBlockModel (model is the target sub-model)
  const parent = model.parent;
  if (parent instanceof ReferenceBlockModel) {
    return true;
  }
  return false;
}

export function registerMenuExtensions() {
  BlockModel.registerExtraMenuItems({
    group: 'common-actions',
    sort: -10,
    matcher: (model) => {
      return (
        !isReferenceTarget(model) &&
        model?.use !== 'ApplyTaskCardDetailsModel' &&
        model?.use !== 'ApprovalTaskCardDetailsModel'
      );
    },
    items: async (model: FlowModel, t) => {
      const pluginT = getPluginT(model);
      const items: MenuItem[] = [];
      const hasReferenceFields = !!getReferenceFormGridSettings(model);
      if (hasReferenceFields) {
        items.push({
          key: 'block-reference:convert-fields-to-copy',
          label: pluginT('Convert reference fields to duplicate'),
          onClick: () => handleConvertFieldsToCopy(model, t),
          sort: -6,
          group: 'common-actions',
        });
      } else {
        items.push({
          key: 'block-reference:convert-to-template',
          label: pluginT('Save as template'),
          onClick: () => handleConvertToTemplate(model, t),
          sort: -10,
          group: 'common-actions',
        });
      }
      return items;
    },
  });

  ReferenceBlockModel.registerExtraMenuItems({
    group: 'common-actions',
    sort: -5,
    matcher: () => true,
    items: async (model: FlowModel, t) => {
      const pluginT = getPluginT(model);
      const items: MenuItem[] = [];
      const tpl = model.getStepParams('referenceSettings', 'useTemplate') || {};
      const hasTpl = !!tpl?.templateUid;
      if (hasTpl) {
        items.push({
          key: 'block-reference:convert-to-copy',
          label: pluginT('Convert reference to duplicate'),
          onClick: () => handleConvertToCopy(model, t),
          sort: -5,
          group: 'common-actions',
        });
      }
      return items;
    },
  });

  // Register popup template menu items on FlowModel base class with matcher
  // This ensures any model with popupSettings flow (not just PopupActionModel) gets these menu items
  FlowModel.registerExtraMenuItems({
    group: 'common-actions',
    sort: -8,
    matcher: (model) => {
      // Check if model has popupSettings flow
      const popupFlow = model.getFlow?.('popupSettings');
      if (!popupFlow) return false;

      // 对于字段，检查是否启用了 click-to-open
      // 如果是字段但没有启用 click-to-open，不显示弹窗相关菜单
      const displayFieldSettingsFlow = model.getFlow?.('displayFieldSettings');
      if (displayFieldSettingsFlow) {
        const clickToOpen = model.getStepParams?.('displayFieldSettings', 'clickToOpen')?.clickToOpen;
        // 如果显式设置了 clickToOpen 为 false，不显示菜单
        if (clickToOpen === false) {
          return false;
        }
        // 如果未设置 clickToOpen，对于非关联字段默认不显示
        if (clickToOpen === undefined) {
          const collectionField = (model.context as any)?.collectionField;
          if (collectionField && !collectionField?.isAssociationField?.()) {
            return false;
          }
        }
      }

      return true;
    },
    items: async (model: FlowModel, t) => {
      const popupFlow = model.getFlow?.('popupSettings');
      const resolveOpenViewStepKey = (flow: any): string | undefined => {
        const steps = flow?.steps || {};
        if (steps?.openView) return 'openView';
        const found = Object.entries(steps).find(([, def]) => (def as any)?.use === 'openView');
        return found?.[0];
      };
      const openViewStepKey =
        (model.getStepParams('popupSettings', 'openView') !== undefined && 'openView') ||
        resolveOpenViewStepKey(popupFlow) ||
        'openView';
      const openViewParams = model.getStepParams('popupSettings', openViewStepKey) || {};
      const templateUid =
        typeof (openViewParams as any)?.popupTemplateUid === 'string'
          ? (openViewParams as any).popupTemplateUid.trim()
          : '';
      const hasTemplate = !!templateUid;
      const disablePopupTemplateMenu = !!(openViewParams as any)?.disablePopupTemplateMenu;
      const pluginT = getPluginT(model);
      if (hasTemplate) {
        return [
          {
            key: 'block-reference:convert-popup-template-to-copy',
            label: pluginT('Convert reference to duplicate'),
            onClick: () => handleConvertPopupTemplateToCopy(model, t),
            sort: -8,
          },
        ];
      }
      if (disablePopupTemplateMenu) {
        return [];
      }
      return [
        {
          key: 'block-reference:save-popup-as-template',
          label: pluginT('Save as template'),
          onClick: () => handleSavePopupAsTemplate(model, t),
          sort: -8,
        },
      ];
    },
  });
}
