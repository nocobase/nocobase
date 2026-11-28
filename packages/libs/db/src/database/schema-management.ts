import type { SchemaOperation } from '../collection/types.js';
import type { SchemaAdapter } from '../schema/adapter.js';
import type { SchemaManagementMode } from './config.js';

export interface SchemaManagementGuardOptions {
  connectionName: string;
  mode: SchemaManagementMode;
}

export class SchemaManagementNotAllowedError extends Error {
  readonly code = 'SCHEMA_MANAGEMENT_NOT_ALLOWED' as const;

  constructor(
    readonly connection: string,
    readonly operation: string,
  ) {
    super(
      `Connection "${connection}" uses external schema management and cannot execute schema operation "${operation}".`,
    );
    this.name = 'SchemaManagementNotAllowedError';
  }
}

export class SchemaManagementSchemaAdapter implements SchemaAdapter {
  readonly dialect: string | undefined;
  readonly capabilities: SchemaAdapter['capabilities'];

  constructor(
    private readonly adapter: SchemaAdapter,
    private readonly options: SchemaManagementGuardOptions,
    private readonly executeSchemaChange?: (
      operation: () => Promise<void>,
    ) => Promise<void>,
  ) {
    this.dialect = adapter.dialect;
    this.capabilities = adapter.capabilities;
  }

  assertExecutable(operations: SchemaOperation[]): void {
    const operation = operations[0];
    if (operation && this.options.mode === 'external') {
      throw new SchemaManagementNotAllowedError(
        this.options.connectionName,
        operation.type,
      );
    }
    this.adapter.assertExecutable?.(operations);
  }

  async execute(operations: SchemaOperation[]): Promise<void> {
    this.assertExecutable(operations);
    if (operations.length > 0 && this.executeSchemaChange) {
      await this.executeSchemaChange(() => this.adapter.execute(operations));
    } else {
      await this.adapter.execute(operations);
    }
  }

  async compile(operations: SchemaOperation[]): Promise<string[]> {
    return this.adapter.compile ? this.adapter.compile(operations) : [];
  }
}

export function assertManagedSchema(
  options: SchemaManagementGuardOptions,
  operation: string,
): void {
  if (options.mode === 'external') {
    throw new SchemaManagementNotAllowedError(
      options.connectionName,
      operation,
    );
  }
}
