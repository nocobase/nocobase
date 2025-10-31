import { describe, it, expect, vi } from 'vitest';
import { FlowEngine } from '../src/flowEngine';
import { createViewScopedEngine } from '../src/ViewScopedFlowEngine';
import { createBlockScopedEngine } from '../src/BlockScopedFlowEngine';
import { FlowModel } from '../src/models/flowModel';

describe('FlowEngine emitter lifecycle', () => {
  it('emits model:created on createModel', () => {
    const engine = new FlowEngine();
    const spy = vi.fn();
    engine.emitter.once('model:created', ({ model }) => {
      expect(model).toBeInstanceOf(FlowModel);
      spy();
    });
    const m = engine.createModel({ use: 'FlowModel' });
    expect(m).toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('emits event:<name>:start/end around dispatchEvent', async () => {
    const engine = new FlowEngine();
    const m = engine.createModel({ use: 'FlowModel' });

    const seq: string[] = [];
    engine.emitter.on(`event:custom:start`, ({ model, eventName }) => {
      expect(model.uid).toBe(m.uid);
      expect(eventName).toBe('custom');
      seq.push('start');
    });
    engine.emitter.on(`event:custom:end`, ({ model, eventName, results }) => {
      expect(model.uid).toBe(m.uid);
      expect(eventName).toBe('custom');
      // no flows registered, results should be []
      expect(Array.isArray(results) || results === undefined).toBeTruthy();
      seq.push('end');
    });

    await m.dispatchEvent('custom');
    expect(seq).toEqual(['start', 'end']);
  });

  it('semantic wrappers onEventStart/onEventEnd work', async () => {
    const engine = new FlowEngine();
    const model = engine.createModel({ use: 'FlowModel' });
    const seq: string[] = [];
    const offStart = engine.onEventStart('wrap', ({ model: m, eventName }) => {
      expect(m.uid).toBe(model.uid);
      expect(eventName).toBe('wrap');
      seq.push('start');
    });
    const offEnd = engine.onEventEnd('wrap', ({ model: m, eventName }) => {
      expect(m.uid).toBe(model.uid);
      expect(eventName).toBe('wrap');
      seq.push('end');
    });
    await model.dispatchEvent('wrap');
    expect(seq).toEqual(['start', 'end']);
    offStart();
    offEnd();
  });

  it('semantic wrappers onModelCreated/onModelDestroyed support tag cleanup', async () => {
    const engine = new FlowEngine();
    const actor = engine.createModel({ use: 'FlowModel' });
    const createdSpy = vi.fn();
    const destroyedSpy = vi.fn();
    const offCreated = engine.onModelCreated(() => createdSpy(), { tag: actor.uid });
    const offDestroyed = engine.onModelDestroyed(() => destroyedSpy(), { tag: actor.uid });
    const m = engine.createModel({ use: 'FlowModel' });
    expect(createdSpy).toHaveBeenCalledTimes(1);
    await engine.destroyModel(m.uid);
    expect(destroyedSpy).toHaveBeenCalledTimes(1);
    // destroy actor -> both tagged listeners should be cleaned
    await engine.destroyModel(actor.uid);
    const n = engine.createModel({ use: 'FlowModel' });
    expect(createdSpy).toHaveBeenCalledTimes(1);
    await engine.destroyModel(n.uid);
    expect(destroyedSpy).toHaveBeenCalledTimes(1);
    // call offs (should be no-op now)
    offCreated();
    offDestroyed();
  });

  it('emits model:destroyed on destroyModel', async () => {
    const engine = new FlowEngine();
    const m = engine.createModel({ use: 'FlowModel' });
    const spy = vi.fn();
    engine.emitter.once('model:destroyed', ({ uid, model }) => {
      expect(uid).toBe(m.uid);
      expect(model?.uid).toBe(m.uid);
      spy();
    });
    await engine.destroyModel(m.uid);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // Note: model:mounted is emitted from a React effect; in this environment we validate lifecycle via other tests.

  it('emitter.once auto-unsubscribes', async () => {
    const engine = new FlowEngine();
    const m = engine.createModel({ use: 'FlowModel' });
    const calls: number[] = [];
    engine.emitter.once('event:custom:end', () => calls.push(1));
    await m.dispatchEvent('custom');
    await m.dispatchEvent('custom');
    expect(calls.length).toBe(1);
  });

  it('emitter.on returns off and off works', async () => {
    const engine = new FlowEngine();
    const m = engine.createModel({ use: 'FlowModel' });
    let count = 0;
    const off = engine.emitter.on('event:x:end', () => count++);
    await m.dispatchEvent('x');
    off();
    await m.dispatchEvent('x');
    expect(count).toBe(1);
  });

  it('offByTag works manually (without destroy)', async () => {
    const engine = new FlowEngine();
    const a = engine.createModel({ use: 'FlowModel' });
    const t = engine.createModel({ use: 'FlowModel' });
    let count = 0;
    engine.emitter.on('event:y:end', () => count++, { tag: a.uid });
    await t.dispatchEvent('y');
    expect(count).toBe(1);
    engine.emitter.offByTag(a.uid);
    await t.dispatchEvent('y');
    expect(count).toBe(1);
  });

  it("listener tagged with actor's own uid should not receive its destroyed event", async () => {
    const engine = new FlowEngine();
    const actor = engine.createModel({ use: 'FlowModel' });
    let count = 0;
    engine.onModelDestroyed(() => count++, { tag: actor.uid });
    await engine.destroyModel(actor.uid);
    expect(count).toBe(0);
  });

  it('beforeRender payload includes inputArgs and results when flows run', async () => {
    const engine = new FlowEngine();
    const m = engine.createModel({ use: 'FlowModel' });
    // register a flow bound to beforeRender
    m.registerFlow({
      key: 'f1',
      on: 'beforeRender',
      steps: {
        s1: {
          handler: () => 'OK',
        },
      },
    } as any);

    const payloads: any[] = [];
    engine.onEventEnd('beforeRender', (p) => {
      if (p.model.uid === m.uid) payloads.push(p);
    });

    await m.dispatchEvent('beforeRender', { foo: 'bar' });
    expect(payloads.length).toBe(1);
    expect(payloads[0].eventName).toBe('beforeRender');
    expect(payloads[0].inputArgs?.foo).toBe('bar');
    // results: array of stepResults per flow
    const results = payloads[0].results;
    expect(Array.isArray(results)).toBe(true);
    expect(results[0]?.s1).toBe('OK');
  });

  it('multiple flows on beforeRender produce ordered results by sort', async () => {
    const engine = new FlowEngine();
    const m = engine.createModel({ use: 'FlowModel' });
    m.registerFlow({
      key: 'fB',
      on: 'beforeRender',
      sort: 2,
      steps: { b: { handler: () => 'B' } },
    } as any);
    m.registerFlow({
      key: 'fA',
      on: 'beforeRender',
      sort: 1,
      steps: { a: { handler: () => 'A' } },
    } as any);
    let captured: any;
    engine.onEventEnd('beforeRender', (p) => {
      if (p.model.uid === m.uid) captured = p;
    });
    await m.dispatchEvent('beforeRender');
    expect(Array.isArray(captured.results)).toBe(true);
    // Order by sort: fA -> fB
    expect(captured.results[0].a).toBe('A');
    expect(captured.results[1].b).toBe('B');
  });

  it('offByTag clears only listeners with the given tag', async () => {
    const engine = new FlowEngine();
    const a1 = engine.createModel({ use: 'FlowModel' });
    const a2 = engine.createModel({ use: 'FlowModel' });
    const t = engine.createModel({ use: 'FlowModel' });
    let c1 = 0,
      c2 = 0;
    engine.onEventEnd('m', () => c1++, { tag: a1.uid });
    engine.onEventEnd('m', () => c2++, { tag: a2.uid });
    await t.dispatchEvent('m');
    expect(c1).toBe(1);
    expect(c2).toBe(1);
    engine.emitter.offByTag(a1.uid);
    await t.dispatchEvent('m');
    expect(c1).toBe(1);
    expect(c2).toBe(2);
  });

  it('onEventEnd off function stops further callbacks', async () => {
    const engine = new FlowEngine();
    const t = engine.createModel({ use: 'FlowModel' });
    let c = 0;
    const off = engine.onEventEnd('q', () => c++);
    await t.dispatchEvent('q');
    expect(c).toBe(1);
    off();
    await t.dispatchEvent('q');
    expect(c).toBe(1);
  });

  it('once with tag only fires once and cleans with actor destroy', async () => {
    const engine = new FlowEngine();
    const actor = engine.createModel({ use: 'FlowModel' });
    const t = engine.createModel({ use: 'FlowModel' });
    let c = 0;
    engine.onEventEnd('once', () => c++, { tag: actor.uid });
    await t.dispatchEvent('once');
    await t.dispatchEvent('once');
    // not once here; onEventEnd registers normal on; change to once API via emitter
    // refine: use emitter.once with tag
    const tag2 = engine.createModel({ use: 'FlowModel' }).uid;
    let c2 = 0;
    engine.emitter.once('event:once2:end', () => c2++, { tag: tag2 });
    await t.dispatchEvent('once2');
    await t.dispatchEvent('once2');
    expect(c2).toBe(1);
    await engine.destroyModel(tag2);
    await t.dispatchEvent('once2');
    expect(c2).toBe(1);
  });

  it('onEventStart receives inputArgs and fires every time', async () => {
    const engine = new FlowEngine();
    const m = engine.createModel({ use: 'FlowModel' });
    let count = 0;
    engine.onEventStart('custom', (p) => {
      if (p.model.uid === m.uid && p.inputArgs?.x === 1) count++;
    });
    await m.dispatchEvent('custom', { x: 1 });
    await m.dispatchEvent('custom', { x: 1 });
    expect(count).toBe(2);
  });
});

describe('FlowEngine emitter scoping', () => {
  it('ViewScoped emitter is isolated from parent', () => {
    const parent = new FlowEngine();
    const child = createViewScopedEngine(parent);

    const childSpy = vi.fn();
    const parentSpy = vi.fn();

    child.emitter.on('model:created', childSpy);
    parent.emitter.on('model:created', parentSpy);

    parent.createModel({ use: 'FlowModel' });

    expect(parentSpy).toHaveBeenCalledTimes(1);
    expect(childSpy).toHaveBeenCalledTimes(0);
  });

  it('ViewScoped created in child does not reach parent', () => {
    const parent = new FlowEngine();
    const child = createViewScopedEngine(parent);
    const childSpy = vi.fn();
    const parentSpy = vi.fn();
    child.emitter.on('model:created', childSpy);
    parent.emitter.on('model:created', parentSpy);
    child.createModel({ use: 'FlowModel' });
    expect(childSpy).toHaveBeenCalledTimes(1);
    expect(parentSpy).toHaveBeenCalledTimes(0);
  });

  it('BlockScoped emitter shares with parent', () => {
    const parent = new FlowEngine();
    const block = createBlockScopedEngine(parent);

    const blockSpy = vi.fn();
    block.emitter.on('model:created', blockSpy);

    parent.createModel({ use: 'FlowModel' });

    expect(blockSpy).toHaveBeenCalledTimes(1);
  });

  it('BlockScoped create in block reaches parent', () => {
    const parent = new FlowEngine();
    const block = createBlockScopedEngine(parent);
    const parentSpy = vi.fn();
    parent.emitter.on('model:created', parentSpy);
    block.createModel({ use: 'FlowModel' });
    expect(parentSpy).toHaveBeenCalledTimes(1);
  });

  it('ViewScoped tag cleanup is local and does not affect parent', async () => {
    const parent = new FlowEngine();
    const child = createViewScopedEngine(parent);
    const actorChild = child.createModel({ use: 'FlowModel' });
    const targetChild = child.createModel({ use: 'FlowModel' });

    let childCount = 0;
    let parentCount = 0;
    child.onEventEnd('z', () => childCount++, { tag: actorChild.uid });
    parent.onEventEnd('z', () => parentCount++);

    await targetChild.dispatchEvent('z');
    expect(childCount).toBe(1);
    expect(parentCount).toBe(0);

    await child.destroyModel(actorChild.uid); // should offByTag in child only
    await targetChild.dispatchEvent('z');
    expect(childCount).toBe(1);
    expect(parentCount).toBe(0);
  });

  it('ViewScoped event start/end do not bubble to parent', async () => {
    const parent = new FlowEngine();
    const child = createViewScopedEngine(parent);
    const model = child.createModel({ use: 'FlowModel' });
    let parentCount = 0;
    let childCount = 0;
    parent.onEventStart('iso', () => parentCount++);
    child.onEventStart('iso', () => childCount++);
    await model.dispatchEvent('iso');
    expect(childCount).toBe(1);
    expect(parentCount).toBe(0);
  });

  it('BlockScoped actor destroy triggers offByTag in parent emitter', async () => {
    const parent = new FlowEngine();
    const block = createBlockScopedEngine(parent);
    const actor = block.createModel({ use: 'FlowModel' });
    const target = parent.createModel({ use: 'FlowModel' });
    let count = 0;
    // register in parent emitter with actor tag
    parent.onEventEnd('bb', () => count++, { tag: actor.uid });
    await target.dispatchEvent('bb');
    expect(count).toBe(1);
    // destroy actor in block -> should clean tagged listener in parent emitter
    await block.destroyModel(actor.uid);
    await target.dispatchEvent('bb');
    expect(count).toBe(1);
  });
});

describe('Emitter tag cleanup', () => {
  it('offByTag cleans listeners when actor destroyed', async () => {
    const engine = new FlowEngine();
    const actor = engine.createModel({ use: 'FlowModel' });
    const target = engine.createModel({ use: 'FlowModel' });

    const calls: number[] = [];
    engine.emitter.on(
      `event:custom:end`,
      () => {
        calls.push(Date.now());
      },
      { tag: actor.uid },
    );

    await target.dispatchEvent('custom');
    expect(calls.length).toBe(1);

    // destroy actor -> offByTag(actor.uid) should run
    await engine.destroyModel(actor.uid);

    await target.dispatchEvent('custom');
    expect(calls.length).toBe(1); // no new call
  });
});
