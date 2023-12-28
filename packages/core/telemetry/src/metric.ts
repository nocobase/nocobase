import { Registry } from '@nocobase/utils';
import opentelemetry from '@opentelemetry/api';
import { MetricReader, PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';

export type MetricOptions = {
  meterName?: string;
  readerName?: string;
};

export class Metric {
  meterName: string;
  readerName: string;
  readers = new Registry<MetricReader>();

  constructor(options?: MetricOptions) {
    const { meterName, readerName } = options || {};
    this.readerName = readerName || 'console';
    this.meterName = meterName || 'nocobase-meter';
    this.registerReader(
      'console',
      new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
      }),
    );
  }

  registerReader(name: string, reader: MetricReader) {
    this.readers.register(name, reader);
  }

  getReader(name?: string) {
    name = name || this.readerName;
    return this.readers.get(name);
  }

  getMeter(name?: string) {
    name = name || this.meterName;
    return opentelemetry.metrics.getMeter(name);
  }
}
