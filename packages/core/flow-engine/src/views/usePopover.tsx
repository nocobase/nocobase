/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Popover } from 'antd';
import * as React from 'react';
import usePatchElement from './usePatchElement';

let uuid = 0;

// 独立 PopoverComponent，参考 DrawerComponent 实现
const PopoverComponent = React.forwardRef<any, any>(({ afterClose, content, placement, rect, ...props }, ref) => {
  const [visible, setVisible] = React.useState(true);
  const [config, setConfig] = React.useState({ content, placement, rect, ...props });

  React.useImperativeHandle(ref, () => ({
    destroy: () => setVisible(false),
    update: (newConfig: any) => setConfig((prev) => ({ ...prev, ...newConfig })),
    close: (result?: any) => setVisible(false),
  }));

  // 关闭后触发 afterClose
  React.useEffect(() => {
    if (!visible) {
      afterClose?.();
    }
  }, [visible, afterClose]);

  return (
    <Popover
      arrow={false}
      open={visible}
      trigger={['click']}
      destroyTooltipOnHide
      content={config.content}
      placement={config.placement}
      getPopupContainer={() => document.body}
      onOpenChange={(nextOpen) => {
        setVisible(nextOpen);
        if (!nextOpen) {
          afterClose?.();
        }
      }}
      {...config}
    >
      <span
        style={{
          position: 'absolute',
          top: (config.rect?.top ?? 0) + window.scrollY,
          left: (config.rect?.left ?? 0) + window.scrollX,
          width: 0,
          height: 0,
        }}
      />
    </Popover>
  );
});

export function usePopover() {
  const holderRef = React.useRef<any>(null);

  const open = (config) => {
    uuid += 1;
    const { target, placement = 'rightTop', content, ...rest } = config;
    const popoverRef = React.createRef<any>();

    // 计算目标位置
    const rect = target?.getBoundingClientRect?.() ?? { top: 0, left: 0 };

    // eslint-disable-next-line prefer-const
    let closeFunc: (() => void) | undefined;
    let resolvePromise: (value?: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    // 构造 currentPopover 实例
    const currentPopover = {
      destroy: () => popoverRef.current?.destroy(),
      update: (newConfig) => popoverRef.current?.update(newConfig),
      close: (result?: any) => {
        resolvePromise?.(result);
        popoverRef.current?.close(result);
      },
    };
    const children = typeof content === 'function' ? content(currentPopover) : content;

    const popover = (
      <PopoverComponent
        key={`popover-${uuid}`}
        ref={popoverRef}
        content={children}
        placement={placement}
        rect={rect}
        afterClose={() => {
          closeFunc?.();
          config.onClose?.();
          resolvePromise?.(config.result);
        }}
        {...rest}
      />
    );
    closeFunc = holderRef.current?.patchElement(popover);

    return Object.assign(promise, currentPopover);
  };

  const api = React.useMemo(() => ({ open }), []);
  const ElementsHolder = React.memo(
    React.forwardRef((props, ref) => {
      const [elements, patchElement] = usePatchElement();
      React.useImperativeHandle(ref, () => ({ patchElement }), []);
      return <>{elements}</>;
    }),
  );

  return [api, <ElementsHolder key="popover-holder" ref={holderRef} />];
}
