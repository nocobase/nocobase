import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { useFieldSchema, useField } from '@formily/react';
import Vditor from 'vditor';
import { useAPIClient, useCollection, useCollectionManager, withDynamicSchemaProps } from '@nocobase/client';
import { Field } from '@formily/core';
import useStyle from './style';

function useTargetCollectionField() {
  const fieldSchema = useFieldSchema();
  const providedCollection = useCollection();
  const collectionManager = useCollectionManager();
  const paths = (fieldSchema.name as string).split('.');
  let collection: any = providedCollection;
  for (let i = 0; i < paths.length - 1; i++) {
    const field = collection.getField(paths[i]);
    collection = collectionManager.getCollection(field.target);
  }
  return collectionManager.getCollectionField(`${collection.name}.${paths[paths.length - 1]}`);
}

export const Edit = withDynamicSchemaProps((props) => {
  const { disabled, onChange, value } = props;
  const { uiSchema } = useTargetCollectionField();
  const field = useField<Field>();

  const vdRef = useRef<Vditor>();
  const vdFullscreen = useRef(false);
  const containerRef = useRef<HTMLDivElement>();
  const containerParentRef = useRef<HTMLDivElement>();

  const apiClient = useAPIClient();

  const { wrapSSR, hashId, componentCls: containerClassName } = useStyle();

  useEffect(() => {
    if (!uiSchema || vdRef.current) return;
    const uploadFileCollection = uiSchema['x-component-props']?.['fileCollection'];
    const toolbarConfig = uiSchema?.['x-component-props']?.['toolbar'] ?? [
      'headings',
      'bold',
      'list',
      'ordered-list',
      'code',
      'inline-code',
      'upload',
    ];
    const vditor = new Vditor(containerRef.current, {
      value,
      lang: apiClient.auth.locale.replaceAll('-', '_') as any,
      cache: {
        enable: false,
      },
      undoDelay: 0,
      preview: {
        math: {
          engine: 'KaTeX',
        },
      },
      toolbar: toolbarConfig,
      fullscreen: {
        index: 1200,
      },
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
        url: `/api/${uploadFileCollection ?? 'attachments'}:create`,
        headers: {
          Authorization: `Bearer ${apiClient.auth.token}`,
          'X-Authenticator': apiClient.auth.authenticator,
          'X-Hostname': location.host,
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
  }, [uiSchema, vdRef]);

  useEffect(() => {
    // 必须要这样，如果setValue会导致编辑器失去焦点，而focus方法只能让焦点到最开始
    const resetStartTag = `reset-${field.address}:`;
    if (!value || value.startsWith(resetStartTag)) {
      let resetValue = value ?? '';
      const resetStartTagIndex = resetValue?.indexOf(resetStartTag);
      resetValue = resetValue.slice(resetStartTagIndex + resetStartTag.length);
      vdRef.current?.setValue(resetValue);
      vdRef.current?.focus();
      field.setValue(resetValue);
      onChange?.(resetValue);
    }
  }, [value]);

  useEffect(() => {
    if (disabled) {
      vdRef.current?.disabled();
    } else {
      vdRef.current?.enable();
    }
  }, [disabled]);

  useLayoutEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target;
        if (target.className.includes('vditor--fullscreen')) {
          document.body.appendChild(target);
          vdFullscreen.current = true;
        } else if (vdFullscreen.current) {
          containerParentRef.current?.appendChild(target);
          vdFullscreen.current = false;
        }
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.unobserve(containerRef.current);
    };
  }, []);

  return wrapSSR(
    <div ref={containerParentRef} className={`${hashId} ${containerClassName}`}>
      <div id={hashId} ref={containerRef}></div>
    </div>,
  );
});
