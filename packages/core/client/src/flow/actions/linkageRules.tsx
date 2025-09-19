/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionScene,
  defineAction,
  escapeT,
  FlowContext,
  FlowModel,
  useFlowContext,
  useFlowEngine,
} from '@nocobase/flow-engine';
import { evaluateConditions, FilterGroupType } from '@nocobase/utils/client';
import React from 'react';
import { Collapse, Input, Button, Switch, Space, Tooltip, Empty, Dropdown, Select } from 'antd';
import {
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CopyOutlined,
  PlusOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { uid } from '@formily/shared';
import { observer } from '@formily/react';
import { FilterGroup } from '../components/filter/FilterGroup';
import { LinkageFilterItem } from '../components/filter';
import { CodeEditor } from '../components/code-editor';
import { FieldAssignValueInput } from '../components/FieldAssignValueInput';
import _ from 'lodash';

interface LinkageRule {
  /** 随机生成的字符串 */
  key: string;
  /** 联动规则的标题 */
  title: string;
  /** 是否启用，默认为 true */
  enable: boolean;
  /** 联动规则的条件部分 */
  condition: FilterGroupType;
  /** 联动规则的动作部分 */
  actions: {
    key: string;
    name: string;
    params?: any;
  }[];
}

let currentLinkageRules = null;

// 获取表单中所有字段的 model 实例的通用函数
const getFormFields = (ctx: any) => {
  try {
    const gridModels = ctx.model?.subModels?.grid?.subModels?.items || [];
    const fields = gridModels;
    return fields.map((model: any) => ({
      label: model.props.label || model.props.name,
      value: model.uid,
      model,
    }));
  } catch (error) {
    console.warn('Failed to get form fields:', error);
    return [];
  }
};

export const linkageSetBlockProps = defineAction({
  name: 'linkageSetBlockProps',
  title: 'Block properties',
  scene: ActionScene.BLOCK_LINKAGE_RULES,
  sort: 100,
  uiSchema: {
    value: {
      type: 'string',
      'x-component': (props) => {
        const { value, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        return (
          <Select
            value={value}
            onChange={onChange}
            placeholder={t('Please select a state')}
            style={{ width: '100%' }}
            options={[
              { label: t('Show block'), value: 'show' },
              { label: t('Hide block'), value: 'hide' },
            ]}
            allowClear
          />
        );
      },
    },
  },
  handler(ctx, { value, setProps }) {
    setProps(ctx.model, { hiddenModel: value === 'hide' });
  },
});

export const linkageSetActionProps = defineAction({
  name: 'linkageSetActionProps',
  title: 'Button properties',
  scene: ActionScene.ACTION_LINKAGE_RULES,
  sort: 100,
  uiSchema: {
    value: {
      type: 'string',
      'x-component': (props) => {
        const { value, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        return (
          <Select
            value={value}
            onChange={onChange}
            placeholder={t('Please select a state')}
            style={{ width: '100%' }}
            options={[
              { label: t('Show button'), value: 'show' },
              { label: t('Hide button'), value: 'hide' },
              { label: t('Enable button'), value: 'enable' },
              { label: t('Disable button'), value: 'disable' },
            ]}
            allowClear
          />
        );
      },
    },
  },
  handler(ctx, { value, setProps }) {
    setProps(ctx.model, { hiddenModel: value === 'hide', disabled: value === 'disable' });
  },
});

export const linkageSetFieldProps = defineAction({
  name: 'linkageSetFieldProps',
  title: 'Field properties',
  scene: ActionScene.FIELD_LINKAGE_RULES,
  sort: 100,
  uiSchema: {
    value: {
      type: 'object',
      'x-component': (props) => {
        const { value = { fields: [] }, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        const fieldOptions = getFormFields(ctx);

        // 状态选项
        const stateOptions = [
          { label: t('Show'), value: 'show' },
          { label: t('Hide'), value: 'hide' },
          { label: t('Hide (keep value)'), value: 'hideKeepValue' },
          { label: t('Required'), value: 'required' },
          { label: t('Optional'), value: 'optional' },
          { label: t('Disabled'), value: 'disabled' },
          { label: t('Enabled'), value: 'enabled' },
        ];

        const handleFieldsChange = (selectedFields: string[]) => {
          onChange({
            ...value,
            fields: selectedFields,
          });
        };

        const handleStateChange = (selectedState: string) => {
          onChange({
            ...value,
            state: selectedState,
          });
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ marginBottom: '4px', fontSize: '14px' }}>{t('Fields')}</div>
              <Select
                mode="multiple"
                value={value.fields}
                onChange={handleFieldsChange}
                placeholder={t('Please select fields')}
                style={{ width: '100%' }}
                options={fieldOptions}
                showSearch
                // @ts-ignore
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                allowClear
              />
            </div>
            <div>
              <div style={{ marginBottom: '4px', fontSize: '14px' }}>{t('State')}</div>
              <Select
                value={value.state}
                onChange={handleStateChange}
                placeholder={t('Please select state')}
                style={{ width: '100%' }}
                options={stateOptions}
                allowClear
              />
            </div>
          </div>
        );
      },
    },
  },
  handler: (ctx, { value, setProps }) => {
    const { fields, state } = value || {};

    if (!fields || !Array.isArray(fields) || !state) {
      return;
    }

    // 根据 uid 找到对应的字段 model 并设置属性
    fields.forEach((fieldUid: string) => {
      try {
        const gridModels = ctx.model?.subModels?.grid?.subModels?.items || [];
        const fieldModel = gridModels.find((model: any) => model.uid === fieldUid);

        if (fieldModel) {
          let props: any = {};

          switch (state) {
            case 'show':
              props = { hiddenModel: false };
              break;
            case 'hide':
              props = { hiddenModel: true };
              break;
            case 'hideKeepValue':
              props = { hidden: true };
              break;
            case 'required':
              props = { required: true };
              break;
            case 'optional':
              props = { required: false };
              break;
            case 'disabled':
              props = { disabled: true };
              break;
            case 'enabled':
              props = { disabled: false };
              break;
            default:
              console.warn(`Unknown state: ${state}`);
              return;
          }

          setProps(fieldModel as FlowModel, props);
        }
      } catch (error) {
        console.warn(`Failed to set props for field ${fieldUid}:`, error);
      }
    });
  },
});

export const linkageAssignField = defineAction({
  name: 'linkageAssignField',
  title: 'Field assignment',
  scene: ActionScene.FIELD_LINKAGE_RULES,
  sort: 200,
  uiSchema: {
    value: {
      type: 'object',
      'x-component': (props) => {
        const { value = { field: undefined, assignValue: undefined }, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        const fieldOptions = getFormFields(ctx);

        const selectedFieldUid = value.field;

        const handleFieldChange = (selectedField) => {
          const nextField = selectedField;
          const changed = nextField !== selectedFieldUid;
          onChange({
            ...value,
            field: nextField,
            // 切换字段时清空赋值
            assignValue: changed ? undefined : value.assignValue,
          });
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ marginBottom: '4px', fontSize: '14px' }}>{t('Field')}</div>
              <Select
                value={selectedFieldUid}
                onChange={handleFieldChange}
                placeholder={t('Please select field')}
                style={{ width: '100%' }}
                options={fieldOptions}
                showSearch
                // @ts-ignore
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                allowClear
              />
            </div>
            {selectedFieldUid && (
              <div>
                <div style={{ marginBottom: '4px', fontSize: '14px' }}>{t('Assign value')}</div>
                <FieldAssignValueInput
                  key={selectedFieldUid}
                  fieldUid={selectedFieldUid}
                  value={value.assignValue}
                  onChange={(v) => onChange({ ...value, assignValue: v })}
                />
              </div>
            )}
          </div>
        );
      },
    },
  },
  handler: (ctx, { value, setProps }) => {
    // 字段赋值处理逻辑
    const { assignValue, field } = value || {};
    if (!field) return;
    try {
      const gridModels = ctx.model?.subModels?.grid?.subModels?.items || [];
      const fieldModel = gridModels.find((model: any) => model.uid === field);
      if (!fieldModel) return;
      // 若赋值为空（如切换字段后清空），调用一次 setProps 触发清空临时 props，避免旧值残留
      if (typeof assignValue === 'undefined') {
        setProps(fieldModel as FlowModel, {});
        return;
      }
      setProps(fieldModel as FlowModel, { value: assignValue });
    } catch (error) {
      console.warn(`Failed to assign value to field ${field}:`, error);
    }
  },
});

export const linkageRunjs = defineAction({
  name: 'linkageRunjs',
  title: 'Execute JavaScript',
  scene: [ActionScene.BLOCK_LINKAGE_RULES, ActionScene.FIELD_LINKAGE_RULES, ActionScene.ACTION_LINKAGE_RULES],
  sort: 300,
  uiSchema: {
    value: {
      type: 'object',
      'x-component': (props) => {
        const { value = { script: '' }, onChange } = props;
        const handleScriptChange = (script: string) => {
          onChange({
            ...value,
            script,
          });
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* <div
              style={{
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '6px',
                padding: '12px',
              }}
            >
              <div style={{ color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
                预留一个位置，用于显示一些提示信息
              </div>
            </div> */}
            <div>
              <CodeEditor value={value.script} onChange={handleScriptChange} height="200px" enableLinter={true} />
            </div>
          </div>
        );
      },
    },
  },
  handler: (ctx, { value }) => {
    // 执行 JS 脚本处理逻辑
    const { script } = value || {};

    if (!script || typeof script !== 'string') {
      return;
    }

    try {
      ctx.runjs(script);
    } catch (error) {
      console.error('Script execution error:', error);
      // 可以选择显示错误信息给用户
      if (ctx.app?.message) {
        ctx.app.message.error(`Script execution error: ${error.message}`);
      }
    }
  },
});

const LinkageRulesUI = observer(
  (props: { readonly value: LinkageRule[]; supportedActions: string[]; title?: string }) => {
    const { value: rules, supportedActions, title = 'Linkage rules' } = props;
    currentLinkageRules = rules;
    const ctx = useFlowContext();
    const flowEngine = useFlowEngine();
    const [submitLoading, setSubmitLoading] = React.useState(false);
    const t = ctx.model.translate.bind(ctx.model);

    // 创建新规则的默认值
    const createNewRule = (): LinkageRule => ({
      key: uid(),
      title: t('Linkage rule'),
      enable: true,
      condition: { logic: '$and', items: [] } as FilterGroupType,
      actions: [],
    });

    // 添加新规则
    const handleAddRule = () => {
      rules.push(createNewRule());
    };

    // 删除规则
    const handleDeleteRule = (index: number) => {
      rules.splice(index, 1);
    };

    // 上移规则
    const handleMoveUp = (index: number) => {
      if (index > 0) {
        const rule = rules[index];
        rules.splice(index, 1);
        rules.splice(index - 1, 0, rule);
      }
    };

    // 下移规则
    const handleMoveDown = (index: number) => {
      if (index < rules.length - 1) {
        const rule = rules[index];
        rules.splice(index, 1);
        rules.splice(index + 1, 0, rule);
      }
    };

    // 复制规则
    const handleCopyRule = (index: number) => {
      const originalRule = rules[index];
      const newRule: LinkageRule = {
        ...originalRule,
        key: uid(),
        title: `${originalRule.title} (Copy)`,
      };
      rules.splice(index + 1, 0, newRule);
    };

    // 更新规则标题
    const handleTitleChange = (index: number, title: string) => {
      rules[index].title = title;
    };

    // 切换规则启用状态
    const handleToggleEnable = (index: number, enable: boolean) => {
      rules[index].enable = enable;
    };

    // 获取可用的动作类型
    const getActionsDefinition = () => {
      return supportedActions.map((actionName: string) => ctx.getAction(actionName));
    };

    // 添加动作
    const handleAddAction = (ruleIndex: number, actionName: string) => {
      const newAction = {
        key: uid(),
        name: actionName,
        params: undefined,
      };
      rules[ruleIndex].actions.push(newAction);
    };

    // 删除动作
    const handleDeleteAction = (ruleIndex: number, actionIndex: number) => {
      rules[ruleIndex].actions.splice(actionIndex, 1);
    };

    // 更新动作的值
    const handleActionValueChange = (ruleIndex: number, actionIndex: number, value: any) => {
      rules[ruleIndex].actions[actionIndex].params = value;
    };

    // 生成折叠面板的自定义标题
    const renderPanelHeader = (rule: LinkageRule, index: number) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ flex: 1, marginRight: 16 }}>
          <Input
            value={rule.title}
            onChange={(e) => handleTitleChange(index, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Enter rule title"
          />
        </div>
        <Space onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Delete">
            <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteRule(index)} />
          </Tooltip>
          <Tooltip title="Move up">
            <Button
              type="text"
              size="small"
              icon={<ArrowUpOutlined />}
              onClick={() => handleMoveUp(index)}
              disabled={index === 0}
            />
          </Tooltip>
          <Tooltip title="Move down">
            <Button
              type="text"
              size="small"
              icon={<ArrowDownOutlined />}
              onClick={() => handleMoveDown(index)}
              disabled={index === rules.length - 1}
            />
          </Tooltip>
          <Tooltip title="Copy">
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopyRule(index)} />
          </Tooltip>
          <Switch
            size="small"
            checked={rule.enable}
            onChange={(checked) => handleToggleEnable(index, checked)}
            checkedChildren={t('Enable')}
            unCheckedChildren={t('Disable')}
          />
        </Space>
      </div>
    );

    // 生成折叠面板项
    const collapseItems = rules.map((rule, index) => ({
      key: rule.key,
      label: renderPanelHeader(rule, index),
      styles: {
        header: {
          display: 'flex',
          alignItems: 'center',
        },
      },
      children: (
        <div>
          {/* 条件部分 */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '16px',
                  backgroundColor: '#1890ff',
                  borderRadius: '2px',
                  marginRight: 8,
                }}
              ></div>
              <h4
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#262626',
                }}
              >
                {t('Condition')}
              </h4>
            </div>
            <div style={{ paddingLeft: 12 }}>
              <FilterGroup
                value={rule.condition}
                FilterItem={(props) => <LinkageFilterItem model={ctx.model} value={props.value} />}
              />
            </div>
          </div>

          {/* 动作部分 */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '16px',
                  backgroundColor: '#52c41a',
                  borderRadius: '2px',
                  marginRight: 8,
                }}
              ></div>
              <h4
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#262626',
                }}
              >
                {t('Actions')}
              </h4>
            </div>
            <div style={{ paddingLeft: 12 }}>
              {/* 渲染已有的动作 */}
              {rule.actions.length > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  {rule.actions.map((action, actionIndex) => {
                    const actionDef = ctx.getAction(action.name);
                    if (!actionDef) return null;

                    return (
                      <div
                        key={action.key}
                        style={{
                          border: '1px solid #f0f0f0',
                          borderRadius: '6px',
                          padding: '12px',
                          marginBottom: '8px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                          }}
                        >
                          <span style={{ fontWeight: 500, color: '#262626' }}>{actionDef.title}</span>
                          <Tooltip title="Delete action">
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteAction(index, actionIndex)}
                            />
                          </Tooltip>
                        </div>
                        <div>
                          {flowEngine.flowSettings.renderStepForm({
                            uiSchema: actionDef.uiSchema,
                            initialValues: action.params,
                            flowEngine,
                            onFormValuesChange: (form: any) => handleActionValueChange(index, actionIndex, form.values),
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Add action 按钮 */}
              <Dropdown
                menu={{
                  items: getActionsDefinition().map((action) => ({
                    key: action.name,
                    label: action.title || action.name,
                    onClick: () => handleAddAction(index, action.name),
                  })),
                }}
                trigger={['hover']}
              >
                <Button type="link" icon={<PlusOutlined />} style={{ padding: 0, height: 'auto', textAlign: 'left' }}>
                  {t('Add action')}
                </Button>
              </Dropdown>
            </div>
          </div>
        </div>
      ),
    }));

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: '#fff',
          borderLeft: '1px solid #e0e0e0',
          position: 'relative',
        }}
      >
        {/* 顶部标题栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            backgroundColor: '#fff',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#262626' }}>{t(title)}</div>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            style={{ color: '#8c8c8c' }}
            onClick={() => ctx.view.destroy()}
          />
        </div>

        {/* 内容区域 */}
        <div
          style={{
            flex: 1,
            padding: '16px',
            overflow: 'auto',
            minHeight: 0,
          }}
        >
          {rules.length > 0 ? (
            <Collapse
              items={collapseItems}
              size="small"
              style={{ marginBottom: 8 }}
              defaultActiveKey={rules.length > 0 ? [rules[0].key] : []}
              accordion
            />
          ) : (
            <div
              style={{
                border: '1px dashed #d9d9d9',
                borderRadius: '6px',
                backgroundColor: '#fafafa',
                marginBottom: '8px',
              }}
            >
              <Empty description={t('No linkage rules')} style={{ margin: '20px 0' }} />
            </div>
          )}
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddRule} style={{ width: '100%' }}>
            {t('Add linkage rule')}
          </Button>
        </div>

        {/* 底部按钮区域 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '8px 16px',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#fff',
            flexShrink: 0,
          }}
        >
          <Button onClick={() => ctx.view.destroy()}>{t('Cancel')}</Button>
          <Button
            type="primary"
            loading={submitLoading}
            onClick={async () => {
              setSubmitLoading(true);
              await ctx.view.submit();
              setSubmitLoading(false);
              ctx.view.destroy();
            }}
          >
            {t('Save')}
          </Button>
        </div>
      </div>
    );
  },
);

const commonLinkageRulesHandler = async (ctx: FlowContext, params: any) => {
  const evaluator = (path: string, operator: string, value: any) => {
    return ctx.app.jsonLogic.apply({ [operator]: [path, value] });
  };

  let linkageRules: LinkageRule[] = [];

  if (currentLinkageRules) {
    linkageRules = await ctx.resolveJsonTemplate(currentLinkageRules);
  } else {
    linkageRules = params.value as LinkageRule[];
  }

  const allModels: FlowModel[] = ctx.model.__allModels || (ctx.model.__allModels = []);

  allModels.forEach((model: any) => {
    // 重置临时属性
    model.__props = {};
  });

  // 1. 运行所有的联动规则
  linkageRules
    .filter((rule) => rule.enable)
    .forEach((rule) => {
      const { condition: conditions, actions } = rule;

      if (evaluateConditions(conditions, evaluator)) {
        actions.forEach((action) => {
          const setProps = (
            model: FlowModel & { __originalProps?: any; __props?: any; __shouldReset?: boolean },
            props: any,
          ) => {
            // 存储原始值，用于恢复
            if (!model.__originalProps) {
              model.__originalProps = {
                hiddenModel: model.hidden,
                disabled: undefined,
                required: undefined,
                hidden: undefined,
                ...model.props,
              };
            }

            if (!model.__props) {
              model.__props = {};
            }

            // 临时存起来，遍历完所有规则后，再统一处理
            model.__props = {
              ...model.__props,
              ...props,
            };

            if (allModels.indexOf(model) === -1) {
              allModels.push(model);
            }
          };

          // TODO: 需要改成 runAction 的写法。但 runAction 是异步的，用在这里会不符合预期。后面需要解决这个问题
          ctx.getAction(action.name)?.handler(ctx, { ...action.params, setProps });
        });
      }
    });

  // 2. 最后才实际更改相关 model 的状态
  allModels.forEach((model: FlowModel & { __originalProps?: any; __props?: any; __shouldReset?: boolean }) => {
    const newProps = {
      ...model.__originalProps,
      ...model.__props,
    };

    model.setProps(_.omit(newProps, ['hiddenModel', 'value']));
    model.hidden = !!newProps.hiddenModel;

    // 目前只有表单的“字段赋值”有 value 属性
    if ('value' in newProps && model.context.form) {
      model.context.form.setFieldValue(model.props.name, newProps.value);
    }

    model.__props = null;
  });
};

export const blockLinkageRules = defineAction({
  name: 'blockLinkageRules',
  title: escapeT('Block linkage rules'),
  uiMode: 'embed',
  uiSchema(ctx) {
    return {
      value: {
        type: 'array',
        'x-component': LinkageRulesUI,
        'x-component-props': {
          supportedActions: getSupportedActions(ctx, ActionScene.BLOCK_LINKAGE_RULES),
          title: escapeT('Block linkage rules'),
        },
      },
    };
  },
  defaultParams: {
    value: [],
  },
  handler: commonLinkageRulesHandler,
});

export const actionLinkageRules = defineAction({
  name: 'actionLinkageRules',
  title: escapeT('Linkage rules'),
  uiMode: 'embed',
  uiSchema(ctx) {
    return {
      value: {
        type: 'array',
        'x-component': LinkageRulesUI,
        'x-component-props': {
          supportedActions: getSupportedActions(ctx, ActionScene.ACTION_LINKAGE_RULES),
          title: escapeT('Linkage rules'),
        },
      },
    };
  },
  defaultParams: {
    value: [],
  },
  handler: commonLinkageRulesHandler,
});

export const fieldLinkageRules = defineAction({
  name: 'fieldLinkageRules',
  title: escapeT('Field linkage rules'),
  uiMode: 'embed',
  uiSchema(ctx) {
    return {
      value: {
        type: 'array',
        'x-component': LinkageRulesUI,
        'x-component-props': {
          supportedActions: getSupportedActions(ctx, ActionScene.FIELD_LINKAGE_RULES),
          title: escapeT('Field linkage rules'),
        },
      },
    };
  },
  defaultParams: {
    value: [],
  },
  handler: (ctx, params) => {
    if (ctx.model.hidden) {
      return;
    }
    commonLinkageRulesHandler(ctx, params);
  },
});

function getSupportedActions(ctx: FlowContext, scene: ActionScene) {
  const result = [...ctx.getActions().values()]
    .filter((action) => {
      let scenes = action.scene;
      if (!scenes) {
        return false;
      }

      if (!Array.isArray(scenes)) {
        scenes = [scenes];
      }

      return scenes.includes(scene);
    })
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map((action) => action.name);

  return result;
}
