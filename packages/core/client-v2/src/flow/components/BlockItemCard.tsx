/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card, CardProps, theme } from 'antd';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DisplayMarkdown } from '../internal/components/Markdown/DisplayMarkdown';
import { useFlowContext } from '@nocobase/flow-engine';

const getRootElement = (element: HTMLElement | null) => {
  if (!element) return document.documentElement;
  return (
    (element.closest('.nb-block-grid') as HTMLElement | null) ||
    (element.closest('.nb-page-wrapper') as HTMLElement | null) ||
    (element.closest('.nb-page') as HTMLElement | null) ||
    document.documentElement
  );
};

const getOuterHeight = (element?: HTMLElement | null) => {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  return rect.height + marginTop + marginBottom;
};

const getPadding = (element: HTMLElement | null) => {
  if (!element || element === document.documentElement) {
    return { top: 0, bottom: 0 };
  }
  const style = window.getComputedStyle(element);
  return {
    top: parseFloat(style.paddingTop) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
  };
};

const getPageHeader = (root: HTMLElement) => {
  const page = root.closest('.nb-page') as HTMLElement | null;
  if (!page) return null;
  return (
    (page.querySelector('.ant-page-header') as HTMLElement | null) ||
    (page.querySelector('.pageHeaderCss') as HTMLElement | null)
  );
};

const getAddBlockContainer = (root: HTMLElement) => {
  const button = root.querySelector('[data-flow-add-block]') as HTMLElement | null;
  if (!button) return null;
  return (button.parentElement as HTMLElement | null) || button;
};

function getValidPageTop(a, b) {
  const aValid = a > 0;
  const bValid = b > 0;

  if (aValid) return a;
  if (bValid) return b;
  return 0; // 都不是正数
}

const useBlockHeight = ({
  height,
  heightMode,
  cardRef,
}: {
  height?: number;
  heightMode?: string;
  cardRef: React.RefObject<HTMLDivElement>;
}) => {
  const [fullHeight, setFullHeight] = useState<number>();
  const ctx = useFlowContext();
  const updateFullHeight = useCallback(() => {
    if (heightMode !== 'fullHeight' || typeof window === 'undefined') {
      setFullHeight((prev) => (prev === undefined ? prev : undefined));
      return;
    }
    const cardEl = cardRef.current;
    if (!cardEl) return;
    const root = getRootElement(cardEl);
    const cardRect = cardEl.getBoundingClientRect();
    const rootRect = root === document.documentElement ? { top: 0 } : root.getBoundingClientRect();
    const padding = getPadding(root);
    const addBlockContainer = getAddBlockContainer(root);
    const pageTop = rootRect.top + padding.top;
    const topOffset = Math.min(Math.max(0, cardRect.top - pageTop), 0);
    let bottomOffset = padding.bottom + ctx.themeToken.marginBlock;
    if (addBlockContainer) {
      const gapBetween = ctx.themeToken.marginBlock;
      bottomOffset = gapBetween + getOuterHeight(addBlockContainer) + padding.bottom;
    }
    const nextHeight = Math.max(
      0,
      Math.floor(window.innerHeight - getValidPageTop(pageTop, 110) - topOffset - bottomOffset),
    );
    setFullHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, [heightMode, cardRef]);

  useLayoutEffect(() => {
    updateFullHeight();
  }, [updateFullHeight]);

  useEffect(() => {
    if (heightMode !== 'fullHeight' || typeof window === 'undefined') return;
    const cardEl = cardRef.current;
    if (!cardEl || typeof ResizeObserver === 'undefined') return;
    const root = getRootElement(cardEl);
    const pageHeader = getPageHeader(root);
    const addBlockContainer = getAddBlockContainer(root);
    const observer = new ResizeObserver(() => updateFullHeight());
    observer.observe(cardEl);
    if (root instanceof HTMLElement) {
      observer.observe(root);
    }
    if (pageHeader) observer.observe(pageHeader);
    if (addBlockContainer) observer.observe(addBlockContainer);
    window.addEventListener('resize', updateFullHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateFullHeight);
    };
  }, [heightMode, cardRef, updateFullHeight]);

  if (heightMode === 'specifyValue') {
    return height;
  }
  if (heightMode === 'fullHeight') {
    return fullHeight;
  }
  return null;
};

export const BlockItemCard = React.forwardRef(
  (
    props: CardProps & {
      beforeContent?: React.ReactNode;
      afterContent?: React.ReactNode;
      description?: any;
      heightMode?: string;
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { title: blockTitle, description, children, className, heightMode, ...rest } = props;
    const cardRef = useRef<HTMLDivElement | null>(null);
    const setCardRef = useCallback(
      (node: HTMLDivElement | null) => {
        cardRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );
    const height = useBlockHeight({ ...(props as any), cardRef });
    const title = (blockTitle || description) && (
      <div>
        <span> {blockTitle}</span>
        {description && (
          <DisplayMarkdown
            value={description}
            style={{
              overflowWrap: 'break-word',
              whiteSpace: 'normal',
              fontWeight: 400,
              color: token.colorTextDescription,
              borderRadius: '4px',
            }}
          />
        )}
      </div>
    );
    return (
      <Card
        ref={setCardRef as any}
        title={title}
        style={{ display: 'flex', flexDirection: 'column', height: height }}
        styles={{
          body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
          header: {
            marginTop: '8px',
          },
        }}
        className={className}
        {...rest}
      >
        {props.beforeContent}
        {children}
        {props.afterContent}
      </Card>
    );
  },
);
