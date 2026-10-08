import {
  writePendingDelivery,
  clearPendingDelivery,
} from '../lib/mail-pending-delivery.js';
import { ApiClientError, resolveAppUrl } from '@nocobase/app-client';
import { uploadedImageContentId } from '../../shared/inline-images.js';
import type { Dispatch, SetStateAction, RefObject } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildComposerInput,
  buildDraftComposerInput,
  clearComposerRecovery,
  composerFingerprint,
  findProviderCapabilities,
  parseAddressList,
  readComposerRecovery,
  replaceComposerSignature,
  writeComposerRecovery,
  type ComposerRecoverySnapshot,
} from '../lib/mail-composer-state.js';
import type {
  ComposerState,
  MailComposerProps,
} from '../contracts/composer.js';
import {
  mailErrorMessage,
  type MailBulkComposeInput,
  type MailIdentity,
  type MailMessage,
  type MailOutboundAttachmentView,
  type MailSignature,
  type MailTemplate,
} from '../mail-client.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { useMailClient } from '../runtime.js';
const AUTO_SAVE_DELAY_MS = 2_000;
const AUTO_SAVE_MAX_WAIT_MS = 10_000;
export function useMailComposer({
  request,
  allowBulkSend = false,
  senderSelection,
  accounts,
  providers,
  onClose,
  onComplete,
}: MailComposerProps): MailComposerController {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const mail = useMailClient();
  const [error, setError] = useState<string>();

  const [initialRecovery] = useState(() =>
    request.value.mode === 'new'
      ? readComposerRecovery(request.accountId)
      : undefined,
  );
  const [composer, setComposer] = useState<ComposerState | undefined>(
    request.value,
  );
  const composerAccountId = request.accountId;
  const [composerIdentities, setComposerIdentities] = useState<
    readonly MailIdentity[]
  >([]);
  const [localIdentityId, setLocalIdentityId] = useState('');
  const identityId = senderSelection?.identityId ?? localIdentityId;
  const setIdentityId = (id: string): void => {
    if (senderSelection) senderSelection.onChange(composerAccountId, id);
    else setLocalIdentityId(id);
  };
  const [ccVisible, setCcVisible] = useState(Boolean(request.value.cc.trim()));
  const [bccVisible, setBccVisible] = useState(
    Boolean(request.value.bcc.trim()),
  );
  const [scheduleEnabled, setScheduleEnabled] = useState(
    Boolean(request.value.scheduledAt),
  );
  const [signatures, setSignatures] = useState<readonly MailSignature[]>([]);
  const [signatureId, setSignatureId] = useState(
    initialRecovery?.signatureId ?? '',
  );
  const [sending, setSending] = useState(false);

  const [autoSaving, setAutoSaving] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'failed'
  >('idle');
  const [recoveryOffer, setRecoveryOffer] = useState<
    ComposerRecoverySnapshot | undefined
  >(initialRecovery);
  const [templates, setTemplates] = useState<readonly MailTemplate[]>([]);
  const [uploading, setUploading] = useState(false);
  const [composeAttachments, setComposeAttachments] = useState<
    readonly MailOutboundAttachmentView[]
  >(request.uploads ?? []);
  const [retainedAttachments, setRetainedAttachments] = useState<
    ReadonlyArray<MailMessage['attachments'][number]>
  >(request.attachments);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const draftMessageIdRef = useRef<string | undefined>(
    request.value.draftMessageId,
  );
  const [lastSavedFingerprint, setLastSavedFingerprint] = useState<
    string | undefined
  >(() => composerFingerprint(request.value, '', '', [], request.attachments));
  const failedFingerprintRef = useRef<string | undefined>(undefined);
  const composerSessionRef = useRef(0);
  const pendingSaveRef = useRef<Promise<MailMessage> | undefined>(undefined);
  const [initialDraftKey] = useState(
    () => initialRecovery?.draftKey ?? crypto.randomUUID(),
  );
  const draftKeyRef = useRef(initialDraftKey);
  const draftRevisionRef = useRef(
    initialRecovery?.draftRevision ?? request.value.draftRevision ?? 0,
  );
  const dirtySinceRef = useRef<number | undefined>(undefined);
  const endingRef = useRef(false);
  const copiedAttachmentsRef = useRef(new Map<string, string>());
  const requestError = useCallback(
    (cause: unknown): void => {
      setError(
        mailErrorMessage(
          cause,
          t('errors.requestFailed', { defaultValue: 'Mail request failed.' }),
        ),
      );
    },
    [t],
  );
  const composerAccount = accounts.find(
    (account) => account.id === composerAccountId,
  );
  const composerProviderCapabilities = findProviderCapabilities(
    composerAccount,
    providers,
  );
  const sendableComposerIdentities = composerIdentities.filter(
    (identity) => identity.canSend,
  );
  const composerCanSend = Boolean(
    composerAccount?.status === 'active' && composerProviderCapabilities?.send,
  );
  const composerCanDraft = Boolean(
    composerAccount?.status === 'active' && composerProviderCapabilities?.send,
  );
  useEffect(() => {
    let active = true;
    const next = request.value;
    const existingAttachments = request.attachments;
    const targetAccountId = request.accountId;
    const recovery = initialRecovery;
    void mail.listTemplates().then(
      (items) => {
        if (active) setTemplates(items);
      },
      (cause: unknown) => {
        if (active) requestError(cause);
      },
    );
    void mail.listSignatures(targetAccountId).then(
      (items) => {
        if (!active) return;
        setSignatures(items);
        const nextSignatureId = resolveSignatureSelection(
          recovery?.signatureId,
          items,
        );
        setSignatureId(nextSignatureId);
        if (next.mode !== 'edit' && !next.text.trim() && !next.html.trim()) {
          setComposer((current) =>
            current
              ? replaceComposerSignature(current, items, nextSignatureId)
              : current,
          );
        }
      },
      (cause: unknown) => {
        if (active) requestError(cause);
      },
    );
    void mail.listIdentities(targetAccountId).then(
      (items) => {
        if (!active) return;
        setComposerIdentities(items);
        const nextIdentityId =
          items.find(
            (identity) =>
              identity.canSend && identity.id === recovery?.identityId,
          )?.id ??
          items.find(
            (identity) =>
              identity.canSend &&
              identity.address.toLowerCase() ===
                next.fromAddress?.toLowerCase(),
          )?.id ??
          items.find((identity) => identity.isPrimary && identity.canSend)
            ?.id ??
          items.find((identity) => identity.canSend)?.id ??
          '';
        setLocalIdentityId(nextIdentityId);
        if (!recovery) {
          setLastSavedFingerprint(
            composerFingerprint(
              next,
              nextIdentityId,
              '',
              [],
              existingAttachments,
            ),
          );
        }
      },
      (cause: unknown) => {
        if (active) requestError(cause);
      },
    );
    return () => {
      active = false;
      composerSessionRef.current += 1;
    };
  }, [initialRecovery, mail, request, requestError]);
  const persistDraft = useCallback(
    (
      snapshot: ComposerState,
      uploads: readonly MailOutboundAttachmentView[],
      retained: MailMessage['attachments'],
    ): Promise<MailMessage> => {
      const revision = ++draftRevisionRef.current;
      const pending = (pendingSaveRef.current ?? Promise.resolve())
        .catch(() => undefined)
        .then(() =>
          mail.saveDraft({
            ...buildDraftComposerInput(
              composerAccountId,
              identityId,
              signatureId,
              {
                ...snapshot,
                draftMessageId:
                  draftMessageIdRef.current ?? snapshot.draftMessageId,
              },
              uploads,
              retained,
            ),
            draftKey: draftKeyRef.current,
            draftRevision: revision,
            idempotencyKey: draftKeyRef.current,
          }),
        )
        .then((draft) => {
          draftMessageIdRef.current = draft.id;
          if (draft.draftRevision !== undefined) {
            draftRevisionRef.current = Math.max(
              draftRevisionRef.current,
              draft.draftRevision,
            );
            if (draft.draftRevision !== revision) {
              // A stale write returns the current stored draft. It does not
              // acknowledge this snapshot; the next save uses a newer revision.
              throw new Error('The draft snapshot was not persisted.');
            }
          }
          return draft;
        })
        .catch(async (error: unknown) => {
          const id = draftMessageIdRef.current;
          if (id && !endingRef.current) {
            const current = await mail
              .getMessage(composerAccountId, id)
              .catch(() => undefined);
            if (current?.draftRevision !== undefined)
              draftRevisionRef.current = Math.max(
                draftRevisionRef.current,
                current.draftRevision,
              );
          }
          throw error;
        });
      pendingSaveRef.current = pending;
      return pending;
    },
    [mail, composerAccountId, identityId, signatureId],
  );

  const closeComposer = (sent = false): void => {
    if (!sent && (sending || uploading)) return;
    endingRef.current = true;
    if (!sent && composer && composerHasContent && composerCanDraft) {
      const snapshot = composer;
      void persistDraft(snapshot, composeAttachments, retainedAttachments)
        .then((draft) => {
          const recovery = readComposerRecovery(composerAccountId);
          if (recovery?.draftKey !== draftKeyRef.current) return;
          writeComposerRecovery({
            ...recovery,
            draftRevision: draft.draftRevision ?? draftRevisionRef.current,
            composer: { ...recovery.composer, draftMessageId: draft.id },
          });
        })
        .catch(() => {
          /* Recovery stays available when the background save fails. */
        });
    }
    if (sent) clearComposerRecovery(composerAccountId);
    composerSessionRef.current += 1;
    setComposer(undefined);
    onClose();
  };

  const sendComposer = (mode: 'normal' | 'bulk' = 'normal'): void => {
    if (
      !composer ||
      !composerAccountId ||
      !identityId ||
      !composerCanSend ||
      sending ||
      uploading ||
      (mode === 'bulk' && !allowBulkSend)
    )
      return;
    const to = parseAddressList(composer.to);
    if (to.length === 0) {
      setError(
        t('workspace.recipientRequired', {
          defaultValue: 'Add at least one recipient.',
        }),
      );
      return;
    }
    if (
      !composer.text.trim() &&
      !/<img\b/iu.test(composer.html) &&
      !composer.forwardQuote?.text.trim() &&
      !composer.forwardQuote?.html.trim()
    ) {
      setError(
        t('workspace.messageRequired', {
          defaultValue: 'Add a message body.',
        }),
      );
      return;
    }
    if (scheduleEnabled && !composer.scheduledAt) {
      setError(
        t('workspace.scheduledAtRequired', {
          defaultValue: 'Choose a send time.',
        }),
      );
      return;
    }
    const seenRecipients = new Set<string>();
    const recipients = to.filter((recipient) => {
      const address = recipient.address.toLowerCase();
      if (seenRecipients.has(address)) return false;
      seenRecipients.add(address);
      return true;
    });
    if (mode === 'bulk') {
      if (composer.cc.trim() || composer.bcc.trim()) {
        setError(
          t('dev.sendHub.bulkNoCopies', {
            defaultValue:
              'Separate sending does not support Cc or Bcc. Clear them to send separately.',
          }),
        );
        return;
      }
      if (
        recipients.some(
          (recipient) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(recipient.address),
        )
      ) {
        setError(
          t('dev.bulkSend.invalidRecipient', {
            defaultValue:
              'Remove or correct invalid recipient addresses first.',
          }),
        );
        return;
      }
      if (recipients.length > 100) {
        setError(
          t('dev.bulkSend.tooManyRecipients', {
            defaultValue: 'Bulk sending supports at most 100 recipients.',
          }),
        );
        return;
      }
    }
    if (
      !composer.subject.trim() &&
      !window.confirm(
        t('workspace.emptySubjectConfirm', {
          defaultValue: 'Send this message without a subject?',
        }),
      )
    )
      return;
    endingRef.current = true;
    setSending(true);
    setError(undefined);
    let input = buildComposerInput(
      composerAccountId,
      identityId,
      signatureId,
      composer,
      composeAttachments,
      retainedAttachments,
    );
    let submitted = false;
    const sendBulk = async () => {
      // Each recipient must own its delivery; sending the shared provider draft
      // would consume it on the first message and break the rest of the batch.
      const attachmentIds = [...(input.attachmentIds ?? [])];
      for (const attachment of retainedAttachments) {
        const cachedId =
          attachment.outboundAttachmentId ??
          copiedAttachmentsRef.current.get(attachment.id);
        if (cachedId) {
          attachmentIds.push(cachedId);
          continue;
        }
        const stream = await mail.downloadAttachment(
          composerAccountId,
          input.draftMessageId ?? attachment.messageId,
          attachment.id,
        );
        const blob = await new Response(stream).blob();
        const uploaded = await mail.uploadAttachment(
          new File([blob], attachment.fileName, {
            type: attachment.contentType,
          }),
        );
        copiedAttachmentsRef.current.set(attachment.id, uploaded.id);
        attachmentIds.push(uploaded.id);
      }
      const bulkInput: Omit<MailBulkComposeInput, 'idempotencyKey'> = {
        accountId: input.accountId,
        identityId: input.identityId,
        signatureId: input.signatureId,
        recipients,
        subject: input.subject,
        text: input.text,
        html: input.html,
        attachmentIds: [...new Set(attachmentIds)],
        scheduledAt: input.scheduledAt,
        sourceDraftMessageId: input.draftMessageId,
        draftKey: draftKeyRef.current,
        inReplyToMessageId: input.inReplyToMessageId,
        forwardOfMessageId: input.forwardOfMessageId,
        forwardBodyIncluded: input.forwardBodyIncluded,
      };
      const wire = { ...bulkInput, idempotencyKey: input.idempotencyKey };
      writePendingDelivery({
        accountId: composerAccountId,
        mode: 'bulk',
        input: wire,
      });
      submitted = true;
      return mail.sendBulk(wire);
    };
    const sendSingle = () => {
      writePendingDelivery({
        accountId: composerAccountId,
        mode: 'normal',
        input,
      });
      submitted = true;
      return mail.sendMessage(input).then((result) => [result]);
    };

    const operation = (async () => {
      // The stable key lets the server consume a draft even while its first
      // autosave is in flight. Sending never waits for autosave completion.
      input = {
        ...input,
        draftMessageId: draftMessageIdRef.current ?? input.draftMessageId,
        draftKey: draftKeyRef.current,
      };
      return mode === 'bulk' ? sendBulk() : sendSingle();
    })();
    void operation
      .then((results) => {
        const rejectedRecipients = results.flatMap(
          (result) => result.error?.recipients?.rejected ?? [],
        );
        const operationError = results.find((result) => result.error)?.error;
        const outcome = results.some((result) => result.status === 'unknown')
          ? 'unknown'
          : results.some((result) => result.status === 'failed')
            ? 'failed'
            : rejectedRecipients.length > 0
              ? 'partial'
              : 'accepted';
        clearPendingDelivery(composerAccountId, input.idempotencyKey);
        closeComposer(true);
        onComplete(
          outcome === 'accepted' && input.scheduledAt ? 'scheduled' : outcome,
          rejectedRecipients,
          operationError,
        );
      })
      .catch((error: unknown) => {
        if (
          !submitted ||
          (error instanceof ApiClientError &&
            [400, 401, 403, 404, 422].includes(error.status))
        ) {
          clearPendingDelivery(composerAccountId, input.idempotencyKey);
          endingRef.current = false;
          requestError(error);
          return;
        }
        // A transport failure is not evidence of non-delivery. Keep the outgoing
        // snapshot in sending records, never restore it as an editable draft.
        closeComposer(true);
        onComplete('unknown');
      })
      .finally(() => setSending(false));
  };

  const uploadInlineImage = async (
    file: File,
  ): Promise<{ cid: string; src: string }> => {
    if (!/^image\/(?:png|jpeg|gif|webp)$/iu.test(file.type)) {
      const error = new Error(t('workspace.invalidImageType'));
      requestError(error);
      throw error;
    }
    setUploading(true);
    setError(undefined);
    try {
      const attachment = await mail.uploadAttachment(file);
      setComposeAttachments((current) => [...current, attachment]);
      return {
        cid: `cid:${uploadedImageContentId(attachment.id)}`,
        src: resolveAppUrl(
          `/api/mail/attachments/${encodeURIComponent(attachment.id)}`,
        ),
      };
    } catch (error) {
      requestError(error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const uploadComposerAttachments = (files: FileList | null): void => {
    if (!files?.length || uploading) return;
    setUploading(true);
    setError(undefined);
    void Promise.all([...files].map((file) => mail.uploadAttachment(file)))
      .then((uploaded) =>
        setComposeAttachments((current) => [...current, ...uploaded]),
      )
      .catch(requestError)
      .finally(() => {
        setUploading(false);
        if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      });
  };

  const currentComposerFingerprint = composer
    ? composerFingerprint(
        composer,
        identityId,
        signatureId,
        composeAttachments,
        retainedAttachments,
      )
    : undefined;
  const composerHasContent = Boolean(
    composer &&
    (composer.to.trim() ||
      composer.cc.trim() ||
      composer.bcc.trim() ||
      composer.subject.trim() ||
      composer.text.trim() ||
      /<img\b/iu.test(composer.html) ||
      composer.scheduledAt ||
      composeAttachments.length ||
      retainedAttachments.length),
  );
  const composerHasRequiredContent = Boolean(
    composer &&
    (composer.text.trim() ||
      /<img\b/iu.test(composer.html) ||
      composer.forwardQuote?.text.trim() ||
      composer.forwardQuote?.html.trim()) &&
    (!scheduleEnabled || composer.scheduledAt),
  );
  const composerHasUnsavedChanges = Boolean(
    composer &&
    (currentComposerFingerprint !== lastSavedFingerprint ||
      composer.scheduledAt),
  );

  useEffect(() => {
    if (!composer || !composerAccountId || !currentComposerFingerprint) return;
    if (recoveryOffer) return;
    if (!composerHasContent && !composer.draftMessageId) {
      clearComposerRecovery(composerAccountId);
      return;
    }
    writeComposerRecovery({
      version: 1,
      accountId: composerAccountId,
      identityId,
      signatureId,
      composer,
      composeAttachments,
      retainedAttachments,
      savedFingerprint: lastSavedFingerprint,
      draftKey: draftKeyRef.current,
      draftRevision: draftRevisionRef.current,
    });
  }, [
    composeAttachments,
    composerAccountId,
    composer,
    composerHasContent,
    currentComposerFingerprint,
    draftSaveStatus,
    identityId,
    signatureId,
    lastSavedFingerprint,
    recoveryOffer,
    retainedAttachments,
  ]);

  const latestComposerFingerprintRef = useRef(currentComposerFingerprint);
  useEffect(() => {
    latestComposerFingerprintRef.current = currentComposerFingerprint;
  }, [currentComposerFingerprint]);

  const saveComposer = useCallback(
    (closeAfterSave = false): void => {
      if (
        !composer ||
        endingRef.current ||
        !composerAccountId ||
        !identityId ||
        !composerCanDraft ||
        recoveryOffer ||
        sending ||
        uploading ||
        autoSaving
      )
        return;
      const session = composerSessionRef.current;
      const snapshot = composer;
      const fingerprint = currentComposerFingerprint;
      dirtySinceRef.current = undefined;
      setAutoSaving(true);
      setDraftSaveStatus('saving');
      void persistDraft(snapshot, composeAttachments, retainedAttachments)
        .then((draft) => {
          if (composerSessionRef.current !== session || endingRef.current)
            return;
          setLastSavedFingerprint(fingerprint);
          failedFingerprintRef.current = undefined;
          setComposer((current) =>
            current
              ? {
                  ...current,
                  draftMessageId: draft.id,
                  draftConflict: undefined,
                }
              : current,
          );
          setDraftSaveStatus('saved');
          if (
            closeAfterSave &&
            latestComposerFingerprintRef.current === fingerprint
          ) {
            endingRef.current = true;
            clearComposerRecovery(composerAccountId);
            composerSessionRef.current += 1;
            setComposer(undefined);
            onClose();
            onComplete('draft');
          }
        })
        .catch(() => {
          if (composerSessionRef.current !== session || endingRef.current)
            return;
          failedFingerprintRef.current = fingerprint;
          setDraftSaveStatus('failed');
        })
        .finally(() => {
          if (composerSessionRef.current === session) setAutoSaving(false);
        });
    },
    [
      onClose,
      onComplete,
      composer,
      composerAccountId,
      identityId,
      composerCanDraft,
      recoveryOffer,
      sending,
      uploading,
      autoSaving,
      currentComposerFingerprint,
      persistDraft,
      composeAttachments,
      retainedAttachments,
    ],
  );

  useEffect(() => {
    if (
      !composer ||
      endingRef.current ||
      !composerAccountId ||
      !identityId ||
      !composerCanDraft ||
      recoveryOffer ||
      sending ||
      uploading
    )
      return;
    if (
      (!composerHasContent && !composer.draftMessageId) ||
      currentComposerFingerprint === lastSavedFingerprint
    ) {
      dirtySinceRef.current = undefined;
      return;
    }
    dirtySinceRef.current ??= Date.now();
    if (autoSaving) return;
    const fingerprint = currentComposerFingerprint;
    const retrying = failedFingerprintRef.current === fingerprint;
    const delay = retrying
      ? AUTO_SAVE_MAX_WAIT_MS
      : Math.max(
          0,
          Math.min(
            AUTO_SAVE_DELAY_MS,
            AUTO_SAVE_MAX_WAIT_MS - (Date.now() - dirtySinceRef.current),
          ),
        );
    const timer = window.setTimeout(() => {
      if (endingRef.current) return;
      saveComposer();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    saveComposer,
    persistDraft,
    autoSaving,
    composeAttachments,
    composerAccountId,
    composer,
    composerHasContent,
    currentComposerFingerprint,
    composerCanDraft,
    identityId,
    signatureId,
    lastSavedFingerprint,
    recoveryOffer,
    mail,
    retainedAttachments,
    sending,
    uploading,
  ]);

  const restoreDraft = (): void => {
    if (!recoveryOffer || sending || autoSaving || uploading) return;

    composerSessionRef.current += 1;
    draftMessageIdRef.current = recoveryOffer.composer.draftMessageId;
    setLastSavedFingerprint(recoveryOffer.savedFingerprint);
    setComposer(recoveryOffer.composer);
    draftKeyRef.current = recoveryOffer.draftKey ?? draftKeyRef.current;
    draftRevisionRef.current =
      recoveryOffer.draftRevision ?? draftRevisionRef.current;
    setIdentityId(recoveryOffer.identityId);
    setSignatureId(
      resolveSignatureSelection(recoveryOffer.signatureId, signatures),
    );
    setCcVisible(Boolean(recoveryOffer.composer.cc.trim()));
    setBccVisible(Boolean(recoveryOffer.composer.bcc.trim()));
    setScheduleEnabled(Boolean(recoveryOffer.composer.scheduledAt));
    setComposeAttachments(recoveryOffer.composeAttachments);
    setRetainedAttachments(recoveryOffer.retainedAttachments);
    setRecoveryOffer(undefined);
  };
  const discardRecovery = (): void => {
    clearComposerRecovery(composerAccountId);
    setLastSavedFingerprint(currentComposerFingerprint);
    setRecoveryOffer(undefined);
  };

  return {
    restoreDraft,
    discardRecovery,
    t,
    error,
    composer,
    setComposer,
    composerAccountId,
    identityId,
    setIdentityId,
    ccVisible,
    setCcVisible,
    bccVisible,
    setBccVisible,
    scheduleEnabled,
    setScheduleEnabled,
    signatures,
    signatureId,
    setSignatureId,
    sending,
    autoSaving,
    draftSaveStatus,
    setDraftSaveStatus,
    recoveryOffer,
    templates,
    uploading,
    composeAttachments,
    setComposeAttachments,
    retainedAttachments,
    setRetainedAttachments,
    attachmentInputRef,
    sendableComposerIdentities,
    composerCanSend,
    composerCanDraft,
    closeComposer,
    saveComposer,
    sendComposer,
    uploadComposerAttachments,
    uploadInlineImage,
    composerHasRequiredContent,
    composerHasUnsavedChanges,
  };
}

function resolveSignatureSelection(
  signatureId: string | undefined,
  signatures: readonly MailSignature[],
): string {
  if (signatureId === '__none__') return signatureId;
  if (
    signatureId &&
    signatures.some((signature) => signature.id === signatureId)
  )
    return signatureId;
  return signatures.some((signature) => signature.isDefault) ? '' : '__none__';
}

export interface MailComposerController {
  readonly restoreDraft: () => void;
  readonly discardRecovery: () => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
  readonly error: string | undefined;
  readonly composer: ComposerState | undefined;
  readonly setComposer: Dispatch<SetStateAction<ComposerState | undefined>>;
  readonly composerAccountId: string;
  readonly identityId: string;
  readonly setIdentityId: (id: string) => void;
  readonly ccVisible: boolean;
  readonly setCcVisible: Dispatch<SetStateAction<boolean>>;
  readonly bccVisible: boolean;
  readonly setBccVisible: Dispatch<SetStateAction<boolean>>;
  readonly scheduleEnabled: boolean;
  readonly setScheduleEnabled: Dispatch<SetStateAction<boolean>>;
  readonly signatures: readonly MailSignature[];
  readonly signatureId: string;
  readonly setSignatureId: Dispatch<SetStateAction<string>>;
  readonly sending: boolean;
  readonly autoSaving: boolean;
  readonly draftSaveStatus: 'idle' | 'saving' | 'saved' | 'failed';
  readonly setDraftSaveStatus: Dispatch<
    SetStateAction<'idle' | 'saving' | 'saved' | 'failed'>
  >;
  readonly recoveryOffer: ComposerRecoverySnapshot | undefined;
  readonly templates: readonly MailTemplate[];
  readonly uploading: boolean;
  readonly composeAttachments: readonly MailOutboundAttachmentView[];
  readonly setComposeAttachments: Dispatch<
    SetStateAction<readonly MailOutboundAttachmentView[]>
  >;
  readonly retainedAttachments: MailMessage['attachments'];
  readonly setRetainedAttachments: Dispatch<
    SetStateAction<MailMessage['attachments']>
  >;
  readonly attachmentInputRef: RefObject<HTMLInputElement | null>;
  readonly sendableComposerIdentities: MailIdentity[];
  readonly composerCanSend: boolean;
  readonly composerCanDraft: boolean;
  readonly closeComposer: (force?: boolean) => void;
  readonly saveComposer: (closeAfterSave?: boolean) => void;
  readonly sendComposer: (mode?: 'normal' | 'bulk') => void;
  readonly uploadInlineImage: (
    file: File,
  ) => Promise<{ cid: string; src: string }>;
  readonly uploadComposerAttachments: (files: FileList | null) => void;
  readonly composerHasRequiredContent: boolean;
  readonly composerHasUnsavedChanges: boolean;
}
