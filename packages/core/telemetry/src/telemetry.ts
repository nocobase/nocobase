import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { InstrumentationOption, registerInstrumentations } from '@opentelemetry/instrumentation';
import { Metric, MetricOptions } from './metric';
import { Trace, TraceOptions } from './trace';

export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}

export class Telemetry {
  serviceName: string;
  version: string;
  instrumentations: InstrumentationOption[] = [];
  trace: Trace;
  metric: Metric;
  started = false;

  constructor(options?: TelemetryOptions) {
    const { trace, metric, serviceName, version } = options || {};
    this.trace = new Trace({ tracerName: `${serviceName}-trace`, version, ...trace });
    this.metric = new Metric({ meterName: `${serviceName}-meter`, version, ...metric });
    this.serviceName = serviceName || 'nocobase';
    this.version = version || '';
  }

  init() {
    registerInstrumentations({
      instrumentations: this.instrumentations,
    });

    const resource = Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: this.version,
      }),
    );

    this.trace.init(resource);
    this.metric.init(resource);
  }

  start() {
    if (!this.started) {
      this.trace.start();
      this.metric.start();
    }
    this.started = true;
  }

  async shutdown() {
    await Promise.all([this.trace.shutdown(), this.metric.shutdown()]);
    this.started = false;
  }

  addInstrumentation(...instrumentation: InstrumentationOption[]) {
    this.instrumentations.push(...instrumentation);
  }
}
