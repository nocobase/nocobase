/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { snippet, type Completion, type CompletionResult, type CompletionSource } from '@codemirror/autocomplete';
import { linter, type Diagnostic as CodeMirrorDiagnostic } from '@codemirror/lint';
import type { Extension } from '@codemirror/state';
import { hoverTooltip, type Tooltip } from '@codemirror/view';
import {
  CompletionItemKind,
  DiagnosticSeverity,
  InsertTextFormat,
  TextDocument,
  getLanguageService,
  type ASTNode,
  type CompletionItem,
  type Diagnostic,
  type Hover,
  type JSONDocument,
  type JSONSchema,
  type MarkedString,
  type MarkupContent,
  type Range,
} from 'vscode-json-languageservice';

export interface CodeEditorJsonSchema {
  uri: string;
  schema: Record<string, unknown>;
}

export interface CodeEditorJsonSchemaRef {
  current?: CodeEditorJsonSchema;
}

export interface CodeEditorJsonHover {
  from: number;
  to: number;
  contents: string;
}

const JSON_DOCUMENT_URI = 'inmemory://nocobase/code-editor.json';

function createDocument(text: string) {
  const service = getLanguageService({
    schemaRequestService: async (uri) => {
      throw new Error(`External JSON Schema requests are disabled: ${uri}`);
    },
  });
  return {
    document: TextDocument.create(JSON_DOCUMENT_URI, 'json', 1, text),
    service,
  };
}

function configureSchema(service: ReturnType<typeof getLanguageService>, jsonSchema: CodeEditorJsonSchema | undefined) {
  service.configure({
    allowComments: false,
    validate: true,
    schemas: jsonSchema
      ? [
          {
            fileMatch: [JSON_DOCUMENT_URI],
            schema: jsonSchema.schema as JSONSchema,
            uri: jsonSchema.uri,
          },
        ]
      : [],
  });
}

function createJsonContext(text: string, jsonSchema?: CodeEditorJsonSchema) {
  const { document, service } = createDocument(text);
  configureSchema(service, jsonSchema);
  return {
    document,
    jsonDocument: service.parseJSONDocument(document),
    service,
  };
}

function rangeToOffsets(document: TextDocument, range: Range): { from: number; to: number } {
  return {
    from: document.offsetAt(range.start),
    to: document.offsetAt(range.end),
  };
}

function getJsonPath(node: ASTNode | undefined): Array<string | number> {
  const path: Array<string | number> = [];
  let current = node;

  while (current) {
    if (current.type === 'property') {
      path.unshift(current.keyNode.value);
      current = current.parent;
      continue;
    }

    const parent = current.parent;
    if (!parent) {
      break;
    }
    if (parent.type === 'property') {
      path.unshift(parent.keyNode.value);
      current = parent.parent;
      continue;
    }
    if (parent.type === 'array') {
      const index = parent.items.indexOf(current);
      if (index >= 0) {
        path.unshift(index);
      }
    }
    current = parent;
  }

  return path;
}

function formatJsonPath(path: Array<string | number>): string {
  return path.reduce<string>((result, segment) => {
    if (typeof segment === 'number') {
      return `${result}[${segment}]`;
    }
    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(segment)) {
      return `${result}.${segment}`;
    }
    return `${result}[${JSON.stringify(segment)}]`;
  }, '$');
}

function diagnosticSeverityToCodeMirror(severity: DiagnosticSeverity | undefined): CodeMirrorDiagnostic['severity'] {
  if (severity === DiagnosticSeverity.Warning) {
    return 'warning';
  }
  if (severity === DiagnosticSeverity.Information || severity === DiagnosticSeverity.Hint) {
    return 'info';
  }
  return 'error';
}

function toCodeMirrorDiagnostic(
  diagnostic: Diagnostic,
  document: TextDocument,
  jsonDocument: JSONDocument,
): CodeMirrorDiagnostic {
  const range = rangeToOffsets(document, diagnostic.range);
  const node = jsonDocument.getNodeFromOffset(range.from, true);
  const path = formatJsonPath(getJsonPath(node));
  return {
    from: range.from,
    message: `${path}: ${diagnostic.message}`,
    severity: diagnosticSeverityToCodeMirror(diagnostic.severity),
    source: diagnostic.source || 'JSON',
    to: Math.max(range.from + 1, range.to),
  };
}

export async function getJsonLanguageDiagnostics(
  text: string,
  jsonSchema?: CodeEditorJsonSchema,
): Promise<CodeMirrorDiagnostic[]> {
  const { document, jsonDocument, service } = createJsonContext(text, jsonSchema);
  const diagnostics = await service.doValidation(
    document,
    jsonDocument,
    {
      comments: 'error',
      schemaRequest: 'error',
      schemaValidation: 'error',
      trailingCommas: 'error',
    },
    jsonSchema?.schema as JSONSchema | undefined,
  );
  return diagnostics.map((diagnostic) => toCodeMirrorDiagnostic(diagnostic, document, jsonDocument));
}

function completionKindToCodeMirror(kind: CompletionItemKind | undefined): string {
  switch (kind) {
    case CompletionItemKind.Property:
    case CompletionItemKind.Field:
      return 'property';
    case CompletionItemKind.Enum:
    case CompletionItemKind.EnumMember:
      return 'enum';
    case CompletionItemKind.Value:
    case CompletionItemKind.Constant:
      return 'constant';
    case CompletionItemKind.Keyword:
      return 'keyword';
    default:
      return 'text';
  }
}

function formatMarkupContent(value: string | MarkupContent | MarkedString | MarkedString[] | undefined): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value.replace(/\\([\\`*{}[\]()#+.!_>-])/g, '$1');
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => formatMarkupContent(item))
      .filter(Boolean)
      .join('\n\n');
  }
  if ('language' in value) {
    return value.value;
  }
  return value.value;
}

function completionItemText(item: CompletionItem): string {
  if (item.textEdit && 'range' in item.textEdit) {
    return item.textEdit.newText;
  }
  return item.insertText || item.label;
}

function completionItemRange(item: CompletionItem, document: TextDocument, fallback: number) {
  if (item.textEdit && 'range' in item.textEdit) {
    return rangeToOffsets(document, item.textEdit.range);
  }
  return { from: fallback, to: fallback };
}

const CODEMIRROR_FINAL_TABSTOP = 1_000_000;

function toCodeMirrorSnippet(value: string): string {
  let result = '';

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const nextCharacter = value[index + 1];

    if (character === '\\') {
      if (nextCharacter === '$') {
        result += value[index + 2] === '{' ? '$\\' : '$';
        index += 1;
        continue;
      }
      if (nextCharacter === '\\') {
        result += '\\';
        index += 1;
        continue;
      }
      if (nextCharacter === '}') {
        result += '\\}';
        index += 1;
        continue;
      }
      result += character;
      continue;
    }

    if (character !== '$') {
      result += character;
      continue;
    }

    const remaining = value.slice(index + 1);
    const unbracedTabstop = /^(\d+)/.exec(remaining);
    if (unbracedTabstop) {
      const tabstop = Number(unbracedTabstop[1]) || CODEMIRROR_FINAL_TABSTOP;
      result += `\${${tabstop}}`;
      index += unbracedTabstop[1].length;
      continue;
    }

    const bracedTabstop = /^\{(\d+)(?=[:}])/.exec(remaining);
    if (bracedTabstop) {
      const tabstop = Number(bracedTabstop[1]) || CODEMIRROR_FINAL_TABSTOP;
      result += `\${${tabstop}`;
      index += bracedTabstop[0].length;
      continue;
    }

    result += character;
  }

  return result;
}

function toCodeMirrorCompletion(item: CompletionItem): Completion {
  const insertText = completionItemText(item);
  const info = formatMarkupContent(item.documentation);
  const filterLabel = item.filterText || item.label;
  return {
    apply: item.insertTextFormat === InsertTextFormat.Snippet ? snippet(toCodeMirrorSnippet(insertText)) : insertText,
    detail: item.detail,
    displayLabel: filterLabel === item.label ? undefined : item.label,
    info: info || undefined,
    label: filterLabel,
    type: completionKindToCodeMirror(item.kind),
  };
}

function isJsonCompletionTextValid(value: string): boolean {
  if (value.startsWith('"')) {
    return /^"(?:[^"\\]|\\.)*"?$/.test(value);
  }
  return !/[\s,:[\]{}]/.test(value);
}

export async function getJsonLanguageCompletions(
  text: string,
  position: number,
  jsonSchema?: CodeEditorJsonSchema,
): Promise<CompletionResult | null> {
  const { document, jsonDocument, service } = createJsonContext(text, jsonSchema);
  const completionList = await service.doComplete(document, document.positionAt(position), jsonDocument);
  if (!completionList?.items.length) {
    return null;
  }

  const range = completionItemRange(completionList.items[0], document, position);
  return {
    from: range.from,
    options: completionList.items.map(toCodeMirrorCompletion),
    to: range.to,
    validFor: isJsonCompletionTextValid,
  };
}

export async function getJsonLanguageHover(
  text: string,
  position: number,
  jsonSchema?: CodeEditorJsonSchema,
): Promise<CodeEditorJsonHover | null> {
  const { document, jsonDocument, service } = createJsonContext(text, jsonSchema);
  const hover: Hover | null = await service.doHover(document, document.positionAt(position), jsonDocument);
  const contents = formatMarkupContent(hover?.contents);
  if (!hover || !contents) {
    return null;
  }
  const range = hover.range ? rangeToOffsets(document, hover.range) : { from: position, to: position };
  return {
    ...range,
    contents,
  };
}

export function createJsonCompletionSource(jsonSchemaRef: CodeEditorJsonSchemaRef): CompletionSource {
  return async (context) => {
    try {
      return await getJsonLanguageCompletions(context.state.doc.toString(), context.pos, jsonSchemaRef.current);
    } catch (_) {
      return null;
    }
  };
}

export function createJsonLinter(jsonSchemaRef: CodeEditorJsonSchemaRef): Extension {
  return linter(async (view) => {
    try {
      return await getJsonLanguageDiagnostics(view.state.doc.toString(), jsonSchemaRef.current);
    } catch (_) {
      return [];
    }
  });
}

function createHoverTooltip(hover: CodeEditorJsonHover): Tooltip['create'] {
  return () => {
    const dom = document.createElement('div');
    dom.style.maxWidth = '420px';
    dom.style.padding = '6px 8px';
    dom.style.whiteSpace = 'pre-wrap';
    dom.textContent = hover.contents;
    return { dom };
  };
}

export function createJsonHoverTooltip(jsonSchemaRef: CodeEditorJsonSchemaRef): Extension {
  return hoverTooltip(async (view, position) => {
    try {
      const hover = await getJsonLanguageHover(view.state.doc.toString(), position, jsonSchemaRef.current);
      return hover
        ? {
            create: createHoverTooltip(hover),
            end: hover.to,
            pos: hover.from,
          }
        : null;
    } catch (_) {
      return null;
    }
  });
}
