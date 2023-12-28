import { Registry } from '@nocobase/utils';
import opentelemetry from '@opentelemetry/api';
import { ConsoleSpanExporter, SpanExporter } from '@opentelemetry/sdk-trace-base';

export type TraceOptions = {
  tracerName?: string;
  version?: string;
  exporterName?: string;
};

export class Trace {
  exporterName: string;
  exporters = new Registry<SpanExporter>();
  tracerName: string;
  version: string;

  constructor(options?: TraceOptions) {
    const { exporterName, tracerName, version } = options || {};
    this.exporterName = exporterName || 'console';
    this.tracerName = tracerName || 'nocobase-trace';
    this.version = version || '';
    this.registerExporter('console', new ConsoleSpanExporter());
  }

  registerExporter(name: string, exporter: SpanExporter) {
    this.exporters.register(name, exporter);
  }

  getExporter(name?: string) {
    name = name || this.exporterName;
    return this.exporters.get(name);
  }

  getTracer() {
    return opentelemetry.trace.getTracer(this.tracerName, this.version);
  }
}
