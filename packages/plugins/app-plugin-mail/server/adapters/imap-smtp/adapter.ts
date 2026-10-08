import {
  ImapFlow,
  type FetchMessageObject,
  type ListResponse,
  type MailboxObject,
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
  metadataQuery,
  attachmentMetadata,
} from './content.js';

import type {
  MailAttachmentContent,
  MailProviderError,
  MailProviderResult,
  MailSyncCursor,
} from '../../../shared/mail.js';
import type {
  MailProviderAdapter,
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
  ImapFolderCursor,
  ImapSmtpCredential,
  ImapSyncCursor,
} from './types.js';
import type { ImapSmtpMailProviderConfig } from './config.js';
import {
  IMAP_SMTP_CAPABILITIES,
  MAX_IMAP_BODY_BYTES,
  MAX_IMAP_DETAIL_BODY_BYTES,
} from './constants.js';
import { createImapClient, createSmtpTransport } from './connection.js';
import {
  encodeHistoryCursor,
  encodeMessageLocator,
  folderCursor,
  parseHistoryCursor,
  parseMessageLocator,
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

  public constructor(
    _context: MailProviderContext,
    private readonly config: ImapSmtpMailProviderConfig,
    account: MailProviderAccount,
    private readonly credential: ImapSmtpCredential,
  ) {
    this.identity = account.provider;
    this.smtpTransport = createSmtpTransport(config.smtp, credential);
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
      const messages: NormalizedMailMessage[] = [];
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
        for (const message of await this.fetchMessages(
          folder,
          String(mailbox.uidValidity),
          selected,
          input.signal,
        )) {
          if (
            input.receivedAfter &&
            message.receivedAt &&
            Date.parse(message.receivedAt) < Date.parse(input.receivedAfter)
          ) {
            continue;
          }
          messages.push(message);
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
          messages,
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
      const messages: NormalizedMailMessage[] = [];
      const deletedProviderMessageIds = new Set<string>();
      const knownByFolder = new Map<string, Set<string>>();
      for (const providerMessageId of input.knownProviderMessageIds ?? []) {
        const locator = parseMessageLocator(providerMessageId);
        if (!locator) continue;
        const known = knownByFolder.get(locator.folder) ?? new Set<string>();
        known.add(providerMessageId);
        knownByFolder.set(locator.folder, known);
      }
      let hasMore = false;
      const limit = Math.max(1, input.limit);

      for (const mailbox of mailboxes) {
        throwIfAborted(input.signal);
        const current = await this.folderState(mailbox.path, mailbox);
        const old = previous.folders[mailbox.path];
        if (old && old.uidValidity !== current.uidValidity) {
          return {
            ok: false,
            error: {
              code: 'IMAP_SYNC_CURSOR_INVALID',
              message: `The IMAP UIDVALIDITY changed for ${mailbox.path}.`,
              category: 'provider',
              retryable: false,
            },
          };
        }
        const start = old?.uidNext ?? 1;
        const canFetch = messages.length < limit;
        const end = canFetch
          ? Math.min(current.uidNext - 1, start + limit - messages.length - 1)
          : start - 1;
        let nextUid = old?.uidNext ?? 1;
        const knownIds = knownByFolder.get(mailbox.path);
        if (start <= end || knownIds?.size) {
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
          if (knownIds?.size) {
            const result = await client.search({ all: true }, { uid: true });
            if (!Array.isArray(result))
              return failure(
                'IMAP_SEARCH_FAILED',
                `Could not search ${mailbox.path} while reconciling deleted messages.`,
                'provider',
                true,
              );
            const presentIds = new Set(
              result.map((uid) =>
                encodeMessageLocator({
                  folder: mailbox.path,
                  uidValidity: current.uidValidity,
                  uid,
                }),
              ),
            );
            for (const providerMessageId of knownIds) {
              if (!presentIds.has(providerMessageId)) {
                deletedProviderMessageIds.add(providerMessageId);
              }
            }
          }
          if (start <= end) {
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
      return {
        ok: true,
        value: {
          messages,
          deletedProviderMessageIds: [...deletedProviderMessageIds],
          nextCursor: syncCursor({ version: 1, folders: nextFolders }),
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
    _providerMessageId: string,
    providerAttachmentId: string,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<MailAttachmentContent>> {
    try {
      throwIfAborted(signal);
      const locator = requireAttachmentLocator(providerAttachmentId);
      const selected = await (
        await this.imap()
      ).mailboxOpen(locator.folder, { readOnly: true });
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
        { uid: true, bodyStructure: true },
        { uid: true },
      );
      const part =
        message && attachmentParts(message.bodyStructure)[locator.attachment];
      if (!part)
        return failure(
          'IMAP_ATTACHMENT_NOT_FOUND',
          'IMAP attachment was not found.',
          'provider',
          false,
        );
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
    return this.updateFlags(providerMessageId, '\\Seen', read, signal);
  }

  public async setStarred(
    providerMessageId: string,
    starred: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
    return this.updateFlags(providerMessageId, '\\Flagged', starred, signal);
  }

  public async deleteMessage(
    providerMessageId: string,
    permanently: boolean,
    signal?: AbortSignal,
  ): Promise<MailProviderResult<void>> {
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
      const locator = requireMessageLocator(providerMessageId);
      const client = await this.imap();
      await client.mailboxOpen(locator.folder);
      await client.messageDelete(locator.uid, { uid: true });
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

  private async imap(): Promise<ImapFlow> {
    if (this.imapClient) return this.imapClient;
    const client = createImapClient(this.config.imap, this.credential);
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
  ): Promise<NormalizedMailMessage[]> {
    if (uids.length === 0) return [];
    const metadata: FetchMessageObject[] = [];
    const client = await this.imap();
    // Finish FETCH before issuing more IMAP commands: nested downloads deadlock.
    for await (const message of client.fetch(uids, metadataQuery(), {
      uid: true,
    })) {
      throwIfAborted(signal);
      metadata.push(message);
    }
    const messages: NormalizedMailMessage[] = [];
    for (const message of metadata) {
      throwIfAborted(signal);
      messages.push(
        await this.normalizeMessage(folder, uidValidity, message, signal),
      );
    }
    return messages;
  }

  private async normalizeMessage(
    folder: string,
    uidValidity: string,
    message: FetchMessageObject,
    signal?: AbortSignal,
    maxBodyBytes: number = MAX_IMAP_BODY_BYTES,
  ): Promise<NormalizedMailMessage> {
    const header = message.headers?.subarray(0, 64 * 1024);
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
      internetMessageId: parsed?.messageId ?? message.envelope?.messageId,
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
