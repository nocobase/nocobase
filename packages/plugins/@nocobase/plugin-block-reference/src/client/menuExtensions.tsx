/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Button, Form, Input, Space, Switch, Typography } from 'antd';
import _ from 'lodash';
import { FlowModel, createBlockScopedEngine } from '@nocobase/flow-engine';
import { BlockModel } from '@nocobase/client';
import { ReferenceBlockModel } from './models/ReferenceBlockModel';
import { duplicateModelTreeLocally } from './utils/flowModelClone';

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

const GRID_REF_FLOW_KEY = 'referenceFormGridSettings';
const GRID_REF_STEP_KEY = 'target';

type ReferenceFormGridTargetSettings = {
  templateUid: string;
  templateName?: string;
  targetUid: string;
  sourcePath?: string;
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
  const sourcePath = String((raw as any).sourcePath || '').trim() || undefined;
  return { grid, settings: { templateUid, templateName, targetUid, sourcePath } };
}

async function handleConvertToTemplate(model: FlowModel, t: (k: string, opt?: any) => string) {
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
      let targetUid = model.uid;
      if (!values.replace) {
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
        rootUse: model.use,
        dataSourceKey: getResourceVal('dataSourceKey') || getResourceVal('dataSource') || resourceInit?.dataSourceKey,
        collectionName: getResourceVal('collectionName') || resourceInit?.collectionName,
        associationName: getResourceVal('associationName') || resourceInit?.associationName,
        filterByTk: getRawInitVal('filterByTk') ?? getResourceVal('filterByTk'),
        sourceId: getRawInitVal('sourceId') ?? getResourceVal('sourceId'),
        detachParent: !!values.replace,
      };
      const res = await api.resource('flowModelTemplates').create({
        values: payload,
      });
      const tpl = unwrapData(res);
      const tplUid = tpl?.uid || tpl?.data?.uid || tpl?.data?.data?.uid || targetUid;
      model.context.message?.success?.(t('Template created'));

      if (values.replace) {
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
            replace: false,
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
          <Form.Item
            name="replace"
            label={<Typography.Text strong>{t('Replace current block with template?')}</Typography.Text>}
            valuePropName="checked"
          >
            <Switch />
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

async function handleConvertToCopy(model: FlowModel, t: (k: string, opt?: any) => string) {
  const flow = (model.constructor as typeof FlowModel).globalFlowRegistry.getFlow('referenceSettings');
  const stepDef = flow?.steps?.target as any;
  if (!stepDef?.beforeParamsSave) {
    model.context.message?.error?.(t('Convert to copy is unavailable'));
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
  viewer.dialog({
    title: t('Convert to copy'),
    width: 520,
    destroyOnClose: true,
    onClose: release,
    content: (currentDialog: any) => (
      <>
        <div style={{ marginBottom: 16 }}>{t('Are you sure to convert this template block to copy mode?')}</div>
        <currentDialog.Footer>
          <Space align="end">
            <Button
              onClick={() => {
                release();
                currentDialog.close();
              }}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                try {
                  const targetStep = model.getStepParams('referenceSettings', 'target') || {};
                  const params = { ...targetStep, mode: 'copy' };
                  await stepDef.beforeParamsSave({ engine: model.flowEngine, model, exit: () => {} } as any, params);
                  currentDialog.close();
                } catch (e) {
                  console.error(e);
                  model.context.message?.error?.(e instanceof Error ? e.message : String(e));
                }
              }}
            >
              {t('Confirm')}
            </Button>
          </Space>
        </currentDialog.Footer>
      </>
    ),
  });
}

async function handleConvertFieldsToCopy(model: FlowModel, t: (k: string, opt?: any) => string) {
  const resolved = getReferenceFormGridSettings(model);
  if (!resolved) {
    return;
  }
  const { settings } = resolved;
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
      const sourcePath = settings.sourcePath?.trim() || 'subModels.grid';
      if (sourcePath !== 'subModels.grid') {
        throw new Error(`[block-reference] Only 'subModels.grid' is supported (got '${sourcePath}').`);
      }
      const scoped = createBlockScopedEngine(model.flowEngine);
      const root = await scoped.loadModel<FlowModel>({ uid: targetUid, includeAsyncNode: true });
      const fragment = _.get(root as any, sourcePath);
      const gridModel =
        fragment instanceof FlowModel ? fragment : _.castArray(fragment).find((m) => m instanceof FlowModel);
      if (!gridModel) {
        throw new Error(t('Target block is invalid'));
      }

      // 注意：不要使用 flowModels:duplicate（会先落库为 root，save 不会重建 treePath）
      const { duplicated } = duplicateModelTreeLocally(gridModel);

      const newOptions = {
        ...duplicated,
        parentId: model.uid,
        subKey: 'grid',
        subType: 'object' as const,
      };
      const newGrid = model.flowEngine.createModel<FlowModel>(newOptions);
      newGrid.isNew = true;
      model.setSubModel('grid', newGrid);
      await newGrid.afterAddAsSubModel();
      await newGrid.save();
      newGrid.isNew = false;

      // 引用已清理，回退临时标题（移除“字段模板”标记）
      const clearTemplateTitle = (m: FlowModel) => {
        const curTitle = m.title || '';
        const labelCandidates = [t('Field template'), 'Field template', '字段模板', '字段模版']
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
      model.context.message?.error?.(e instanceof Error ? e.message : t('Convert to copy is unavailable'));
    } finally {
      release();
    }
  };

  if (!viewer || typeof viewer.dialog !== 'function') {
    const ok = window.confirm('确定将引用字段转换为复制模式吗？');
    if (ok) await doConvert();
    release();
    return;
  }

  viewer.dialog({
    title: t('Convert fields to copy'),
    width: 520,
    destroyOnClose: true,
    content: (currentDialog: any) => (
      <>
        <div style={{ marginBottom: 16 }}>{t('Are you sure to convert referenced fields to copy mode?')}</div>
        <currentDialog.Footer>
          <Space align="end">
            <Button
              onClick={() => {
                currentDialog.close();
                release();
              }}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                await doConvert();
                currentDialog.close();
              }}
            >
              {t('Confirm')}
            </Button>
          </Space>
        </currentDialog.Footer>
      </>
    ),
    onClose: release,
  });
}

export function registerMenuExtensions() {
  BlockModel.registerExtraMenuItems({
    group: 'common-actions',
    sort: -10,
    matcher: (model) => !(model instanceof ReferenceBlockModel),
    items: async (model: FlowModel, t) => {
      const items: MenuItem[] = [];
      const hasReferenceFields = !!getReferenceFormGridSettings(model);
      if (hasReferenceFields) {
        items.push({
          key: 'block-reference:convert-fields-to-copy',
          label: t('Convert fields to copy'),
          onClick: () => handleConvertFieldsToCopy(model, t),
          sort: -6,
          group: 'common-actions',
        });
      } else {
        items.push({
          key: 'block-reference:convert-to-template',
          label: t('Save as template'),
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
      const items: MenuItem[] = [];
      const tpl = model.getStepParams('referenceSettings', 'useTemplate') || {};
      const hasTpl = !!tpl?.templateUid;
      if (hasTpl) {
        items.push({
          key: 'block-reference:convert-to-copy',
          label: t('Convert to copy'),
          onClick: () => handleConvertToCopy(model, t),
          sort: -5,
          group: 'common-actions',
        });
      }
      return items;
    },
  });
}
