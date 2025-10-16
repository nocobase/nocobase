/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { CSSProperties, useEffect, useRef, useState } from 'react';
import Vditor from 'vditor';
import { useCDN } from './useCDN';
import useStyle from './style';

function DisplayInner(props: { value: string; style?: CSSProperties }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { wrapSSR, componentCls, hashId } = useStyle();
  const cdn = useCDN();
  useEffect(() => {
    Vditor.preview(containerRef.current, props.value ?? '', {
      mode: 'light',
      cdn,
    });
    setTimeout(() => {
      containerRef.current?.querySelectorAll('img').forEach((img: HTMLImageElement) => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
          openCustomPreview(img.src);
        });
      });
    }, 0);
  }, [props.value]);

  return wrapSSR(
    <span className={`${hashId} ${componentCls}`}>
      <span ref={containerRef} style={{ border: 'none', ...(props?.style ?? {}) }} />
    </span>,
  );
}

function openCustomPreview(src: string) {
  if (document.getElementById('custom-image-preview')) return;

  // 创建容器
  const overlay = document.createElement('span');
  overlay.id = 'custom-image-preview';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '9999',
    cursor: 'zoom-out',
  });

  const img = document.createElement('img');
  img.src = src;
  Object.assign(img.style, {
    maxWidth: '90%',
    maxHeight: '90%',
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    transition: 'transform 0.2s',
    cursor: 'zoom-out',
  });

  overlay.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  overlay.appendChild(img);
  document.body.appendChild(overlay);
}

export const Display = (props) => {
  const value = props.value;
  const containerRef = useRef<HTMLDivElement>();
  const cdn = useCDN();
  useEffect(() => {
    if (!props.value) return;
    containerRef.current &&
      Vditor.preview(containerRef.current, props.value, {
        mode: 'light',
        cdn,
      });
  }, [props.value, props.ellipsis]);

  return <DisplayInner value={value} />;
};
