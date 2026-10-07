/**
 * What the `acme` CLI shares with the application beside the command manifest (`CLI_ROUTES.manifest`), whose commands
 * are the application's API routes: the upload ticket a route answers for a file streamed beside the request, and
 * what a command that answers a file saves.
 *
 * A route whose `x-cli` names a `ticketUpload` answers an `UploadTicket` (`data`); the CLI then streams the file named
 * by the ticket flag straight to the ticket's URL with the ticket's headers and a `content-disposition` naming the
 * file, and the upload's answer (`{ data }`, or an error body) is the command's result.
 *
 * A command whose route answers a file (`output.kind: 'download'`) saves it where `--out <path>` says
 * (`DOWNLOAD_OUT_FLAG`: a file, or an existing directory to save into; the current directory when absent), never
 * overwriting a file unless that is the path given, and prints where it went (`DownloadResult`).
 */
import { z } from 'zod';

/**
 * Where a ticket upload sends its file: the `data` of the route's answer. `url` is absolute, or a path on the server
 * the CLI talks to; `headers` carry the ticket's own credential, so the CLI sends nothing of its session there. The
 * file is the body, streamed.
 */
export interface UploadTicket {
  readonly url: string;
  readonly method: 'POST' | 'PUT';
  readonly headers: Readonly<Record<string, string>>;
  /** One line for a person, printed with the upload's result. */
  readonly message?: string;
}

export const UploadTicketSchema: z.ZodType<UploadTicket> = z.object({
  url: z.string().min(1),
  method: z.enum(['POST', 'PUT']),
  headers: z.record(z.string(), z.string()),
  message: z.string().optional(),
});

/** The CLI's own flag of a `download` command: where to save the file. Never sent to the server. */
export const DOWNLOAD_OUT_FLAG = 'out';

/** What the CLI prints, and `--json` returns, once a `download` command saved its file. */
export interface DownloadResult {
  /** The absolute path it was saved to. */
  readonly path: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly size: number;
}
