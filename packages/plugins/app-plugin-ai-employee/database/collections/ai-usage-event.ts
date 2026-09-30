import type { BuilderResult, CollectionBuilder } from '@nocobase/db';

/**
 * The shape 202608260002 creates, not the current schema. That migration is
 * this file's only consumer, so editing it here would silently change what an
 * already-released migration does on a fresh database. Later columns, such as
 * `occurredHour`, are added by their own migrations instead.
 */
export function createAIUsageEventCollection(
  builder: CollectionBuilder,
): Promise<BuilderResult> {
  return builder.createCollection(
    'aiUsageEvents',
    (c) => {
      c.bigInt('id').notNull();
      c.bigInt('occurredAt').notNull();
      c.uuid('sessionId').notNull();
      c.bigInt('messageId').notNull();
      c.string('userId').nullable();
      c.string('aiEmployeeUsername').nullable();
      c.string('from', { defaultValue: 'main-agent' }).notNull();
      c.string('category', { defaultValue: 'chat' }).notNull();
      c.string('eventType', { defaultValue: 'llm_message' }).notNull();
      c.string('role').notNull();
      c.string('provider').nullable();
      c.string('llmService').nullable();
      c.string('model').nullable();
      c.bigInt('inputTokens', { defaultValue: 0 }).notNull();
      c.bigInt('outputTokens', { defaultValue: 0 }).notNull();
      c.bigInt('totalTokens', { defaultValue: 0 }).notNull();
      c.bigInt('cachedTokens', { defaultValue: 0 }).notNull();
      c.bigInt('reasoningTokens', { defaultValue: 0 }).notNull();
      c.integer('toolCallCount', { defaultValue: 0 }).notNull();
      c.integer('autoToolCallCount', { defaultValue: 0 }).notNull();
      c.string('status', { defaultValue: 'success' }).notNull();
      c.json('rawUsageMetadata').nullable();
      c.json('rawResponseMetadata').nullable();
      c.foreignKey('userId', {
        references: { collection: 'user', fields: ['id'] },
      });
      c.foreignKey('aiEmployeeUsername', {
        references: { collection: 'aiEmployees', fields: ['username'] },
      });
      c.unique(['messageId', 'eventType'], {
        name: 'uq_ai_usage_events_message_type',
      });
      c.index('occurredAt', { name: 'idx_ai_usage_events_occurred' });
      c.index(['userId', 'occurredAt'], {
        name: 'idx_ai_usage_events_user_occurred',
      });
      c.index(['aiEmployeeUsername', 'occurredAt'], {
        name: 'idx_ai_usage_events_employee_occurred',
      });
      c.index('sessionId', { name: 'idx_ai_usage_events_session' });
    },
    { ifNotExists: true },
  );
}
