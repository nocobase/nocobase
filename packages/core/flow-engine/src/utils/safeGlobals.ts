/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 统一的安全全局对象代理：window/document/navigator
 * - window：仅允许常用的定时器、console、Math、Date、addEventListener、open（安全包装）、location（安全代理）
 * - document：仅允许 createElement/querySelector/querySelectorAll
 * - navigator：仅提供极少量低风险能力（clipboard.writeText、onLine、language、languages）
 * - 不允许随意访问未声明的属性，最小权限原则
 */

export function createSafeWindow(extra?: Record<string, any>) {
  // 解析相对 URL 使用脱敏 base（不含 query/hash），避免在解析时泄露敏感信息
  const getSafeBaseHref = () => `${window.location.origin}${window.location.pathname}`;

  // 安全的 window.open 代理
  const safeOpen = (url: string, target?: string, features?: string): Window | null => {
    // 仅允许 http/https 和 about:blank
    const isSafeUrl = (u: string): boolean => {
      try {
        const parsed = new URL(u, getSafeBaseHref()); // 使用脱敏 base
        const protocol = parsed.protocol.toLowerCase();
        if (protocol === 'about:') return parsed.href === 'about:blank';
        return protocol === 'http:' || protocol === 'https:';
      } catch {
        return false;
      }
    };

    if (!isSafeUrl(url)) {
      throw new Error('Unsafe URL: window.open only allows http/https/about:blank.');
    }

    // 强制在新标签页打开，避免覆盖当前页或父窗口
    const sanitizedTarget = '_blank';

    // 合并并强制加上安全特性
    const enforceFeatures = (f?: string): string => {
      const set = new Set<string>();
      if (f) {
        f.split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((part) => {
            const key = part.split('=')[0].trim().toLowerCase();
            if (key !== 'noopener' && key !== 'noreferrer') set.add(part);
          });
      }
      set.add('noopener');
      set.add('noreferrer');
      return Array.from(set).join(',');
    };

    const sanitizedFeatures = enforceFeatures(features);

    // 调用原生 window.open
    const newWin = window.open.call(window, url, sanitizedTarget, sanitizedFeatures);

    // 双重保险：禁用 opener（部分浏览器/场景下 features 可能不生效）
    if (newWin && 'opener' in newWin) {
      try {
        (newWin as any).opener = null;
      } catch {
        // ignore
      }
    }
    return newWin;
  };

  // 同源在当前页导航；跨域强制用新标签页 + noreferrer/noopener
  const guardedNavigate = (rawUrl: string, opts?: { replace?: boolean }) => {
    const parsed = new URL(rawUrl, getSafeBaseHref());
    const protocol = parsed.protocol.toLowerCase();

    const isAboutBlank = protocol === 'about:' && parsed.href === 'about:blank';
    const isHttp = protocol === 'http:' || protocol === 'https:';
    if (!isHttp && !isAboutBlank) {
      throw new Error('Unsafe URL: only http/https/about:blank are allowed.');
    }

    if (isAboutBlank) {
      return opts?.replace ? window.location.replace('about:blank') : window.location.assign('about:blank');
    }

    const sameOrigin =
      parsed.protocol === window.location.protocol &&
      parsed.hostname === window.location.hostname &&
      parsed.port === window.location.port;

    if (sameOrigin) {
      return opts?.replace ? window.location.replace(parsed.href) : window.location.assign(parsed.href);
    }

    const win = safeOpen(parsed.href);
    if (!win) throw new Error('Popup blocked: cross-origin navigation is opened in a new tab.');
  };

  // 只读/脱敏的 location 代理；支持安全的 href 赋值和 assign/replace
  const safeLocation = new Proxy(
    {},
    {
      get(_t, prop: string) {
        switch (prop) {
          case 'origin':
            return window.location.origin;
          case 'protocol':
            return window.location.protocol;
          case 'host':
            return window.location.host;
          case 'hostname':
            return window.location.hostname;
          case 'port':
            return window.location.port;
          case 'pathname':
            return window.location.pathname;
          case 'assign':
            return (u: string) => guardedNavigate(u, { replace: false });
          case 'replace':
            return (u: string) => guardedNavigate(u, { replace: true });
          case 'reload':
            throw new Error('Access to location.reload is not allowed.');
          case 'href':
            throw new Error('Reading location.href is not allowed.');
          default:
            throw new Error(`Access to location property "${prop}" is not allowed.`);
        }
      },
      set(_t, prop: string, value: any) {
        if (prop === 'href') {
          guardedNavigate(String(value), { replace: false });
          return true;
        }
        throw new Error('Mutation on location is not allowed.');
      },
    },
  );

  const allowedGlobals: Record<string, any> = {
    // 需绑定到原始 window，避免严格模式下触发 Illegal invocation
    setTimeout: window.setTimeout.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
    setInterval: window.setInterval.bind(window),
    clearInterval: window.clearInterval.bind(window),
    console,
    Math,
    Date,
    // 事件侦听仅绑定到真实 window，便于少量需要的全局监听
    addEventListener: addEventListener.bind(window),
    // 安全的 window.open 代理
    open: safeOpen,
    // 安全的 location 代理
    location: safeLocation,
    ...(extra || {}),
  };

  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop in allowedGlobals) return allowedGlobals[prop];
        throw new Error(`Access to global property "${prop}" is not allowed.`);
      },
    },
  );
}

export function createSafeDocument(extra?: Record<string, any>) {
  const allowed: Record<string, any> = {
    createElement: document.createElement.bind(document),
    querySelector: document.querySelector.bind(document),
    querySelectorAll: document.querySelectorAll.bind(document),
    ...(extra || {}),
  };
  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop in allowed) return allowed[prop];
        throw new Error(`Access to document property "${prop}" is not allowed.`);
      },
    },
  );
}

export function createSafeNavigator(extra?: Record<string, any>) {
  const nav: any = (typeof window !== 'undefined' && window.navigator) || undefined;

  // 始终提供 clipboard 对象，避免可选链访问时抛错
  const clipboard: Record<string, any> = {};
  const writeText = nav?.clipboard?.writeText;
  if (typeof writeText === 'function') {
    clipboard.writeText = writeText.bind(nav.clipboard);
  }

  const allowed: Record<string, any> = {
    clipboard,
  };

  // 只读常用标识，避免泄露更多指纹信息
  Object.defineProperty(allowed, 'onLine', {
    get: () => !!nav?.onLine,
    enumerable: true,
    configurable: false,
  });
  Object.defineProperty(allowed, 'language', {
    get: () => nav?.language,
    enumerable: true,
    configurable: false,
  });
  Object.defineProperty(allowed, 'languages', {
    get: () => (nav?.languages ? [...nav.languages] : undefined),
    enumerable: true,
    configurable: false,
  });

  // 允许额外注入（例如自定义能力的受控暴露）
  Object.assign(allowed, extra || {});

  return new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop in allowed) return (allowed as any)[prop];
        throw new Error(`Access to navigator property "${String(prop)}" is not allowed.`);
      },
    },
  );
}
