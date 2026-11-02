/** Reexecute an existing user input in its conversation, discarding every later message. */
export interface OnlineAgentResendOptions {
  /** Defaults to the last user message, selected when input is admitted. */
  messageId?: string;
  /** Only text is editable; saved attachments and context are retained. */
  input?: { text: string };
}
