import { SchemaOptionsContext, useForm, useField, Schema } from '@formily/react';
import { mapValues, isArray, isPlainObject, isString, nth, get, isNumber } from 'lodash';
import { useContext, useEffect, useState, useRef, useCallback } from 'react';

export function findDecoratorFilterDeep(schema: Schema) {
  if (!schema) {
    return null;
  }
  if (schema['x-decorator-props']?.params?.filter) {
    return schema['x-decorator-props']?.params?.filter;
  }
  if (schema?.properties) {
    for (const key in schema?.properties) {
      const rs = findDecoratorFilterDeep(schema?.properties?.[key]);
      if (rs) {
        return rs;
      }
    }
  }
  return null;
}

export function useParseFilter(filterParams, onChange?: () => void) {
  const schemaOptions = useContext(SchemaOptionsContext);
  const parentBlock = schemaOptions?.scope?.useParentBlockProps?.() || {};
  const usedForm = useForm();
  const usedField = useField();
  const form = parentBlock?.form || usedForm;
  const field = parentBlock?.field || usedField;

  const [filter, setFilter] = useState({});
  const formChangedPath = useRef('');
  // 依赖的字段
  const deps = useRef({});
  const parseFilter = useCallback(
    (filterObj) => {
      return mapValues({ ...filterObj }, (value, key) => {
        if (isArray(value)) {
          return value.map((v) => {
            return parseFilter(v);
          });
        }
        if (isPlainObject(value)) {
          return parseFilter(value);
        }
        if (isString(value) && value.includes('$currentForm')) {
          // keys 可能的字符串为 $currentFrom.id 或者 $currentFrom.someSource.id
          const keys = value.replaceAll(/\{|\}/g, '').split('.');
          const name = nth(keys, -2);
          const nameField = nth(keys, -1);
          let formPath = name === '$currentForm' ? [nameField] : keys.slice(1, -1);
          let formPathField = keys.slice(1);
          // 子表单数据
          if (field.path.segments.some((k) => isNumber(k))) {
            formPath = [...field.path.segments];
            formPath[formPath.length - 1] = name;
            formPathField = [...formPath, nameField];
          }
          // 表头数据
          const formValue = get(form.values, formPath);
          // 字段数据
          const formValueField = isArray(formValue)
            ? formValue.map((v) => v?.[nameField])
            : get(form.values, formPathField);

          const formPathStr = formPath.join('.');
          const formPathFieldStr = formPathField.join('.');
          if (
            !field.path.segments.includes(formChangedPath.current) &&
            (formPathStr.includes(formChangedPath.current) || formPathFieldStr.includes(formChangedPath.current))
          ) {
            onChange?.();
          }
          deps.current = {
            ...deps.current,
            [formPathStr]: formValue,
            [formPathFieldStr]: formValueField,
          };
          return formValueField || null;
        }
        return value;
      });
    },
    [form, field, onChange],
  );
  useEffect(() => {
    // form 表单其他字段更新时触发重置表单值
    const unsubscribe = form.subscribe(({ payload, type }) => {
      const path = payload?.path?.entire || '';
      if (type !== 'onFieldValidateSuccess' || (deps.current[path] && deps.current[path] === payload.value)) {
        return;
      }
      formChangedPath.current = path;
      setFilter(parseFilter(filterParams));
    });
    return () => {
      form.unsubscribe(unsubscribe);
    };
  }, [form, field, filterParams, onChange, parseFilter]);

  return {
    filter,
    parseFilter,
  };
}
