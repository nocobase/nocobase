import { useCallback, useEffect, useRef, useState } from "react";
import { useAI } from "./ai-provider";
import type { AIChatAttachment } from "./types";

const EMPTY_ATTACHMENTS: AIChatAttachment[] = [];

const disposeRemovedAttachmentPreviews = (
  current: AIChatAttachment[],
  next: AIChatAttachment[]
) => {
  const retainedPreviews = new Set(
    next.map((attachment) => attachment.preview).filter(Boolean)
  );
  for (const attachment of current) {
    if (
      attachment.preview?.startsWith("blob:") &&
      !retainedPreviews.has(attachment.preview)
    ) {
      URL.revokeObjectURL(attachment.preview);
    }
  }
};

const disposeAttachmentDrafts = (
  drafts: Record<string, AIChatAttachment[]>
) => Object.values(drafts).forEach((items) => disposeRemovedAttachmentPreviews(items, []));

export function useChatAttachments(activeConversationId: string) {
  const ai = useAI();
  const [drafts, setDrafts] = useState<Record<string, AIChatAttachment[]>>({});
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;

  const setConversationAttachments = useCallback(
    (
      conversationId: string,
      value:
        | AIChatAttachment[]
        | ((current: AIChatAttachment[]) => AIChatAttachment[])
    ) => {
      setDrafts((current) => {
        const previous = current[conversationId] ?? [];
        const next = typeof value === "function" ? value(previous) : value;
        disposeRemovedAttachmentPreviews(previous, next);
        return { ...current, [conversationId]: next };
      });
    },
    []
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      const conversationId = activeConversationId;
      const pending = files.map((file) => ({
        uid: `upload-${crypto.randomUUID()}`,
        filename: file.name || `pasted-image-${Date.now()}`,
        status: "uploading" as const,
        size: file.size,
        mimetype: file.type,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
        progress: 0,
        file,
      }));
      setConversationAttachments(conversationId, (current) => [
        ...current,
        ...pending,
      ]);

      await Promise.all(
        pending.map(async (attachment) => {
          try {
            const response = await ai.uploadFile(attachment.file);
            const meta =
              response.meta && typeof response.meta === "object"
                ? (response.meta as Record<string, unknown>)
                : undefined;
            const source =
              meta?.source && typeof meta.source === "object"
                ? meta.source
                : response.source;
            setConversationAttachments(conversationId, (current) =>
              current.map((item) =>
                item.uid === attachment.uid
                  ? {
                      ...response,
                      uid: String(response.id ?? attachment.uid),
                      filename: String(
                        response.filename ??
                          response.title ??
                          attachment.filename
                      ),
                      status: "done",
                      size:
                        typeof response.size === "number"
                          ? response.size
                          : attachment.size,
                      mimetype:
                        typeof response.mimetype === "string"
                          ? response.mimetype
                          : attachment.mimetype,
                      url:
                        typeof response.url === "string"
                          ? response.url
                          : undefined,
                      preview:
                        typeof response.preview === "string"
                          ? response.preview
                          : attachment.mimetype?.startsWith("image/") &&
                            typeof response.url === "string"
                          ? response.url
                          : attachment.preview,
                      progress: 100,
                      source,
                    }
                  : item
              )
            );
          } catch (error) {
            setConversationAttachments(conversationId, (current) =>
              current.map((item) =>
                item.uid === attachment.uid
                  ? {
                      ...item,
                      status: "error",
                      error:
                        error instanceof Error
                          ? error.message
                          : "File upload failed",
                    }
                  : item
              )
            );
          }
        })
      );
    },
    [activeConversationId, ai, setConversationAttachments]
  );

  const removeAttachment = useCallback(
    (uid: string) => {
      setConversationAttachments(activeConversationId, (current) => {
        return current.filter((attachment) => attachment.uid !== uid);
      });
    },
    [activeConversationId, setConversationAttachments]
  );

  const moveAttachments = useCallback((from: string, to: string) => {
    setDrafts((current) => {
      if (!current[from]) return current;
      const next = { ...current, [to]: current[from] };
      delete next[from];
      return next;
    });
  }, []);

  const removeConversationAttachments = useCallback(
    (conversationId: string) => {
      setDrafts((current) => {
        if (!current[conversationId]) return current;
        disposeRemovedAttachmentPreviews(current[conversationId], []);
        const next = { ...current };
        delete next[conversationId];
        return next;
      });
    },
    []
  );

  const clearAttachments = useCallback(
    () =>
      setDrafts((current) => {
        disposeAttachmentDrafts(current);
        return {};
      }),
    []
  );
  // Falls back to the shared EMPTY_ATTACHMENTS rather than a fresh `[]`: callers compare the
  // result by identity across an await to detect "the user changed the attachments mid-send", and
  // a new array each call would make that check fire on every send from a conversation with no
  // attachments.
  const getConversationAttachments = useCallback(
    (conversationId: string) =>
      draftsRef.current[conversationId] ?? EMPTY_ATTACHMENTS,
    []
  );
  const attachments = drafts[activeConversationId] ?? EMPTY_ATTACHMENTS;

  useEffect(
    () => () => disposeAttachmentDrafts(draftsRef.current),
    []
  );

  return {
    attachments,
    uploadingAttachments: attachments.some(
      (attachment) => attachment.status === "uploading"
    ),
    uploadFiles,
    removeAttachment,
    setConversationAttachments,
    moveAttachments,
    removeConversationAttachments,
    clearAttachments,
    getConversationAttachments,
  };
}
