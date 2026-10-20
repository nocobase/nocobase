import type { OnlineAgentToolExecution } from '../agent/types.js';
import type {
  OnlineAgentSandbox,
  OnlineAgentSandboxInput,
  OnlineAgentSandboxPreparation,
  OnlineAgentSandboxProvider,
} from './types.js';

/** Execution-local capabilities; only the first shell call allocates a Sandbox. */
export class NativeToolExecution implements OnlineAgentToolExecution {
  private prepared: Promise<OnlineAgentSandboxPreparation> | undefined;
  private closed = false;
  private cleanup: Promise<void> | undefined;

  constructor(
    readonly id: string,
    private readonly owner: { sandbox?: Promise<OnlineAgentSandbox> },
    private readonly input: OnlineAgentSandboxInput,
    private readonly provider: OnlineAgentSandboxProvider | undefined,
  ) {}

  private available(): void {
    if (this.closed) throw new Error('Execution is closed.');
    this.input.context.signal.throwIfAborted();
  }

  private preparation(): Promise<OnlineAgentSandboxPreparation> {
    this.available();
    if (!this.provider) throw new Error('Sandbox provider is unavailable.');
    return (this.prepared ??= this.provider.prepare(this.input));
  }

  async instructions(tools: readonly string[]): Promise<string> {
    if (!tools.some((name) => name === 'bash' || name === 'skill')) return '';
    return (await this.preparation()).instructions;
  }

  async getSandbox(): Promise<OnlineAgentSandbox> {
    this.available();
    const sandbox = await (this.owner.sandbox ??= this.preparation().then(
      (prepared) => {
        this.available();
        return prepared.create();
      },
    ));
    this.available();
    return sandbox;
  }

  async readSkill(name: string): Promise<{ ok: boolean; output: string }> {
    const prepared = await this.preparation();
    this.available();
    return prepared.readSkill(name);
  }

  dispose(): Promise<void> {
    if (this.cleanup) return this.cleanup;
    this.closed = true;
    this.cleanup = (async () => {
      // Creation failures release partial resources in the provider, not here.
      const sandbox = await this.owner.sandbox?.catch(() => undefined);
      await sandbox?.dispose();
      const prepared = await this.prepared?.catch(() => undefined);
      prepared?.dispose();
    })().catch((error: unknown) => {
      this.cleanup = undefined;
      throw error;
    });
    return this.cleanup;
  }
}
