/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import type { ButtonProps } from 'antd/es/button';
import { tExpr } from './locale';

const copyHeadStyles = (sourceDoc: Document, targetDoc: Document) => {
  const head = targetDoc.head;
  // Copy <link rel="stylesheet"> and <style> tags; safest for most builds.
  sourceDoc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((node) => {
    head.appendChild(node.cloneNode(true));
  });
  sourceDoc.querySelectorAll<HTMLStyleElement>('style').forEach((node) => {
    head.appendChild(node.cloneNode(true));
  });
};

const renderPrintableDom = (blockModel: any) => {
  const gridModel = blockModel?.subModels?.grid;
  const container: HTMLElement | null | undefined = gridModel?.gridContainerRef?.current;
  if (!container) {
    return null;
  }
  return (container.querySelector('[data-grid-root]') as HTMLElement | null) || container;
};

const openPrintWindow = async (contentEl: HTMLElement) => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument || win?.document;
  if (!win || !doc) {
    iframe.remove();
    window.print();
    return;
  }

  doc.open();
  doc.write('<!doctype html><html><head><meta charset="utf-8" /></head><body></body></html>');
  doc.close();

  copyHeadStyles(window.document, doc);

  const style = doc.createElement('style');
  style.textContent = `
@media print {
  html, body { margin: 0; padding: 0; }
  body { background: #fff; }
  [data-grid-root] { padding-top: 20px !important; }
}
`;
  doc.head.appendChild(style);

  const wrapper = doc.createElement('div');
  wrapper.style.padding = '0';
  wrapper.appendChild(contentEl.cloneNode(true));
  doc.body.appendChild(wrapper);

  // Allow styles to load/paint.
  await new Promise((resolve) => setTimeout(resolve, 50));
  const cleanup = () => iframe.remove();
  win.addEventListener('afterprint', cleanup, { once: true });
  win.focus();
  win.print();
  // Remove after print starts; some browsers need a delay.
  setTimeout(cleanup, 200);
};

export class PrintActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    type: 'link',
    title: tExpr('Print'),
    icon: 'PrinterOutlined',
  };
}

PrintActionModel.define({
  label: tExpr('Print'),
  sort: 4000,
  hide(ctx) {
    // 仅支持“详情区块（DetailsBlockModel）”配置该动作，避免出现在表格行操作/其他区块里。
    const blockModel: any = (ctx as any)?.blockModel;
    return blockModel?.constructor?.name !== 'DetailsBlockModel';
  },
});

PrintActionModel.registerFlow({
  // 运行时也隐藏：避免历史配置里已经把该动作加到表格行操作里时仍然显示
  key: 'hideInTableRowActions',
  on: 'beforeRender',
  steps: {
    apply: {
      hideInSettings() {
        return true;
      },
      handler(ctx) {
        const blockModel: any = (ctx as any)?.blockModel;
        ctx.model.setHidden(blockModel?.constructor?.name !== 'DetailsBlockModel');
      },
    },
  },
});

PrintActionModel.registerFlow({
  key: 'print',
  title: tExpr('Print'),
  on: 'click',
  steps: {
    print: {
      async handler(ctx) {
        const blockModel = (ctx as any)?.blockModel || (ctx as any)?.model?.context?.blockModel;
        const dom = renderPrintableDom(blockModel);
        if (!dom) {
          window.print();
          return;
        }
        await openPrintWindow(dom);
      },
    },
  },
});
