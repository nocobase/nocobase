/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

export type MarkdownEngineName = string;

export interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  engine?: MarkdownEngineName;
  engineName?: MarkdownEngineName;
  [key: string]: unknown;
}

export interface MarkdownPreviewProps {
  value?: string;
  textOnly?: boolean;
  ellipsis?: boolean;
  engine?: MarkdownEngineName;
  engineName?: MarkdownEngineName;
  [key: string]: unknown;
}

export interface MarkdownEngine {
  name: MarkdownEngineName;
  Editor: React.ComponentType<MarkdownEditorProps>;
  Preview: React.ComponentType<MarkdownPreviewProps>;
  dependencies?: Record<string, unknown>;
  edit?: (props?: MarkdownEditorProps) => React.ReactNode;
  render?: (text: string, props?: MarkdownPreviewProps) => React.ReactNode;
}

export interface MarkdownRegisterOptions {
  default?: boolean;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function renderError(message: string, error?: unknown) {
  const suffix = error ? `：${getErrorMessage(error)}` : '';
  return <pre style={{ color: 'red' }}>{message + suffix}</pre>;
}

function getEngineName(props?: MarkdownEditorProps | MarkdownPreviewProps) {
  return props?.engineName || props?.engine;
}

export class MarkdownRegistry {
  private engines = new Map<MarkdownEngineName, MarkdownEngine>();
  private defaultEngineName?: MarkdownEngineName;

  register(engine: MarkdownEngine, options: MarkdownRegisterOptions = {}) {
    if (!engine?.name) {
      throw new Error('Markdown engine name is required');
    }
    if (!engine.Editor || !engine.Preview) {
      throw new Error(`Markdown engine "${engine.name}" must provide Editor and Preview components`);
    }

    this.engines.set(engine.name, engine);

    if (options.default || !this.defaultEngineName) {
      this.defaultEngineName = engine.name;
    }
  }

  unregister(name: MarkdownEngineName) {
    this.engines.delete(name);
    if (this.defaultEngineName === name) {
      this.defaultEngineName = this.engines.keys().next().value;
    }
  }

  getEngine(name?: MarkdownEngineName) {
    const engineName = name || this.defaultEngineName;
    return engineName ? this.engines.get(engineName) : undefined;
  }

  getDefaultEngine() {
    return this.getEngine();
  }

  setDefaultEngine(name: MarkdownEngineName) {
    if (!this.engines.has(name)) {
      throw new Error(`Markdown engine "${name}" is not registered`);
    }
    this.defaultEngineName = name;
  }

  getEngineNames() {
    return Array.from(this.engines.keys());
  }

  get dependencies() {
    return this.getDefaultEngine()?.dependencies || {};
  }

  render(text: string, props: MarkdownPreviewProps = {}) {
    if (!text) return null;

    try {
      const engine = this.getEngine(getEngineName(props));
      if (!engine) {
        return renderError('Markdown engine not found');
      }
      if (engine.render) {
        return engine.render(text, props);
      }

      const Preview = engine.Preview;
      return <Preview {...props} value={text} />;
    } catch (err) {
      console.error('渲染失败:', err);
      return renderError('Markdown 渲染错误', err);
    }
  }

  edit(props: MarkdownEditorProps = {}) {
    try {
      const engine = this.getEngine(getEngineName(props));
      if (!engine) {
        return renderError('Markdown engine not found');
      }
      if (engine.edit) {
        return engine.edit(props);
      }

      const Editor = engine.Editor;
      return <Editor {...props} />;
    } catch (err) {
      return renderError('Markdown 编辑器加载错误', err);
    }
  }
}

export function ensureMarkdownRegistry(ctx: {
  markdown?: MarkdownRegistry;
  defineProperty?: (key: string, options: { get?: () => MarkdownRegistry; value?: MarkdownRegistry }) => void;
}) {
  if (ctx.markdown) {
    return ctx.markdown;
  }

  const registry = new MarkdownRegistry();
  ctx.defineProperty?.('markdown', {
    get: () => registry,
  });
  return registry;
}

export { MarkdownRegistry as Markdown };
