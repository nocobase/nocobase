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

export function usePopover() {
  const holderRef = React.useRef(null);

  const open = (config) => {
    uuid += 1;
    const { target, placement = 'rightTop', content, onRendered, ...rest } = config;
    const popoverRef = React.createRef<{ destroy: () => void; update: (config: any) => void }>();

    // 计算目标位置
    const rect = target?.getBoundingClientRect?.() ?? { top: 0, left: 0 };

    // eslint-disable-next-line prefer-const
    let closeFunc: (() => void) | undefined;
    const PopoverComponent = (props) => {
      const [open, setOpen] = React.useState(true);
      React.useEffect(() => {
        onRendered?.();
      }, []);
      return (
        <Popover
          arrow={false}
          open={open}
          trigger={['click']}
          destroyTooltipOnHide
          onOpenChange={(open) => setOpen(open)}
          content={content}
          placement={placement}
          getPopupContainer={() => document.body}
          {...rest}
        >
          <span
            style={{
              position: 'absolute',
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
              width: 0,
              height: 0,
            }}
          />
        </Popover>
      );
    };

    const popover = <PopoverComponent key={`popover-${uuid}`} ref={popoverRef} />;
    // eslint-disable-next-line prefer-const
    closeFunc = holderRef.current?.patchElement(popover);

    return {
      destroy: () => closeFunc?.(),
      // update: (newConfig) => ... // 可选：实现更新逻辑
    };
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
