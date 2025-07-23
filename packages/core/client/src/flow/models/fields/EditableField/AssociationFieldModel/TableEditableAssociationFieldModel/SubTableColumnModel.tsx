/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { EditOutlined } from '@ant-design/icons';
import {
  DragHandler,
  Droppable,
  escapeT,
  FlowsFloatContextMenu,
  FlowModelRenderer,
  useFlowEngine,
} from '@nocobase/flow-engine';
import { observer } from '@formily/react';
import { TableColumnProps, Tooltip } from 'antd';
import React, { useRef } from 'react';
import { FieldModel } from '../../../../base/FieldModel';
import { EditableFieldModel } from '../../EditableFieldModel';
import { uid } from '@formily/shared';

const LargeFieldEdit = observer(
  ({ model, params: { fieldPath, dataSourceKey, collectionName }, defaultValue }: any) => {
    const flowEngine = useFlowEngine();
    const ref = useRef(null);
    return (
      <div ref={ref}>
        <span>{model.field?.value || defaultValue?.[fieldPath]}</span>
        <EditOutlined
          className="edit-icon"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
              await flowEngine.context.viewOpener.open({
                mode: 'popover',
                target: e.target,
                placement: 'rightTop',
                styles: {
                  body: {
                    maxWidth: 400,
                  },
                },
                content: (popover) => {
                  return (
                    <>
                      <FlowModelRenderer model={model} uid={model.uid} />
                    </>
                  );
                },
              });
            } catch (error) {
              console.log(error);
            }
          }}
        />
      </div>
    );
  },
);

export class SubTableColumnModel extends FieldModel {
  getColumnProps(): TableColumnProps {
    const titleContent = (
      <Droppable model={this}>
        <FlowsFloatContextMenu
          model={this}
          containerStyle={{ display: 'block', padding: '11px 7px', margin: '-11px -7px' }}
          showBorder={false}
          settingsMenuLevel={2}
          extraToolbarItems={[
            {
              key: 'drag-handler',
              component: DragHandler,
              sort: 1,
            },
          ]}
        >
          <div
            className={css`
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              width: calc(${this.props.width}px - 16px);
            `}
          >
            {this.props.title || this.collectionField.title}
          </div>
        </FlowsFloatContextMenu>
      </Droppable>
    );
    return {
      ...this.props,
      ellipsis: true,
      title: this.props.tooltip ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {titleContent}
          <Tooltip title={this.props.tooltip}>
            <QuestionCircleOutlined style={{ cursor: 'pointer' }} />
          </Tooltip>
        </span>
      ) : (
        titleContent
      ),
      onCell: (record, recordIndex) => ({
        record,
        recordIndex,
        width: this.props.width,
        editable: this.props.editable,
        dataIndex: this.props.dataIndex,
        title: this.props.title,
        model: this,
        // handleSave,
      }),
      render: this.render(),
    };
  }

  render() {
    return (value, record, index) => (
      <div>
        {this.mapSubModels('field', (action: EditableFieldModel) => {
          record.__key = record.__key || uid();
          action.enableFormItem = false;
          const fork: any = action.createFork({}, `${record.__key}`);
          fork.context.defineProperty('basePath', {
            get: () => {
              const basePath = (this.parent as FieldModel).fieldPath;
              return `${basePath}.${index}`;
            },
            cache: false,
          });
          fork.applyFlow('formItemSettings');
          if (fork.constructor.isLargeField) {
            return (
              <LargeFieldEdit
                model={fork}
                params={{
                  fieldPath: action.fieldPath,
                  collectionName: action.collectionField.collection.name,
                  dataSourceKey: action.collectionField.dataSourceKey,
                }}
                defaultValue={value}
              />
            );
          } else {
            return <FlowModelRenderer model={fork} key={record.__key} />;
          }
        })}
      </div>
    );
  }
}

SubTableColumnModel.define({
  title: escapeT('Table column'),
  icon: 'TableColumn',
  defaultOptions: {
    use: 'SubTableColumnModel',
  },
  sort: 0,
});

SubTableColumnModel.registerFlow({
  key: 'subTableColumnSettings',
  auto: true,
  sort: 500,
  title: escapeT('Table column settings'),
  steps: {
    init: {
      async handler(ctx, params) {
        const field = ctx.model.collectionField;
        if (!field) {
          return;
        }
        ctx.model.setProps('title', field.title);
        ctx.model.setProps('dataIndex', field.name);
        await ctx.model.applySubModelsAutoFlows('field');
      },
    },
    title: {
      title: escapeT('Column title'),
      uiSchema: (ctx) => {
        return {
          title: {
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            'x-component-props': {
              placeholder: escapeT('Column title'),
            },
            'x-reactions': (field) => {
              const { model } = ctx;
              const originTitle = model.collectionField?.title;
              field.decoratorProps = {
                ...field.decoratorProps,
                extra: model.context.t('Original field title: ') + (model.context.t(originTitle) ?? ''),
              };
            },
          },
        };
      },
      defaultParams: (ctx) => {
        return {
          title: ctx.model.collectionField?.title,
        };
      },
      handler(ctx, params) {
        const title = ctx.t(params.title || ctx.model.collectionField?.title);
        ctx.model.setProps('title', title);
      },
    },
    tooltip: {
      title: escapeT('Tooltip'),
      uiSchema: {
        tooltip: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setProps('tooltip', params.tooltip);
      },
    },
    width: {
      title: escapeT('Column width'),
      uiSchema: {
        width: {
          'x-component': 'NumberPicker',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        width: 200,
      },
      handler(ctx, params) {
        ctx.model.setProps('width', params.width);
      },
    },
  },
});

SubTableColumnModel.define({
  hide: true,
});
