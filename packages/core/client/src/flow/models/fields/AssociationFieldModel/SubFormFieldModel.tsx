/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { createCollectionContextMeta, escapeT, FlowModelRenderer, useFlowModel } from '@nocobase/flow-engine';
import { Button, Card, Divider, Form, Tooltip } from 'antd';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FormItemModel } from '../../blocks/form/FormItemModel';
import { AssociationFieldModel } from './AssociationFieldModel';

class FormAssociationFieldModel extends AssociationFieldModel {
  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('collection', {
      get: () => this.context.collectionField.targetCollection,
    });
    this.context.defineProperty('prefixFieldPath', {
      get: () => {
        return (this.parent as FormItemModel).fieldPath;
      },
    });
  }
}
export const ObjectNester = (props) => {
  const model: any = useFlowModel();
  const gridModel = model.subModels.grid;
  const rowIndex = model.context.fieldIndex;
  // 在数组子表单场景下，为每个子项创建行内 fork，并透传当前行索引
  const grid = React.useMemo(() => {
    if (rowIndex == null) return gridModel;
    const fork = gridModel.createFork({}, `${rowIndex}`);
    fork.context.defineProperty('fieldIndex', {
      get: () => rowIndex,
    });

    return fork;
  }, [gridModel, rowIndex]);
  useEffect(() => {
    if (props.disabled !== grid.context.parentDisabled) {
      grid.mapSubModels('items', (item) => {
        item.setProps({ disabled: props.disabled });
      });
      grid.context.defineProperty('parentDisabled', {
        get: () => props.disabled,
        cache: false,
      });
    }
  }, [props.disabled, grid]);
  return (
    <Card>
      <FlowModelRenderer model={grid} showFlowSettings={false} />
    </Card>
  );
};
export class SubFormFieldModel extends FormAssociationFieldModel {
  updateAssociation = true;
  onInit(options) {
    super.onInit(options);
  }
  render() {
    return <ObjectNester {...this.props} />;
  }
}

SubFormFieldModel.define({
  label: escapeT('Sub-form'),
  createModelOptions: {
    use: 'SubFormFieldModel',
    subModels: {
      grid: {
        use: 'FormGridModel',
      },
    },
  },
});

const ArrayNester = ({ name, value, disabled }: any) => {
  const model: any = useFlowModel();
  const gridModel = model.subModels.grid;
  const { t } = useTranslation();
  const rowIndex = model.context.fieldIndex || [];
  // 用来缓存每行的 fork，保证每行只创建一次
  const forksRef = useRef<Record<string, any>>({});
  const collectionName = model.context.collectionField.name;
  useEffect(() => {
    gridModel.context.defineProperty('parentDisabled', {
      get: () => disabled,
      cache: false,
    });
  }, [disabled]);
  return (
    <Card
      bordered={true}
      style={{ position: 'relative' }}
      className={css`
        > .ant-card-body > .ant-divider:last-child {
          display: none;
        }
      `}
    >
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => {
              const { key, name: index } = field;
              const uid = `${key}.${name}`;
              // 每行只创建一次 fork
              if (!forksRef.current[uid]) {
                const fork = gridModel.createFork();
                fork.gridContainerRef = React.createRef<HTMLDivElement>();
                fork.context.defineProperty('fieldIndex', {
                  get: () => [...rowIndex, `${collectionName}:${index}`],
                });
                fork.context.defineProperty('currentObject', {
                  get: () => {
                    return fork.context.form.getFieldValue([name, index]);
                  },
                  cache: false,
                  meta: createCollectionContextMeta(() => fork.context.collection, fork.context.t('Current object')),
                });
                forksRef.current[uid] = fork;
              }
              forksRef.current[uid].setProps({
                disabled: disabled,
              });
              return (
                <div key={uid} style={{ marginBottom: 12 }}>
                  {!disabled && (
                    <div style={{ textAlign: 'right' }}>
                      <Tooltip title={t('Remove')}>
                        <CloseOutlined
                          style={{ zIndex: 1000, color: '#a8a3a3' }}
                          onClick={() => {
                            remove(index);
                            // 删除 fork 缓存
                            delete forksRef.current[uid];
                          }}
                        />
                      </Tooltip>
                    </div>
                  )}
                  <FlowModelRenderer model={forksRef.current[uid]} showFlowSettings={false} />
                  <Divider />
                </div>
              );
            })}
            <Button type="link" onClick={() => add()} disabled={disabled}>
              <PlusOutlined />
              {t('Add new')}
            </Button>
          </>
        )}
      </Form.List>
    </Card>
  );
};

export class SubFormListFieldModel extends FormAssociationFieldModel {
  updateAssociation = true;
  onInit(options) {
    super.onInit(options);
    this.context.blockModel.emitter.on('formValuesChange', ({ changedValues, allValues }) => {
      this.dispatchEvent('formValuesChange', { changedValues, allValues }, { debounce: true });
    });

    this.context.defineProperty('currentObject', {
      value: null,
      meta: createCollectionContextMeta(() => this.context.collection, this.context.t('Current object')),
    });
  }
  onMount() {
    super.onMount();
    setTimeout(() => {
      this.applyFlow('eventSettings');
    }, 100);
  }
  render() {
    return <ArrayNester {...this.props} />;
  }
}

SubFormListFieldModel.define({
  label: escapeT('Sub-form'),
  createModelOptions: {
    use: 'SubFormListFieldModel',
    subModels: {
      grid: {
        use: 'FormGridModel',
      },
    },
  },
});

SubFormListFieldModel.registerFlow({
  key: 'eventSettings',
  title: escapeT('Event settings'),
  on: 'formValuesChange',
  steps: {
    linkageRules: {
      use: 'subFormFieldLinkageRules',
      afterParamsSave(ctx) {
        // 保存后，自动运行一次
        ctx.model.applyFlow('eventSettings');
      },
    },
  },
});

FormItemModel.bindModelToInterface('SubFormFieldModel', ['m2o', 'o2o', 'oho', 'obo', 'updatedBy', 'createdBy'], {
  when: (ctx, field) => {
    if (field.targetCollection) {
      return field.targetCollection.template !== 'file';
    }
    return true;
  },
});

FormItemModel.bindModelToInterface('SubFormListFieldModel', ['m2m', 'o2m', 'mbm'], {
  when: (ctx, field) => {
    if (field.targetCollection) {
      return field.targetCollection.template !== 'file';
    }
    return true;
  },
});
