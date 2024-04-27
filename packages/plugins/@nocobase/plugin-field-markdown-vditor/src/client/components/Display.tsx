import { Field } from '@formily/core';
import { useField } from '@formily/react';
import React, { useRef, useEffect, useMemo, useState, CSSProperties, useCallback } from 'react';
import Vditor from 'vditor';
import { Popover } from 'antd';
import useStyle from './style';
import { withDynamicSchemaProps } from '@nocobase/client';
import { cdn } from './const';

function convertToText(markdownText: string) {
  const content = markdownText;
  let temp = document.createElement('div');
  temp.innerHTML = content;
  const text = temp.innerText;
  temp = null;
  return text?.replace(/[\n\r]/g, '') || '';
}

const getContentWidth = (element) => {
  if (element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const contentWidth = range.getBoundingClientRect().width;
    return contentWidth;
  }
};

function DisplayInner(props: { value: string; style?: CSSProperties }) {
  const containerRef = useRef<HTMLDivElement>();
  const { wrapSSR, componentCls, hashId } = useStyle();

  useEffect(() => {
    if (!props.value) return;
    Vditor.preview(containerRef.current, props.value, {
      mode: 'light',
      cdn,
    });
  }, [props.value]);

  return wrapSSR(
    <div className={`${hashId} ${componentCls}`}>
      <div ref={containerRef} style={{ border: 'none', ...(props?.style ?? {}) }} />
    </div>,
  );
}

export const Display = withDynamicSchemaProps((props) => {
  const field = useField<Field>();
  const value = props.value ?? field.value;

  const containerRef = useRef<HTMLDivElement>();

  const [popoverVisible, setPopoverVisible] = useState(false);
  const [ellipsis, setEllipsis] = useState(false);

  const [text, setText] = useState('');

  const elRef = useRef<HTMLDivElement>();

  useEffect(() => {
    if (!props.value || !field.value) return;
    if (props.ellipsis) {
      Vditor.md2html(props.value, {
        mode: 'light',
        cdn,
      })
        .then((html) => {
          setText(convertToText(html));
        })
        .catch(() => setText(''));
    } else {
      Vditor.preview(containerRef.current, props.value ?? field.value, {
        mode: 'light',
        cdn,
      });
    }
  }, [props.value, props.ellipsis, field.value]);

  const isOverflowTooltip = useCallback(() => {
    if (!elRef.current) return false;
    const contentWidth = getContentWidth(elRef.current);
    const offsetWidth = elRef.current?.offsetWidth;
    return contentWidth > offsetWidth;
  }, [elRef]);

  if (props.ellipsis) {
    return (
      <Popover
        open={popoverVisible}
        onOpenChange={(visible) => {
          setPopoverVisible(ellipsis && visible);
        }}
        content={<DisplayInner value={value} style={{ maxWidth: 500, maxHeight: 400, overflowY: 'auto' }} />}
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
          {text}
        </div>
      </Popover>
    );
  }

  return <DisplayInner value={value} />;
});
