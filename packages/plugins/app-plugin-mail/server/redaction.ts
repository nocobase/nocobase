function encodedSecret(secret: string): string {
  try {
    return encodeURIComponent(secret);
  } catch {
    return secret;
  }
}

/** Replace known credentials before truncation, including common protocol encodings. */
export function redactMailText(
  value: unknown,
  secrets: readonly string[] = [],
): string | undefined {
  if (typeof value !== 'string') return undefined;
  let text = value;
  const variants = secrets
    .filter(Boolean)
    .flatMap((secret) => [
      secret,
      encodedSecret(secret),
      Buffer.from(secret).toString('base64'),
    ]);
  for (const secret of variants.sort((a, b) => b.length - a.length))
    text = text.split(secret).join('[REDACTED]');
  return text
    .replace(/\b(?!file:)[a-z][a-z0-9+.-]*:\/\/[^\s]+/giu, '[URL]')
    .replace(
      /\b(?:AUTH(?:ENTICATE)?|LOGIN|Bearer|Basic)\s+[^\r\n]*/giu,
      '[REDACTED]',
    )
    .replace(
      /\b(?:password|pass|secret|token|api[_-]?key|access_token|accessToken|refresh_token|refreshToken|client_secret|clientSecret|code_verifier|credentialReference|authorization|code|state)["']?\s*[=:]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/giu,
      '[REDACTED]',
    )
    .replace(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@([A-Z0-9.-]+)/giu, '***@$1')
    .slice(0, 200);
}
