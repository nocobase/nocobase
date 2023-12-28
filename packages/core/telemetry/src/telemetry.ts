import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { InstrumentationOption } from '@opentelemetry/instrumentation';
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
  sdk: NodeSDK;
  instrumentations: InstrumentationOption[] = [];
  trace: Trace;
  metric: Metric;
  started = false;

  constructor(options?: TelemetryOptions) {
    const { trace, metric, serviceName, version } = options || {};
    this.trace = new Trace({ tracerName: `${serviceName}-trace`, version, ...trace });
    this.metric = new Metric({ meterName: `${serviceName}-meter`, ...metric });
    this.serviceName = serviceName || 'nocobase';
    this.version = version || '';
  }

  start() {
    if (!this.sdk) {
      this.sdk = new NodeSDK({
        [SemanticResourceAttributes.SERVICE_NAME]: this.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: this.version,
        traceExporter: this.trace.getExporter(),
        metricReader: this.metric.getReader(),
        instrumentations: this.instrumentations,
      });
    }
    this.sdk.start();
    this.started = true;
  }

  async shutdown() {
    if (!this.sdk) {
      return;
    }
    await this.sdk.shutdown();
    this.started = false;
  }

  addInstrumentation(...instrumentation: InstrumentationOption[]) {
    this.instrumentations.push(...instrumentation);
  }
}
