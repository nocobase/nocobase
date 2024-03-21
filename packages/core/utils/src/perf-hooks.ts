import { RecordableHistogram, performance } from 'perf_hooks';

export const prePerfHooksWrap = (handler: any, options?: { name?: string }) => {
  const { name } = options || {};
  return async (ctx: any, next: any) => {
    if (!ctx.getPerfHistogram) {
      return await handler(ctx, next);
    }
    const histogram = ctx.getPerfHistogram(name || handler) as RecordableHistogram;
    const start = performance.now();
    await handler(ctx, async () => {
      const duration = performance.now() - start;
      histogram.record(Math.ceil(duration * 1e6));
      await next();
    });
  };
};

export const postPerfHooksWrap = (handler: any, options: { name?: string }) => {
  const { name } = options || {};
  return async (ctx: any, next: any) => {
    if (!ctx.getPerfHistogram) {
      return await handler(ctx, next);
    }
    await next();
    const histogram = ctx.getPerfHistogram(name || handler) as RecordableHistogram;
    const start = performance.now();
    await handler(ctx, async () => {});
    const duration = performance.now() - start;
    histogram.record(Math.ceil(duration * 1e6));
  };
};
