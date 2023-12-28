import { AppTelemetryOptions } from '@nocobase/server';

export const telemetry: AppTelemetryOptions = {
  enabled: process.env.TELEMETRY_ENABLED === 'true',
  metric: {
    readerName: process.env.TELEMETRY_METRIC_READER,
  },
  trace: {
    exporterName: process.env.TELEMETRY_TRACE_EXPORTER,
  },
};
