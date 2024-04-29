import { useAPIClient, useApp, withDynamicSchemaProps } from '@nocobase/client';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import Vditor from 'vditor';
import { defaultToolbar } from '../interfaces/markdown-vditor';
import { useCDN } from './const';
import useStyle from './style';

export const Edit = withDynamicSchemaProps((props) => {
  const { disabled, onChange, value, fileCollection, toolbar } = props;

  const vdRef = useRef<Vditor>();
  const vdFullscreen = useRef(false);
  const containerRef = useRef<HTMLDivElement>();
  const containerParentRef = useRef<HTMLDivElement>();
  const app = useApp();
  const apiClient = useAPIClient();
  const cdn = useCDN();
  const { wrapSSR, hashId, componentCls: containerClassName } = useStyle();

  useEffect(() => {
    const uploadFileCollection = fileCollection || 'attachments';
    const toolbarConfig = toolbar ?? defaultToolbar;
    const vditor = new Vditor(containerRef.current, {
      value: value ?? '',
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
      cdn,
      minHeight: 200,
      after: () => {
        vdRef.current = vditor;
        vditor.setValue(value ?? '');
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
        url: app.getApiUrl(`${uploadFileCollection}:create`),
        headers: apiClient.getHeaders(),
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
  }, [fileCollection, toolbar?.join(',')]);

  useEffect(() => {
    if (value === vdRef?.current?.getValue()) {
      return;
    }
    vdRef.current?.setValue(value);
    vdRef.current?.focus();
    // 移动光标到末尾
    const preArea = containerRef.current.querySelector('div.vditor-content > div.vditor-ir > pre') as HTMLPreElement;
    if (preArea) {
      const range = document.createRange();
      const selection = window.getSelection();
      if (selection) {
        range.selectNodeContents(preArea);
        range.collapse(false); // 将光标移动到内容末尾
        selection.removeAllRanges();
        selection.addRange(range);
      }
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
