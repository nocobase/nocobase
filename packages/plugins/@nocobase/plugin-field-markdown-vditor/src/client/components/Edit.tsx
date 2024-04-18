import React, { useRef, useEffect, useMemo } from 'react';
import { useFieldSchema, useField, useForm } from '@formily/react';
import Vditor from 'vditor';
import { useCollection_deprecated, useCollectionDataSource, useCollectionManager_deprecated } from '@nocobase/client';
import { Field } from '@formily/core';
import useStyle from './style';

function useTargetCollectionField() {
  const fieldSchema = useFieldSchema();
  const providedCollection = useCollection_deprecated();
  const { getCollection, getCollectionField } = useCollectionManager_deprecated();
  const paths = (fieldSchema.name as string).split('.');
  let collection: any = providedCollection;
  for (let i = 0; i < paths.length - 1; i++) {
    const field = collection.getField(paths[i]);
    collection = getCollection(field.target);
  }
  return getCollectionField(`${collection.name}.${paths[paths.length - 1]}`);
}

export function Edit(props) {
  const { disabled, onChange } = props;
  const { uiSchema } = useTargetCollectionField();
  const field = useField<Field>();
  const form = useForm();

  const vdRef = useRef<Vditor>();
  const containerRef = useRef<HTMLDivElement>();

  const value = useMemo(() => {
    return props.value ?? field.value;
  }, [props.value, field.value]);

  const { wrapSSR, hashId, componentCls: containerClassName } = useStyle();

  useEffect(() => {
    if (!uiSchema || vdRef.current) return;
    const vditor = new Vditor(containerRef.current, {
      value,
      lang: localStorage.getItem('NOCOBASE_LOCALE').replaceAll('-', '_') as any,
      cache: {
        enable: false,
      },
      undoDelay: 0,
      preview: {
        math: {
          engine: 'KaTeX',
        },
      },
      toolbar: uiSchema?.['x-component-props']?.['toolbar'],
      minHeight: 200,
      after: () => {
        vdRef.current = vditor;
        if (disabled) {
          vditor.disabled();
        } else {
          vditor.enable();
        }
      },
      input(value) {
        onChange(value);
      },
      upload: {
        url: `/api/${uiSchema['x-component-props']['fileCollection']}:create`,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('NOCOBASE_TOKEN')}`,
          'X-Authenticator': localStorage.getItem('NOCOBASE_AUTH'),
          'X-Hostname': location.hostname,
          'X-Locale': localStorage.getItem('NOCOBASE_LOCALE'),
          'X-Role': localStorage.getItem('NOCOBASE_ROLE'),
          'X-Timezone': '+08:00',
          'X-With-ACL-Meta': 'true',
        },
        multiple: false,
        fieldName: 'file',
        format(files, responseText) {
          const response = JSON.parse(responseText);
          const formatResponse = {
            msg: '',
            code: 0,
            data: {
              errFiles: [],
              succMap: {
                [response.data.filename]: response.data.url,
              },
            },
          };
          return JSON.stringify(formatResponse);
        },
      },
    });
    return () => {
      vdRef.current?.destroy();
      vdRef.current = undefined;
    };
  }, [uiSchema, form, field, vdRef]);

  useEffect(() => {
    if (!value) {
      vdRef.current?.setValue('');
      vdRef.current?.focus();
    }
  }, [value]);

  useEffect(() => {
    if (disabled) {
      vdRef.current?.disabled();
    } else {
      vdRef.current?.enable();
    }
  }, [disabled]);

  return wrapSSR(
    <div className={`${hashId} ${containerClassName}`}>
      <div ref={containerRef}></div>
    </div>,
  );
}
