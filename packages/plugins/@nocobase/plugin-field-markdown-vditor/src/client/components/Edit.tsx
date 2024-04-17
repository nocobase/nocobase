import React, { useRef, useEffect } from 'react';
import { useFieldSchema, useField, useForm } from '@formily/react';
import Vditor from 'vditor';
import { useCollection_deprecated, useCollectionDataSource, useCollectionManager_deprecated } from '@nocobase/client';
import { Field } from '@formily/core';

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

  useEffect(() => {
    if (!uiSchema || vdRef.current || !form || !field) return;
    const vditor = new Vditor(containerRef.current, {
      value: props.value ?? field.value,
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
      },
      input(value) {
        onChange(value);
        field.setValue(value);
        field.value = value;
        form.setValuesIn(field.address.toString(), value);
      },
      upload: {
        url: `/api/${uiSchema['x-component-props']['fileCollection']}:create`,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('NOCOBASE_TOKEN')}`,
          'X-Authenticator': 'basic',
          'X-Hostname': 'localhost',
          'X-Locale': 'en-US',
          'X-Role': 'root',
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
    if (disabled) {
      vdRef.current?.disabled();
    } else {
      vdRef.current?.enable();
    }
  }, [disabled]);

  return <div ref={containerRef} />;
}
