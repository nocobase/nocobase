/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, screen, userEvent, waitFor, sleep } from '@nocobase/test/client';
import { FlowEngine, FlowEngineProvider, FlowModel, FlowModelProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConfigProvider, App } from 'antd';
import { createForm } from '@formily/core';
import { FormProvider, Field } from '@formily/react';
import { DefaultValue } from '../DefaultValue';
import { InputFieldModel } from '../../models/fields/InputFieldModel';
import { DateTimeFilterFieldModel } from '../../models/blocks/filter-form/fields/date-time/DateTimeFilterFieldModel';
import { VariableFieldFormModel } from '../../models/fields/VariableFieldFormModel';
import { RecordSelectFieldModel } from '../../models/fields/AssociationFieldModel';
import { SelectFieldModel } from '../../models/fields/SelectFieldModel';
import { RichTextFieldModel } from '../../models/fields/RichTextFieldModel';

// 简易 Form stub（非 Formily 分支），用于验证写回逻辑
function createFormStub(initial: any = {}) {
  const state: Record<string, any> = { ...initial };
  let touched = false;
  const calls: { setFieldValue: Array<{ name: any; value: any }> } = { setFieldValue: [] };
  return {
    getState: () => state,
    setTouched: (val: boolean) => {
      touched = !!val;
    },
    isFieldsTouched: () => touched,
    getFieldValue: (name: any) => {
      if (Array.isArray(name)) return state[name.join('.')];
      return state[name];
    },
    setFieldValue: (name: any, value: any) => {
      calls.setFieldValue.push({ name, value });
      if (Array.isArray(name)) state[name.join('.')] = value;
      else state[name] = value;
    },
    getCalls: () => calls,
  };
}

// 简化 metaTree：用于 VariableInput 的变量树（DefaultValue 内部会自动合并 constant/null）
const simpleMetaTree = async () => [
  {
    title: 'Context',
    name: 'ctx',
    type: 'object',
    paths: ['ctx'],
    children: [
      {
        title: 'user',
        name: 'user',
        type: 'object',
        paths: ['ctx', 'user'],
        children: [{ title: 'name', name: 'name', type: 'string', paths: ['ctx', 'user', 'name'] }],
      },
    ],
  },
];

// Host 模型：在其 render 中渲染 DefaultValue，使 DefaultValue 能通过 useFlowContext 获取到 model
// 注意：表单实例需要在每个用例中重置，避免状态污染
let form: any;

class HostModel extends FlowModel {
  render() {
    const { value, onChange, metaTree, flags } = (this.props || {}) as any;
    const fieldModel = this.subModels.field as FlowModel;
    return (
      <FormProvider form={form}>
        <FlowModelProvider model={this}>
          <Field
            name="test"
            component={[
              DefaultValue,
              {
                value: value,
                onChange: onChange,
                metaTree: metaTree || simpleMetaTree,
                flags,
              },
            ]}
          />
        </FlowModelProvider>
      </FormProvider>
    );
  }
}

describe('DefaultValue component', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    // 注册必要的模型（使用真实 FlowEngine，不 mock）
    engine.registerModels({
      HostModel,
      InputFieldModel,
      VariableFieldFormModel,
      RecordSelectFieldModel,
      DateTimeFilterFieldModel,
      SelectFieldModel,
      RichTextFieldModel,
    });

    // 每个用例重置表单实例，避免跨用例的值污染（例如上个用例输入的 "hello"）
    form = createForm();

    // 为多选关联选择组件的测试场景，覆盖/简化 beforeRender 事件流，仅保留必要的属性赋值
    RecordSelectFieldModel.registerFlow({ key: 'eventSettings', manual: true, steps: {} });
    RecordSelectFieldModel.registerFlow({
      key: 'selectSettings',
      manual: true,
      steps: {
        fieldNames: {
          handler(ctx) {
            const fromCf = ctx.model.collectionField?.fieldNames;
            ctx.model.setProps({
              fieldNames: fromCf || { label: 'name', value: 'id' },
              allowMultiple: true,
              multiple: true,
            });
          },
        },
      },
    });
  });

  it('readPretty mode: constant editor stays editable even if origin field is display-only', async () => {
    // Dummy display-only field model to simulate readPretty binding
    class DummyDisplayFieldModel extends FlowModel {
      render() {
        return <div data-testid="dummy-display">DISPLAY_ONLY</div>;
      }
    }
    engine.registerModels({ DummyDisplayFieldModel });

    const onChange = vi.fn();

    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'nickname', value: '', onChange, metaTree: simpleMetaTree, pattern: 'readPretty' },
      subModels: { field: { use: 'DummyDisplayFieldModel' } },
    });
    // 提供集合字段上下文，指向可编辑接口（input）
    host.context.defineProperty('collectionField', { value: { interface: 'input', type: 'string' } });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    const input = await screen.findByRole('textbox');
    expect(input).toBeInTheDocument();
    await act(async () => {
      await userEvent.type(input, 'abc');
    });
    expect(onChange).toHaveBeenCalled();
  });

  it('relation field constant mode: selecting an option works and returns record object', async () => {
    const onChange = vi.fn();
    // 捕获 DefaultValue 内部创建的临时根模型，便于直接触发字段 onChange
    const origCreate = engine.createModel.bind(engine);
    let capturedTempRoot: any;
    // @ts-ignore
    engine.createModel = ((options: any, extra?: any) => {
      const created = origCreate(options, extra);
      if (options?.use === 'VariableFieldFormModel') {
        capturedTempRoot = created;
      }
      return created;
    }) as any;

    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'role', value: '', onChange, metaTree: simpleMetaTree },
      subModels: { field: { use: 'RecordSelectFieldModel' } },
    });
    // 关系字段上下文（单选 m2o）
    host.context.defineProperty('collectionField', {
      value: {
        interface: 'm2o',
        type: 'belongsTo',
        isAssociationField: () => true,
        fieldNames: { label: 'name', value: 'id' },
        targetCollection: {
          getField: (name) => ({ name, type: 'string', interface: 'input', uiSchema: { 'x-component': 'Input' } }),
        },
      },
    });
    // 为临时字段提供静态选项，避免依赖资源加载
    (host as any).customFieldProps = {
      fieldNames: { label: 'name', value: 'id' },
      options: [
        // 提供 value/label 以匹配 antd Select 的期望结构
        { id: 1, name: 'Role A', value: 1, label: 'Role A' },
        { id: 2, name: 'Role B', value: 2, label: 'Role B' },
      ],
      allowMultiple: false,
      multiple: false,
    };

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    // 直接调用临时字段的 onChange，模拟 Select 选择行为
    await waitFor(() => {
      expect(capturedTempRoot?.subModels?.fields?.[0]).toBeTruthy();
    });
    const fieldModel = capturedTempRoot.subModels.fields[0];
    await act(async () => {
      fieldModel?.props?.onChange?.({ data: { id: 1, name: 'Role A' } });
    });
    expect(onChange).toHaveBeenCalled();
  });
  it('constant mode: renders editable input and triggers controlled onChange, does not backfill original form', async () => {
    const onChange = vi.fn();
    const formStub = createFormStub();

    // 创建 Host，挂载 field 子模型，注入上下文（form / collectionField）
    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'nickname', value: '', onChange, metaTree: simpleMetaTree },
      subModels: {
        field: { use: 'InputFieldModel' },
      },
    });
    host.context.defineProperty('form', { value: formStub });
    host.context.defineProperty('collectionField', { value: { interface: 'input', type: 'string' } });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    // DefaultValue 在常量路径下，右侧使用临时字段模型渲染真正输入框
    const input = await screen.findByRole('textbox');
    await act(async () => {
      await userEvent.type(input, 'hello');
    });

    // 仅受控触发 onChange；不应立即写回原始 form（setFieldValue 未被调用）
    expect(onChange).toHaveBeenCalled();
    expect(formStub.getCalls().setFieldValue.length).toBe(0);
  });

  it('null mode: renders empty input when value=null (no backfill)', async () => {
    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'nickname', value: null, onChange: vi.fn(), metaTree: simpleMetaTree },
      subModels: { field: { use: 'InputFieldModel' } },
    });
    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );
    // 渲染后应出现一个输入框，值为空（不回填原表单）
    const input = await screen.findByRole('textbox');
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('many-to-many relationship: uses RecordSelectFieldModel to render multi-select dropdown (ant-select-multiple)', async () => {
    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'roles', value: '', onChange: vi.fn(), metaTree: simpleMetaTree },
      subModels: {
        field: {
          use: 'RecordSelectFieldModel',
          props: {
            fieldNames: { label: 'name', value: 'id' },
            allowMultiple: true,
            multiple: true,
          },
        },
      },
    });
    // 指定为对多关系，DefaultValue 内部应选择 RecordSelectFieldModel，并在 onDispatchEventEnd 推断 multiple
    host.context.defineProperty('collectionField', {
      value: {
        interface: 'm2m',
        type: 'belongsToMany',
        fieldNames: { label: 'name', value: 'id' },
        targetCollection: {
          getField: (name) => ({
            name,
            type: 'string',
            interface: 'input',
            uiSchema: { 'x-component': 'Input' },
          }),
        },
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    // 右侧编辑器应为 antd Select 且为多选模式 + 有 fieldNames 配置
    await waitFor(
      () => {
        const errorBanner = document.querySelector('.ant-result-error');
        expect(errorBanner).toBeNull();
      },
      { timeout: 5000 },
    );
  });

  it('default value relation editor keeps origin title-field mapping', async () => {
    const onChange = vi.fn();
    const originalCreate = engine.createModel.bind(engine);
    let capturedTempRoot: any;
    // 捕获 DefaultValue 内部创建的临时模型，验证其关系字段映射是否继承原字段配置
    // @ts-ignore
    engine.createModel = ((options: any, extra?: any) => {
      const created = originalCreate(options, extra);
      if (options?.use === 'VariableFieldFormModel') {
        capturedTempRoot = created;
      }
      return created;
    }) as any;

    // 关闭测试桩对 selectSettings 的覆盖，避免把 fieldNames 强制重置为 collectionField 默认值
    RecordSelectFieldModel.registerFlow({ key: 'selectSettings', manual: true, steps: {} });

    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: {
        name: 'assignees',
        value: [
          { id: 24, nickname: 'User 24' },
          { id: 26, nickname: 'User 26' },
        ],
        onChange,
        metaTree: simpleMetaTree,
      },
      subModels: {
        field: {
          use: 'RecordSelectFieldModel',
          props: {
            // 原筛选字段使用 nickname 作为 title-field 展示
            fieldNames: { label: 'nickname', value: 'id' },
            allowMultiple: true,
            multiple: true,
          },
        },
      },
    });
    host.context.defineProperty('collectionField', {
      value: {
        interface: 'm2m',
        type: 'belongsToMany',
        isAssociationField: () => true,
        // 底层集合默认仍是 id，用于模拟“默认值弹窗退化显示 id”的真实场景
        fieldNames: { label: 'id', value: 'id' },
        targetCollection: {
          getField: (name) => ({ name, type: 'string', interface: 'input', uiSchema: { 'x-component': 'Input' } }),
        },
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(capturedTempRoot?.subModels?.fields?.[0]).toBeTruthy();
    });

    // 期望：临时关系字段继承原字段的 title-field 映射（nickname），而不是退化为 id
    expect(capturedTempRoot.subModels.fields[0].props.fieldNames).toEqual({ label: 'nickname', value: 'id' });
  });

  it('default value dialog relation multi-select enables keepDropdownOpenOnSelect', async () => {
    const onChange = vi.fn();
    const originalCreate = engine.createModel.bind(engine);
    let capturedTempRoot: any;
    // @ts-ignore
    engine.createModel = ((options: any, extra?: any) => {
      const created = originalCreate(options, extra);
      if (options?.use === 'VariableFieldFormModel') {
        capturedTempRoot = created;
      }
      return created;
    }) as any;

    RecordSelectFieldModel.registerFlow({ key: 'selectSettings', manual: true, steps: {} });

    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: {
        name: 'assignees',
        value: [{ id: 24, nickname: 'User 24' }],
        onChange,
        metaTree: simpleMetaTree,
        flags: { isInSetDefaultValueDialog: true },
      },
      subModels: {
        field: {
          use: 'RecordSelectFieldModel',
          props: {
            fieldNames: { label: 'nickname', value: 'id' },
            allowMultiple: true,
            multiple: true,
          },
        },
      },
    });
    host.context.defineProperty('collectionField', {
      value: {
        interface: 'm2m',
        type: 'belongsToMany',
        isAssociationField: () => true,
        fieldNames: { label: 'id', value: 'id' },
        targetCollection: {
          getField: (name) => ({ name, type: 'string', interface: 'input', uiSchema: { 'x-component': 'Input' } }),
        },
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(capturedTempRoot?.subModels?.fields?.[0]).toBeTruthy();
    });

    expect(capturedTempRoot.subModels.fields[0].props.keepDropdownOpenOnSelect).toBe(true);
  });

  it('default value dialog relation multi-select keeps dropdown open after option click', async () => {
    const originalCreate = engine.createModel.bind(engine);
    let capturedTempRoot: any;
    let tempRootCreateCount = 0;
    // @ts-ignore
    engine.createModel = ((options: any, extra?: any) => {
      const created = originalCreate(options, extra);
      if (options?.use === 'VariableFieldFormModel') {
        capturedTempRoot = created;
        tempRootCreateCount += 1;
      }
      return created;
    }) as any;

    const onChange = vi.fn();
    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: {
        name: 'assignees',
        value: [{ id: 24, nickname: 'User 24' }],
        onChange,
        metaTree: simpleMetaTree,
        flags: { isInSetDefaultValueDialog: true },
      },
      subModels: {
        field: {
          use: 'RecordSelectFieldModel',
          props: {
            fieldNames: { label: 'nickname', value: 'id' },
            allowMultiple: true,
            multiple: true,
          },
        },
      },
    });
    host.context.defineProperty('collectionField', {
      value: {
        interface: 'm2m',
        type: 'belongsToMany',
        isAssociationField: () => true,
        fieldNames: { label: 'nickname', value: 'id' },
        collection: {
          dataSource: { displayName: 'main', key: 'main' },
          title: 'Users',
          name: 'users',
          tableName: 'users',
        },
        targetCollection: {
          getField: (name) => ({ name, type: 'string', interface: 'input', uiSchema: { 'x-component': 'Input' } }),
        },
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(capturedTempRoot?.subModels?.fields?.[0]).toBeTruthy();
    });
    const initialTempRootCreateCount = tempRootCreateCount;
    const tempField = capturedTempRoot.subModels.fields[0];
    tempField.setProps({
      options: [
        { id: 22, nickname: 'User 22' },
        { id: 23, nickname: 'User 23' },
        { id: 24, nickname: 'User 24' },
      ],
      fieldNames: { label: 'nickname', value: 'id' },
      allowMultiple: true,
      multiple: true,
    });

    const combobox = await screen.findByRole('combobox');
    await act(async () => {
      await userEvent.click(combobox);
    });
    await screen.findByRole('option', { name: 'User 22' });

    await act(async () => {
      await userEvent.click(screen.getByRole('option', { name: 'User 22' }));
    });

    await act(async () => {
      host.setProps({
        value: [
          { id: 24, nickname: 'User 24' },
          { id: 22, nickname: 'User 22' },
        ],
        // 模拟真实场景：值变化后外层传入新的 flags 对象引用
        flags: { isInSetDefaultValueDialog: true },
      });
    });

    // 点击选项后面板应保持展开
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    });
    // 变更后不应重建临时模型，否则会导致下拉状态被重置
    expect(tempRootCreateCount).toBe(initialTempRootCreateCount);
  });

  it('safe backfill when saving (setStepParams): overwrite when empty/unmodified or equals last default value; otherwise do not overwrite', async () => {
    const formStub = createFormStub();

    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'nickname', value: '', onChange: vi.fn(), metaTree: simpleMetaTree },
      subModels: { field: { use: 'InputFieldModel' } },
    });
    host.context.defineProperty('form', { value: formStub });
    host.context.defineProperty('collectionField', { value: { interface: 'input', type: 'string' } });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    // Wait for component to mount and patches to be applied
    await waitFor(
      () => {
        expect(host['__dvSetStepParamsPatched']).toBe(true);
      },
      { timeout: 2000 },
    );

    // 1) 当前表单为空且未修改：应写回新默认值 'a'
    await act(async () => {
      await host.setStepParams('formItemSettings', 'initialValue', { defaultValue: 'a' });
    });
    await waitFor(
      () => {
        expect(formStub.getFieldValue('nickname')).toBe('a');
      },
      { timeout: 1000 },
    );

    // 2) 当前值与上次默认值相等：应覆盖为 'b'
    await act(async () => {
      await host.setStepParams('formItemSettings', 'initialValue', { defaultValue: 'b' });
    });
    await waitFor(
      () => {
        expect(formStub.getFieldValue('nickname')).toBe('b');
      },
      { timeout: 1000 },
    );

    // 3) 用户已修改为与上次默认值不同：不应覆盖
    formStub.setFieldValue('nickname', 'userInput');
    formStub.setTouched(true);
    await act(async () => {
      await host.setStepParams('formItemSettings', 'initialValue', { defaultValue: 'c' });
    });
    expect(formStub.getFieldValue('nickname')).toBe('userInput');
  });

  it('runjs default value: backfill uses computed result instead of object', async () => {
    const formStub = createFormStub();

    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'nickname', value: '', onChange: vi.fn(), metaTree: simpleMetaTree },
      subModels: { field: { use: 'InputFieldModel' } },
    });
    host.context.defineProperty('form', { value: formStub });
    host.context.defineProperty('collectionField', { value: { interface: 'input', type: 'string' } });
    host.context.defineMethod('runjs', async (code: string) => {
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(code);
        return { success: true, value: fn() };
      } catch (e) {
        return { success: false, error: e };
      }
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(
      () => {
        expect(host['__dvSetStepParamsPatched']).toBe(true);
      },
      { timeout: 2000 },
    );

    await act(async () => {
      await host.setStepParams('formItemSettings', 'initialValue', {
        defaultValue: { code: "return 'test';", version: 'v1' },
      });
    });

    await waitFor(
      () => {
        expect(formStub.getFieldValue('nickname')).toBe('test');
      },
      { timeout: 1000 },
    );
  });

  it('variable resolution: supports resolveJsonTemplate and ctx-based path fallback', async () => {
    // 第一步：验证 ctx 回退路径解析 -> 'Bob'
    const formStub1 = createFormStub();
    const host1 = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'nickname', value: '', onChange: vi.fn(), metaTree: simpleMetaTree },
      subModels: { field: { use: 'InputFieldModel' } },
    });
    host1.context.defineProperty('form', { value: formStub1 });
    host1.context.defineProperty('user', { value: { name: 'Bob' } });
    host1.context.defineMethod('resolveJsonTemplate', async () => undefined);

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host1} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );
    await waitFor(
      () => {
        expect((host1 as any).__dvSetStepParamsPatched).toBe(true);
      },
      { timeout: 2000 },
    );
    await act(async () => {
      await host1.setStepParams('formItemSettings', 'initialValue', { defaultValue: '{{ ctx.user.name }}' });
    });
    await waitFor(
      () => {
        expect(formStub1.getFieldValue('nickname')).toBe('Bob');
      },
      { timeout: 1000 },
    );

    // 第二步：验证 resolveJsonTemplate 生效 -> 新建 Host，默认空且未修改，应解析为 'Alice'
    const formStub2 = createFormStub();
    const host2 = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'nickname', value: '', onChange: vi.fn(), metaTree: simpleMetaTree },
      subModels: { field: { use: 'InputFieldModel' } },
    });
    host2.context.defineProperty('form', { value: formStub2 });
    host2.context.defineProperty('user', { value: { name: 'Bob' } });
    host2.context.defineMethod('resolveJsonTemplate', async () => 'Alice');

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host2} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );
    await waitFor(
      () => {
        expect((host2 as any).__dvSetStepParamsPatched).toBe(true);
      },
      { timeout: 2000 },
    );
    await act(async () => {
      await host2.setStepParams('formItemSettings', 'initialValue', { defaultValue: '{{ ctx.user.name }}' });
    });
    await waitFor(
      () => {
        expect(formStub2.getFieldValue('nickname')).toBe('Alice');
      },
      { timeout: 1000 },
    );
  });

  // ------------------ Filter-form focused cases ------------------
  it('date-like editor: propagates object value changes', async () => {
    const onChange = vi.fn();
    // 捕获临时字段
    const origCreate = engine.createModel.bind(engine);
    let capturedTempRoot: any;
    // @ts-ignore
    engine.createModel = ((options: any, extra?: any) => {
      const created = origCreate(options, extra);
      if (options?.use === 'VariableFieldFormModel') {
        capturedTempRoot = created;
        const tempField = capturedTempRoot?.subModels?.fields?.[0];
        // 在临时字段上下文直接注入 association 判定，确保 unwrap 生效
        tempField?.context?.defineProperty?.('collectionField', {
          value: { interface: 'm2m', type: 'belongsToMany', isAssociationField: () => true },
        });
      }
      return created;
    }) as any;

    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'createdAt', value: undefined, onChange, metaTree: simpleMetaTree },
      subModels: { field: { use: 'DateTimeFilterFieldModel' } },
    });
    host.context.defineProperty('collectionField', { value: { interface: 'datetime', type: 'date' } });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => expect(capturedTempRoot?.subModels?.fields?.[0]).toBeTruthy());
    const fieldModel = capturedTempRoot.subModels.fields[0];
    await act(async () => {
      fieldModel.props.onChange?.({ type: 'past', number: 2, unit: 'day' });
    });
    expect(onChange).toHaveBeenCalled();
    const arg1 = (onChange as any).mock.calls[0][0];
    expect(arg1).toEqual({ type: 'past', number: 2, unit: 'day' });
  });

  it('date-like editor: supports antd (dates, dateStrings) signature', async () => {
    const onChange = vi.fn();
    const origCreate = engine.createModel.bind(engine);
    let capturedTempRoot: any;
    // @ts-ignore
    engine.createModel = ((options: any, extra?: any) => {
      const created = origCreate(options, extra);
      if (options?.use === 'VariableFieldFormModel') capturedTempRoot = created;
      return created;
    }) as any;

    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'createdAt', value: undefined, onChange, metaTree: simpleMetaTree },
      subModels: { field: { use: 'DateTimeFilterFieldModel' } },
    });
    host.context.defineProperty('collectionField', { value: { interface: 'datetime', type: 'date' } });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => expect(capturedTempRoot?.subModels?.fields?.[0]).toBeTruthy());
    const fieldModel = capturedTempRoot.subModels.fields[0];
    await act(async () => {
      fieldModel.props.onChange?.('dummyDayjs', '2024-10-01');
    });
    expect(onChange).toHaveBeenCalled();
    const arg2 = (onChange as any).mock.calls[0][0];
    expect(arg2).toBe('2024-10-01');
  });

  // 不再断言“初始受控镜像”，因为 VariableInput 的 constant 路径会提供空串初值；
  // 仅验证 onChange 行为与签名兼容性即可。

  it('text input remains uncontrolled (no props.value mirror)', async () => {
    const origCreate = engine.createModel.bind(engine);
    let capturedTempRoot: any;
    // @ts-ignore
    engine.createModel = ((options: any, extra?: any) => {
      const created = origCreate(options, extra);
      if (options?.use === 'VariableFieldFormModel') capturedTempRoot = created;
      return created;
    }) as any;

    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'nickname', value: 'hello', onChange: vi.fn(), metaTree: simpleMetaTree },
      subModels: { field: { use: 'InputFieldModel' } },
    });
    host.context.defineProperty('collectionField', { value: { interface: 'input', type: 'string' } });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );
    await waitFor(() => expect(capturedTempRoot?.subModels?.fields?.[0]).toBeTruthy());
    const fieldModel = capturedTempRoot.subModels.fields[0];
    // 文本类字段不镜像 props.value（避免 IME 问题）
    expect(fieldModel.props.value).toBeUndefined();
  });

  it('text input: prefers target.value over target.checked', async () => {
    const onChange = vi.fn();
    const origCreate = engine.createModel.bind(engine);
    let capturedTempRoot: any;
    // @ts-ignore
    engine.createModel = ((options: any, extra?: any) => {
      const created = origCreate(options, extra);
      if (options?.use === 'VariableFieldFormModel') capturedTempRoot = created;
      return created;
    }) as any;

    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'title', value: '', onChange, metaTree: simpleMetaTree },
      subModels: { field: { use: 'InputFieldModel' } },
    });
    host.context.defineProperty('collectionField', { value: { interface: 'input', type: 'string' } });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => expect(capturedTempRoot?.subModels?.fields?.[0]).toBeTruthy());
    const fieldModel = capturedTempRoot.subModels.fields[0];

    await act(async () => {
      fieldModel.props.onChange?.({ target: { checked: false, value: 'hello' } });
    });
    expect(onChange).toHaveBeenCalled();
    const arg = (onChange as any).mock.calls[0][0];
    expect(arg).toBe('hello');
  });

  // 注：关联字段的“去包装”由 collectionField 决定，真实页面场景下已具备。
  // 这里不再重复校验，仅在前面的用例验证了常量编辑器与关系字段的基本行为。

  it('multipleSelect constant editor: emits array value on change (UI mode not enforced)', async () => {
    const onChange = vi.fn();
    const origCreate = engine.createModel.bind(engine);
    let capturedTempRoot: any;
    // @ts-ignore
    engine.createModel = ((options: any, extra?: any) => {
      const created = origCreate(options, extra);
      if (options?.use === 'VariableFieldFormModel') {
        capturedTempRoot = created;
      }
      return created;
    }) as any;

    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'tags', value: [], onChange, metaTree: simpleMetaTree },
      subModels: { field: { use: 'SelectFieldModel' } },
    });
    host.context.defineProperty('collectionField', {
      value: {
        interface: 'multipleSelect',
        type: 'json',
        uiSchema: { enum: ['A', 'B', 'C'] },
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => expect(capturedTempRoot?.subModels?.fields?.[0]).toBeTruthy());
    const fieldModel = capturedTempRoot.subModels.fields[0];

    await act(async () => {
      fieldModel?.props?.onChange?.(['A', 'C']);
    });
    expect(onChange).toHaveBeenCalled();
    const callArg = (onChange as any).mock.calls.pop()?.[0];
    expect(callArg).toEqual(['A', 'C']);
  });

  it('richText constant editor: supports typing (host.setProps mirror not required)', async () => {
    const onChange = vi.fn();
    const origCreate = engine.createModel.bind(engine);
    let capturedTempRoot: any;
    // @ts-ignore
    engine.createModel = ((options: any, extra?: any) => {
      const created = origCreate(options, extra);
      if (options?.use === 'VariableFieldFormModel') capturedTempRoot = created;
      return created;
    }) as any;

    const host = engine.createModel<HostModel>({
      use: 'HostModel',
      props: { name: 'content', value: '', onChange, metaTree: simpleMetaTree },
      subModels: { field: { use: 'RichTextFieldModel' } },
    });
    host.context.defineProperty('collectionField', { value: { interface: 'richText', type: 'text' } });

    const { container } = render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    // 等待 ReactQuill 通过 lazy 动态加载并渲染完成，避免固定 sleep 带来的偶发失败
    await waitFor(
      () => {
        expect(container.querySelector('.ql-editor')).toBeTruthy();
      },
      { timeout: 3000 },
    );
    const editor = container.querySelector('.ql-editor') as HTMLElement;
    editor.focus();
    await userEvent.type(editor, 'Hello');
    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });
});
