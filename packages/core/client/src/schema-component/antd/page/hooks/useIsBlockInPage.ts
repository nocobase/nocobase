import { useCallback } from 'react';
import { useActionContext } from '../../action';

/**
 * 判断当前区块是否在页面而不是在弹窗中
 */
export const useIsBlockInPage = () => {
  const { visible } = useActionContext();

  const isBlockInPage = useCallback(() => {
    return !visible;
  }, [visible]);

  return { isBlockInPage };
};
