/**
 * How a queued request to AI says why it waits, given by the application. The organiser reports a reason code and the
 * values its words need (`IntakeAiProgress.waitReason`, `waitParams`) and this plugin knows none of them: an
 * application with the agents plugin passes that plugin's `formatRunWait` with the page's `t`. Without it, a request
 * reads as waiting, naming the code.
 */
import { createContext, useContext, type Context, type ReactNode } from 'react';

/** A wait as the organiser reports it. */
export interface IntakeWait {
  readonly reason: string;
  readonly params?: Readonly<
    Record<string, string | number | readonly string[]>
  >;
}

export type IntakeWaitFormat = (wait: IntakeWait) => ReactNode;

export const IntakeWaitFormatContext: Context<IntakeWaitFormat | null> =
  createContext<IntakeWaitFormat | null>(null);

export function useIntakeWaitFormat(): IntakeWaitFormat | null {
  return useContext(IntakeWaitFormatContext);
}
