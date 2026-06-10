/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ElementProxy, tExpr, createSafeDocument, createSafeWindow, createSafeNavigator } from '@nocobase/flow-engine';
import React, { useEffect, useMemo, useRef } from 'react';
import { Input } from 'antd';
import { FieldModel } from '../base/FieldModel';
import { CodeEditor } from '../../components/code-editor';
import { resolveRunJsParams } from '../utils/resolveRunJsParams';

const INPUT_DEFAULT_CODE = `
function JsEditableField() {
  const React = ctx.React;
  const { Input } = ctx.antd;
  const [value, setValue] = React.useState(ctx.getValue() ?? '');

  React.useEffect(() => {
    const handler = (event) => setValue(event.detail ?? '');
    ctx.element.addEventListener('js-field:value-change', handler);
    return () => ctx.element.removeEventListener('js-field:value-change', handler);
  }, []);

  const onChange = (event) => {
    const nextValue = event.target.value;
    setValue(nextValue);
    ctx.setValue(nextValue);
  };

  if (ctx.readOnly) {
    return <span>{String(value ?? '')}</span>;
  }

  return (
    <Input
      {...ctx.model.props}
      value={value}
      onChange={onChange}
    />
  );
}

ctx.render(<JsEditableField />);
`;

const SINGLE_SELECT_DEFAULT_CODE = `
function JsSelectField() {
  const React = ctx.React;
  const { Select } = ctx.antd;
  const props = ctx.model.props || {};
  const field = ctx.collectionField || {};
  const options = (props.options || field.uiSchema?.enum || []).map((option) => ({
    ...option,
    label: ctx.t(option.label),
  }));
  const [value, setValue] = React.useState(ctx.getValue());

  React.useEffect(() => {
    const handler = (event) => setValue(event.detail);
    ctx.element.addEventListener('js-field:value-change', handler);
    return () => ctx.element.removeEventListener('js-field:value-change', handler);
  }, []);

  const onChange = (nextValue) => {
    setValue(nextValue);
    ctx.setValue(nextValue);
  };

  if (ctx.readOnly) {
    const selected = options.find((option) => option.value === value);
    return <span>{String(selected?.label ?? value ?? '')}</span>;
  }

  return (
    <Select
      {...props}
      style={{ width: '100%', ...(props.style || {}) }}
      allowClear
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}

ctx.render(<JsSelectField />);
`;

const MULTIPLE_SELECT_DEFAULT_CODE = `
function JsMultipleSelectField() {
  const React = ctx.React;
  const { Select } = ctx.antd;
  const props = ctx.model.props || {};
  const field = ctx.collectionField || {};
  const toArray = (input) => (Array.isArray(input) ? input : input == null ? [] : [input]);
  const options = (props.options || field.uiSchema?.enum || []).map((option) => ({
    ...option,
    label: ctx.t(option.label),
  }));
  const [value, setValue] = React.useState(toArray(ctx.getValue()));

  React.useEffect(() => {
    const handler = (event) => setValue(toArray(event.detail));
    ctx.element.addEventListener('js-field:value-change', handler);
    return () => ctx.element.removeEventListener('js-field:value-change', handler);
  }, []);

  const onChange = (nextValue) => {
    const normalized = toArray(nextValue);
    setValue(normalized);
    ctx.setValue(normalized);
  };

  if (ctx.readOnly) {
    const labels = value.map((item) => options.find((option) => option.value === item)?.label ?? item);
    return <span>{labels.map(String).join(', ')}</span>;
  }

  return (
    <Select
      {...props}
      style={{ width: '100%', ...(props.style || {}) }}
      allowClear
      mode="multiple"
      value={value}
      onChange={onChange}
      options={options}
      maxTagCount="responsive"
    />
  );
}

ctx.render(<JsMultipleSelectField />);
`;

const CHECKBOX_SELECT_DEFAULT_CODE = `
function JsCheckboxSelectField() {
  const React = ctx.React;
  const { Select } = ctx.antd;
  const props = ctx.model.props || {};
  const options = [
    { label: ctx.t('Yes'), value: true },
    { label: ctx.t('No'), value: false },
  ];
  const [value, setValue] = React.useState(ctx.getValue());

  React.useEffect(() => {
    const handler = (event) => setValue(event.detail);
    ctx.element.addEventListener('js-field:value-change', handler);
    return () => ctx.element.removeEventListener('js-field:value-change', handler);
  }, []);

  const onChange = (nextValue) => {
    setValue(nextValue);
    ctx.setValue(nextValue);
  };

  if (ctx.readOnly) {
    return <span>{options.find((option) => option.value === value)?.label ?? ''}</span>;
  }

  return (
    <Select
      {...props}
      style={{ width: '100%', ...(props.style || {}) }}
      allowClear
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}

ctx.render(<JsCheckboxSelectField />);
`;

const ASSOCIATION_SELECT_DEFAULT_CODE = `
function JsAssociationSelectField() {
  const React = ctx.React;
  const { Select } = ctx.antd;
  const { fieldNames = {}, allowMultiple, multiple: propsMultiple, ...selectProps } = ctx.model.props || {};
  const field = ctx.collectionField || {};
  const targetCollection = field.targetCollection || {};
  const targetKey = Array.isArray(targetCollection.filterTargetKey)
    ? targetCollection.filterTargetKey[0]
    : targetCollection.filterTargetKey;
  const valueKey = fieldNames.value && fieldNames.value !== 'value' ? fieldNames.value : targetKey || field.targetKey || 'id';
  const labelKey =
    fieldNames.label && fieldNames.label !== 'label'
      ? fieldNames.label
      : targetCollection.titleCollectionField?.name || targetCollection.titleField || valueKey;
  const relationMultiple = ['belongsToMany', 'hasMany', 'm2m', 'o2m', 'mbm'].includes(field.type || field.interface);
  const multiple = Boolean((typeof propsMultiple === 'boolean' ? propsMultiple : relationMultiple) && allowMultiple !== false);
  const dataSourceKey = field.dataSourceKey || targetCollection.dataSourceKey || field.collection?.dataSourceKey;

  const toArray = (input) => (Array.isArray(input) ? input : input == null ? [] : [input]);
  const getRecordKey = (record) => (record && typeof record === 'object' ? record[valueKey] : record);
  const currentRecords = () => toArray(ctx.getValue()).filter((item) => item && typeof item === 'object');
  const labelOf = (record) => ctx.t(String(record?.[labelKey] ?? record?.[valueKey] ?? record ?? ''));
  const toSelectValue = (input) => {
    return multiple ? toArray(input).map(getRecordKey) : getRecordKey(input);
  };
  const uniqueRecords = (items) => {
    const map = new Map();
    items.forEach((record) => {
      const key = record?.[valueKey];
      if (key != null && !map.has(String(key))) {
        map.set(String(key), record);
      }
    });
    return Array.from(map.values());
  };

  const [records, setRecords] = React.useState(currentRecords);
  const [value, setValue] = React.useState(toSelectValue(ctx.getValue()));
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const handler = (event) => {
      setValue(toSelectValue(event.detail));
      setRecords(currentRecords());
    };
    ctx.element.addEventListener('js-field:value-change', handler);
    return () => ctx.element.removeEventListener('js-field:value-change', handler);
  }, []);

  const loadOptions = async (keyword = '') => {
    setLoading(true);
    try {
      const params = { page: 1, pageSize: 40 };
      if (keyword) {
        params.filter = { [labelKey + '.$includes']: keyword };
      }
      const response = await ctx.request({
        url: field.target + ':list',
        method: 'get',
        params,
        ...(dataSourceKey ? { headers: { 'X-Data-Source': dataSourceKey } } : {}),
      });
      setRecords(response.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const mergedRecords = uniqueRecords([...records, ...currentRecords()]);
  const options = mergedRecords.map((record) => ({
    label: labelOf(record),
    value: record?.[valueKey],
  }));
  const findRecord = (key) => {
    return mergedRecords.find((record) => String(record[valueKey]) === String(key)) || { [valueKey]: key };
  };

  const onChange = (nextValue) => {
    setValue(nextValue);
    if (multiple) {
      ctx.setValue(toArray(nextValue).map(findRecord));
      return;
    }
    ctx.setValue(nextValue == null ? undefined : findRecord(nextValue));
  };

  const onDropdownVisibleChange = (open) => {
    selectProps.onDropdownVisibleChange?.(open);
    if (open) {
      loadOptions('');
    }
  };

  if (ctx.readOnly) {
    const labels = toArray(ctx.getValue()).map(labelOf);
    return <span>{labels.join(', ')}</span>;
  }

  return (
    <Select
      {...selectProps}
      style={{ width: '100%', ...(selectProps.style || {}) }}
      allowClear
      showSearch
      filterOption={false}
      loading={loading}
      mode={multiple ? 'multiple' : undefined}
      value={value}
      onChange={onChange}
      onSearch={loadOptions}
      onDropdownVisibleChange={onDropdownVisibleChange}
      options={options}
      maxTagCount="responsive"
    />
  );
}

ctx.render(<JsAssociationSelectField />);
`;

type CollectionFieldLike = {
  interface?: string;
  type?: string;
  isAssociationField?: () => boolean;
};

function readCollectionField(source?: unknown): CollectionFieldLike | undefined {
  try {
    const record = source as
      | {
          collectionField?: unknown;
          context?: { collectionField?: unknown };
        }
      | undefined;
    const field = record?.collectionField ?? record?.context?.collectionField;
    if (field && typeof field === 'object') {
      return field as CollectionFieldLike;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function isAssociationField(field?: CollectionFieldLike) {
  if (!field) {
    return false;
  }
  if (typeof field.isAssociationField === 'function') {
    return field.isAssociationField();
  }
  return ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'].includes(field.interface || '');
}

export function getDefaultEditableJsCode(source?: unknown) {
  const field = readCollectionField(source);
  const interfaceName = field?.interface;

  if (isAssociationField(field)) {
    return ASSOCIATION_SELECT_DEFAULT_CODE.trim();
  }

  if (['select', 'radioGroup'].includes(interfaceName || '')) {
    return SINGLE_SELECT_DEFAULT_CODE.trim();
  }

  if (['multipleSelect', 'checkboxGroup'].includes(interfaceName || '')) {
    return MULTIPLE_SELECT_DEFAULT_CODE.trim();
  }

  if (interfaceName === 'checkbox') {
    return CHECKBOX_SELECT_DEFAULT_CODE.trim();
  }

  return INPUT_DEFAULT_CODE.trim();
}

function getEffectivePattern(model?: JSEditableFieldModel) {
  return (
    model?.props?.pattern ??
    (model?.context as { pattern?: string } | undefined)?.pattern ??
    (model?.parent as { props?: { pattern?: string } } | undefined)?.props?.pattern
  );
}

function isReadOnlyMode(model?: JSEditableFieldModel) {
  return !!model?.props?.readOnly || getEffectivePattern(model) === 'readPretty';
}

function resolveScriptCode(model: JSEditableFieldModel | undefined, codeParam?: string) {
  if (typeof codeParam === 'string') {
    return codeParam.trim();
  }
  return getDefaultEditableJsCode(model);
}

type NamePathPart = string | number;

function toNamePath(input: unknown): NamePathPart[] | null {
  if (Array.isArray(input)) {
    return input.filter((item): item is NamePathPart => typeof item === 'string' || typeof item === 'number');
  }
  if (typeof input === 'number') {
    return [input];
  }
  if (typeof input === 'string') {
    return input
      .split('.')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return null;
}

function startsWithNamePath(namePath: NamePathPart[], prefix: NamePathPart[]) {
  return prefix.length <= namePath.length && prefix.every((item, index) => String(namePath[index]) === String(item));
}

function getFieldSettingsNamePath(model: any): NamePathPart[] | null {
  const init =
    model?.getStepParams?.('fieldSettings', 'init') || model?.parent?.getStepParams?.('fieldSettings', 'init');
  const fieldPath = toNamePath(init?.fieldPath);
  const associationPath = toNamePath(init?.associationPathName);

  if (!fieldPath?.length) {
    return null;
  }

  if (!associationPath?.length || startsWithNamePath(fieldPath, associationPath)) {
    return fieldPath;
  }

  return [...associationPath, ...fieldPath];
}

function applyFieldIndex(namePath: NamePathPart[] | null, fieldIndex: unknown): NamePathPart[] | null {
  if (!namePath?.length) {
    return null;
  }
  if (namePath.some((item) => typeof item === 'number') || !Array.isArray(fieldIndex) || fieldIndex.length === 0) {
    return namePath;
  }

  const indexQueues = new Map<string, number[]>();
  for (const item of fieldIndex) {
    if (typeof item !== 'string') continue;
    const [fieldName, indexStr] = item.split(':');
    const index = Number(indexStr);
    if (!fieldName || !Number.isFinite(index)) continue;
    const queue = indexQueues.get(fieldName) || [];
    queue.push(index);
    indexQueues.set(fieldName, queue);
  }

  if (!indexQueues.size) {
    return namePath;
  }

  const result: NamePathPart[] = [];
  for (const item of namePath) {
    result.push(item);
    const queue = indexQueues.get(String(item));
    if (queue?.length) {
      result.push(queue.shift() as number);
    }
  }
  return result;
}

function resolveEffectiveNamePath(ctx: any): NamePathPart[] | null {
  const namePath =
    getFieldSettingsNamePath(ctx.model) || toNamePath(ctx.fieldPathArray) || toNamePath(ctx.model?.props?.name);
  return applyFieldIndex(namePath, ctx.fieldIndex);
}

function setFormValue(form: any, namePath: NamePathPart[], value: any) {
  if (typeof form?.setFieldValue === 'function') {
    form.setFieldValue(namePath, value);
    return;
  }

  if (typeof form?.setFieldsValue === 'function') {
    const patch: any = {};
    let cursor = patch;
    namePath.forEach((item, index) => {
      if (index === namePath.length - 1) {
        cursor[item] = value;
        return;
      }
      cursor[item] = typeof namePath[index + 1] === 'number' ? [] : {};
      cursor = cursor[item];
    });
    form.setFieldsValue(patch);
  }
}

const JSFormRuntime: React.FC<{
  model: JSEditableFieldModel;
  value?: any;
  onChange?: (v: any) => void;
  disabled?: boolean;
  readOnly?: boolean;
}> = ({ model, value, onChange, disabled, readOnly }) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const externalRef = model.context?.ref as React.RefObject<HTMLSpanElement>;
  const assignRefs = (el: HTMLSpanElement | null) => {
    (containerRef as any).current = el as any;
    if (externalRef && typeof externalRef === 'object') {
      (externalRef as any).current = el as any;
    }
  };
  // 统一获取&裁剪脚本代码，直接依赖具体 code 字符串，避免顶层 stepParams 引用未变化导致不更新
  const codeParam = model.getStepParams('jsSettings', 'runJs')?.code as string | undefined;
  const scriptCode = useMemo(() => {
    return resolveScriptCode(model, codeParam);
  }, [codeParam, model]);

  useEffect(() => {
    if (!containerRef.current || !scriptCode) return;
    model.scheduleApplyJsSettings();
  }, [model, scriptCode]);

  useEffect(() => {
    if (!containerRef.current || !scriptCode) return;
    const event = new CustomEvent('js-field:value-change', { detail: value });
    containerRef.current.dispatchEvent(event);
  }, [value, scriptCode]);

  if (readOnly && !scriptCode) {
    return <span>{String(value ?? '')}</span>;
  }

  if (!scriptCode) {
    return (
      <Input value={value} onChange={(e) => onChange?.(e.target.value)} disabled={disabled} style={{ width: '100%' }} />
    );
  }

  return <span ref={assignRefs} style={{ display: 'inline-block', width: '100%' }} />;
};

/**
 * JS 可编辑字段（表单项）：
 * - 通过 jsSettings.runJs 运行 JS 代码；
 * - 在运行时提供 ctx.getValue/ctx.setValue，实现与表单的双向交互；
 * - 子节点由脚本渲染（DOM 操作），用于完全自定义输入体验。
 */
export class JSEditableFieldModel extends FieldModel {
  private _mountedOnce = false;
  private _pendingJsSettingsApply = false;
  private _lastAppliedJsSettings?: {
    code: string;
    disabled: boolean;
    readOnly: boolean;
    element: HTMLSpanElement | null;
  };

  scheduleApplyJsSettings() {
    const codeParam = this.getStepParams('jsSettings', 'runJs')?.code as string | undefined;
    if (!resolveScriptCode(this, codeParam)) return;

    if (this._pendingJsSettingsApply) {
      return;
    }

    this._pendingJsSettingsApply = true;
    queueMicrotask(() => {
      this._pendingJsSettingsApply = false;

      const nextCodeParam = this.getStepParams('jsSettings', 'runJs')?.code as string | undefined;
      const nextCode = resolveScriptCode(this, nextCodeParam);
      const nextElement = this.context.ref?.current as HTMLSpanElement | null;
      if (!nextCode || !nextElement) {
        return;
      }

      const nextRun = {
        code: nextCode,
        disabled: !!this.props?.disabled,
        readOnly: isReadOnlyMode(this),
        element: nextElement,
      };
      const lastRun = this._lastAppliedJsSettings;
      if (
        lastRun &&
        lastRun.code === nextRun.code &&
        lastRun.disabled === nextRun.disabled &&
        lastRun.readOnly === nextRun.readOnly &&
        lastRun.element === nextRun.element
      ) {
        return;
      }

      this._lastAppliedJsSettings = nextRun;
      this.applyFlow('jsSettings');
    });
  }

  useHooksBeforeRender() {
    const codeParam = this.getStepParams('jsSettings', 'runJs')?.code as string | undefined;
    const scriptCode = resolveScriptCode(this, codeParam);
    const disabled = this.props?.disabled;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (!scriptCode) return;
      this.scheduleApplyJsSettings();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scriptCode, disabled]);
  }

  render() {
    const readOnly = isReadOnlyMode(this);
    return (
      <JSFormRuntime
        model={this as JSEditableFieldModel}
        value={this.props?.value}
        onChange={this.props?.onChange}
        disabled={this.props?.disabled}
        readOnly={readOnly}
      />
    );
  }

  /**
   * 在 CreateForm / 提交后重置等场景下，字段可能被卸载并重新挂载。
   * 由于 beforeRender 命中缓存，新挂载的容器不会自动写入 JS 渲染内容。
   * 这里在二次挂载时检测容器已就绪，主动触发 rerender 来刷新 beforeRender（禁用缓存），
   * 保证输入框不会因为容器变更而空白。
   */
  protected onMount() {
    if (this._mountedOnce) {
      if (this.context.ref?.current) {
        this.rerender();
      }
    }
    this._mountedOnce = true;
  }
}

const jsEditableFieldModelMeta = {
  label: tExpr('JS field'),
  preserveOnPatternChange: true,
};

JSEditableFieldModel.define(jsEditableFieldModelMeta);

JSEditableFieldModel.registerFlow({
  key: 'jsSettings',
  title: tExpr('JavaScript settings'),
  manual: true,
  steps: {
    runJs: {
      title: tExpr('Write JavaScript'),
      useRawParams: true,
      uiSchema: {
        code: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': CodeEditor,
          'x-component-props': {
            minHeight: '320px',
            theme: 'light',
            enableLinter: true,
            wrapperStyle: {
              position: 'fixed',
              inset: 8,
            },
          },
        },
      },
      uiMode: {
        type: 'embed',
        props: {
          styles: {
            body: {
              transform: 'translateX(0)',
            },
          },
        },
      },
      defaultParams(ctx) {
        return {
          version: 'v2',
          code: getDefaultEditableJsCode(ctx),
        };
      },
      async handler(ctx, params) {
        const { code, version } = resolveRunJsParams(ctx, params);
        if (!code?.trim()) {
          return;
        }

        ctx.onRefReady(ctx.ref, async (element) => {
          // 暴露容器与读写能力（使用动态 getter 绑定 ref.current，避免容器变更失效）
          ctx.defineProperty('element', {
            get: () => new ElementProxy((ctx.ref?.current as HTMLSpanElement | null) || element),
            cache: false,
          });
          ctx.defineMethod('getValue', () => {
            const namePath = resolveEffectiveNamePath(ctx);
            if (namePath?.length) {
              const fv = ctx.form?.getFieldValue?.(namePath);
              return fv !== undefined ? fv : ctx.model.props?.value;
            }
            return ctx.model.props?.value;
          });
          ctx.defineMethod('setValue', (v) => {
            try {
              ctx.model.setProps('value', v);
              const namePath = resolveEffectiveNamePath(ctx);
              if (namePath?.length) {
                setFormValue(ctx.form, namePath, v);
              }
            } catch (_) {
              // ignore
            }
          });
          ctx.defineProperty('namePath', { get: () => resolveEffectiveNamePath(ctx), cache: false });
          ctx.defineProperty('disabled', { get: () => !!ctx.model.props?.disabled, cache: false });
          ctx.defineProperty('readOnly', {
            get: () => isReadOnlyMode(ctx.model),
            cache: false,
          });
          const navigator = createSafeNavigator();
          await ctx.runjs(
            code,
            {
              window: createSafeWindow({ navigator }),
              document: createSafeDocument(),
              navigator,
            },
            { version },
          );
        });
      },
    },
  },
});
