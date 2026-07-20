/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ElementProxy, tExpr, createSafeDocument, createSafeWindow, createSafeNavigator } from '@nocobase/flow-engine';
import React from 'react';
import { BlockModel } from '../../base';
import { BlockItemCard } from '../../../components';
import { resolveRunJsParams } from '../../utils/resolveRunJsParams';
import { CodeEditor } from '../../../components/code-editor';

const NAMESPACE = 'client';

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

function getValidPageTop(a: number, b: number) {
  const aValid = a > 0;
  const bValid = b > 0;

  if (aValid) return a;
  if (bValid) return b;
  return 0;
}

const usePlainHostHeight = ({
  height,
  heightMode,
  hostRef,
  marginBlock,
}: {
  height?: number;
  heightMode?: string;
  hostRef: React.RefObject<HTMLDivElement>;
  marginBlock: number;
}) => {
  const [fullHeight, setFullHeight] = React.useState<number>();
  const updateFullHeight = React.useCallback(() => {
    if (heightMode !== 'fullHeight' || typeof window === 'undefined') {
      setFullHeight((prev) => (prev === undefined ? prev : undefined));
      return;
    }
    const hostEl = hostRef.current;
    if (!hostEl) return;
    const root = getRootElement(hostEl);
    const hostRect = hostEl.getBoundingClientRect();
    const rootRect = root === document.documentElement ? { top: 0 } : root.getBoundingClientRect();
    const padding = getPadding(root);
    const addBlockContainer = getAddBlockContainer(root);
    const pageTop = rootRect.top + padding.top;
    const topOffset = Math.max(0, hostRect.top - pageTop);
    let bottomOffset = padding.bottom + marginBlock;
    if (addBlockContainer) {
      const gapBetween = marginBlock;
      bottomOffset = gapBetween + getOuterHeight(addBlockContainer) + padding.bottom;
    }
    const nextHeight = Math.max(
      0,
      Math.floor(window.innerHeight - getValidPageTop(pageTop, 110) - topOffset - bottomOffset - 1),
    );
    setFullHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, [heightMode, hostRef, marginBlock]);

  React.useLayoutEffect(() => {
    updateFullHeight();
  }, [updateFullHeight]);

  React.useEffect(() => {
    if (heightMode !== 'fullHeight' || typeof window === 'undefined') return;
    const hostEl = hostRef.current;
    if (!hostEl || typeof ResizeObserver === 'undefined') return;
    const root = getRootElement(hostEl);
    const pageHeader = getPageHeader(root);
    const addBlockContainer = getAddBlockContainer(root);
    const observer = new ResizeObserver(() => updateFullHeight());
    observer.observe(hostEl);
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
  }, [heightMode, hostRef, updateFullHeight]);

  if (heightMode === 'specifyValue') {
    return height;
  }
  if (heightMode === 'fullHeight') {
    return fullHeight;
  }
  return null;
};

const JSBlockPlainHost = ({
  uid,
  className,
  heightMode,
  height,
  style,
  beforeContent,
  afterContent,
  contentRef,
  marginBlock,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  uid: string;
  heightMode?: string;
  height?: number;
  beforeContent?: React.ReactNode;
  afterContent?: React.ReactNode;
  contentRef: React.RefObject<HTMLDivElement>;
  marginBlock: number;
}) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const resolvedHeight = usePlainHostHeight({ height, heightMode, hostRef, marginBlock });

  return (
    <div
      {...rest}
      ref={hostRef}
      id={`model-${uid}`}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: resolvedHeight ?? undefined,
        minHeight: 0,
        overflow: 'auto',
        ...(style || {}),
      }}
    >
      {beforeContent}
      <div ref={contentRef} />
      {afterContent}
    </div>
  );
};

export class JSBlockModel extends BlockModel {
  // Avoid double-run on first mount; only rerun after remounts
  private _mountedOnce = false;

  get showBlockCard() {
    return this.getStepParams('jsSettings', 'showBlockCard')?.showBlockCard !== false;
  }

  renderComponent(): React.ReactNode {
    return <div ref={this.context.ref} />;
  }
  render() {
    const decoratorProps = this.decoratorProps || {};
    const {
      className,
      id: _ignoredId,
      title,
      description,
      showCard: _ignoredShowCard,
      heightMode,
      height,
      style,
      beforeContent,
      afterContent,
      ...rest
    } = decoratorProps;
    const mergedClassName = ['code-block', className].filter(Boolean).join(' ');

    if (!this.showBlockCard) {
      return (
        <JSBlockPlainHost
          {...rest}
          uid={this.uid}
          className={mergedClassName}
          heightMode={heightMode}
          height={height}
          style={style}
          beforeContent={beforeContent}
          afterContent={afterContent}
          contentRef={this.context.ref}
          marginBlock={this.context.themeToken?.marginBlock ?? 0}
        />
      );
    }

    const cardProps = {
      ...rest,
      height,
      ...(style === undefined ? {} : { style }),
      ...(beforeContent === undefined ? {} : { beforeContent }),
      ...(afterContent === undefined ? {} : { afterContent }),
    };

    return (
      <BlockItemCard
        id={`model-${this.uid}`}
        className={mergedClassName}
        title={title}
        description={description}
        heightMode={heightMode}
        {...cardProps}
      >
        <div ref={this.context.ref} />
      </BlockItemCard>
    );
  }
  protected onMount() {
    // Rerun only when remounting (e.g., after being hidden/unmounted)
    if (this._mountedOnce) {
      if (this.context.ref.current) {
        this.rerender();
      }
    }
    this._mountedOnce = true;
  }
}

JSBlockModel.define({
  label: tExpr('JS block'),
  createModelOptions: {
    use: 'JSBlockModel',
  },
});

JSBlockModel.registerFlow({
  key: 'jsSettings',
  title: 'JavaScript settings',
  steps: {
    showBlockCard: {
      title: tExpr('Show block card'),
      uiMode: { type: 'switch', key: 'showBlockCard' },
      defaultParams: {
        showBlockCard: true,
      },
    },
    runJs: {
      title: tExpr('Write JavaScript'),
      useRawParams: true,
      uiSchema: {
        code: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': CodeEditor,
          'x-component-props': {
            minHeight: '320px',
            theme: 'light',
            enableLinter: true,
            wrapperStyle: {
              position: 'fixed',
              inset: 8,
            },
          },
        },
      },
      uiMode: {
        type: 'embed',
        props: {
          styles: {
            body: {
              transform: 'translateX(0)',
            },
          },
        },
      },
      defaultParams(ctx) {
        return {
          version: 'v2',
          code:
            `// Welcome to the JS block
// Create powerful interactive components with JavaScript
ctx.render(\`
  <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px;">
    <h2 style="color: #1890ff; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
      🚀 \${ctx.i18n.t('Welcome to JS block', { ns: '` +
            NAMESPACE +
            `' })}
    </h2>

    <p style="color: #666; margin-bottom: 24px; font-size: 16px;">
      \${ctx.i18n.t('Build interactive components with JavaScript and external libraries', { ns: '` +
            NAMESPACE +
            `' })}
    </p>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="color: #333; margin: 0 0 16px 0; font-size: 18px;">✨ \${ctx.i18n.t('Key Features', { ns: '` +
            NAMESPACE +
            `' })}</h3>
      <ul style="margin: 0; padding-left: 20px; color: #555;">
        <li style="margin-bottom: 8px;">🎨 <strong>\${ctx.i18n.t('Custom JavaScript execution', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Full programming capabilities', { ns: '` +
            NAMESPACE +
            `' })}</li>
        <li style="margin-bottom: 8px;">📚 <strong>\${ctx.i18n.t('External library support', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Load any npm package or CDN library', { ns: '` +
            NAMESPACE +
            `' })}</li>
        <li style="margin-bottom: 8px;">🔗 <strong>\${ctx.i18n.t('NocoBase API integration', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Access your data and collections', { ns: '` +
            NAMESPACE +
            `' })}</li>
        <li style="margin-bottom: 8px;">💡 <strong>\${ctx.i18n.t('Async/await support', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Handle asynchronous operations', { ns: '` +
            NAMESPACE +
            `' })}</li>
        <li style="margin-bottom: 8px;">🎯 <strong>\${ctx.i18n.t('Direct DOM manipulation', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Full control over rendering', { ns: '` +
            NAMESPACE +
            `' })}</li>
      </ul>
    </div>

    <div style="background: #e6f7ff; border-left: 4px solid #1890ff; padding: 16px; border-radius: 4px;">
      <p style="margin: 0; color: #333; font-size: 14px;">
        💡 <strong>\${ctx.i18n.t('Ready to start?', { ns: '` +
            NAMESPACE +
            `' })}</strong> \${ctx.i18n.t('Replace this code with your custom JavaScript to build amazing components!', { ns: '` +
            NAMESPACE +
            `' })}
      </p>
    </div>
  </div>
\`);`.trim(),
        };
      },
      async handler(ctx, params) {
        const { code, version } = resolveRunJsParams(ctx, params);
        ctx.onRefReady(ctx.ref, async (element) => {
          ctx.defineProperty('element', {
            get: () => new ElementProxy(element),
            info: {
              deprecated: {
                replacedBy: 'ctx.render',
              },
            },
          });
          const navigator = createSafeNavigator();
          await ctx.runjs(
            code,
            { window: createSafeWindow({ navigator }), document: createSafeDocument(), navigator },
            { version },
          );
        });
      },
    },
  },
});
