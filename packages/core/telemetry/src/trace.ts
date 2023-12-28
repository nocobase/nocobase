import { Registry } from '@nocobase/utils';
import { BatchSpanProcessor, ConsoleSpanExporter, SpanExporter } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';

export type TraceOptions = {
  tracerName?: string;
  version?: string;
  exporterName?: string | string[];
};

export class Trace {
  exporterName: string | string[];
  exporters = new Registry<SpanExporter>();
  tracerName: string;
  version: string;
  provider: NodeTracerProvider;

  constructor(options?: TraceOptions) {
    const { exporterName, tracerName, version } = options || {};
    this.exporterName = exporterName || 'console';
    this.tracerName = tracerName || 'nocobase-trace';
    this.version = version || '';
    this.registerExporter('console', new ConsoleSpanExporter());
  }

  init(resource: Resource) {
    this.provider = new NodeTracerProvider({
      resource,
    });
  }

  registerExporter(name: string, exporter: SpanExporter) {
    this.exporters.register(name, exporter);
  }

  getExporter(name: string) {
    return this.exporters.get(name);
  }

  getTracer() {
    return this.provider.getTracer(this.tracerName, this.version);
  }

  start() {
    let exporterName = this.exporterName;
    if (typeof exporterName === 'string') {
      exporterName = exporterName.split(',');
    }
    exporterName.forEach((name) => {
      const exporter = this.getExporter(name);
      this.provider.addSpanProcessor(new BatchSpanProcessor(exporter));
    });
  }

  shutdown() {
    return this.provider.shutdown();
  }
}
