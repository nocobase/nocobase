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
import { FlowModel } from '@nocobase/flow-engine';
import { BlockModel } from '@nocobase/client';
import { ReferenceBlockModel } from './models/ReferenceBlockModel';

type MenuItem = {
  key: string;
  label: React.ReactNode;
  group?: string;
  sort?: number;
  onClick?: () => void;
};

const unwrapData = (val: any) => {
  if (!val) return val;
  if (val.data) return val.data;
  return val;
};

const normalizeTitle = (val?: string) => {
  if (!val) return '';
  return String(val).replace(/\s+/g, ' ').trim();
};

const openConvertDialogs = new WeakSet<FlowModel>();
const openCopyDialogs = new WeakSet<FlowModel>();

async function handleConvertToTemplate(model: FlowModel, t: (k: string, opt?: any) => string) {
  const api = (model as any)?.context?.api;
  const viewer = (model as any)?.context?.viewer;
  if (openConvertDialogs.has(model)) {
    return;
  }
  openConvertDialogs.add(model);
  const viewArgs = (model as any)?.context?.view?.inputArgs || {};
  const resourceCtx = (model as any)?.context?.resource || {};
  const resourceInit = (model as any).getStepParams?.('resourceSettings', 'init') || {};

  const getResourceVal = (key: string) =>
    resourceCtx?.[key] ||
    (typeof resourceCtx?.[`get${_.upperFirst(key)}`] === 'function'
      ? resourceCtx[`get${_.upperFirst(key)}`]()
      : undefined) ||
    viewArgs?.[key];

  const release = () => openConvertDialogs.delete(model);

  const TemplateDialogContent: React.FC<{ currentDialog: any }> = ({ currentDialog }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [closed, setClosed] = useState(false);

    const handleSubmit = async () => {
      const values = await form.validateFields();
      let targetUid = model.uid;
      if (!values.replace) {
        try {
          const duplicated = await api.resource('flowModels').duplicate({ uid: model.uid });
          const dupBody = unwrapData(duplicated);
          targetUid =
            (dupBody && typeof dupBody === 'object' && (dupBody.uid || dupBody.data?.uid)) ||
            (typeof dupBody === 'string' ? dupBody : targetUid);
        } catch (e) {
          // fallback to current uid
        }
      }
      const payload = {
        name: values.name,
        description: values.description,
        targetUid,
        dataSourceKey: getResourceVal('dataSourceKey') || getResourceVal('dataSource') || resourceInit?.dataSourceKey,
        collectionName: getResourceVal('collectionName') || resourceInit?.collectionName,
        filterByTk: getResourceVal('filterByTk') || resourceInit?.filterByTk,
        sourceId: getResourceVal('sourceId') || resourceInit?.sourceId,
        detachParent: !!values.replace,
      };
      const res = await api.resource('flowModelTemplates').create({
        values: payload,
      });
      const tpl = unwrapData(res);
      const tplUid = tpl?.uid || tpl?.data?.uid || tpl?.data?.data?.uid || targetUid;
      (model as any)?.context?.message?.success?.(t('Template created'));

      if (values.replace) {
        const parent = (model as any).parent as FlowModel | undefined;
        const subKey = (model as any).subKey as string;
        const subType = (model as any).subType as 'array' | 'object';
        const engine = model.flowEngine;
        if (!parent || !subKey || !engine) {
          (model as any)?.context?.message?.error?.(t('Parent not found, cannot replace block'));
        } else {
          const newModel = engine.createModel<FlowModel>({
            use: 'ReferenceBlockModel',
            parentId: parent.uid,
            subKey,
            subType,
          } as any);
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
            (newModel as any).sortIndex = insertIndex;
            await (newModel as any).afterAddAsSubModel?.();
          } else {
            parent.setSubModel(subKey, newModel);
            await (newModel as any).afterAddAsSubModel?.();
          }

          await newModel.save();
          await parent.saveStepParams();
          (model as any)?.context?.message?.success?.(t('Replaced with template block'));
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
        // keep dialog open for correction
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
            name: normalizeTitle((model as any)?.title),
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
    title: t('Convert to template'),
    width: 600,
    destroyOnClose: true,
    content: (currentDialog: any) => <TemplateDialogContent currentDialog={currentDialog} />,
  });

  return dialog;
}

async function handleConvertToCopy(model: FlowModel, t: (k: string, opt?: any) => string) {
  const flow = (model.constructor as typeof FlowModel).globalFlowRegistry.getFlow('referenceSettings');
  const stepDef = flow?.steps?.target as any;
  if (!stepDef?.beforeParamsSave) {
    (model as any)?.context?.message?.error?.(t('Convert to copy is unavailable'));
    return;
  }
  const viewer = (model as any)?.context?.viewer;
  if (openCopyDialogs.has(model)) {
    return;
  }
  openCopyDialogs.add(model);
  viewer.dialog({
    title: t('Convert to copy'),
    width: 520,
    destroyOnClose: true,
    content: (currentDialog: any) => (
      <>
        <div style={{ marginBottom: 16 }}>{t('Are you sure to convert this template block to copy mode?')}</div>
        <currentDialog.Footer>
          <Space align="end">
            <Button
              onClick={() => {
                openCopyDialogs.delete(model);
                currentDialog.close();
              }}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                const targetStep = (model as any).getStepParams?.('referenceSettings', 'target') || {};
                const params = { ...targetStep, mode: 'copy' };
                await stepDef.beforeParamsSave({ engine: model.flowEngine, model, exit: () => {} } as any, params);
                openCopyDialogs.delete(model);
                currentDialog.close();
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

export function registerMenuExtensions() {
  BlockModel.registerExtraMenuItems({
    group: 'common-actions',
    sort: -10,
    matcher: (model) => !(model instanceof ReferenceBlockModel),
    items: async (model: FlowModel, t) => {
      const items: MenuItem[] = [];
      items.push({
        key: 'block-reference:convert-to-template',
        label: t('Convert to template'),
        onClick: () => handleConvertToTemplate(model, t),
        sort: -10,
        group: 'common-actions',
      });
      return items;
    },
  });

  ReferenceBlockModel.registerExtraMenuItems({
    group: 'common-actions',
    sort: -5,
    matcher: () => true,
    items: async (model: FlowModel, t) => {
      const items: MenuItem[] = [];
      const tpl = (model as any)?.getStepParams?.('referenceSettings', 'useTemplate') || {};
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
