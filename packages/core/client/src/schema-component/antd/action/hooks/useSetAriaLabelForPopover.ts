import { useEffect } from 'react';
import { useGetAriaLabelOfPopover } from './useGetAriaLabelOfPopover';

export function useSetAriaLabelForPopover(visible: boolean) {
  const { getAriaLabel } = useGetAriaLabelOfPopover();

  // 因 Popover 设置 aria-label 无效，所以使用下面这种方式设置，方便 e2e 录制工具选中
  useEffect(() => {
    if (visible) {
      const wrappers = [...document.querySelectorAll('.ant-popover-content')];
      const currentWrapper = wrappers[wrappers.length - 1];
      if (currentWrapper) {
        currentWrapper.setAttribute('role', 'button');
        // 都设置一下，让 e2e 录制工具自己选择
        currentWrapper.setAttribute('data-testid', getAriaLabel());
        currentWrapper.setAttribute('aria-label', getAriaLabel());
      }
    }
  }, [getAriaLabel, visible]);
}
