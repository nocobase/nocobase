/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Popover, QRCode } from 'antd';
import { css } from '@emotion/css';
import { createRoot } from 'react-dom/client';
import React, { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import Vditor from 'vditor';
import { useCDN } from './useCDN';
import useStyle from './style';

function convertToText(markdownText: string) {
  // 使用 DOMParser 来解析 HTML 字符串
  const parser = new DOMParser();
  const doc = parser.parseFromString(markdownText, 'text/html'); // 解析为 HTML 文档
  // 提取所有图片标签，并替换为其 src 属性
  const imgTags = doc.querySelectorAll('img');
  imgTags.forEach((img) => {
    const src = img.getAttribute('src');
    if (src) {
      img.replaceWith(document.createTextNode(` [Image: ${src}] `)); // 替换图片标签为其 src 属性
    }
  });

  // 获取纯文本内容，并去除换行符
  const text = doc.body.textContent || doc.body.innerText;
  return text?.replace(/\n|\r/g, ' ') || ''; // 替换换行符为空格
}

const getContentWidth = (element) => {
  if (element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const contentWidth = range.getBoundingClientRect().width;
    return contentWidth;
  }
};

function DisplayInner(props: { value: string; style?: CSSProperties; loadImages?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { wrapSSR, componentCls, hashId } = useStyle();
  const cdn = useCDN();
  useEffect(() => {
    if (props.loadImages) {
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
        containerRef.current?.querySelectorAll('qr-code').forEach((el) => {
          const value = el.getAttribute('value') || '';
          const container = document.createElement('div');
          el.replaceWith(container);
          const root = createRoot(container);
          root.render(<QRCode value={value} />);
        });
      }, 300);
    }
  }, [props.value, props.loadImages, cdn]);

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
  const { value, textOnly = true } = props;
  const cdn = useCDN();
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [ellipsis, setEllipsis] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false); // 记录图片是否加载

  const [text, setText] = useState('');

  const elRef = useRef<HTMLDivElement>();
  useEffect(() => {
    if (!props.value) return;
    if (textOnly) {
      Vditor.md2html(props.value, {
        mode: 'light',
        cdn,
      })
        .then((html) => {
          setText(convertToText(html));
        })
        .catch(() => setText(''));
    }
  }, [props.value, textOnly]);

  const isOverflowTooltip = useCallback(() => {
    if (!elRef.current) return false;
    const contentWidth = getContentWidth(elRef.current);
    const offsetWidth = elRef.current?.offsetWidth;
    return contentWidth > offsetWidth;
  }, [elRef]);

  const handlePopoverOpenChange = (visible) => {
    setPopoverVisible(visible);
    if (visible && !imagesLoaded) {
      setImagesLoaded(true); // 只在 Popover 显示时加载图片
    }
  };
  if (props.ellipsis) {
    return (
      <Popover
        open={popoverVisible}
        getPopupContainer={() => document.getElementsByClassName('ant-drawer-content')?.[0] as HTMLElement}
        onOpenChange={(visible) => {
          handlePopoverOpenChange(ellipsis && visible);
        }}
        overlayStyle={{ maxWidth: 600 }}
        content={
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            <DisplayInner value={value} loadImages={imagesLoaded} />
          </div>
        }
      >
        <div
          ref={elRef}
          style={{
            overflow: 'hidden',
            overflowWrap: 'break-word',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            wordBreak: 'break-all',
          }}
          onMouseEnter={(e) => {
            const el = e.target as any;
            const isShowTooltips = isOverflowTooltip();
            if (isShowTooltips) {
              setEllipsis(el.scrollWidth >= el.clientWidth);
            }
          }}
        >
          {textOnly ? (
            text
          ) : (
            <div
              className={css`
                .vditor-reset {
                  white-space: nowrap;
                  display: -webkit-box;
                  -webkit-box-orient: vertical;
                  -webkit-line-clamp: 1;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  word-break: break-word;
                }
              `}
            >
              <DisplayInner value={value} loadImages={true} />
            </div>
          )}
        </div>
      </Popover>
    );
  }
  if (textOnly) {
    return text as any;
  } else {
    return <DisplayInner value={value} loadImages={true} />;
  }
};
