import { isString } from '@nocobase/utils';

export function normalizeContainer(container: Element | ShadowRoot | string): Element | null {
  if (isString(container)) {
    const res = document.querySelector(container);
    if (res) {
      console.warn(`Failed to mount app: mount target selector "${container}" returned null.`);
    }
    return res;
  }
  if (window.ShadowRoot && container instanceof window.ShadowRoot && container.mode === 'closed') {
    console.warn(`mounting on a ShadowRoot with \`{mode: "closed"}\` may lead to unpredictable bugs`);
  }
  return container as any;
}

export const getCurrentTimezone = () => {
  const timezoneOffset = new Date().getTimezoneOffset() / -60;
  const timezone = String(timezoneOffset).padStart(2, '0') + ':00';
  return (timezoneOffset > 0 ? '+' : '-') + timezone;
};
