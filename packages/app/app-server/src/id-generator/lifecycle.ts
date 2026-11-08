import {
  SnowflakeIdGenerator,
  type IdGeneratorService,
} from '@nocobase/snowflake';
import type { AppSnowflakeConfig } from './config.js';

/** Construct synchronously without acquiring resources; initialization owns asynchronous work. */
export type IdGeneratorFactory = () => ManagedIdGenerator;

export interface ManagedIdGenerator extends IdGeneratorService {
  initialize(): Promise<void>;
  /** Close generation synchronously, then finish bounded resource cleanup, including partial initialization. */
  shutdown(): Promise<void>;
}

export interface IdGeneratorLifecycle {
  readonly mode: 'manual' | 'auto';
  /** Register exactly one auto factory during Provider.register(), without replacing the business Token. */
  registerFactory(factory: IdGeneratorFactory): void;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

/** Host wait budget; a timeout reports an unknown return, never successful cancellation. */
export const ID_GENERATOR_SHUTDOWN_TIMEOUT_MS: number = 15_000;

export class AppIdGenerator
  implements IdGeneratorService, IdGeneratorLifecycle
{
  private factory?: IdGeneratorFactory;
  private generator?: IdGeneratorService;
  private managed?: ManagedIdGenerator;
  private initialized?: Promise<void>;
  private stopped?: Promise<void>;
  private closed = false;

  public constructor(private readonly config: AppSnowflakeConfig) {}

  public get mode(): 'manual' | 'auto' {
    return this.isAuto() ? 'auto' : 'manual';
  }

  public registerFactory(factory: IdGeneratorFactory): void {
    if (this.factory || this.initialized || this.closed) {
      throw new Error(
        'The automatic ID factory must be registered once before initialization.',
      );
    }
    this.factory = factory;
  }

  public initialize(): Promise<void> {
    this.initialized ??= Promise.resolve().then(async () => {
      this.assertOpen();
      if (this.isAuto()) {
        if (
          this.config.workerId !== undefined ||
          this.config.epoch !== undefined
        ) {
          throw new Error(
            'Automatic Snowflake mode forbids workerId and epoch overrides.',
          );
        }
        if (!this.factory)
          throw new Error(
            'Automatic Snowflake mode requires an ID generator factory.',
          );
        this.managed = this.factory();
        await this.managed.initialize();
        this.assertOpen();
        this.generator = this.managed;
      }
    });
    return this.initialized;
  }

  public generate(): number {
    this.assertOpen();
    const generator = this.isAuto() ? this.generator : this.manualGenerator();
    if (!generator)
      throw new Error('Automatic ID generation has not initialized.');
    return generator.generate();
  }

  public generateString(): string {
    return String(this.generate());
  }

  public shutdown(): Promise<void> {
    this.closed = true;
    // Invoke immediately, even while initialize is pending: the adapter must cancel/drain its own work.
    this.stopped ??= boundedShutdown(() => this.managed?.shutdown());
    return this.stopped;
  }

  private isAuto(): boolean {
    if (
      this.config?.mode !== undefined &&
      this.config.mode !== 'manual' &&
      this.config.mode !== 'auto'
    ) {
      throw new Error('Snowflake mode must be manual or auto.');
    }
    return this.config?.mode === 'auto';
  }

  private manualGenerator(): IdGeneratorService {
    if (this.config?.mode === 'auto')
      throw new Error(
        'Automatic Snowflake mode cannot use a manual generator.',
      );
    this.generator ??= new SnowflakeIdGenerator(this.config);
    return this.generator;
  }

  private assertOpen(): void {
    if (this.closed) throw new Error('ID generation is permanently closed.');
  }
}

async function boundedShutdown(
  shutdown: () => Promise<void> | undefined,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      shutdown(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                'ID generator shutdown timed out; worker return is unknown.',
              ),
            ),
          ID_GENERATOR_SHUTDOWN_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
