import { createRequire } from 'node:module';
import type { ServiceResolver } from '@nocobase/service-provider';
import type { DemoModelService } from '../../shared/model-services.js';

interface DemoModelInput {
  title: string;
  provider: 'openai-compatible';
  baseUrl: string | null;
  apiKey?: string | null;
  models: {
    value: string;
    label: string;
    kind?: 'chat' | 'embedding' | 'rerank';
    dimensions?: number | null;
  }[];
}

/** The official Agents capability used here, without requiring its types in non-AI applications. */
export interface DemoAgents {
  readonly models?: {
    readonly services?: {
      list(): Promise<readonly DemoModelService[]>;
      create(input: DemoModelInput): Promise<DemoModelService>;
      update(
        name: string,
        input: Partial<Omit<DemoModelInput, 'title' | 'provider'>> & {
          enabled?: boolean;
        },
      ): Promise<unknown>;
      remove(name: string): Promise<void>;
    };
  };
}

/** Missing optional packages are allowed; errors loading an installed integration must remain visible. */
export async function resolveDemoAgents(
  container: ServiceResolver,
): Promise<DemoAgents | undefined> {
  try {
    createRequire(import.meta.url).resolve(
      '@nocobase/app-plugin-agents/package.json',
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND')
      return undefined;
    throw error;
  }
  const { agentsToken } =
    await import('@nocobase/app-plugin-agents/server/tokens');
  return container.has(agentsToken)
    ? container.resolve(agentsToken)
    : undefined;
}
