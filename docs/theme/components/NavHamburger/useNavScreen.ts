import { useLocation } from '@rspress/core/runtime';
import { useEffect, useState } from 'react';

export function useNavScreen() {
  const { pathname, hash } = useLocation();
  const [isScreenOpen, setIsScreenOpen] = useState(false);

  function openScreen() {
    setIsScreenOpen(true);
    window.addEventListener('resize', closeScreenOnTabletWindow);
  }

  function closeScreen() {
    setIsScreenOpen(false);
    window.removeEventListener('resize', closeScreenOnTabletWindow);
  }

  function toggleScreen() {
    if (isScreenOpen) {
      closeScreen();
    } else {
      openScreen();
    }
  }

  useEffect(() => {
    closeScreen();
  }, [pathname, hash]);

  /**
   * Close screen when the user resizes the window wider than tablet size.
   */
  function closeScreenOnTabletWindow() {
    window.outerWidth >= 768 && closeScreen();
  }

  return {
    isScreenOpen,
    openScreen,
    closeScreen,
    toggleScreen,
  };
}
