/** Stable CID for an owned upload; only referenced image uploads become inline. */
export function uploadedImageContentId(id: string): string {
  return `nocobase-${id}@mail.inline`;
}

export function uploadedImageMetadata(
  id: string,
  contentType: string,
  html: string | undefined,
): { inline: boolean; contentId?: string } {
  const contentId = uploadedImageContentId(id);
  const inline =
    /^image\/(?:png|jpeg|gif|webp)$/iu.test(contentType) &&
    Boolean(html?.includes(`cid:${contentId}`));
  return inline ? { inline, contentId } : { inline };
}

/** Embedded image resources belong to the body, not the attachment list. */
export function isVisibleMailAttachment(attachment: {
  readonly inline: boolean;
  readonly contentType: string;
}): boolean {
  return !attachment.inline || !/^image\//iu.test(attachment.contentType);
}
