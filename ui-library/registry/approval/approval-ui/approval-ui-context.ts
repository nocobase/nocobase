import { createContext, type Context, type ReactNode } from 'react';

/**
 * What the approval components need from the application that renders
 * them: how a person is named and shown, and how an instant is written.
 * Everything has a default, so the components work without a provider and
 * show raw ids.
 */
export interface ApprovalUiOptions {
  /** A person's display name; defaults to the id. */
  readonly personName?: (id: string) => string;
  /** How a person is drawn beside a line, such as an avatar; defaults to nothing. */
  readonly renderAvatar?: (id: string) => ReactNode;
  /** How an instant is written; defaults to the browser's medium date and short time. */
  readonly formatDateTime?: (iso: string) => string;
}

/** The options with every default filled in. */
export interface ApprovalUi {
  readonly personName: (id: string) => string;
  readonly renderAvatar: (id: string) => ReactNode;
  readonly formatDateTime: (iso: string) => string;
}

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const APPROVAL_UI_DEFAULTS: ApprovalUi = {
  personName: (id) => id,
  renderAvatar: () => null,
  formatDateTime: (iso) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : dateTime.format(date);
  },
};

export const ApprovalUiContext: Context<ApprovalUi> =
  createContext<ApprovalUi>(APPROVAL_UI_DEFAULTS);
