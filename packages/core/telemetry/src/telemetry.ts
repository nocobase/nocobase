import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { InstrumentationOption } from '@opentelemetry/instrumentation';
import packageJson from '../package.json';
import { Metric, MetricOptions } from './metric';
import { Trace, TraceOptions } from './trace';

export type TelemetryOptions = {
  trace?: TraceOptions;
  metric?: MetricOptions;
};

export class Telemetry {
  sdk: NodeSDK;
  instrumentations: InstrumentationOption[] = [];
  trace: Trace;
  metric: Metric;
  started = false;

  constructor(options?: TelemetryOptions) {
    const { trace, metric } = options || {};
    this.trace = new Trace(trace);
    this.metric = new Metric(metric);
  }

  start() {
    if (!this.sdk) {
      console.log(this.metric.getReader());
      this.sdk = new NodeSDK({
        [SemanticResourceAttributes.SERVICE_NAME]: 'nocobase',
        [SemanticResourceAttributes.SERVICE_VERSION]: packageJson.version,
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
