export const MAIL_ORIGINAL_MAX_BYTES: number = 40 * 1024 * 1024;

export function canHaveOriginalMessage(providerMessageId: string): boolean {
  return !providerMessageId.startsWith('local-draft:');
}

export function originalMessageFileName(subject: string): string {
  const base = subject
    .replace(/[<>:"/\\|?*\p{Cc}\p{Cf}\p{Cs}]/gu, ' ')
    .trim()
    .replace(/\.eml$/iu, '')
    .replace(/^[. ]+|[. ]+$/gu, '');
  // 60 code points fit a 255-byte filename even with four-byte UTF-8 characters.
  const shortened = Array.from(base)
    .slice(0, 60)
    .join('')
    .replace(/[. ]+$/gu, '');
  const safe = shortened.replace(
    /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/iu,
    '_$&',
  );
  return `${safe || 'message'}.eml`;
}
