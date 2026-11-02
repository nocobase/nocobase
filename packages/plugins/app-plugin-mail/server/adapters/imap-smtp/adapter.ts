import { encodePath } from 'imapflow/lib/tools.js';
import { MailError, mailFailedPrecondition } from '../../services/errors.js';
import {
  ImapFlow,
  type FetchMessageObject,
  type FetchQueryObject,
  type ListResponse,
  type MailboxObject,
  type MessageStructureObject,
} from 'imapflow';
import { type Transporter } from 'nodemailer';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';
import { randomUUID } from 'node:crypto';
import { simpleParser } from 'mailparser';
import { Readable, addAbortSignal } from 'node:stream';
import {
  attachmentParts,
  bodyParts,
  readBody,
  readRawSource,
  rawComparable,
  metadataQuery,
  attachmentMetadata,
  MAX_HEADER_BYTES,
} from './content.js';

import type {
  MailAttachmentContent,
  MailProviderError,
  MailProviderResult,
  MailSyncCursor,
} from '../../../shared/mail.js';
import type {
  MailProviderAdapter,
  MailProviderMoveResult,
  MailProviderAccount,
  MailProviderContext,
  MailProviderFolderPage,
  MailProviderListChangesInput,
  MailProviderListFoldersInput,
  MailProviderListMessagesInput,
  MailProviderMessagePage,
  MailProviderSendInput,
  MailProviderSendResult,
  NormalizedMailFolder,
  NormalizedMailMessage,
} from '../../contracts/provider.js';

import type {
  ImapCopyEvidence,
  ImapMoveState,
  ImapFolderCursor,
  ImapIdSource,
  ImapOperationSnapshot,
  ImapLocationChange,
  ImapLocationPersistence,
  ImapLocationTuple,
  ImapSmtpCredential,
  ImapStoredLocation,
  ImapSyncCursor,
  ImapVerifyFolder,
  ImapVerifyState,
} from './types.js';
import type { MailSyncStepCommit } from '../../contracts/persistence.js';
import type { MailSyncRun } from '../../../shared/mail.js';
import type { ImapSmtpMailProviderConfig } from './config.js';
import {
  IMAP_SMTP_CAPABILITIES,
  MAX_IMAP_BODY_BYTES,
  MAX_IMAP_DETAIL_BODY_BYTES,
  MAX_IMAP_PROVIDER_ID_LENGTH,
  MAX_IMAP_RAW_COMPARE_BUDGET,
  MAX_IMAP_RAW_COMPARE_BYTES,
  MAX_IMAP_VERIFY_ATTEMPTS,
  MAX_IMAP_VERIFY_STATE_BYTES,
} from './constants.js';
import { createImapClient, createSmtpTransport } from './connection.js';
import {
  compressUids,
  encodeCopyLocator,
  encodeHistoryCursor,
  encodeMessageLocator,
  folderCursor,
  parseHistoryCursor,
  parseSyncCursor,
  rangeFor,
  requireAttachmentLocator,
  requireMessageLocator,
  syncCursor,
} from './locators.js';
import { classifyFolderType, folderTypeFromPath } from './folders.js';

function classifyConfiguredFolder(
  mailbox: ListResponse,
  sentFolder?: string,
): NormalizedMailFolder['type'] {
  if (sentFolder && mailbox.path === sentFolder) return 'sent';
  return classifyFolderType(mailbox.path, mailbox.specialUse);
}
import {
  addresses,
  envelopeAddress,
  envelopeAddresses,
  preview,
  references,
  toHeader,
  toIsoDate,
} from './normalize.js';
import { classifyError, failure, throwIfAborted } from './errors.js';

export class ImapSmtpAdapter implements MailProviderAdapter {
  public readonly identity: MailProviderAccount['provider'];
  public readonly capabilities: MailProviderAdapter['capabilities'] =
    IMAP_SMTP_CAPABILITIES;
  private readonly folderTypes = new Map<
    string,
    NormalizedMailFolder['type']
  >();
  private imapClient?: ImapFlow;
  private readonly smtpTransport: Transporter;
  // Evidence and byte budget of the current step only; never reused across steps.
  private copies: ImapCopyEvidence[] = [];
  private changes: ImapLocationChange[] = [];
  private cleanup = false;
  private verificationIncomplete = false;
  private readonly verificationCopies: FetchedCopy[] = [];
  private readonly syncRun?: MailSyncRun;
  private rawBudget = MAX_IMAP_RAW_COMPARE_BUDGET;
  private readonly rawCache = new Map<string, Buffer | undefined>();

  public constructor(
    private readonly context: MailProviderContext,
    private readonly config: ImapSmtpMailProviderConfig,
    private readonly account: MailProviderAccount,
    private readonly credential: ImapSmtpCredential,
    private readonly locations?: ImapLocationPersistence | undefined,
    run?: MailSyncRun,
    private readonly protocol: {
      readonly imap: typeof createImapClient;
      readonly smtp: typeof createSmtpTransport;
      readonly expungeUid: typeof expungeUid;
      readonly transferUid?: typeof transferUid;
    } = Object.freeze({
      imap: createImapClient,
      smtp: createSmtpTransport,
      expungeUid,
      transferUid,
    }),
    private readonly operation?: ImapOperationSnapshot | undefined,
  ) {
    if (locations && locations.accountId !== account.id)
      throw new Error('The IMAP persistence belongs to another account.');
    if (operation && operation.accountId !== account.id)
      throw new Error('The IMAP operation belongs to another account.');
    this.operation = operation && Object.freeze({ ...operation });
    this.config = Object.freeze({
      ...config,
      imap: Object.freeze({ ...config.imap }),
      smtp: Object.freeze({ ...config.smtp }),
    });
    this.account = Object.freeze({
      ...account,
      provider: Object.freeze({ ...account.provider }),
    });
    this.credential = Object.freeze({ ...credential });
    this.syncRun =
      run &&
      Object.freeze({ ...run, policy: Object.freeze({ ...run.policy }) });
    this.protocol = Object.freeze({ ...protocol });
    this.identity = this.account.provider;
    this.smtpTransport = this.protocol.smtp(this.config.smtp, this.credential);
  }

  public forSync(run: MailSyncRun): ImapSmtpAdapter {
    if (!this.locations)
      throw new Error('IMAP location persistence is not configured.');
    if (this.operation)
      throw new Error(
        'An IMAP message operation cannot be reused for synchronization.',
      );
    if (run.accountId !== this.account.id)
      throw new Error('The IMAP sync account changed.');
    return new ImapSmtpAdapter(
      this.context,
      this.config,
      this.account,
      this.credential,
      this.locations,
      run,
      this.protocol,
    );
  }

  public async forMessage(
    messageId: string,
    providerMessageId: string,
    operation: 'flags' | 'delete' | 'move',
    move?: {
      readonly sourceProviderFolderId?: string;
      readonly destinationProviderFolderId: string;
    },
  ): Promise<ImapSmtpAdapter> {
    if (!this.locations)
      throw new Error('IMAP location persistence is not configured.');
    const bound = await this.locations.bindMessage(
      messageId,
      providerMessageId,
      operation,
      move,
    );
    return new ImapSmtpAdapter(
      this.context,
      this.config,
      this.account,
      this.credential,
      bound.persistence,
      undefined,
      this.protocol,
      bound.snapshot,
    );
  }

  /** True when this instance records message copies in the account's location table. */
  public get persistsLocations(): boolean {
    return this.locations !== undefined;
  }

  /** Commit a sync step together with the location evidence this instance gathered for it. */
  public async commitSyncStep(input: MailSyncStepCommit): Promise<MailSyncRun> {
    if (!this.locations)
      throw new Error('IMAP location persistence is not configured.');
    if (!this.syncRun)
      throw new Error(
        'An IMAP sync commit requires its immutable run snapshot.',
      );
    const ids = new Set(
      input.messages.map((message) => message.providerMessageId),
    );
    if (
      this.syncRun &&
      (input.run.id !== this.syncRun.id ||
        input.run.accountId !== this.syncRun.accountId ||
        input.run.phase !== this.syncRun.phase ||
        input.run.revision !== this.syncRun.revision ||
        input.run.leaseToken !== this.syncRun.leaseToken)
    )
      throw new Error('The IMAP sync operation snapshot changed.');
    const incomplete = this.verificationIncomplete;
    const evidence = {
      copies: this.copies.filter(
        (copy) => copy.flagsOnly || ids.has(copy.providerMessageId),
      ),
      changes: this.changes,
      cleanup: this.cleanup,
    };
    this.beginStep();
    return this.locations.commitSyncStep(
      incomplete
        ? { ...input, status: 'partial', createNextTask: false }
        : input,
      evidence,
    );
  }

  public async listFolders(
    input: MailProviderListFoldersInput,
  ): Promise<MailProviderResult<MailProviderFolderPage>> {
    try {
      throwIfAborted(input.signal);
      const mailboxes = this.selectableMailboxes(await this.listMailboxes());
      return {
        ok: true,
        value: {
          folders: mailboxes.map((mailbox) => this.normalizeFolder(mailbox)),
          completeProviderFolderIds: mailboxes.map((mailbox) => mailbox.path),
        },
      };
    } catch (error) {
      return { ok: false, error: classifyError(error, 'IMAP_LIST_FOLDERS') };
    }
  }

  public async getCurrentSyncCursor(
    signal?: AbortSignal,
  ): Promise<MailProviderResult<MailSyncCursor>> {
    try {
      throwIfAborted(signal);
      const mailboxes = this.selectableMailboxes(await this.listMailboxes());
      const folders: Record<string, ImapFolderCursor> = {};
      for (const mailbox of mailboxes) {
        throwIfAborted(signal);
        folders[mailbox.path] = await this.folderState(mailbox.path, mailbox);
      }
      return { ok: true, value: syncCursor({ version: 1, folders }) };
    } catch (error) {
      return {
        ok: false,
        error: classifyError(error, 'IMAP_SYNC_CURSOR'),
      };
    }
  }

  public async listMessages(
    input: MailProviderListMessagesInput,
  ): Promise<MailProviderResult<MailProviderMessagePage>> {
    this.beginStep();
    try {
      throwIfAborted(input.signal);
      const folders = input.providerFolderIds?.length
        ? [...input.providerFolderIds]
        : this.selectableMailboxes(await this.listMailboxes()).map(
            (mailbox) => mailbox.path,
          );
      let position: ReturnType<typeof parseHistoryCursor>;
      try {
        position = parseHistoryCursor(input.cursor);
      } catch {
        return failure(
          'IMAP_SYNC_CURSOR_INVALID',
          'Invalid history cursor; rescan is required.',
          'provider',
          false,
        );
      }
      const limit = Math.max(1, input.limit ?? 100);
      const messages: FetchedCopy[] = [];
      let folderIndex = position.folderIndex;
      let upperUid = position.upperUid;
      let legacyOffset = position.legacyOffset;
      // IMAP SINCE compares calendar days. Include the previous UTC day for
      // server timezone differences, then enforce the exact instant after FETCH.
      const since = input.receivedAfter
        ? new Date(Date.parse(input.receivedAfter) - 86_400_000)
        : undefined;
      since?.setUTCHours(0, 0, 0, 0);
      let scannedRanges = 0;
      while (
        folderIndex < folders.length &&
        messages.length < limit &&
        scannedRanges < 10
      ) {
        scannedRanges += 1;
        throwIfAborted(input.signal);
        const folder = folders[folderIndex];
        const mailbox = await (
          await this.imap()
        ).mailboxOpen(folder, {
          readOnly: true,
        });
        const baseline = parseSyncCursor(input.baselineCursor).folders[folder];
        if (baseline && baseline.uidValidity !== String(mailbox.uidValidity)) {
          return failure(
            'IMAP_SYNC_CURSOR_INVALID',
            'IMAP mailbox generation changed during history sync.',
            'provider',
            false,
          );
        }
        const remaining = limit - messages.length;
        let selected: number[];
        if (legacyOffset !== undefined) {
          const result = await (
            await this.imap()
          ).search({ all: true }, { uid: true });
          const uids = Array.isArray(result)
            ? [...result].sort((left, right) => right - left)
            : [];
          selected = uids.slice(legacyOffset, legacyOffset + remaining);
          legacyOffset = undefined;
          upperUid = selected.at(-1) ? (selected.at(-1) as number) - 1 : 0;
          if (since && selected.length) {
            const matching = await (
              await this.imap()
            ).search({ uid: selected.join(','), since }, { uid: true });
            const matchingIds = new Set(
              Array.isArray(matching) ? matching : [],
            );
            selected = selected.filter((uid) => matchingIds.has(uid));
          }
        } else {
          const maxUid =
            upperUid ?? (await this.selectedFolderState(mailbox)).uidNext - 1;
          if (maxUid < 1) {
            folderIndex += 1;
            upperUid = undefined;
            continue;
          }
          if (since) {
            // Search the date scope once per page instead of probing sparse UID
            // ranges. The exact timestamp filter below remains authoritative.
            const result = await (
              await this.imap()
            ).search({ since }, { uid: true });
            const candidates = Array.isArray(result)
              ? [...result]
                  .filter((uid) => uid <= maxUid)
                  .sort((left, right) => right - left)
              : [];
            selected = candidates.slice(0, remaining);
            if (selected.length < candidates.length) {
              upperUid = (selected.at(-1) as number) - 1;
            } else {
              folderIndex += 1;
              upperUid = undefined;
            }
          } else {
            const start = Math.max(1, maxUid - remaining + 1);
            const result = await (
              await this.imap()
            ).search({ uid: rangeFor(start, maxUid) }, { uid: true });
            selected = Array.isArray(result)
              ? [...result].sort((left, right) => right - left)
              : [];
            upperUid = start - 1;
          }
        }
        for (const copy of await this.fetchMessages(
          folder,
          String(mailbox.uidValidity),
          selected,
          input.signal,
        )) {
          const { receivedAt } = copy.message;
          if (
            input.receivedAfter &&
            receivedAt &&
            Date.parse(receivedAt) < Date.parse(input.receivedAfter)
          ) {
            continue;
          }
          messages.push(copy);
        }
        if (upperUid !== undefined && upperUid < 1) {
          folderIndex += 1;
          upperUid = undefined;
        }
      }
      const nextCursor =
        folderIndex < folders.length
          ? encodeHistoryCursor({ folderIndex, upperUid })
          : undefined;
      return {
        ok: true,
        value: {
          messages: await this.assignIdentities(messages, input.signal),
          nextCursor,
          syncCursor: input.cursor ? undefined : input.baselineCursor,
        },
      };
    } catch (error) {
      return { ok: false, error: classifyError(error, 'IMAP_LIST_MESSAGES') };
    }
  }

  public async listChanges(input: MailProviderListChangesInput): Promise<
    MailProviderResult<{
      readonly messages: readonly NormalizedMailMessage[];
      readonly deletedProviderMessageIds: readonly string[];
      readonly nextCursor: MailSyncCursor;
      readonly hasMore: boolean;
    }>
  > {
    this.beginStep();
    try {
      throwIfAborted(input.signal);
      let previous: ImapSyncCursor;
      try {
        previous = parseSyncCursor(input.cursor);
      } catch {
        return {
          ok: false,
          error: {
            code: 'IMAP_SYNC_CURSOR_INVALID',
            message: 'The IMAP sync cursor is invalid.',
            category: 'provider',
            retryable: false,
          },
        };
      }
      const mailboxes = this.selectableMailboxes(await this.listMailboxes());
      const nextFolders: Record<string, ImapFolderCursor> = {};
      const messages: FetchedCopy[] = [];
      let hasMore = false;
      const limit = Math.max(1, input.limit);

      for (const mailbox of mailboxes) {
        throwIfAborted(input.signal);
        const current = await this.folderState(mailbox.path, mailbox);
        const old = previous.folders[mailbox.path];
        const sameGeneration = old?.uidValidity === current.uidValidity;
        const start = sameGeneration ? old.uidNext : 1;
        const canFetch = messages.length < limit;
        const end = canFetch
          ? Math.min(current.uidNext - 1, start + limit - messages.length - 1)
          : start - 1;
        let nextUid = sameGeneration ? old.uidNext : 1;
        if (start <= end) {
          const client = await this.imap();
          const selected = await client.mailboxOpen(mailbox.path, {
            readOnly: true,
          });
          if (String(selected.uidValidity) !== current.uidValidity)
            return failure(
              'IMAP_SYNC_CURSOR_INVALID',
              'Mailbox generation changed before fetching.',
              'provider',
              false,
            );
          const fetched = await this.fetchMessages(
            mailbox.path,
            current.uidValidity,
            rangeFor(start, end),
            input.signal,
          );
          messages.push(...fetched);
          // Complete the bounded UID range before advancing, regardless of response order or holes.
          nextUid = end + 1;
          if (fetched.length === 0 && nextUid < current.uidNext) {
            // Some servers assign very large, sparse UIDs. Jump to the next
            // existing message instead of scheduling every empty UID range.
            const remaining = await client.search(
              { uid: rangeFor(nextUid, current.uidNext - 1) },
              { uid: true },
            );
            const lowerBound = nextUid;
            nextUid = current.uidNext;
            if (Array.isArray(remaining)) {
              for (const uid of remaining) {
                if (uid >= lowerBound && uid < nextUid) nextUid = uid;
              }
            }
          }
        } else if (canFetch) {
          nextUid = current.uidNext;
        }
        if (nextUid < current.uidNext) hasMore = true;
        nextFolders[mailbox.path] = {
          uidValidity: current.uidValidity,
          uidNext: nextUid,
        };
      }
      let verify: ImapVerifyState | undefined;
      if (this.locations) {
        if (hasMore || messages.length > 0) {
          // New copies are committed first; verification restarts afterwards.
          verify = previous.verify && {
            attempts: previous.verify.attempts,
            excluded: previous.verify.excluded,
          };
          hasMore = true;
        } else {
          const result = await this.verifyFolders(
            mailboxes,
            nextFolders,
            previous.verify,
            input.signal,
          );
          if (result === 'generation-changed')
            return failure(
              'IMAP_SYNC_CURSOR_INVALID',
              'Mailbox generation changed during verification.',
              'provider',
              false,
            );
          messages.push(...this.verificationCopies);
          hasMore = !result.done;
          verify = result.verify;
        }
      }
      return {
        ok: true,
        value: {
          messages: await this.assignIdentities(messages, input.signal),
          // Copies leave through location evidence; one missing UID never deletes a message.
          deletedProviderMessageIds: [],
          nextCursor: syncCursor({
            version: 1,
            folders: nextFolders,
            ...(verify ? { verify } : {}),
          }),
          hasMore,
        },
      };
    } catch (error) {
      return { ok: false, error: classifyError(error, 'IMAP_LIST_CHANGES') };
    }
  }

  public async getMessage(
    providerMessageId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<NormalizedMailMessage>> {
    try {
      throwIfAborted(signal);
      if (this.locations) {
        // Try each verified copy; a stale copy is skipped, never reported as deleted.
        for (const location of await this.locations.listValidLocations(
          providerMessageId,
        )) {
          const message = await this.openCopy(location, metadataQuery());
          if (!message) continue;
          return {
            ok: true,
            value: {
              ...(await this.normalizeMessage(
                location.folder,
                location.uidValidity,
                message,
                signal,
                MAX_IMAP_DETAIL_BODY_BYTES,
              )),
              providerMessageId,
            },
          };
        }
        return failure(
          'IMAP_MESSAGE_NOT_FOUND',
          'No verified IMAP copy of this message is available.',
          'provider',
          false,
        );
      }
      const locator = requireMessageLocator(providerMessageId);
      const mailbox = await (
        await this.imap()
      ).mailboxOpen(locator.folder, {
        readOnly: true,
      });
      if (String(mailbox.uidValidity) !== locator.uidValidity) {
        return failure(
          'IMAP_SYNC_CURSOR_INVALID',
          'The mailbox generation changed; synchronization must recover first.',
          'provider',
          false,
        );
      }
      const message = await (
        await this.imap()
      ).fetchOne(locator.uid, metadataQuery(), { uid: true });
      if (!message)
        return failure(
          'IMAP_MESSAGE_NOT_FOUND',
          'IMAP message was not found.',
          'provider',
          false,
        );
      return {
        ok: true,
        value: await this.normalizeMessage(
          locator.folder,
          String(mailbox.uidValidity),
          message,
          signal,
          MAX_IMAP_DETAIL_BODY_BYTES,
        ),
      };
    } catch (error) {
      return { ok: false, error: classifyError(error, 'IMAP_GET_MESSAGE') };
    }
  }

  public async getAttachment(
    providerMessageId: string,
    providerAttachmentId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<MailAttachmentContent>> {
    let release: (() => void) | undefined;
    let streamed = false;
    try {
      throwIfAborted(signal);
      const locator = requireAttachmentLocator(providerAttachmentId);
      let storedCopy: ImapStoredLocation | undefined;
      let expected:
        import('../../../shared/mail.js').NormalizedMailAttachment | undefined;
      if (this.locations) {
        // The part index is only meaningful on the copy it was read from.
        const [location] = await this.locations.findLocations([locator]);
        if (
          location?.status !== 'valid' ||
          location.providerMessageId !== providerMessageId
        )
          return failure(
            'IMAP_ATTACHMENT_NOT_FOUND',
            'The IMAP copy holding this attachment is no longer available.',
            'provider',
            false,
          );
        storedCopy = location;
        expected = await this.locations.findAttachment(
          location,
          providerAttachmentId,
        );
        if (!expected)
          return failure(
            'IMAP_ATTACHMENT_NOT_FOUND',
            'The stored attachment does not belong to this copy.',
            'provider',
            false,
          );
      }
      const lockedClient = await this.imap();
      const lock = await lockedClient.getMailboxLock(locator.folder, {
        readOnly: true,
      });
      let released = false;
      release = () => {
        if (!released) {
          released = true;
          lock.release();
        }
      };
      const selected = lockedClient.mailbox;
      if (!selected)
        throw new Error('IMAP mailbox lock did not select the folder.');
      if (String(selected.uidValidity) !== locator.uidValidity)
        return failure(
          'IMAP_SYNC_CURSOR_INVALID',
          'Mailbox generation changed before downloading.',
          'provider',
          false,
        );
      const client = await this.imap();
      const message = await client.fetchOne(
        locator.uid,
        { uid: true, bodyStructure: true, envelope: true },
        { uid: true },
      );
      if (!message || message.uid !== locator.uid)
        return failure(
          'IMAP_ATTACHMENT_NOT_FOUND',
          'The IMAP attachment copy changed.',
          'provider',
          false,
        );
      const part = attachmentParts(message.bodyStructure)[locator.attachment];
      if (!part)
        return failure(
          'IMAP_ATTACHMENT_NOT_FOUND',
          'IMAP attachment was not found.',
          'provider',
          false,
        );
      if (expected) {
        const actual = attachmentMetadata(
          locator.folder,
          locator.uidValidity,
          locator.uid,
          part,
          locator.attachment,
        );
        if (
          actual.fileName !== expected.fileName ||
          actual.contentType !== expected.contentType ||
          actual.size !== expected.size ||
          actual.contentId !== expected.contentId ||
          actual.inline !== expected.inline ||
          ((storedCopy?.source === 'objectid' ||
            storedCopy?.source === 'x-gm-msgid') &&
            validNativeId(this.nativeSource(), message.emailId) !== undefined &&
            (this.nativeSource() !== storedCopy.source ||
              message.emailId !== storedCopy.providerMessageId))
        )
          return failure(
            'IMAP_ATTACHMENT_NOT_FOUND',
            'The IMAP attachment metadata or identity changed.',
            'provider',
            false,
          );
      }
      const download = await client.download(locator.uid, part.part ?? '1', {
        uid: true,
        chunkSize: 64 * 1024,
      });
      if (!download.content)
        return failure(
          'IMAP_ATTACHMENT_NOT_FOUND',
          'IMAP attachment was not found.',
          'provider',
          false,
        );
      download.content.once('end', release);
      download.content.once('error', release);
      download.content.once('close', release);
      streamed = true;
      if (signal) addAbortSignal(signal, download.content);
      return {
        ok: true,
        value: {
          fileName:
            download.meta.filename ??
            part.dispositionParameters?.filename ??
            part.parameters?.name ??
            'attachment',
          contentType: download.meta.contentType ?? part.type,
          // IMAP reports encoded part sizes, not the decoded stream length.
          stream: Readable.toWeb(download.content, {
            strategy: {
              highWaterMark: 64 * 1024,
              size: (chunk: Uint8Array) => chunk.byteLength,
            },
          }) as ReadableStream<Uint8Array>,
        },
      };
    } catch (error) {
      return { ok: false, error: classifyError(error, 'IMAP_GET_ATTACHMENT') };
    } finally {
      if (!streamed) release?.();
    }
  }

  public async sendMessage(
    input: MailProviderSendInput,
  ): Promise<MailProviderSendResult> {
    let submissionStarted = false;
    try {
      throwIfAborted(input.signal);
      const attachments = [];
      for (const attachment of input.message.attachments) {
        throwIfAborted(input.signal);
        const content = Buffer.from(
          await new Response(await attachment.open()).arrayBuffer(),
        );
        if (content.byteLength !== attachment.size) {
          throw new Error('Mail attachment size changed before submission.');
        }
        attachments.push({
          filename: attachment.fileName,
          content,
          contentType: attachment.contentType,
          contentDisposition: attachment.inline
            ? ('inline' as const)
            : ('attachment' as const),
          cid: attachment.contentId,
        });
      }
      const mail = {
        from: toHeader({
          address: input.identity.address,
          name: input.identity.displayName,
        }),
        to: input.message.to.map(toHeader),
        cc: input.message.cc.map(toHeader),
        bcc: input.message.bcc.map(toHeader),
        subject: input.message.subject,
        text: input.message.text,
        html: input.message.html,
        messageId:
          input.message.internetMessageId ??
          `<${randomUUID()}@${input.identity.address.split('@')[1]}>`,
        date: new Date(),
        headers: {
          ...(input.message.inReplyTo
            ? { 'In-Reply-To': input.message.inReplyTo }
            : {}),
          ...(input.message.references.length > 0
            ? { References: input.message.references.join(' ') }
            : {}),
        },
        attachments,
      };
      let sentCopy: Buffer | undefined;
      if (this.config.sentCopyMode === 'client') {
        const composer = new MailComposer(mail).compile();
        composer.keepBcc = true;
        sentCopy = await composer.build();
      }
      submissionStarted = true;
      const info = (await this.smtpTransport.sendMail(mail)) as {
        messageId?: string;
        accepted?: readonly (string | { address: string })[];
        rejected?: readonly (string | { address: string })[];
      };
      const recipientError: MailProviderError | undefined = info.rejected
        ?.length
        ? {
            code: 'SMTP_RECIPIENTS_REJECTED',
            message:
              'The SMTP server rejected some recipients after accepting others.',
            category: 'recipient',
            // Retrying the entire submission would duplicate accepted deliveries.
            retryable: false,
            recipients: {
              accepted: (info.accepted ?? []).map((recipient) =>
                typeof recipient === 'string' ? recipient : recipient.address,
              ),
              rejected: info.rejected.map((recipient) =>
                typeof recipient === 'string' ? recipient : recipient.address,
              ),
            },
          }
        : undefined;
      const internetMessageId = info.messageId ?? mail.messageId;
      let sentCopyError;
      if (sentCopy) {
        try {
          const folders = this.selectableMailboxes(await this.listMailboxes());
          const folder = this.config.sentFolder
            ? folders.find((item) => item.path === this.config.sentFolder)?.path
            : folders.find(
                (item) =>
                  classifyFolderType(item.path, item.specialUse) === 'sent',
              )?.path;
          if (!folder)
            throw new Error(
              this.config.sentFolder
                ? 'The configured sentFolder is missing or is not selectable.'
                : 'Configure sentFolder or provide an IMAP folder marked as Sent.',
            );
          const client = await this.imap();
          await client.mailboxOpen(folder, { readOnly: true });
          const existing = await client.search(
            { header: { 'Message-ID': internetMessageId } },
            { uid: true },
          );
          if (!Array.isArray(existing) || existing.length === 0) {
            if (
              !(await client.append(folder, sentCopy, ['\\Seen'], mail.date))
            ) {
              throw new Error(
                'The IMAP server did not confirm the sent copy was saved.',
              );
            }
          }
        } catch (error) {
          // SMTP already accepted the message; never report this as a send failure.
          sentCopyError = {
            ...classifyError(error, 'IMAP_SAVE_SENT_COPY'),
            code: 'IMAP_SENT_COPY_FAILED',
            retryable: false,
          };
        }
      }
      return {
        status: 'accepted',
        providerMessageId: internetMessageId,
        internetMessageId,
        ...(sentCopyError ? { sentCopyError } : {}),
        ...(recipientError ? { recipientError } : {}),
      };
    } catch (error) {
      const classified = classifyError(error, 'SMTP_SEND');
      return {
        status:
          submissionStarted &&
          (classified.category === 'network' ||
            classified.category === 'timeout') &&
          classified.retryable
            ? 'submission_unknown'
            : 'failed',
        error: classified,
      };
    }
  }

  public async setRead(
    providerMessageId: string,
    read: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    if (
      (this.locations && !this.operation) ||
      (this.operation &&
        (this.operation.operation !== 'flags' ||
          this.operation.providerMessageId !== providerMessageId))
    )
      return failure(
        'IMAP_OPERATION_MISMATCH',
        'The IMAP operation does not match its immutable target.',
        'configuration',
        false,
      );
    return this.locations
      ? this.updateCopyFlags(providerMessageId, '\\Seen', read, signal)
      : this.updateFlags(providerMessageId, '\\Seen', read, signal);
  }

  public async setStarred(
    providerMessageId: string,
    starred: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    if (
      (this.locations && !this.operation) ||
      (this.operation &&
        (this.operation.operation !== 'flags' ||
          this.operation.providerMessageId !== providerMessageId))
    )
      return failure(
        'IMAP_OPERATION_MISMATCH',
        'The IMAP operation does not match its immutable target.',
        'configuration',
        false,
      );
    return this.locations
      ? this.updateCopyFlags(providerMessageId, '\\Flagged', starred, signal)
      : this.updateFlags(providerMessageId, '\\Flagged', starred, signal);
  }

  /** Move only the bound copy; fixed UID primitives never choose a global EXPUNGE. */
  public async moveMessage(
    providerMessageId: string,
    providerFolderId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<MailProviderMoveResult>> {
    if (
      !this.locations ||
      this.operation?.operation !== 'move' ||
      this.operation.providerMessageId !== providerMessageId ||
      this.operation.destinationProviderFolderId !== providerFolderId
    )
      throw mailFailedPrecondition(
        'MAIL_IMAP_MOVE_SOURCE_REQUIRED',
        'A move requires a bound source folder.',
      );
    let state: ImapMoveState | undefined;
    let remoteStarted = false;
    try {
      throwIfAborted(signal);
      const client = await this.imap();
      if (
        !client.capabilities.has('MOVE') &&
        !client.capabilities.has('UIDPLUS')
      )
        throw mailFailedPrecondition(
          'MAIL_IMAP_MOVE_UNSUPPORTED',
          'This server cannot safely move messages. Use your mail client.',
        );
      const folders = await this.listMailboxes();
      if (
        !folders.some(
          (folder) =>
            folder.path === providerFolderId && !folder.flags.has('\\Noselect'),
        )
      )
        throw mailFailedPrecondition(
          'MAIL_IMAP_MOVE_LOCATION_CHANGED',
          'The selected destination is no longer a selectable folder. Synchronize the mailbox.',
        );
      const destinationMailbox = await client.mailboxOpen(providerFolderId, {
        readOnly: false,
      });
      if (destinationMailbox.readOnly)
        throw mailFailedPrecondition(
          'MAIL_IMAP_MOVE_NOT_WRITABLE',
          'The selected destination is read-only.',
        );
      state = await this.locations.beginMove();
      const source = await this.openCopy(
        state.source,
        { flags: true, size: true, bodyStructure: true },
        false,
      );
      if (client.mailbox && client.mailbox.readOnly)
        throw mailFailedPrecondition(
          'MAIL_IMAP_MOVE_NOT_WRITABLE',
          'The selected source is read-only.',
        );
      if (source && !(source.flags instanceof Set))
        throw mailFailedPrecondition(
          'MAIL_IMAP_MOVE_LOCATION_CHANGED',
          'The server did not report source flags.',
        );
      if (!source && !state.destination)
        throw mailFailedPrecondition(
          'MAIL_IMAP_MOVE_LOCATION_CHANGED',
          'The selected source changed. Synchronize and open its source folder again.',
        );
      if (
        client.mailbox &&
        !client.mailbox.readOnly &&
        client.mailbox.permanentFlags &&
        !client.mailbox.permanentFlags.has('\\Deleted') &&
        !client.mailbox.permanentFlags.has('\\*') &&
        !state.destination
      )
        throw mailFailedPrecondition(
          'MAIL_IMAP_MOVE_NOT_WRITABLE',
          'The selected source does not allow deletion flags.',
        );
      if (source?.flags?.has('\\Deleted') && !state.destination)
        throw mailFailedPrecondition(
          'MAIL_IMAP_MOVE_LOCATION_CHANGED',
          'The selected source already has an external deletion flag.',
        );
      if (state.source.folder === providerFolderId && source) {
        await this.locations.releaseMove(state);
        state = undefined;
        return { ok: true, value: { providerMessageId } };
      }
      const resumed = Boolean(state.destination);
      // A persisted mapping is resumed without ever issuing another COPY or MOVE.
      if (!state.destination) {
        throwIfAborted(signal);
        if (
          !client.capabilities.has('MOVE') &&
          !client.capabilities.has('UIDPLUS')
        )
          throw mailFailedPrecondition(
            'MAIL_IMAP_MOVE_UNSUPPORTED',
            'This server no longer has a safe move path.',
          );
        remoteStarted = true;
        const native = client.capabilities.has('MOVE');
        const tuple = await (this.protocol.transferUid ?? transferUid)(
          client,
          state.source.uid,
          providerFolderId,
          native,
        );
        if (
          !tuple ||
          tuple.uidValidity !== String(destinationMailbox.uidValidity)
        )
          throw new Error(
            'The server did not supply a valid destination mapping.',
          );
        const destination = await this.fetchMoveDestination(
          tuple,
          providerMessageId,
        );
        if (
          !destination ||
          !source ||
          destination.size !== source.size ||
          JSON.stringify(destination.bodyStructure) !==
            JSON.stringify(source.bodyStructure) ||
          destination.envelope?.messageId !== source.envelope?.messageId ||
          (source.emailId && destination.emailId !== source.emailId)
        )
          throw new Error(
            'The mapped destination does not match the selected source.',
          );
        state = await this.locations.rememberMoveDestination(state, {
          ...tuple,
          locationId: randomUUID(),
          providerMessageId,
          source: this.operation.source,
          read: destination.flags?.has('\\Seen') ?? false,
          starred: destination.flags?.has('\\Flagged') ?? false,
          receivedAt: destination.internalDate
            ? toIsoDate(destination.internalDate)
            : undefined,
        });
        // Native MOVE has already removed the source. Do not run COPY after any native failure.
        if (native) {
          await client.mailboxOpen(state.source.folder, { readOnly: false });
          if (
            !client.mailbox ||
            String(client.mailbox.uidValidity) !== state.source.uidValidity
          )
            throw new Error('The source generation changed after MOVE.');
          const remaining = await client.search(
            { uid: String(state.source.uid) },
            { uid: true },
          );
          if (!Array.isArray(remaining) || remaining.includes(state.source.uid))
            throw new Error('The source is still present after MOVE.');
          const id = await this.locations.commitMoved(
            state,
            this.moveAttachments(state.destination!, destination),
            {
              read: destination.flags!.has('\\Seen'),
              starred: destination.flags!.has('\\Flagged'),
            },
          );
          return { ok: true, value: { providerMessageId: id } };
        }
      }
      const destination = await this.fetchMoveDestination(
        state.destination!,
        providerMessageId,
      );
      if (!destination) throw new Error('The confirmed destination changed.');
      throwIfAborted(signal);
      const current = await this.openCopy(
        state.source,
        { flags: true, size: true, bodyStructure: true },
        false,
      );
      if (current) {
        if (client.mailbox && client.mailbox.readOnly)
          throw mailFailedPrecondition(
            'MAIL_IMAP_MOVE_NOT_WRITABLE',
            'The selected source is read-only.',
          );
        if (!client.capabilities.has('UIDPLUS'))
          throw new Error('UIDPLUS became unavailable before source cleanup.');
        remoteStarted = true;
        if (!current.flags?.has('\\Deleted')) {
          if (
            !(await client.messageFlagsAdd(
              String(state.source.uid),
              ['\\Deleted'],
              { uid: true },
            ))
          )
            throw new Error(
              'The server did not confirm the source deletion flag.',
            );
        } else if (!resumed)
          throw new Error('The source acquired an external deletion flag.');
        if (!client.capabilities.has('UIDPLUS'))
          throw new Error('UIDPLUS became unavailable after STORE.');
        await this.protocol.expungeUid(client, state.source.uid);
      }
      // An absent UID is safe only in the same generation, including explicit partial-copy recovery.
      if (
        !client.mailbox ||
        String(client.mailbox.uidValidity) !== state.source.uidValidity
      )
        throw new Error(
          'The source generation changed before cleanup was confirmed.',
        );
      const remaining = await client.search(
        { uid: String(state.source.uid) },
        { uid: true },
      );
      if (!Array.isArray(remaining) || remaining.includes(state.source.uid))
        throw new Error('The source removal was not confirmed.');
      const id = await this.locations.commitMoved(
        state,
        this.moveAttachments(state.destination!, destination),
        {
          read: destination.flags!.has('\\Seen'),
          starred: destination.flags!.has('\\Flagged'),
        },
      );
      return { ok: true, value: { providerMessageId: id } };
    } catch (error) {
      if (
        (error as { imapCopyRejected?: boolean }).imapCopyRejected &&
        !state?.destination
      )
        remoteStarted = false;
      if (state && !state.destination && !remoteStarted)
        await this.locations.releaseMove(state);
      if (state && (remoteStarted || state.destination))
        throw mailFailedPrecondition(
          'MAIL_IMAP_MOVE_OUTCOME_UNKNOWN',
          'The move is incomplete or its result is unknown. Verify the mailbox before retrying.',
        );
      if (error instanceof MailError) throw error;
      return { ok: false, error: classifyError(error, 'IMAP_MOVE_MESSAGE') };
    }
  }

  private async fetchMoveDestination(
    tuple: ImapLocationTuple,
    providerMessageId: string,
  ): Promise<FetchMessageObject | undefined> {
    const client = await this.imap();
    const selected = await client.mailboxOpen(tuple.folder, { readOnly: true });
    if (String(selected.uidValidity) !== tuple.uidValidity) return undefined;
    const result = await client.fetchOne(
      tuple.uid,
      {
        uid: true,
        flags: true,
        envelope: true,
        bodyStructure: true,
        size: true,
        internalDate: true,
      },
      { uid: true },
    );
    if (
      !result ||
      result.uid !== tuple.uid ||
      !(result.flags instanceof Set) ||
      result.flags.has('\\Deleted')
    )
      return undefined;
    const source = this.operation!.source;
    if (
      (source === 'objectid' || source === 'x-gm-msgid') &&
      result.emailId !== providerMessageId
    )
      return undefined;
    if (
      source === 'rfc-message-id' &&
      result.envelope?.messageId !== providerMessageId
    )
      return undefined;
    return result;
  }

  private moveAttachments(
    tuple: ImapLocationTuple,
    message: FetchMessageObject,
  ): readonly import('../../../shared/mail.js').NormalizedMailAttachment[] {
    const parts = attachmentParts(message.bodyStructure);
    if (!parts)
      throw new Error('The destination attachment structure is missing.');
    return parts.map((part, index) =>
      attachmentMetadata(
        tuple.folder,
        tuple.uidValidity,
        tuple.uid,
        part,
        index,
      ),
    );
  }

  public async deleteMessage(
    providerMessageId: string,
    permanently: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    if (
      (this.locations && !this.operation) ||
      (this.operation &&
        (this.operation.operation !== 'delete' ||
          this.operation.providerMessageId !== providerMessageId))
    )
      return failure(
        'IMAP_OPERATION_MISMATCH',
        'The IMAP operation does not match its immutable target.',
        'configuration',
        false,
      );
    if (!permanently) {
      return failure(
        'IMAP_SOFT_DELETE_UNSUPPORTED',
        'This IMAP Provider cannot move messages to Trash. Delete them in your mail client instead.',
        'configuration',
        false,
      );
    }
    try {
      throwIfAborted(signal);
      const client = await this.imap();
      // Without UIDPLUS, ImapFlow falls back to a mailbox-wide EXPUNGE.
      if (!client.capabilities?.has('UIDPLUS'))
        return failure(
          'IMAP_UIDPLUS_REQUIRED',
          'This IMAP server cannot expunge a single message (UIDPLUS is missing). Delete it in your mail client instead.',
          'configuration',
          false,
        );
      if (!this.locations) {
        const locator = requireMessageLocator(providerMessageId);
        const selected = await client.mailboxOpen(locator.folder);
        if (String(selected.uidValidity) !== locator.uidValidity)
          return this.copyChanged();
        const target = await client.fetchOne(
          locator.uid,
          { uid: true },
          { uid: true },
        );
        if (!target || target.uid !== locator.uid) return this.copyChanged();
        if (
          !(await client.messageFlagsAdd(String(locator.uid), ['\\Deleted'], {
            uid: true,
          }))
        )
          throw new Error('The IMAP server did not set the deletion flag.');
        if (!client.capabilities.has('UIDPLUS'))
          throw new Error('UIDPLUS became unavailable before expunging.');
        await this.protocol.expungeUid(client, locator.uid);
        const remaining = await client.search(
          { uid: String(locator.uid) },
          { uid: true },
        );
        if (!Array.isArray(remaining) || remaining.includes(locator.uid))
          throw new Error('The IMAP server still lists the deleted message.');
        return { ok: true, value: undefined };
      }
      const locations =
        await this.locations.listValidLocations(providerMessageId);
      if (locations.length === 0)
        return failure(
          'IMAP_MESSAGE_NOT_FOUND',
          'No verified IMAP copy of this message is available.',
          'provider',
          false,
        );
      for (const location of locations) {
        throwIfAborted(signal);
        if (!(await this.openCopy(location, { uid: true }, false)))
          return this.copyChanged();
        const uid = String(location.uid);
        if (!(await client.messageFlagsAdd(uid, ['\\Deleted'], { uid: true })))
          throw new Error('The IMAP server did not set the deletion flag.');
        if (!client.capabilities.has('UIDPLUS'))
          throw new Error('UIDPLUS became unavailable before expunging.');
        // Never use messageDelete(): its post-STORE capability check can choose global EXPUNGE.
        await this.protocol.expungeUid(client, location.uid);
        const remaining = await client.search({ uid }, { uid: true });
        if (!Array.isArray(remaining) || remaining.includes(location.uid))
          throw new Error('The IMAP server still lists the deleted message.');
        // Earlier copies stay committed if a later copy fails.
        await this.locations.commitDeleted(location);
      }
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: classifyError(error, 'IMAP_DELETE_MESSAGE') };
    }
  }

  public async close(): Promise<void> {
    this.smtpTransport.close();
    if (!this.imapClient) return;
    try {
      await this.imapClient.logout();
    } catch {
      this.imapClient.close();
    } finally {
      this.imapClient = undefined;
    }
  }

  private async updateFlags(
    providerMessageId: string,
    flag: string,
    enabled: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    try {
      throwIfAborted(signal);
      const locator = requireMessageLocator(providerMessageId);
      const client = await this.imap();
      await client.mailboxOpen(locator.folder);
      const method = enabled ? 'messageFlagsAdd' : 'messageFlagsRemove';
      await client[method](locator.uid, [flag], { uid: true });
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: classifyError(error, 'IMAP_UPDATE_FLAGS') };
    }
  }

  private closeImap(): void {
    const client = this.imapClient;
    this.imapClient = undefined;
    client?.close();
  }

  private async imap(): Promise<ImapFlow> {
    if (this.imapClient) return this.imapClient;
    const client = this.protocol.imap(this.config.imap, this.credential);
    await client.connect();
    this.imapClient = client;
    return client;
  }

  private async listMailboxes(): Promise<ListResponse[]> {
    const client = await this.imap();
    const mailboxes = await client.list({
      statusQuery: {
        messages: true,
        unseen: true,
        uidNext: true,
        uidValidity: true,
      },
      specialUseHints: {
        sent: this.config.sentFolder,
        trash: this.config.trashFolder,
        drafts: this.config.draftsFolder,
      },
    });
    this.folderTypes.clear();
    for (const mailbox of mailboxes) {
      this.folderTypes.set(
        mailbox.path,
        classifyConfiguredFolder(mailbox, this.config.sentFolder),
      );
    }
    return mailboxes;
  }

  private selectableMailboxes(
    mailboxes: readonly ListResponse[],
  ): ListResponse[] {
    // \\NonExistent implies \\Noselect under IMAP, so neither entry can be opened.
    return mailboxes.filter((mailbox) => {
      const flags = new Set(
        [...(mailbox.flags ?? [])].map((flag) => flag.toLowerCase()),
      );
      return !flags.has('\\noselect') && !flags.has('\\nonexistent');
    });
  }

  private async folderState(
    path: string,
    listedMailbox?: ListResponse,
  ): Promise<ImapFolderCursor> {
    let stage: 'LIST' | 'STATUS' | 'SELECT' = 'STATUS';
    let statusUidValidity: bigint | undefined;
    let selectedUidValidity: bigint | undefined;
    try {
      const client = await this.imap();
      const listedStatus = listedMailbox?.status;
      if (
        listedStatus?.uidNext !== undefined &&
        listedStatus.uidValidity !== undefined
      ) {
        stage = 'LIST';
        statusUidValidity = listedStatus.uidValidity;
        return folderCursor(listedStatus.uidValidity, listedStatus.uidNext);
      }
      if (client.mailbox && client.mailbox.path === path) {
        stage = 'SELECT';
        selectedUidValidity = client.mailbox.uidValidity;
        return this.selectedFolderState(client.mailbox);
      }
      stage = 'STATUS';
      const status = await client.status(path, {
        uidNext: true,
        uidValidity: true,
      });
      statusUidValidity = status ? status.uidValidity : undefined;
      if (
        status &&
        status.uidNext !== undefined &&
        Number.isSafeInteger(status.uidNext) &&
        status.uidNext >= 1 &&
        status.uidValidity !== undefined &&
        status.uidValidity >= 1n
      ) {
        return folderCursor(status.uidValidity, status.uidNext);
      }
      stage = 'SELECT';
      const mailbox = await client.mailboxOpen(path, { readOnly: true });
      selectedUidValidity = mailbox.uidValidity;
      const selectedState = await this.selectedFolderState(mailbox);
      return selectedState;
    } catch (error) {
      if ((error as { code?: unknown })?.code !== 'IMAP_INVALID_UIDVALIDITY') {
        throw error;
      }
      throw Object.assign(
        new Error(
          `The IMAP server returned invalid UIDVALIDITY for ${path} during ${stage} (STATUS: ${statusUidValidity ?? 'missing'}, SELECT: ${selectedUidValidity ?? 'not read'}).`,
        ),
        { code: 'IMAP_INVALID_UIDVALIDITY' },
      );
    }
  }

  private async selectedFolderState(
    mailbox: MailboxObject,
  ): Promise<ImapFolderCursor> {
    if (mailbox.uidNext !== undefined) {
      return folderCursor(mailbox.uidValidity, mailbox.uidNext);
    }
    // Some servers (including Coremail/163) omit UIDNEXT in both STATUS and
    // SELECT. Read the last sequence number's UID without downloading mail or
    // marking it read. Missing metadata must never masquerade as an empty inbox.
    if (mailbox.exists === 0) return folderCursor(mailbox.uidValidity, 1);
    if (Number.isSafeInteger(mailbox.exists) && mailbox.exists > 0) {
      const last = await (
        await this.imap()
      ).fetchOne(mailbox.exists, { uid: true }, { uid: false });
      if (last && Number.isSafeInteger(last.uid) && last.uid > 0) {
        return folderCursor(mailbox.uidValidity, last.uid + 1);
      }
    }
    throw Object.assign(
      new Error(
        'The IMAP server did not provide UIDNEXT and the last message UID could not be read. Retry synchronization after checking the mailbox connection.',
      ),
      { code: 'IMAP_INVALID_UIDNEXT' },
    );
  }

  private normalizeFolder(mailbox: ListResponse): NormalizedMailFolder {
    return {
      providerFolderId: mailbox.path,
      type: classifyConfiguredFolder(mailbox, this.config.sentFolder),
      name: mailbox.name || mailbox.path,
      unreadCount: mailbox.status?.unseen,
      kind: 'folder',
    };
  }

  private async fetchMessages(
    folder: string,
    uidValidity: string,
    uids: number[] | string,
    signal?: AbortSignal,
  ): Promise<FetchedCopy[]> {
    if (uids.length === 0) return [];
    const observed = this.locations
      ? await this.locations.listKnownLocations()
      : [];
    const metadata: FetchMessageObject[] = [];
    const client = await this.imap();
    // Finish FETCH before issuing more IMAP commands: nested downloads deadlock.
    for await (const message of client.fetch(uids, metadataQuery(), {
      uid: true,
    })) {
      throwIfAborted(signal);
      metadata.push(message);
    }
    const messages: FetchedCopy[] = [];
    for (const message of metadata) {
      throwIfAborted(signal);
      const normalized = await this.normalizeMessage(
        folder,
        uidValidity,
        message,
        signal,
      );
      messages.push({
        message: normalized,
        tuple: { folder, uidValidity, uid: message.uid },
        observed: observed.find(
          (location) =>
            location.folder === folder &&
            location.uidValidity === uidValidity &&
            location.uid === message.uid,
        ),
        emailId: message.emailId,
        rfcMessageId: validRfcMessageId(normalized.internetMessageId),
        structure: message.bodyStructure,
        size: message.size,
      });
    }
    return messages;
  }

  private beginStep(): void {
    this.copies = [];
    this.changes = [];
    this.cleanup = false;
    this.verificationIncomplete = false;
    this.verificationCopies.length = 0;
    this.rawBudget = MAX_IMAP_RAW_COMPARE_BUDGET;
    this.rawCache.clear();
  }

  /**
   * Choose each copy's identity: its persisted location first, then the
   * server's native ID, then an RFC Message-ID proven by identical MIME bytes,
   * and otherwise the copy's own location.
   */
  private async assignIdentities(
    fetched: readonly FetchedCopy[],
    signal?: AbortSignal,
  ): Promise<NormalizedMailMessage[]> {
    if (!this.locations) return fetched.map((copy) => copy.message);
    const stored = new Map(
      (
        await this.locations.findLocations(fetched.map((copy) => copy.tuple))
      ).map((location) => [tupleKey(location), location]),
    );
    const nativeSource = this.nativeSource();
    const candidates = new Set<string>();
    for (const copy of fetched) {
      if (stored.has(tupleKey(copy.tuple))) continue;
      const id = validNativeId(nativeSource, copy.emailId) ?? copy.rfcMessageId;
      if (id) candidates.add(id);
    }
    const sources = await this.locations.findMessageSources([...candidates]);
    const claimed = new Map<string, FetchedCopy>();
    const messages: NormalizedMailMessage[] = [];
    for (const copy of fetched) {
      throwIfAborted(signal);
      const existing = stored.get(tupleKey(copy.tuple));
      const locationId = existing?.id ?? randomUUID();
      const nativeId = validNativeId(nativeSource, copy.emailId);
      let identity: { id: string; source: ImapIdSource } | undefined;
      if (existing) {
        if (
          nativeId &&
          (existing.source === 'objectid' ||
            existing.source === 'x-gm-msgid') &&
          (existing.source !== nativeSource ||
            existing.providerMessageId !== nativeId)
        ) {
          throw Object.assign(
            new Error(
              'The IMAP native identity conflicts with its stored copy.',
            ),
            { code: 'IMAP_IDENTITY_CONFLICT' },
          );
        }
        // A verified location keeps its identity even if a native field is missing now.
        identity = {
          id: existing.providerMessageId,
          source: existing.source ?? 'locator',
        };
      } else if (nativeId && nativeSource) {
        if (sources.has(nativeId) && sources.get(nativeId) !== nativeSource) {
          throw Object.assign(
            new Error(
              'The IMAP identity source conflicts with a stored message.',
            ),
            { code: 'IMAP_IDENTITY_CONFLICT' },
          );
        }
        if (!sources.has(nativeId) || sources.get(nativeId) === nativeSource)
          identity = { id: nativeId, source: nativeSource };
      } else if (copy.rfcMessageId) {
        const id = copy.rfcMessageId;
        if (
          sources.has(id) &&
          sources.get(id) !== undefined &&
          sources.get(id) !== 'rfc-message-id'
        ) {
          throw Object.assign(
            new Error(
              'The IMAP identity source conflicts with a stored message.',
            ),
            { code: 'IMAP_IDENTITY_CONFLICT' },
          );
        }
        const claimer = claimed.get(id);
        if (
          claimer
            ? await this.sameRawCopies(claimer, copy, signal)
            : !sources.has(id) ||
              (sources.get(id) === 'rfc-message-id' &&
                (await this.matchesStoredCopy(id, copy, signal)))
        ) {
          identity = { id, source: 'rfc-message-id' };
          if (!claimer) claimed.set(id, copy);
        }
      }
      identity ??= {
        id: encodeCopyLocator(copy.tuple, locationId),
        source: 'locator',
      };
      this.copies.push({
        ...copy.tuple,
        observed: copy.observed,
        locationId,
        providerMessageId: identity.id,
        source: identity.source,
        read: copy.message.read,
        starred: copy.message.starred,
        receivedAt: copy.message.receivedAt,
      });
      messages.push({ ...copy.message, providerMessageId: identity.id });
    }
    return messages;
  }

  private nativeSource(): ImapIdSource | undefined {
    const capabilities = this.imapClient?.capabilities;
    if (capabilities?.has('OBJECTID')) return 'objectid';
    if (capabilities?.has('X-GM-EXT-1')) return 'x-gm-msgid';
    return undefined;
  }

  /** Compare a new copy with a verified copy already stored under this RFC Message-ID. */
  private async matchesStoredCopy(
    id: string,
    copy: FetchedCopy,
    signal?: AbortSignal,
  ): Promise<boolean> {
    for (const location of await this.locations!.listValidLocations(id)) {
      if (location.source !== 'rfc-message-id') return false;
      const stored = await this.openCopy(location, {
        size: true,
        bodyStructure: true,
      });
      if (!stored) continue;
      return this.sameRawCopies(
        {
          message: copy.message,
          tuple: location,
          structure: stored.bodyStructure,
          size: stored.size,
        },
        copy,
        signal,
      );
    }
    // A candidate that is gone, pending or unreadable cannot prove anything.
    return false;
  }

  private async sameRawCopies(
    left: FetchedCopy,
    right: FetchedCopy,
    signal?: AbortSignal,
  ): Promise<boolean> {
    const first = await this.rawCopy(left, signal);
    const second = first && (await this.rawCopy(right, signal));
    return Boolean(first && second && first.equals(second));
  }

  /** Complete raw MIME of one copy within the per-message and per-step budgets. */
  private async rawCopy(
    copy: Pick<FetchedCopy, 'tuple' | 'structure' | 'size'>,
    signal?: AbortSignal,
  ): Promise<Buffer | undefined> {
    const key = tupleKey(copy.tuple);
    if (this.rawCache.has(key)) return this.rawCache.get(key);
    let raw: Buffer | undefined;
    if (
      rawComparable(copy.structure, copy.size, MAX_IMAP_RAW_COMPARE_BYTES) &&
      copy.size! + 1 <= this.rawBudget
    ) {
      // The probe byte past the reported size is charged as well.
      this.rawBudget -= copy.size! + 1;
      try {
        const client = await this.imap();
        const mailbox = await client.mailboxOpen(copy.tuple.folder, {
          readOnly: true,
        });
        raw =
          String(mailbox.uidValidity) === copy.tuple.uidValidity
            ? await readRawSource(client, copy.tuple.uid, copy.size!, signal)
            : undefined;
      } catch (error) {
        const classified = classifyError(error, 'IMAP_READ_SOURCE');
        if (classified.retryable || classified.category === 'authentication')
          throw error;
        raw = undefined;
      }
    }
    this.rawCache.set(key, raw);
    return raw;
  }

  /**
   * Select a stored copy and confirm it is still the same message. Returns
   * undefined for a changed generation, a missing UID or another identity.
   */
  private async openCopy(
    location: ImapStoredLocation,
    query: FetchQueryObject,
    readOnly = true,
  ): Promise<FetchMessageObject | undefined> {
    try {
      const client = await this.imap();
      const mailbox = await client.mailboxOpen(location.folder, { readOnly });
      if (String(mailbox.uidValidity) !== location.uidValidity)
        return undefined;
      const message = await client.fetchOne(
        location.uid,
        { ...query, uid: true, envelope: true },
        { uid: true },
      );
      if (!message || message.uid !== location.uid) return undefined;
      const source = location.source ?? 'locator';
      if (source === 'objectid' || source === 'x-gm-msgid') {
        const currentSource = this.nativeSource();
        const nativeId = validNativeId(currentSource, message.emailId);
        // A UID cannot identify another message within the same UIDVALIDITY.
        // Missing native metadata preserves this previously verified tuple.
        return !nativeId ||
          (currentSource === source && nativeId === location.providerMessageId)
          ? message
          : undefined;
      }
      if (source === 'rfc-message-id')
        return message.envelope?.messageId === location.providerMessageId
          ? message
          : undefined;
      return source === 'locator' &&
        encodeCopyLocator(location, location.id) === location.providerMessageId
        ? message
        : undefined;
    } catch (error) {
      const classified = classifyError(error, 'IMAP_OPEN_COPY');
      if (classified.retryable || classified.category === 'authentication')
        throw error;
      return undefined;
    }
  }

  private copyChanged(): MailProviderResult<never> {
    return failure(
      'IMAP_MESSAGE_COPY_CHANGED',
      'An IMAP copy of this message changed. Synchronize the mailbox and try again.',
      'provider',
      false,
    );
  }

  /** Change one flag on every verified copy, committing each confirmed copy on its own. */
  private async updateCopyFlags(
    providerMessageId: string,
    flag: string,
    enabled: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    try {
      throwIfAborted(signal);
      const locations =
        await this.locations!.listValidLocations(providerMessageId);
      if (locations.length === 0)
        return failure(
          'IMAP_MESSAGE_NOT_FOUND',
          'No verified IMAP copy of this message is available.',
          'provider',
          false,
        );
      const client = await this.imap();
      for (const location of locations) {
        throwIfAborted(signal);
        if (!(await this.openCopy(location, { uid: true }, false)))
          return this.copyChanged();
        const uid = String(location.uid);
        const method = enabled ? 'messageFlagsAdd' : 'messageFlagsRemove';
        if (!(await client[method](uid, [flag], { uid: true })))
          throw new Error('The IMAP server did not update the message flags.');
        const confirmed = await client.fetchOne(
          uid,
          { uid: true, flags: true },
          { uid: true },
        );
        if (
          !confirmed ||
          confirmed.uid !== location.uid ||
          !confirmed.flags ||
          confirmed.flags.has(flag) !== enabled
        )
          throw new Error('The IMAP server did not confirm the message flags.');
        await this.locations!.commitFlags(
          location,
          flag === '\\Seen' ? { read: enabled } : { starred: enabled },
        );
      }
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: classifyError(error, 'IMAP_UPDATE_FLAGS') };
    }
  }

  /**
   * One complete pass over every selectable folder. It reconciles stored
   * copies, and two matching passes in a row authorize orphan cleanup.
   */
  private async verifyFolders(
    mailboxes: readonly ListResponse[],
    folders: Readonly<Record<string, ImapFolderCursor>>,
    previous: ImapVerifyState | undefined,
    signal?: AbortSignal,
  ): Promise<
    | { readonly done: boolean; readonly verify?: ImapVerifyState }
    | 'generation-changed'
  > {
    const attempts = (previous?.attempts ?? 0) + 1;
    const snapshot: Record<string, ImapVerifyFolder> = {};
    const present = new Map<string, Set<number>>();
    const excluded = new Set(previous?.excluded ?? []);
    const uncertainGenerations = new Set<string>();
    let stable = true;
    const known = await this.locations!.listKnownLocations();
    for (const mailbox of mailboxes) {
      throwIfAborted(signal);
      const client = await this.imap();
      const selected = await client.mailboxOpen(mailbox.path, {
        readOnly: true,
      });
      const state = await this.selectedFolderState(selected);
      const cursor = folders[mailbox.path];
      if (state.uidValidity !== cursor.uidValidity) return 'generation-changed';
      // New mail arrived after this page: import it before verifying again.
      if (state.uidNext !== cursor.uidNext) stable = false;
      let uids: number[] | false | undefined;
      try {
        uids = await client.search({ all: true }, { uid: true });
      } catch (error) {
        if (!isResponseLimitError(error)) throw error;
        // The UID list exceeds the protocol budget: keep every copy and skip cleanup.
        this.closeImap();
        this.verificationIncomplete = true;
        return { done: true, verify: { attempts, excluded: [...excluded] } };
      }
      if (!Array.isArray(uids))
        // Retry the step: an incomplete SEARCH proves nothing about missing copies.
        throw Object.assign(
          new Error(`Could not search ${mailbox.path} during verification.`),
          { code: 'IMAP_SEARCH_FAILED', serverResponseCode: 'UNAVAILABLE' },
        );
      if (
        uids.some(
          (uid) => !Number.isSafeInteger(uid) || uid < 1 || uid > 4294967295,
        )
      )
        throw new Error('Invalid UID in IMAP SEARCH.');
      present.set(mailbox.path, new Set(uids));
      snapshot[mailbox.path] = { ...state, uids: compressUids(uids) };
      if (
        Buffer.byteLength(JSON.stringify(snapshot)) >
        MAX_IMAP_VERIFY_STATE_BYTES
      ) {
        this.verificationIncomplete = true;
        return { done: true, verify: { attempts, excluded: [...excluded] } };
      }
      const bound = new Set(
        known
          .filter(
            (location) =>
              location.folder === mailbox.path &&
              location.uidValidity === state.uidValidity &&
              location.status === 'valid',
          )
          .map((location) => location.uid),
      );
      const unbound = uids.filter(
        (uid) =>
          !bound.has(uid) &&
          !excluded.has(
            tupleKey({
              folder: mailbox.path,
              uidValidity: state.uidValidity,
              uid,
            }),
          ),
      );
      if (unbound.length) {
        // Reconcile copies below the scan high-water mark, including old-date moves.
        const fetched = await this.fetchMessages(
          mailbox.path,
          state.uidValidity,
          unbound.slice(0, this.syncRun?.policy.batchSize ?? 100),
          signal,
        );
        const sources = await this.locations!.findMessageSources(
          fetched.flatMap((copy) => {
            const id =
              validNativeId(this.nativeSource(), copy.emailId) ??
              copy.rfcMessageId;
            return id ? [id] : [];
          }),
        );
        for (const copy of fetched) {
          const id =
            validNativeId(this.nativeSource(), copy.emailId) ??
            copy.rfcMessageId;
          const beforeImportDate =
            this.syncRun?.policy.receivedAfter &&
            copy.message.receivedAt &&
            Date.parse(copy.message.receivedAt) <
              Date.parse(this.syncRun.policy.receivedAfter);
          if (beforeImportDate && !copy.observed && (!id || !sources.has(id)))
            excluded.add(tupleKey(copy.tuple));
          else this.verificationCopies.push(copy);
        }
        stable = false;
      }
    }
    const after = this.selectableMailboxes(await this.listMailboxes());
    if (
      after.length !== mailboxes.length ||
      after.some((box) => !snapshot[box.path])
    )
      stable = false;
    for (const mailbox of after) {
      const selected = await (
        await this.imap()
      ).mailboxOpen(mailbox.path, { readOnly: true });
      const state = await this.selectedFolderState(selected);
      const rechecked = await (
        await this.imap()
      ).search({ all: true }, { uid: true });
      if (!Array.isArray(rechecked))
        throw new Error('The final IMAP SEARCH was incomplete.');
      if (compressUids(rechecked) !== snapshot[mailbox.path]?.uids)
        stable = false;
      if (
        state.uidValidity !== snapshot[mailbox.path]?.uidValidity ||
        state.uidNext !== snapshot[mailbox.path]?.uidNext
      )
        stable = false;
      if (state.uidValidity !== snapshot[mailbox.path]?.uidValidity)
        uncertainGenerations.add(mailbox.path);
    }
    const finalRange = this.selectableMailboxes(await this.listMailboxes());
    const finalPaths = new Set(finalRange.map((mailbox) => mailbox.path));
    if (
      finalPaths.size !== mailboxes.length ||
      mailboxes.some((mailbox) => !finalPaths.has(mailbox.path))
    )
      stable = false;
    for (const mailbox of finalRange) {
      const generation = mailbox.status?.uidValidity;
      const uidNext = mailbox.status?.uidNext;
      if (
        generation !== undefined &&
        String(generation) !== snapshot[mailbox.path]?.uidValidity
      ) {
        uncertainGenerations.add(mailbox.path);
        stable = false;
      }
      if (uidNext !== undefined && uidNext !== snapshot[mailbox.path]?.uidNext)
        stable = false;
    }
    for (const location of known) {
      if (
        this.verificationCopies.some(
          (copy) => tupleKey(copy.tuple) === tupleKey(location),
        )
      )
        continue;
      const uids = present.get(location.folder);
      const generation = snapshot[location.folder]?.uidValidity;
      const replaced =
        generation !== location.uidValidity &&
        (location.source === 'objectid' || location.source === 'x-gm-msgid') &&
        known.some(
          (copy) =>
            copy.messageId === location.messageId &&
            copy.source === location.source &&
            copy.providerMessageId === location.providerMessageId &&
            copy.status === 'valid' &&
            snapshot[copy.folder]?.uidValidity === copy.uidValidity &&
            present.get(copy.folder)?.has(copy.uid),
        );
      if (
        stable &&
        location.status === 'valid' &&
        location.source &&
        generation === location.uidValidity &&
        uids?.has(location.uid)
      ) {
        const observed = await this.openCopy(location, { flags: true });
        if (!observed?.flags)
          throw new Error(
            'The IMAP copy identity or flags changed during verification.',
          );
        this.copies.push({
          flagsOnly: true,
          locationId: location.id,
          observed: location,
          folder: location.folder,
          uidValidity: location.uidValidity,
          uid: location.uid,
          providerMessageId: location.providerMessageId,
          source: location.source,
          read: observed.flags.has('\\Seen'),
          starred: observed.flags.has('\\Flagged'),
        });
      }
      const next: Pick<ImapLocationChange, 'status' | 'reason'> =
        !finalPaths.has(location.folder)
          ? { status: 'pending', reason: 'folder-unavailable' }
          : uncertainGenerations.has(location.folder)
            ? { status: 'pending', reason: 'generation-changed' }
            : replaced && stable
              ? { status: 'invalid', reason: 'generation-replaced' }
              : !uids
                ? { status: 'pending', reason: 'folder-unavailable' }
                : generation !== location.uidValidity
                  ? { status: 'pending', reason: 'generation-changed' }
                  : uids.has(location.uid)
                    ? { status: 'valid' }
                    : { status: 'invalid', reason: 'uid-missing' };
      if (next.status !== 'valid' || next.status !== location.status)
        this.changes.push({ id: location.id, observed: location, ...next });
    }
    if (
      Buffer.byteLength(JSON.stringify({ snapshot, excluded: [...excluded] })) >
      MAX_IMAP_VERIFY_STATE_BYTES
    ) {
      this.verificationIncomplete = true;
      return { done: true, verify: { attempts } };
    }
    if (!stable) {
      if (attempts >= MAX_IMAP_VERIFY_ATTEMPTS) {
        this.verificationIncomplete = true;
        return { done: true, verify: { attempts, excluded: [...excluded] } };
      }
      return { done: false, verify: { attempts, excluded: [...excluded] } };
    }
    if (previous?.folders && sameSnapshot(previous.folders, snapshot)) {
      this.cleanup = true;
      return { done: true };
    }
    if (attempts >= MAX_IMAP_VERIFY_ATTEMPTS) {
      this.verificationIncomplete = true;
      return { done: true, verify: { attempts, excluded: [...excluded] } };
    }
    return {
      done: false,
      verify: { attempts, folders: snapshot, excluded: [...excluded] },
    };
  }

  private async normalizeMessage(
    folder: string,
    uidValidity: string,
    message: FetchMessageObject,
    signal?: AbortSignal,
    maxBodyBytes: number = MAX_IMAP_BODY_BYTES,
  ): Promise<NormalizedMailMessage> {
    const header = message.headers;
    if (
      !header ||
      header.byteLength > MAX_HEADER_BYTES ||
      !header.subarray(-4).equals(Buffer.from('\r\n\r\n'))
    ) {
      throw Object.assign(
        new Error(
          'The complete IMAP header could not be read within the header budget.',
        ),
        { code: 'IMAP_HEADER_INCOMPLETE' },
      );
    }
    const parsed = header
      ? await simpleParser(Buffer.concat([header, Buffer.from('\r\n\r\n')]), {
          skipHtmlToText: true,
          skipTextToHtml: true,
        })
      : undefined;
    const body = await readBody(
      await this.imap(),
      message.uid,
      bodyParts(message.bodyStructure),
      signal,
      maxBodyBytes,
    );
    const from = parsed
      ? addresses(parsed.from)[0]
      : envelopeAddress(message.envelope?.from?.[0]);
    const to = parsed
      ? addresses(parsed.to)
      : envelopeAddresses(message.envelope?.to);
    const cc = parsed
      ? addresses(parsed.cc)
      : envelopeAddresses(message.envelope?.cc);
    const bcc = parsed
      ? addresses(parsed.bcc)
      : envelopeAddresses(message.envelope?.bcc);
    const replyTo = parsed
      ? addresses(parsed.replyTo)
      : envelopeAddresses(message.envelope?.replyTo);
    const receivedAt = toIsoDate(message.internalDate ?? parsed?.date);
    const attachments = attachmentParts(message.bodyStructure).map(
      (part, index) =>
        attachmentMetadata(folder, uidValidity, message.uid, part, index),
    );
    const flags = message.flags ?? new Set<string>();
    const providerMessageId = encodeMessageLocator({
      folder,
      uidValidity,
      uid: message.uid,
    });
    const folderType =
      this.folderTypes.get(folder) ??
      (this.config.draftsFolder === folder
        ? 'drafts'
        : folderTypeFromPath(folder));
    return {
      providerMessageId,
      ...body,
      size: message.size,
      // Preserve the header value; mailparser can wrap malformed bare IDs in brackets.
      internetMessageId:
        /^message-id:[\t ]*([^\r\n]*(?:\r\n[\t ][^\r\n]*)*)\r\n/im.exec(
          header.toString('utf8'),
        )?.[1],
      providerFolderIds: [folder],
      from,
      to,
      cc,
      bcc,
      replyTo,
      inReplyTo: parsed?.inReplyTo ?? message.envelope?.inReplyTo,
      references: references(parsed?.references),
      subject: parsed?.subject ?? message.envelope?.subject ?? '',
      preview: preview(body.text),
      receivedAt,
      sentAt: receivedAt,
      read: flags.has('\\Seen'),
      starred: flags.has('\\Flagged'),
      draft: flags.has('\\Draft') || folderType === 'drafts',
      attachments,
    };
  }
}

interface FetchedCopy {
  readonly observed?: ImapStoredLocation;
  readonly message: NormalizedMailMessage;
  readonly tuple: ImapLocationTuple;
  readonly emailId?: string;
  readonly rfcMessageId?: string;
  readonly structure?: MessageStructureObject;
  readonly size?: number;
}

function tupleKey(tuple: ImapLocationTuple): string {
  return JSON.stringify([tuple.folder, tuple.uidValidity, tuple.uid]);
}

const MAX_UINT64 = 2n ** 64n - 1n;

/** The server's own object ID, never ImapFlow's synthesized message.id. */
function validNativeId(
  source: ImapIdSource | undefined,
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  if (source === 'objectid')
    return /^[A-Za-z0-9_-]{1,255}$/.test(value) ? value : undefined;
  if (source === 'x-gm-msgid')
    // Keep the decimal string: a JavaScript number would lose uint64 precision.
    return /^(0|[1-9]\d{0,19})$/.test(value) && BigInt(value) <= MAX_UINT64
      ? value
      : undefined;
  return undefined;
}

function validRfcMessageId(value: string | undefined): string | undefined {
  return value &&
    value.length <= MAX_IMAP_PROVIDER_ID_LENGTH &&
    /^<[\x21-\x3b\x3d\x3f-\x7e]+@[\x21-\x3b\x3d\x3f-\x7e]+>$/.test(value)
    ? value
    : undefined;
}

function sameSnapshot(
  left: Readonly<Record<string, ImapVerifyFolder>>,
  right: Readonly<Record<string, ImapVerifyFolder>>,
): boolean {
  const paths = Object.keys(right);
  return (
    Object.keys(left).length === paths.length &&
    paths.every(
      (path) =>
        left[path]?.uidValidity === right[path].uidValidity &&
        left[path].uidNext === right[path].uidNext &&
        left[path].uids === right[path].uids,
    )
  );
}

function isResponseLimitError(error: unknown): boolean {
  return ['LiteralTooLarge', 'ResponseTooLarge', 'LineTooLarge'].includes(
    (error as { code?: string } | undefined)?.code ?? '',
  );
}

/** ImapFlow 2.2.10's command primitive keeps the verb explicitly scoped to a UID. */
async function expungeUid(client: ImapFlow, uid: number): Promise<void> {
  const connection = client as ImapFlow & {
    exec(
      command: 'UID EXPUNGE',
      attributes: { readonly type: 'SEQUENCE'; readonly value: string }[],
    ): Promise<{ next(): void }>;
  };
  const response = await connection.exec('UID EXPUNGE', [
    { type: 'SEQUENCE', value: String(uid) },
  ]);
  response.next();
}

/** Parse only the exact one-UID mapping requested by this operation. Never infer a destination UID. */
async function transferUid(
  client: ImapFlow,
  uid: number,
  folder: string,
  native: boolean,
): Promise<ImapLocationTuple | undefined> {
  type Response = { attributes?: { section?: { value?: unknown }[] }[] };
  const connection = client as ImapFlow & {
    exec(
      command: string,
      attributes: { type: string; value: string }[],
      options: {
        untagged: { OK(response: Response): Promise<void> };
      },
    ): Promise<{ next(): void; response: Response }>;
  };
  let mapping: ImapLocationTuple | undefined;
  let invalid = false;
  const parse = (response: Response): void => {
    const section = response.attributes?.[0]?.section;
    if (section?.[0]?.value !== 'COPYUID') return;
    const single = (value: unknown): number | undefined => {
      if (
        typeof value !== 'string' ||
        !/^[1-9]\d{0,9}(?::[1-9]\d{0,9})?$/.test(value)
      )
        return undefined;
      const [first, last = first] = value.split(':').map(Number);
      return first === last && first <= 0xffffffff ? first : undefined;
    };
    const validityValue = section[1]?.value;
    const validity =
      typeof validityValue === 'string' && /^[1-9]\d{0,9}$/.test(validityValue)
        ? single(validityValue)
        : undefined;
    const source = single(section[2]?.value);
    const destination = single(section[3]?.value);
    if (!validity || source !== uid || !destination) {
      invalid = true;
      return;
    }
    const tuple = { folder, uidValidity: String(validity), uid: destination };
    if (mapping && tupleKey(mapping) !== tupleKey(tuple)) invalid = true;
    mapping = tuple;
  };
  // No library-level MOVE/COPY emulation can run through this fixed command primitive.
  let result;
  try {
    result = await connection.exec(
      native ? 'UID MOVE' : 'UID COPY',
      [
        { type: 'SEQUENCE', value: String(uid) },
        { type: 'ATOM', value: encodePath(client, folder) },
      ],
      {
        untagged: {
          OK: async (response) => {
            parse(response);
          },
        },
      },
    );
  } catch (error) {
    const failure = error as {
      responseStatus?: string;
      imapCopyRejected?: boolean;
    };
    if (!native && ['NO', 'BAD'].includes(failure.responseStatus ?? ''))
      failure.imapCopyRejected = true;
    throw error;
  }
  result.next();
  parse(result.response);
  return invalid ? undefined : mapping;
}
