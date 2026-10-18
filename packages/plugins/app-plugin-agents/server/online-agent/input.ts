import type { ModelMessage, UIMessage } from 'ai';
import { invalid } from '../kernel/errors.js';
import { jsonSafe } from './codec.js';

/** Normalize trusted background user input to the SDK's JSON-persistable UI parts. */
export function nativeInputParts(message: ModelMessage): UIMessage['parts'] {
  if (message.role !== 'user')
    throw invalid('Input must contain user messages.');
  if (typeof message.content === 'string')
    return [{ type: 'text', text: message.content }];
  return message.content.map((part): UIMessage['parts'][number] => {
    const providerMetadata = part.providerOptions
      ? (jsonSafe(part.providerOptions) as NonNullable<
          typeof part.providerOptions
        >)
      : undefined;
    if (part.type === 'text')
      return {
        type: 'text',
        text: part.text,
        ...(providerMetadata ? { providerMetadata } : {}),
      };
    let data = part.type === 'image' ? part.image : part.data;
    const mediaType = part.mediaType ?? 'image';
    let url: string;
    let providerReference: Extract<
      UIMessage['parts'][number],
      { type: 'file' }
    >['providerReference'];
    const stringDataUrl = (value: string): string =>
      URL.canParse(value) ? value : `data:${mediaType};base64,${value}`;
    if (data instanceof URL) {
      url = data.href;
    } else if (
      typeof data === 'object' &&
      data !== null &&
      !(data instanceof Uint8Array) &&
      !(data instanceof ArrayBuffer)
    ) {
      if ('type' in data && data.type === 'url') url = data.url.href;
      else if ('type' in data && data.type === 'text')
        url = `data:${mediaType};base64,${Buffer.from(data.text).toString('base64')}`;
      else if ('type' in data && data.type === 'data') {
        data = data.data;
        if (typeof data === 'string' && data.startsWith('data:'))
          throw invalid(
            'Data URLs must use a URL input, not tagged inline data.',
          );
        url =
          typeof data === 'string'
            ? `data:${mediaType};base64,${data}`
            : stringDataUrl(
                Buffer.from(
                  data instanceof ArrayBuffer ? new Uint8Array(data) : data,
                ).toString('base64'),
              );
      } else {
        providerReference =
          'type' in data && data.type === 'reference' ? data.reference : data;
        url = '';
      }
    } else {
      url =
        typeof data === 'string'
          ? stringDataUrl(data)
          : stringDataUrl(
              Buffer.from(
                data instanceof ArrayBuffer ? new Uint8Array(data) : data,
              ).toString('base64'),
            );
    }
    return {
      type: 'file',
      mediaType,
      url,
      ...(part.type === 'file' && part.filename
        ? { filename: part.filename }
        : {}),
      ...(providerReference ? { providerReference } : {}),
      ...(providerMetadata ? { providerMetadata } : {}),
    };
  });
}
