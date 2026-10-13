import type {
  ConfigurableParameter,
  JsonObject,
  ParameterBinding,
  ParameterSnapshot,
  ParameterUsage,
} from '@nocobase/lifecycle';

export interface ParameterGroupView {
  readonly key: string;
  readonly title: string;
  readonly revision: number;
  readonly origin: 'configuration' | 'default';
  readonly schemaVersion: number;
  readonly values: JsonObject;
  readonly canUpdate: boolean;
  readonly fields: Readonly<
    Record<string, Omit<ConfigurableParameter, 'parse'>>
  >;
  readonly uses: readonly {
    readonly lifecycle: string;
    readonly field: string;
    readonly readMode: string;
    readonly bindings: readonly ParameterBinding[];
  }[];
}
export interface ReviewerReference {
  readonly id: string;
  readonly name: string;
  readonly active?: boolean;
}
export interface ReviewerOptions {
  readonly departments: readonly ReviewerReference[];
  readonly roles: readonly ReviewerReference[];
  readonly people: readonly ReviewerReference[];
}
export interface ParameterHistoryView {
  readonly snapshot: ParameterSnapshot | null;
  readonly usages: readonly ParameterUsage[];
  readonly current: Readonly<object>;
  readonly recorded: boolean;
}
