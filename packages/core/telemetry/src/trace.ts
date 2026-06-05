/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { BatchSpanProcessor, ConsoleSpanExporter, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider, type NodeTracerConfig } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';

export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};

type GetSpanProcessor = () => SpanProcessor;

export class Trace {
  processorName: string | string[];
  processors = new Registry<GetSpanProcessor>();
  tracerName: string;
  version: string;
  provider?: NodeTracerProvider;
  resource?: Resource;
  activeProcessors: SpanProcessor[] = [];

  constructor(options?: TraceOptions) {
    const { processorName, tracerName, version } = options || {};
    this.processorName = processorName || 'console';
    this.tracerName = tracerName || 'nocobase-trace';
    this.version = version || '';

    this.registerProcessor('console', () => new BatchSpanProcessor(new ConsoleSpanExporter()));
  }

  init(resource: Resource) {
    this.resource = resource;
  }

  registerProcessor(name: string, processor: GetSpanProcessor) {
    this.processors.register(name, processor);
  }

  getProcessor(name: string) {
    return this.processors.get(name);
  }

  start() {
    if (!this.resource) {
      throw new Error('Trace.init(resource) must be called before start()');
    }

    let names = this.processorName;
    if (typeof names === 'string') {
      names = names.split(',');
    }

    const processors: SpanProcessor[] = [];

    for (const name of names) {
      const processor = this.getProcessor(name);

      if (!processor) {
        continue;
      }

      processors.push(processor());
    }

    this.activeProcessors = processors;

    const config: NodeTracerConfig = {
      resource: this.resource,
      spanProcessors: processors,
    };

    this.provider = new NodeTracerProvider(config);
    this.provider.register();
  }

  getTracer(name?: string, version?: string) {
    if (!this.provider) {
      return null;
    }
    return this.provider.getTracer(name || this.tracerName, version || this.version);
  }

  async shutdown() {
    await Promise.all(this.activeProcessors.map((p) => p.shutdown()));
    await this.provider?.shutdown();
  }
}
