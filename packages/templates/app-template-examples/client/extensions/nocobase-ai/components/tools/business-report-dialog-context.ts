import { createContext, useContext } from 'react';
import type { BusinessReportData } from './business-report-utils.js';

export type BusinessReportDialogController = {
  hasRenderError: (toolCallId: string, report: BusinessReportData) => boolean;
  open: (
    toolCallId: string,
    report: BusinessReportData,
    ready: boolean,
  ) => void;
  update: (
    toolCallId: string,
    report: BusinessReportData,
    ready: boolean,
  ) => void;
};

export const BusinessReportDialogContext =
  createContext<BusinessReportDialogController | null>(null);

export function useBusinessReportDialog(): BusinessReportDialogController {
  const value = useContext(BusinessReportDialogContext);
  if (!value) {
    throw new Error(
      'useBusinessReportDialog must be used inside BusinessReportDialogProvider',
    );
  }
  return value;
}
