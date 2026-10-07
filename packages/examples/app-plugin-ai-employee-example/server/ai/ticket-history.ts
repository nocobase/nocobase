// Internal activity the support page does not show. The page hands the employee a ticket's summary as work
// context; the employee calls the history tool for what only the server knows, so a task demonstrates both sources.

export interface TicketActivity {
  readonly at: string;
  readonly actor: string;
  readonly note: string;
}

export const TICKET_HISTORY: Readonly<
  Record<string, readonly TicketActivity[]>
> = Object.freeze({
  'TK-1042': [
    {
      at: '2026-07-22T09:42:00Z',
      actor: 'Northwind Finance',
      note: 'Reported that the payment succeeded but the order stayed unpaid for twelve minutes.',
    },
    {
      at: '2026-07-22T10:05:00Z',
      actor: 'On-call engineer',
      note: 'Payment gateway retried the callback three times; the first two timed out at the order service.',
    },
    {
      at: '2026-07-22T10:31:00Z',
      actor: 'On-call engineer',
      note: 'Order service connection pool was saturated by a batch export between 09:30 and 09:45.',
    },
  ],
  'TK-1041': [
    {
      at: '2026-07-21T15:10:00Z',
      actor: 'Contoso Retail',
      note: 'Profile form rejects a phone number with an extension.',
    },
    {
      at: '2026-07-21T16:02:00Z',
      actor: 'Support agent',
      note: 'Reproduced: the validator allows digits only. Workaround sent: store the extension in the notes field.',
    },
  ],
  'TK-1038': [
    {
      at: '2026-07-19T08:20:00Z',
      actor: 'Fabrikam',
      note: 'Exported invoices show amounts with a comma decimal separator in the English locale.',
    },
  ],
});
