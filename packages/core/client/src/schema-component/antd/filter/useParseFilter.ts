import { SchemaOptionsContext, useForm, useField } from '@formily/react';
import { mapValues, isArray, isPlainObject, isString, nth, get } from 'lodash';
import { useContext, useEffect, useState, useRef, useCallback } from 'react';

function deepFind(obj, key) {
  if (obj[key]) {
    return obj[key];
  }
  for (const i in obj) {
    if (obj[i] && typeof obj[i] === 'object') {
      const found = deepFind(obj[i], key);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
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
  const parseFilter = useCallback(
    (filterObj) => {
      return mapValues(filterObj, (value, key) => {
        if (isArray(value)) {
          return value.map((v) => {
            return parseFilter(v);
          });
        }
        if (isPlainObject(value)) {
          return parseFilter(value);
        }
        if (isString(value) && value.includes('form')) {
          const keys = value.replaceAll(/\{|\}/g, '').split('.');
          const name = nth(keys, -2);
          const nameField = nth(keys, -1);
          const formPath = [...field.path.segments];
          formPath[formPath.length - 1] = name;
          const formValue = get(form.values, formPath)?.[nameField] || null;
          if (formChangedPath.current === formPath.join('.')) {
            onChange?.();
          }
          return formValue;
        }
        return value;
      });
    },
    [form, field, onChange],
  );
  useEffect(() => {
    // form 表单其他字段更新时触发重置表单值
    const unsubscribe = form.subscribe(({ payload, type }) => {
      if (type !== 'onFieldValidateSuccess') {
        return;
      }
      formChangedPath.current = payload.path.entire;
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
