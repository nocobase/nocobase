import type { ReactElement, RefCallback } from 'react';
import { expectTypeOf } from 'vitest';

import {
  AIFormRegistry,
  AIFormRegistryProvider,
  useAIForm,
  useAIFormRegistry,
  useChatUIContextSource,
  type AIFormApplyResult,
  type AIFormField,
  type AIFormOperationContext,
  type AIFormRegistration,
  type AIFormRegistrationHandle,
  type AIFormSnapshot,
  type AIFormValues,
  type AppUIJson,
  type PageUIItem,
} from '../client/chat.js';

// Compile-only consumer contract, included in tsconfig.type-tests.json.
const fields: readonly AIFormField[] = [
  { name: 'name', type: 'string', editable: true },
  { name: 'status', type: 'string', editable: true, enum: ['draft', 'ready'] },
  { name: 'record', type: 'string', editable: false },
];
const registration: AIFormRegistration = {
  id: 'draft',
  identity: 'user:record',
  title: 'Draft',
  fields,
  getRevision: () => '0',
  getValues: async (context) => {
    expectTypeOf(context).toEqualTypeOf<AIFormOperationContext>();
    return { name: '', status: 'draft', record: 'record' };
  },
  setValues: async (patch, context) => {
    expectTypeOf(patch).toEqualTypeOf<AIFormValues>();
    expectTypeOf(context.signal).toEqualTypeOf<AbortSignal>();
    expectTypeOf(context.isCurrent()).toEqualTypeOf<boolean>();
    return { status: 'applied' };
  },
  validate: (patch) => {
    expectTypeOf(patch).toEqualTypeOf<Record<string, AppUIJson>>();
    return undefined;
  },
};

expectTypeOf<ReturnType<typeof useAIForm<HTMLFormElement>>>().toEqualTypeOf<
  RefCallback<HTMLFormElement>
>();

export function FormConsumer(): ReactElement {
  const registry = useAIFormRegistry();
  const ref = useAIForm<HTMLFormElement>(registration);
  useChatUIContextSource({
    kind: 'form',
    id: registration.id,
    label: registration.title,
    getSnapshot: () => registry.snapshot(registration.id),
  });
  return <form ref={ref} />;
}

export function ProviderConsumer(): ReactElement {
  return (
    <AIFormRegistryProvider>
      <FormConsumer />
    </AIFormRegistryProvider>
  );
}

async function checkRegistry(registry: AIFormRegistry): Promise<void> {
  const handle = registry.register(registration);
  expectTypeOf(handle).toEqualTypeOf<AIFormRegistrationHandle>();
  const snapshot = await registry.snapshot('draft');
  expectTypeOf(snapshot).toEqualTypeOf<AIFormSnapshot>();
  const item: PageUIItem = snapshot;
  const outcome = registry.apply({
    source: item,
    operationId: 'message:tool',
    values: { name: 'Edited' },
  });
  expectTypeOf(outcome).toEqualTypeOf<Promise<AIFormApplyResult>>();
  handle.update(registration);
  handle.unregister();
}

void ProviderConsumer;
void checkRegistry;
