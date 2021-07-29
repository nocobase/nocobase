import { useCookieState } from "ahooks";
import constate from 'constate';

const [DesignableSwitchProvider, useDesignableSwitchContext] = constate(() => {
  const [active, setActive] = useCookieState('useCookieDesignable');

  return {
    designable: active === 'true',
    setDesignable(value) {
      setActive(value ? 'true' : 'false');
    }
  }
});

export { DesignableSwitchProvider, useDesignableSwitchContext };
