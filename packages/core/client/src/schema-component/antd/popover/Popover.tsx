import { Popover as AntdPopover, PopoverProps } from 'antd';
import React, { useCallback, useRef } from 'react';

/**
 * 参见：https://github.com/ant-design/ant-design/issues/44119
 * fix https://nocobase.height.app/T-1508
 * @param props
 * @returns
 */
export const StablePopover = (props: PopoverProps) => {
  // 1. 用于记录点击的元素
  const target = useRef(null);

  // 2. 通过 event.target 获取到被点击的元素，然后记录到 target 中
  const avoidClose = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    target.current = e.target;
  }, []);

  const onOpenChange = useCallback(
    (open: boolean) => {
      // 3. 因为 onOpenChange 会先于 onClick 触发，所以这里需要延迟执行，保证在这里能获取到被点击的元素
      setTimeout(() => {
        if (!open && target.current !== null && !isTargetInPopover(target.current)) {
          target.current = null;
          return;
        }
        props.onOpenChange?.(open);
      });
    },
    [props],
  );

  return (
    <div className="popover-with-stop-propagation" onClick={avoidClose}>
      <AntdPopover {...props} onOpenChange={onOpenChange} />
    </div>
  );
};

/**
 * 在 Popover 中有可能会出现被渲染在 body 的悬浮元素，这些元素会触发 Popover 的 onOpenChange 事件，导致 Popover 关闭；
 * 该方法就是用来判断被点击的元素是否在 Popover 中，如果不在，则不触发 Popover 的 onOpenChange 事件
 * @param target event.target
 * @returns
 */
function isTargetInPopover(target: any) {
  if (!target) {
    return false;
  }

  while (target) {
    if (target.classList?.contains('popover-with-stop-propagation')) {
      return true;
    }
    target = target.parentNode;
  }

  return false;
}
