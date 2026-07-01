/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '@nocobase/database';

import agAgentConversationEvents from '../collections/agAgentConversationEvents';

const collection = agAgentConversationEvents as CollectionOptions;
const fieldNames = (collection.fields || []).map((field) => field.name);

const hasUniqueIndex = (fields: string[]) =>
  collection.indexes?.some((index) => index.unique === true && JSON.stringify(index.fields) === JSON.stringify(fields));

const hasIndex = (fields: string[]) =>
  collection.indexes?.some((index) => JSON.stringify(index.fields) === JSON.stringify(fields));

const getField = (fieldName: string) => collection.fields?.find((field) => field.name === fieldName);

describe('agent gateway conversation event collection', () => {
  it('defines the normalized user-facing timeline collection', () => {
    expect(collection.name).toBe('agAgentConversationEvents');
    expect(collection.tableName).toBe('ag_agent_conversation_events');
    expect(collection.autoGenId).toBe(false);
    expect(collection.migrationRules).toContain('schema-only');
    expect(fieldNames).toEqual(
      expect.arrayContaining([
        'id',
        'sessionId',
        'runId',
        'sequence',
        'eventType',
        'source',
        'providerEventId',
        'correlationId',
        'confidence',
        'contentText',
        'contentJson',
        'createdById',
      ]),
    );
  });

  it('keeps run and event identity fields constrained for timeline ordering and dedupe', () => {
    expect(getField('runId')?.allowNull).toBe(false);
    expect(getField('runId')?.autoFill).toBe(false);
    expect(getField('sessionId')?.autoFill).toBe(false);
    expect(getField('sequence')?.allowNull).toBe(false);
    expect(getField('eventType')?.allowNull).toBe(false);
    expect(getField('source')?.allowNull).toBe(false);
    expect(hasIndex(['runId', 'createdAt', 'sequence'])).toBe(true);
    expect(hasIndex(['sessionId', 'createdAt', 'sequence'])).toBe(true);
    expect(hasUniqueIndex(['runId', 'source', 'providerEventId'])).toBe(true);
    expect(hasUniqueIndex(['runId', 'source', 'sequence'])).toBe(true);
  });
});
