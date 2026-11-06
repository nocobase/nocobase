import type { OnlineAgentResendOptions } from '../../../../shared/resend.js';
import { MESSAGE_CONTENT_MAX } from '../../../../shared/conversations.js';
import { invalid } from '../../../kernel/errors.js';
import type { NativeMessage } from '../types.js';

/** Snapshot and validate SDK callers too, before reserving an execution. */
export function resendOptions(
  value: OnlineAgentResendOptions,
): OnlineAgentResendOptions {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => key !== 'messageId' && key !== 'input') ||
    (value.messageId !== undefined &&
      (typeof value.messageId !== 'string' ||
        !value.messageId ||
        value.messageId.length > 64)) ||
    (value.input !== undefined &&
      (!value.input ||
        typeof value.input !== 'object' ||
        Array.isArray(value.input) ||
        Object.keys(value.input).some((key) => key !== 'text') ||
        typeof value.input.text !== 'string' ||
        [...value.input.text].length > MESSAGE_CONTENT_MAX))
  )
    throw invalid(
      'A valid user message reference and text input are required.',
    );
  return structuredClone(value);
}

/** Replace text on a detached private original, keeping private file indices aligned. */
export function resendMessage(
  original: NativeMessage,
  options: OnlineAgentResendOptions,
): NativeMessage {
  const message = structuredClone(original);
  if (options.input) {
    const oldParts = message.parts;
    const privateFiles = new Set(message.metadata?.inputFiles ?? []);
    const remapped: number[] = [];
    const firstText = oldParts.findIndex((part) => part.type === 'text');
    const insertAt =
      firstText < 0
        ? Math.max(
            0,
            oldParts.findIndex((part) => part.type === 'file'),
          )
        : firstText;
    const parts: NativeMessage['parts'] = [];
    for (let index = 0; index < oldParts.length; index++) {
      if (index === insertAt)
        parts.push({ type: 'text', text: options.input.text });
      if (oldParts[index].type === 'text') continue;
      if (privateFiles.has(index)) remapped.push(parts.length);
      parts.push(oldParts[index]);
    }
    if (!oldParts.length)
      parts.push({ type: 'text', text: options.input.text });
    message.parts = parts;
    if (message.metadata?.inputFiles) message.metadata.inputFiles = remapped;
  }
  const text = message.parts
    .flatMap((part) => (part.type === 'text' ? [part.text] : []))
    .join('\n');
  if (
    [...text].length > MESSAGE_CONTENT_MAX ||
    (!text.trim() && !message.parts.some((part) => part.type === 'file'))
  )
    throw invalid('A valid user input is required.');
  return message;
}
