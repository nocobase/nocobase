import { Registry } from '@nocobase/utils';
import opentelemetry from '@opentelemetry/api';
import packageJson from '../package.json';
import { ConsoleSpanExporter, SpanExporter } from '@opentelemetry/sdk-trace-base';

export type TraceOptions = {
  exporterName?: string;
};

export class Trace {
  exporterName: string;
  exporters = new Registry<SpanExporter>();

  constructor(options?: TraceOptions) {
    const { exporterName } = options || {};
    this.exporterName = exporterName || 'console';
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
    return opentelemetry.trace.getTracer('nocobase-trace', packageJson.version);
  }
}
