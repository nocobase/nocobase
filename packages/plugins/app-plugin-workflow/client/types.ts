import type { ComponentType } from 'react';

export type JsonPrimitive = null | boolean | number | string;
export type JsonValue =
  JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };
export type JsonObject = { readonly [key: string]: JsonValue };

export interface WorkflowGraphDefinitionNode {
  readonly key: string;
  readonly title?: string;
  readonly description?: string;
  readonly type: string;
  readonly config: JsonObject;
  readonly branches?: Readonly<
    Record<string, readonly WorkflowGraphDefinitionNode[]>
  >;
}

export interface WorkflowGraphDefinition {
  readonly title: string;
  readonly nodes: readonly WorkflowGraphDefinitionNode[];
}

export interface WorkflowFlatDefinitionNode {
  readonly key: string;
  readonly title?: string;
  readonly description?: string;
  readonly type: string;
  readonly config: JsonObject;
  readonly options?: JsonObject;
  readonly result?: JsonValue;
  readonly upstreamKey: string | null;
  readonly downstreamKey: string | null;
  readonly branchKey: string | null;
}

export interface WorkflowFlatDefinition {
  readonly title: string;
  readonly description?: string;
  readonly options?: JsonObject;
  readonly parameters?: JsonObject;
  readonly inputSchema: JsonObject;
  readonly start: string | null;
  readonly nodes: readonly WorkflowFlatDefinitionNode[];
}

export interface WorkflowNestedDefinition extends WorkflowGraphDefinition {
  readonly description?: string;
  readonly options?: JsonObject;
  readonly parameters?: JsonObject;
  readonly inputSchema: JsonObject;
}
export interface WorkflowParameterFormWorkflow {
  readonly id: string;
  readonly key: string;
  readonly hash: string;
  readonly version: string | null;
}
export interface WorkflowParameterFormProps {
  readonly workflow: WorkflowParameterFormWorkflow;
  readonly schema: Record<
    string,
    {
      readonly type: 'string' | 'number' | 'boolean';
      readonly title?: string;
      readonly description?: string;
      readonly default?: string | number | boolean;
      readonly enum?: readonly {
        readonly label: string;
        readonly value: string | number;
      }[];
    }
  >;
  readonly value: Record<string, string | number | boolean>;
  readonly defaults: Record<string, string | number | boolean>;
  readonly disabled: boolean;
  readonly onChange: (value: Record<string, string | number | boolean>) => void;
}
export type WorkflowParameterFormComponent =
  ComponentType<WorkflowParameterFormProps>;
