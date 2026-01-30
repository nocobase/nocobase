/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * RunJS 外部模块加载辅助（浏览器侧）。
 *
 * 背景：
 * - NocoBase 前端整体使用 requirejs（AMD）来加载插件与模块；
 * - RunJS 场景下又需要支持 `ctx.importAsync(url)` 直接用浏览器原生 `import()` 加载远端 ESM；
 * - 某些第三方库（典型：UMD/CJS 产物，例如 lodash）会在运行时探测 `define.amd`：
 *   - 若存在 AMD，则优先走 `define(...)` 分支；
 *   - 但像 esm.sh 这类 CDN 的“CJS/UMD → ESM 包装”往往依赖 `module.exports` 提取导出；
 *   - 当 UMD 走了 AMD 分支时，`module.exports` 不会被赋值，最终表现为 ESM 导出（default/命名导出）为 `undefined`。
 *
 * 这里的策略：
 * 1) 全局串行锁：避免 `requireAsync` / `importAsync` 并发时互相影响（尤其是临时 patch 全局 `define.amd`）。
 * 2) 尽量缩小影响窗口：先预取模块（不改全局），再等待 requirejs 空闲，最后只在真正执行 `import()` 的瞬间临时屏蔽 `define.amd`。
 * 3) 所有操作均为 best-effort：内部结构变化、浏览器能力差异等情况下不会阻断正常流程。
 */

type RequireJsLike =
  | ((deps: string[], onLoad: (...args: any[]) => void, onError: (err: any) => void) => void)
  | undefined;

/**
 * 使用全局 Promise 链实现“互斥锁”：
 * - 锁存放在 `globalThis.__nocobaseRunjsModuleLoadLock`；
 * - 每次进入都会等待上一个任务完成；
 * - 无论任务成功/失败都会释放，避免死锁。
 *
 * 注意：这是 RunJS 运行时的全局锁（同一页面内共享），用于保护对全局对象的临时改动。
 */
async function withRunjsModuleLoadLock<T>(task: () => Promise<T>): Promise<T> {
  const g = globalThis as any;
  g.__nocobaseRunjsModuleLoadLock = (g.__nocobaseRunjsModuleLoadLock || Promise.resolve()).catch(() => {});
  const prev: Promise<void> = g.__nocobaseRunjsModuleLoadLock;
  let release: (() => void) | undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  g.__nocobaseRunjsModuleLoadLock = prev.then(() => current);
  await prev;
  try {
    return await task();
  } finally {
    release?.();
  }
}

/**
 * 临时屏蔽 `define.amd`（而不是删除 define），让 UMD 库不要走 AMD 分支。
 *
 * 关键点：
 * - 只在 `globalThis.define` 且 `define.amd` 存在时生效；
 * - 通过 property descriptor 恢复原状，尽量不破坏 requirejs 对 `define.amd` 的定义方式；
 * - 返回 restore 函数，调用后恢复到原先状态。
 */
function disableAmdDefineTemporarily(): () => void {
  const g = globalThis as any;
  const def = g?.define;
  const amd = def?.amd;
  if (!def || !amd) return () => {};

  const desc = Object.getOwnPropertyDescriptor(def, 'amd');
  const hadOwn = !!desc;
  const prev = amd;

  try {
    if (desc?.writable) {
      def.amd = undefined;
    } else if (desc?.configurable) {
      delete def.amd;
    } else {
      def.amd = undefined;
    }
  } catch (_) {
    // 忽略异常（best-effort，避免影响主流程）
  }

  return () => {
    try {
      if (hadOwn && desc) {
        // 恢复原始属性描述符（兼容数据/访问器 descriptor）。
        Object.defineProperty(def, 'amd', desc);
        return;
      }
      def.amd = prev;
    } catch (_) {
      // 忽略异常（best-effort，避免影响主流程）
    }
  };
}

/**
 * 判断 requirejs 当前是否仍有“正在加载、尚未初始化”的模块。
 *
 * 实现方式：
 * - requirejs 内部会维护 `requirejs.s.contexts[*].registry`；
 * - 我们 best-effort 扫描 registry，复用 requirejs `checkLoaded()` 的信号：
 *   `enabled && fetched && !inited && map.isDefine` => 仍处于 define() 加载链路中。
 *
 * 注意：这是内部结构探测，requirejs 升级/改动时可能失效，但失效时会返回 false（不阻断流程）。
 */
function hasPendingRequireJsLoads(): boolean {
  const g = globalThis as any;
  const req = g?.requirejs?.requirejs;
  const contexts = req?.s?.contexts;
  if (!contexts || typeof contexts !== 'object') return false;
  for (const ctxName of Object.keys(contexts)) {
    const ctx = contexts[ctxName];
    const registry = ctx?.registry;
    if (!registry || typeof registry !== 'object') continue;
    for (const id of Object.keys(registry)) {
      const mod = registry[id];
      if (!mod || typeof mod !== 'object') continue;
      if (!mod.enabled) continue;
      if (mod.error) continue;
      const map = mod.map;
      if (!map || typeof map !== 'object') continue;
      // 复用 requirejs `checkLoaded()` 的判定信号：识别仍在加载 define() 模块的情况。
      if (!mod.inited && mod.fetched && map.isDefine) return true;
    }
  }
  return false;
}

/**
 * 等待 requirejs “空闲”（没有挂起加载）：
 * - 轮询 `hasPendingRequireJsLoads()`；
 * - 达到超时后直接放行（best-effort，不阻塞用户逻辑）。
 */
async function waitForRequireJsIdle(options?: { timeoutMs?: number; pollMs?: number }): Promise<void> {
  const timeoutMs = Math.max(0, options?.timeoutMs ?? 1500);
  const pollMs = Math.max(10, options?.pollMs ?? 30);
  if (timeoutMs === 0) return;

  const start = Date.now();
  while (hasPendingRequireJsLoads()) {
    if (Date.now() - start >= timeoutMs) return;
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}

/**
 * 预取 ESM 模块（best-effort）以缩短后续 `import()` 实际执行期间的全局影响窗口。
 *
 * 为什么需要预取：
 * - 我们会在真实 `import()` 期间临时屏蔽 `define.amd`；
 * - 如果此时还要走网络请求，影响窗口会被拉长；
 * - 先做预取（不改全局），可让浏览器缓存命中，从而缩短“屏蔽 amd”的时间。
 *
 * 策略：
 * 1) 优先使用 `<link rel="modulepreload">`（若浏览器支持）；
 * 2) 否则用 `fetch` 拉取并 drain body 来“暖缓存”；
 * 3) 结果会缓存在 `globalThis.__nocobaseImportAsyncPrefetchCache`，避免重复预取；
 * 4) 预取失败不影响后续导入（内部会吞掉异常）。
 */
async function prefetchEsmModule(url: string, options?: { timeoutMs?: number }): Promise<void> {
  const u = typeof url === 'string' ? url.trim() : '';
  if (!u) return;

  const g = globalThis as any;
  g.__nocobaseImportAsyncPrefetchCache = g.__nocobaseImportAsyncPrefetchCache || new Map<string, Promise<void>>();
  const cache: Map<string, Promise<void>> = g.__nocobaseImportAsyncPrefetchCache;
  if (cache.has(u)) return await cache.get(u);

  const timeoutMs = Math.max(0, options?.timeoutMs ?? 5000);

  const task: Promise<void> = (async () => {
    // best-effort：优先用 modulepreload，让后续 dynamic import 尽量复用同一次响应/缓存。
    try {
      if (typeof document !== 'undefined' && document?.createElement) {
        const href = new URL(u, (globalThis as any)?.location?.href || undefined).toString();
        const head = document.head || document.getElementsByTagName('head')[0];
        if (head) {
          const selector = `link[rel="modulepreload"][href="${href}"]`;
          const existing = document.querySelector(selector);
          if (!existing) {
            const link = document.createElement('link');
            link.rel = 'modulepreload';
            link.href = href;
            // 与 dynamic import 的跨域拉取模式对齐。
            (link as any).crossOrigin = 'anonymous';
            const done = await new Promise<void>((resolve) => {
              let settled = false;
              const finalize = () => {
                if (settled) return;
                settled = true;
                link.onload = null;
                link.onerror = null;
                resolve();
              };
              const timer =
                timeoutMs > 0
                  ? setTimeout(() => {
                      finalize();
                    }, timeoutMs)
                  : undefined;
              link.onload = () => {
                if (timer) clearTimeout(timer);
                finalize();
              };
              link.onerror = () => {
                if (timer) clearTimeout(timer);
                finalize();
              };
              head.appendChild(link);
            });
            return done;
          }
        }
      }
    } catch (_) {
      // 忽略异常（best-effort，避免影响主流程）
    }

    // 兜底：用 fetch 拉取并 drain body，以“暖缓存”（尽量让后续 import 命中浏览器缓存）。
    try {
      if (typeof fetch !== 'function') return;
      const controller = typeof AbortController === 'function' ? new AbortController() : undefined;
      const timer =
        controller && timeoutMs > 0
          ? setTimeout(() => {
              try {
                controller.abort();
              } catch (_) {
                // 忽略异常
              }
            }, timeoutMs)
          : undefined;
      const res = await fetch(u, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'force-cache',
        signal: controller?.signal,
      } as any);
      if (timer) clearTimeout(timer);
      // 读取响应体，避免浏览器因未消费 body 而不写入缓存。
      if (res && (res as any).ok && typeof (res as any).arrayBuffer === 'function') {
        try {
          await (res as any).arrayBuffer();
        } catch (_) {
          // 忽略异常
        }
      }
    } catch (_) {
      // 忽略异常（best-effort，避免影响主流程）
    }
  })();

  // 预取失败不应影响真正 import：吞掉异常。
  const safeTask = task.catch(() => {});
  cache.set(u, safeTask);
  return await safeTask;
}

/**
 * 在 RunJS 内部按 URL 通过 requirejs 加载模块：
 * - 与 `runjsImportAsync` 共用同一把锁，避免并发加载期间全局 patch 互相干扰；
 * - 返回 requirejs 回调的第一个模块值（与现有 `ctx.requireAsync` 行为保持一致）。
 */
export async function runjsRequireAsync(requirejs: RequireJsLike, url: string): Promise<any> {
  return await withRunjsModuleLoadLock(
    () =>
      new Promise((resolve, reject) => {
        if (!requirejs) {
          reject(new Error('requirejs is not available'));
          return;
        }
        requirejs(
          [url],
          (...args: any[]) => {
            resolve(args[0]);
          },
          reject,
        );
      }),
  );
}

/**
 * 在 RunJS 内部按 URL 动态导入 ESM 模块（返回模块命名空间对象）。
 *
 * 兼容点：
 * - 若检测到 `globalThis.define.amd`，则会在导入前做预取，并在真正执行 `import()` 时短暂屏蔽 `define.amd`；
 * - 为了进一步降低风险，会先等待 requirejs 没有挂起加载；
 * - 使用带 `@vite-ignore` / `webpackIgnore: true` 标记的 dynamic import，避免被打包器重写；
 * - 若仍被拦截，再用 `eval('u => import(u)')` 兜底。
 *
 * 重要说明：
 * - 这里不做 URL 解析（如拼 CDN base/suffix），调用方应传入“最终可 import 的 URL”；
 * - 缓存通常由上层（例如 `ctx.importAsync`）按 URL 做 Map 缓存，此处只负责导入与兼容逻辑。
 */
export async function runjsImportAsync(url: string): Promise<any> {
  if (!url || typeof url !== 'string') {
    throw new Error('invalid url');
  }
  const u = url.trim();
  const shouldPatchAmd = !!(globalThis as any)?.define?.amd;
  // 尽量缩小全局副作用窗口：
  // 1) 先预取模块（保持 `define.amd` 不动）
  // 2) 等待 requirejs 空闲
  // 3) 仅在模块实例化（import 执行）期间短暂屏蔽 `define.amd`
  if (shouldPatchAmd) await prefetchEsmModule(u);

  return await withRunjsModuleLoadLock(async () => {
    await waitForRequireJsIdle();
    // 一些 UMD 包（例如 lodash）在检测到 `define.amd` 时会优先走 AMD 分支，
    // 这会导致 esm.sh 等“CJS/UMD → ESM 包装”无法从 module.exports 提取导出（表现为导出为 undefined）。
    // 因此在评估/实例化阶段临时屏蔽 AMD 标志，强制走非 AMD 分支。
    const restoreAmd = shouldPatchAmd ? disableAmdDefineTemporarily() : () => {};
    try {
      // 尝试使用原生 dynamic import（加上 vite/webpack 的 ignore 注释）
      const nativeImport = () => import(/* @vite-ignore */ /* webpackIgnore: true */ u);
      // 兜底方案：通过 eval 在运行时构造 import，避免被打包器接管
      const evalImport = () => {
        const importer = (0, eval)('u => import(u)');
        return importer(u);
      };
      try {
        return await nativeImport();
      } catch (err: any) {
        // 常见于打包产物仍然拦截了 dynamic import 或开发态插件未识别 ignore 注释
        try {
          return await evalImport();
        } catch (err2) {
          throw err2 || err;
        }
      }
    } finally {
      restoreAmd();
    }
  });
}
