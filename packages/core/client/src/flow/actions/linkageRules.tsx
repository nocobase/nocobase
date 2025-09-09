/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT, FlowContext, FlowModel, useFlowContext, parseValueToPath } from '@nocobase/flow-engine';
import { evaluateConditions, FilterGroupType } from '@nocobase/utils/client';
import React from 'react';
import { Collapse, Input, Button, Switch, Space, Tooltip, Empty, Dropdown, Select } from 'antd';
import { DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, CopyOutlined, PlusOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { observer } from '@formily/react';
import { FilterGroup } from '../components/filter/FilterGroup';
import { FilterItem, LinkageFilterItem } from '../components/filter';
import { CodeEditor } from '../components/code-editor';
import { DefaultValue } from '../components/DefaultValue';
import _ from 'lodash';

interface LinkageRule {
  /** 随机生成的字符串 */
  key: string;
  /** 联动规则的标题 */
  title: string;
  /** 是否启用，默认为 true */
  enable: boolean;
  /** 联动规则的条件部分 */
  conditions: FilterGroupType;
  /** 联动规则的动作部分 */
  actions: {
    key: string;
    type: string;
    value?: any;
  }[];
}

interface LinkageActions {
  [type: string]: {
    title: string;
    /** 每个动作的配置组件 */
    component: (props: { value: any; onChange: (value: any) => void }) => JSX.Element;
    /** 每个动作的处理函数 */
    handler: (params: {
      /** 流上下文 */
      ctx: FlowContext;
      /** 当前动作的值 */
      value: any;
      /** 封装好的用来更新 model 状态的函数。里面会处理一些额外的逻辑 */
      setProps: (model: FlowModel, props: any) => void;
    }) => void;
  };
}

const linkageActions: LinkageActions = {
  // 区块属性设置
  setBlockProps: {
    title: '区块属性设置',
    component: (props) => {
      const { value, onChange } = props;

      return (
        <Select
          value={value}
          onChange={onChange}
          placeholder="请选择一个状态"
          style={{ width: '100%' }}
          options={[
            { label: '显示区块', value: 'show' },
            { label: '隐藏区块', value: 'hide' },
          ]}
          allowClear
        />
      );
    },
    handler: ({ ctx, value, setProps }) => {
      setProps(ctx.model, { hiddenModel: value === 'hide' });
    },
  },
  // 按钮属性设置
  setActionProps: {
    title: '按钮属性设置',
    component: (props) => {
      const { value, onChange } = props;

      return (
        <Select
          value={value}
          onChange={onChange}
          placeholder="请选择一个状态"
          style={{ width: '100%' }}
          options={[
            { label: '显示按钮', value: 'show' },
            { label: '隐藏按钮', value: 'hide' },
            { label: '启用按钮', value: 'enable' },
            { label: '禁用按钮', value: 'disable' },
          ]}
          allowClear
        />
      );
    },
    handler: ({ ctx, value, setProps }) => {
      setProps(ctx.model, { hiddenModel: value === 'hide', disabled: value === 'disable' });
    },
  },
  // 字段属性设置
  setFieldProps: {
    title: '字段属性设置',
    component: (props) => {
      const { value = { fields: [] }, onChange } = props;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const ctx = useFlowContext();

      // 获取表单中所有字段的 model 实例
      const getFormFields = () => {
        try {
          const gridModels = ctx.model?.subModels?.grid?.subModels?.items || [];
          const fields = gridModels;
          return fields.map((model: any) => ({
            label: model.props.title || model.props.name,
            value: model.uid,
            model,
          }));
        } catch (error) {
          console.warn('Failed to get form fields:', error);
          return [];
        }
      };

      const fieldOptions = getFormFields();

      // 状态选项
      const stateOptions = [
        { label: '显示', value: 'show' },
        { label: '隐藏', value: 'hide' },
        { label: '隐藏（保留值）', value: 'hideKeepValue' },
        { label: '必填', value: 'required' },
        { label: '非必填', value: 'optional' },
        { label: '禁用', value: 'disabled' },
        { label: '启用', value: 'enabled' },
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
            <div style={{ marginBottom: '4px', fontSize: '14px' }}>字段</div>
            <Select
              mode="multiple"
              value={value.fields}
              onChange={handleFieldsChange}
              placeholder="请选择字段"
              style={{ width: '100%' }}
              options={fieldOptions}
              showSearch
              // @ts-ignore
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              allowClear
            />
          </div>
          <div>
            <div style={{ marginBottom: '4px', fontSize: '14px' }}>状态</div>
            <Select
              value={value.state}
              onChange={handleStateChange}
              placeholder="请选择状态"
              style={{ width: '100%' }}
              options={stateOptions}
              allowClear
            />
          </div>
        </div>
      );
    },
    handler: ({ ctx, value, setProps }) => {
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
  },
  // 字段赋值
  assignField: {
    title: '字段赋值',
    component: (props) => {
      const { value = { fields: [], assignValue: '' }, onChange } = props;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const ctx = useFlowContext();

      // 获取表单中所有字段的 model 实例
      const getFormFields = () => {
        try {
          const gridModels = ctx.model?.subModels?.grid?.subModels?.items || [];
          const fields = gridModels;
          return fields.map((model: any) => ({
            label: model.props.title || model.props.name,
            value: model.uid,
            model,
          }));
        } catch (error) {
          console.warn('Failed to get form fields:', error);
          return [];
        }
      };

      const fieldOptions = getFormFields();

      const handleFieldsChange = (selectedFields: string[]) => {
        onChange({
          ...value,
          fields: selectedFields,
        });
      };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ marginBottom: '4px', fontSize: '14px' }}>字段</div>
            <Select
              mode="multiple"
              value={value.fields}
              onChange={handleFieldsChange}
              placeholder="请选择字段"
              style={{ width: '100%' }}
              options={fieldOptions}
              showSearch
              // @ts-ignore
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </div>
          <div>
            <div style={{ marginBottom: '4px', fontSize: '14px' }}>赋值</div>
            <DefaultValue value={value.assignValue} onChange={(v) => onChange({ ...value, assignValue: v })} />
          </div>
        </div>
      );
    },
    handler: ({ ctx, value, setProps }) => {
      // 字段赋值处理逻辑
      const { fields, assignValue } = value || {};

      if (!fields || !Array.isArray(fields) || !assignValue) {
        return;
      }

      // 根据 uid 找到对应的字段 model 并设置值
      fields.forEach((fieldUid: string) => {
        try {
          const gridModels = ctx.model?.subModels?.grid?.subModels?.items || {};
          const fieldModel = Object.values(gridModels).find((model: any) => model.uid === fieldUid);

          if (fieldModel) {
            // 设置字段的值
            setProps(fieldModel as FlowModel, { value: assignValue });
          }
        } catch (error) {
          console.warn(`Failed to assign value to field ${fieldUid}:`, error);
        }
      });
    },
  },
  // 执行 JavaScript
  runjs: {
    title: 'Execute JavaScript',
    component: (props) => {
      const { value = { script: '' }, onChange } = props;
      const handleScriptChange = (script: string) => {
        onChange({
          ...value,
          script,
        });
      };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px',
              padding: '12px',
            }}
          >
            <div style={{ color: '#666', fontSize: '12px', lineHeight: '1.5' }}>预留一个位置，用于显示一些提示信息</div>
          </div>
          <div>
            <CodeEditor value={value.script} onChange={handleScriptChange} height="200px" enableLinter={true} />
          </div>
        </div>
      );
    },
    handler: ({ ctx, value }) => {
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
          ctx.app.message.error(`脚本执行错误: ${error.message}`);
        }
      }
    },
  },
};

const LinkageRulesUI = observer((props: { readonly value: LinkageRule[]; supportedActions: string[] }) => {
  const { value: rules, supportedActions } = props;
  const ctx = useFlowContext();

  // 创建新规则的默认值
  const createNewRule = (): LinkageRule => ({
    key: uid(),
    title: 'Linkage rule',
    enable: true,
    conditions: { logic: '$and', items: [] } as FilterGroupType,
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
  const getAvailableActions = () => {
    return supportedActions.filter((actionType: string) => linkageActions[actionType]);
  };

  // 添加动作
  const handleAddAction = (ruleIndex: number, actionType: string) => {
    const newAction = {
      key: uid(),
      type: actionType,
      value: undefined,
    };
    rules[ruleIndex].actions.push(newAction);
  };

  // 删除动作
  const handleDeleteAction = (ruleIndex: number, actionIndex: number) => {
    rules[ruleIndex].actions.splice(actionIndex, 1);
  };

  // 更新动作的值
  const handleActionValueChange = (ruleIndex: number, actionIndex: number, value: any) => {
    rules[ruleIndex].actions[actionIndex].value = value;
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
          checkedChildren="启用"
          unCheckedChildren="禁用"
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
              条件
            </h4>
          </div>
          <div style={{ paddingLeft: 12 }}>
            <FilterGroup
              value={rule.conditions}
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
              动作
            </h4>
          </div>
          <div style={{ paddingLeft: 12 }}>
            {/* 渲染已有的动作 */}
            {rule.actions.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                {rule.actions.map((action, actionIndex) => {
                  const actionDef = linkageActions[action.type];
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
                        {React.createElement(actionDef.component, {
                          value: action.value,
                          onChange: (value: any) => handleActionValueChange(index, actionIndex, value),
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
                items: getAvailableActions().map((actionType) => ({
                  key: actionType,
                  label: linkageActions[actionType]?.title || actionType,
                  onClick: () => handleAddAction(index, actionType),
                })),
              }}
              trigger={['hover']}
            >
              <Button type="link" icon={<PlusOutlined />} style={{ padding: 0, height: 'auto', textAlign: 'left' }}>
                Add action
              </Button>
            </Dropdown>
          </div>
        </div>
      </div>
    ),
  }));

  return (
    <div>
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
          <Empty description="No linkage rules" style={{ margin: '20px 0' }} />
        </div>
      )}
      <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddRule} style={{ width: '100%' }}>
        Add linkage rule
      </Button>
    </div>
  );
});

const commonLinkageRulesHandler = (ctx: FlowContext, params: any) => {
  const evaluator = (path: string, operator: string, value: any) => {
    return ctx.app.jsonLogic.apply({ [operator]: [path, value] });
  };

  const linkageRules = params.value as LinkageRule[];
  const allModels: FlowModel[] = ctx.model.__allModels || (ctx.model.__allModels = []);
  const ruleItemModels: FlowModel[] = ctx.model.__ruleModels || (ctx.model.__ruleModels = {});

  // 1. 运行所有的联动规则
  linkageRules
    .filter((rule) => rule.enable)
    .forEach((rule) => {
      const { conditions, actions } = rule;
      const models = ruleItemModels[rule.key] || (ruleItemModels[rule.key] = []);

      if (evaluateConditions(conditions, evaluator)) {
        actions.forEach((action) => {
          const handler = linkageActions[action.type]?.handler;

          if (!handler) {
            throw new Error(`Unknown action type: ${action.type}`);
          }

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

            if (model.__shouldReset) {
              model.__props = {};
              model.__shouldReset = false;
            }

            // 临时存起来，遍历完所有规则后，再统一处理
            model.__props = {
              ...model.__props,
              ...props,
            };

            if (models.indexOf(model) === -1) {
              models.push(model);
            }

            if (allModels.indexOf(model) === -1) {
              allModels.push(model);
            }
          };

          handler({ ctx, value: action.value, setProps });
        });
      } else {
        // 条件不满足时重置状态
        models.forEach((model: any) => {
          model.__props = {};
          model.__shouldReset = false;
        });
      }
    });

  // 2. 最后才实际更改相关 model 的状态
  allModels.forEach((model: FlowModel & { __originalProps?: any; __props?: any; __shouldReset?: boolean }) => {
    const newProps = {
      ...model.__originalProps,
      ...model.__props,
    };

    model.setProps(_.omit(newProps, 'hiddenModel'));
    model.hidden = !!newProps.hiddenModel;

    model.__shouldReset = true;
  });
};

export const blockLinkageRules = defineAction({
  name: 'blockLinkageRules',
  title: escapeT('Block linkage Rules'),
  uiSchema: {
    value: {
      type: 'array',
      'x-component': LinkageRulesUI,
      'x-component-props': {
        supportedActions: ['setBlockProps', 'runjs'],
      },
    },
  },
  defaultParams: {
    value: [],
  },
  handler: commonLinkageRulesHandler,
});

export const actionLinkageRules = defineAction({
  name: 'actionLinkageRules',
  title: escapeT('Linkage Rules'),
  uiSchema: {
    value: {
      type: 'array',
      'x-component': LinkageRulesUI,
      'x-component-props': {
        supportedActions: ['setActionProps', 'runjs'],
      },
    },
  },
  defaultParams: {
    value: [],
  },
  handler: commonLinkageRulesHandler,
});

export const fieldLinkageRules = defineAction({
  name: 'fieldLinkageRules',
  title: escapeT('Field linkage Rules'),
  uiSchema: {
    value: {
      type: 'array',
      'x-component': LinkageRulesUI,
      'x-component-props': {
        supportedActions: ['setFieldProps', 'assignField', 'runjs'],
      },
    },
  },
  defaultParams: {
    value: [],
  },
  handler: commonLinkageRulesHandler,
  afterParamsSave(ctx) {
    // 保存后，自动运行一次
    ctx.model.applyFlow('eventSettings');
  },
});
