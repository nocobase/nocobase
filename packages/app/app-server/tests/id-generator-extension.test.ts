import { describe, expect, it, vi } from 'vitest';
import { ServiceProvider } from '@nocobase/service-provider';
import {
  SnowflakeIdGenerator,
  type IdGeneratorService,
} from '@nocobase/snowflake';
import { Application } from '../src/application/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  IdGeneratorProvider,
  idGeneratorToken,
  idGeneratorImplementationToken,
  type IdGeneratorImplementation,
} from '../src/id-generator/index.js';

async function application(
  snowflake: unknown = { workerId: 7 },
): Promise<Application> {
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({ snowflake });
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: '/test/id-extension' }),
  });
  app.addServiceProvider(IdGeneratorProvider);
  return app;
}

function extension(value = 42) {
  let ready = false;
  let closed = false;
  const generate = () => {
    if (closed) throw new Error('closed');
    if (!ready) throw new Error('not initialized');
    return value;
  };
  const implementation: IdGeneratorImplementation = {
    initialize: vi.fn(async () => {
      ready = true;
    }),
    generate,
    generateString: () => String(generate()),
  };
  return {
    implementation,
    close: () => {
      closed = true;
    },
  };
}

function registerExtension(
  app: Application,
  implementation: IdGeneratorImplementation,
): void {
  class ExtensionProvider extends ServiceProvider<Application> {
    public readonly name: string = 'test/id-extension';
    public override register(): void {
      this.app.container.instance(
        idGeneratorImplementationToken,
        implementation,
      );
    }
  }
  app.addServiceProvider(ExtensionProvider);
}

describe('optional ID implementation', () => {
  it('keeps the original synchronous numeric/string API and manual epoch without an extension', async () => {
    const epoch = 1_600_000_000;
    const app = await application({ workerId: 7, epoch });
    try {
      await app.start();
      const ids = app.container.resolve(idGeneratorToken);
      expect(app.container.resolve(idGeneratorToken)).toBe(ids);
      const number = ids.generate();
      const string = ids.generateString();
      expect(typeof number).toBe('number');
      expect(typeof string).toBe('string');
      const parser = new SnowflakeIdGenerator({ workerId: 0, epoch });
      expect(parser.parse(number).workerId).toBe(7);
      expect(parser.parse(string).sequence).toBe(
        parser.parse(number).sequence + 1,
      );
      expect(parser.parse(number).timestamp).toBeGreaterThanOrEqual(
        Math.floor(Date.now() / 1000) - 1,
      );
    } finally {
      await app.shutdown();
    }
  });

  it('validates used manual configuration lazily, not while resolving the public object', async () => {
    const app = await application({ workerId: 'invalid' });
    app.registerProviders();
    const ids = app.container.resolve(idGeneratorToken);
    expect(() => ids.generate()).toThrow('workerId');
    await app.shutdown();
  });

  it('uses a later extension through an early resolved reference without constructing an invalid manual generator', async () => {
    const app = await application({ workerId: 'ignored', epoch: 'ignored' });
    let early: IdGeneratorService | undefined;
    const fake = extension();
    class Consumer extends ServiceProvider<Application> {
      public readonly name: string = 'early-consumer';
      public override register(): void {
        early = this.app.container.resolve(idGeneratorToken);
      }
      public override async boot(): Promise<void> {
        expect(early?.generate()).toBe(42);
      }
    }
    app.addServiceProvider(Consumer);
    registerExtension(app, fake.implementation);
    app.registerProviders();
    expect(() => early?.generate()).toThrow('not initialized');
    try {
      await app.start();
      expect(app.container.resolve(idGeneratorToken)).toBe(early);
      expect(early?.generateString()).toBe('42');
      expect(fake.implementation.initialize).toHaveBeenCalledTimes(1);
      fake.close();
      expect(() => early?.generate()).toThrow('closed');
      expect(() => early?.generateString()).toThrow('closed');
    } finally {
      await app.shutdown();
    }
  });

  it('awaits initialization before later business providers boot', async () => {
    const app = await application();
    const fake = extension();
    let finish: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const initialized = fake.implementation.initialize;
    fake.implementation.initialize = vi.fn(async () => {
      await gate;
      await initialized();
    });
    const businessBoot = vi.fn();
    class Business extends ServiceProvider<Application> {
      public readonly name: string = 'business';
      public override async boot(): Promise<void> {
        businessBoot(this.app.container.resolve(idGeneratorToken).generate());
      }
    }
    app.addServiceProvider(Business);
    registerExtension(app, fake.implementation);
    const starting = app.start();
    await vi.waitFor(() =>
      expect(fake.implementation.initialize).toHaveBeenCalledTimes(1),
    );
    expect(businessBoot).not.toHaveBeenCalled();
    finish!();
    try {
      await starting;
      expect(businessBoot).toHaveBeenCalledWith(42);
    } finally {
      await app.shutdown();
    }
  });

  it('propagates initialization and generation failures without manual fallback', async () => {
    const app = await application();
    const failure = new Error('allocation failed');
    const implementation: IdGeneratorImplementation = {
      initialize: vi.fn(async () => {
        throw failure;
      }),
      generate: () => {
        throw failure;
      },
      generateString: () => {
        throw failure;
      },
    };
    registerExtension(app, implementation);
    await expect(app.start()).rejects.toBe(failure);
    expect(() => app.container.resolve(idGeneratorToken).generate()).toThrow(
      failure,
    );
    await app.shutdown();
  });

  it('rejects duplicate extensions using the existing container constraint', async () => {
    const app = await application();
    app.registerProviders();
    app.container.instance(
      idGeneratorImplementationToken,
      extension().implementation,
    );
    expect(() =>
      app.container.instance(
        idGeneratorImplementationToken,
        extension().implementation,
      ),
    ).toThrow('already registered');
    await app.shutdown();
  });

  it('isolates implementations across applications', async () => {
    const a = await application();
    const b = await application();
    registerExtension(a, extension(12).implementation);
    registerExtension(b, extension(34).implementation);
    try {
      await a.start();
      await b.start();
      expect(a.container.resolve(idGeneratorToken).generate()).toBe(12);
      expect(b.container.resolve(idGeneratorToken).generate()).toBe(34);
    } finally {
      await a.shutdown();
      await b.shutdown();
    }
  });
});
