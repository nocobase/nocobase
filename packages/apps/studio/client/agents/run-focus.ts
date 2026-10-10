let returnTarget: HTMLElement | null = null;
let returnHeading: HTMLElement | null = null;

/** Keep the actual trigger: pointer activation need not move document.activeElement. */
export function rememberRunFocus(
  target: HTMLElement | null,
  heading: HTMLElement | null,
): void {
  returnTarget = target;
  returnHeading = heading;
}

/** A removed entry falls back to the still-mounted history heading. */
export function runReturnFocus(): HTMLElement | null {
  return returnTarget?.isConnected
    ? returnTarget
    : returnHeading?.isConnected
      ? returnHeading
      : document.querySelector<HTMLElement>(
          '[data-slot="agent-run-history"] h2, [data-slot="issue-run-focus"]',
        );
}
