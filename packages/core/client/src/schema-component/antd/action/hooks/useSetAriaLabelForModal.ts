import { useEffect } from 'react';
import { useGetAriaLabelOfModal } from './useGetAriaLabelOfModal';

export function useSetAriaLabelForModal(visible: boolean) {
  const { getAriaLabel } = useGetAriaLabelOfModal();

  // 因 Drawer 设置 aria-label 无效，所以使用下面这种方式设置，方便 e2e 录制工具选中
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        const wrappers = [...document.querySelectorAll('.ant-modal-content')];
        const masks = [...document.querySelectorAll('.ant-modal-wrap')];
        // 如果存在多个 mask，最后一个 mask 为当前打开的 mask；wrapper 也是同理
        const currentMask = masks[masks.length - 1];
        const currentWrapper = wrappers[wrappers.length - 1];
        if (currentMask) {
          currentMask.setAttribute('role', 'button');
          currentMask.setAttribute('aria-label', getAriaLabel('mask'));
        }
        if (currentWrapper) {
          currentWrapper.setAttribute('role', 'button');
          // 都设置一下，让 e2e 录制工具自己选择
          currentWrapper.setAttribute('data-testid', getAriaLabel());
          currentWrapper.setAttribute('aria-label', getAriaLabel());
        }
      });
    }
  }, [getAriaLabel, visible]);
}
