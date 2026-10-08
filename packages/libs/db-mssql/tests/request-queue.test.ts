import { EventEmitter } from 'node:events';

import knex from 'knex';
import { describe, expect, it } from 'vitest';

import { mssqlDriver } from '../src/index.js';

interface RequestClient {
  _enqueueRequest(request: EventEmitter, connection: TestConnection): void;
  _chomp(connection: TestConnection): void;
}

class TestConnection {
  state = { name: 'LoggedIn' };
  executed: EventEmitter[] = [];

  execSql(request: EventEmitter): void {
    this.state.name = 'SentClientRequest';
    this.executed.push(request);
  }
}

function client(): RequestClient {
  const base = mssqlDriver.resolveKnexClient!();
  const dialect = mssqlDriver.createKnexClient!({} as never, base);
  return knex({ client: dialect }).client as unknown as RequestClient;
}

describe('MSSQL request ownership', () => {
  it('never executes a queued request on another connection or client', () => {
    const firstClient = client();
    const secondClient = client();
    const busy = new TestConnection();
    busy.state.name = 'SentClientRequest';
    const idle = new TestConnection();
    const request = new EventEmitter();
    firstClient._enqueueRequest(request, busy);
    firstClient._chomp(idle);
    secondClient._chomp(idle);
    expect(idle.executed).toEqual([]);
    busy.state.name = 'LoggedIn';
    firstClient._chomp(busy);
    expect(busy.executed).toEqual([request]);
  });

  it('drains a completed request without relying on a query success callback', async () => {
    const driver = client();
    const connection = new TestConnection();
    const active = new EventEmitter();
    const waiting = new EventEmitter();
    driver._enqueueRequest(active, connection);
    driver._enqueueRequest(waiting, connection);
    expect(connection.executed).toHaveLength(1);
    connection.state.name = 'LoggedIn';
    active.emit('requestCompleted');
    await new Promise<void>((resolve) => process.nextTick(resolve));
    expect(connection.executed).toHaveLength(2);
    expect(connection.executed[1]).toBe(waiting);
  });

  it('keeps request order on one connection, including transaction client clones', () => {
    const root = client();
    const transaction = Object.create(root) as RequestClient;
    const connection = new TestConnection();
    connection.state.name = 'SentClientRequest';
    const first = new EventEmitter();
    const second = new EventEmitter();
    root._enqueueRequest(first, connection);
    transaction._enqueueRequest(second, connection);
    connection.state.name = 'LoggedIn';
    transaction._chomp(connection);
    expect(connection.executed).toHaveLength(1);
    expect(connection.executed[0]).toBe(first);
    connection.state.name = 'LoggedIn';
    root._chomp(connection);
    expect(connection.executed).toHaveLength(2);
    expect(connection.executed[1]).toBe(second);
  });
});
