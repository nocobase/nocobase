import type { Dispatch, SetStateAction } from 'react';
import type { MessageAttachment } from '@nocobase/app-plugin-agents/shared/conversations';

/** Application lifetime editor state, including uploads owned by this draft. */
export class ComposerSession {
  public active = true;
  public intent = 0;
  private revision = 0;
  private readonly values = new Map<string, unknown>();
  private readonly setters = new Map<string, unknown>();
  private readonly listeners = new Set<() => void>();
  private discard: ((attachment: MessageAttachment) => void) | undefined;
  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  public snapshot = (): number => this.revision;
  public read<T>(key: string, fallback: T): T {
    if (!this.values.has(key)) this.values.set(key, fallback);
    return this.values.get(key) as T;
  }
  public setter<T>(key: string, fallback: T): Dispatch<SetStateAction<T>> {
    const cached = this.setters.get(key);
    if (cached) return cached as Dispatch<SetStateAction<T>>;
    const setter: Dispatch<SetStateAction<T>> = (value) => {
      if (!this.active) return;
      const before = this.read(key, fallback);
      const next =
        typeof value === 'function' ? (value as (old: T) => T)(before) : value;
      if (Object.is(before, next)) return;
      this.values.set(key, next);
      this.revision += 1;
      for (const listener of this.listeners) listener();
    };
    this.setters.set(key, setter);
    return setter;
  }
  public beginIntent(): number {
    this.intent += 1;
    return this.intent;
  }
  public setDiscard(
    discard: ((attachment: MessageAttachment) => void) | undefined,
  ): void {
    this.discard = discard;
  }
  public hasDraft(): boolean {
    return Boolean(
      this.read('content', '').trim() ||
      this.read<readonly unknown[]>('files', []).length ||
      this.read('waiting', false),
    );
  }
  public append(text: string): void {
    this.beginIntent();
    this.setter('waiting', false)(false);
    this.setter(
      'content',
      '',
    )((before) => (before ? `${before}\n\n${text}` : text));
  }
  public restore(
    text: string,
    attachments: readonly MessageAttachment[],
  ): void {
    this.append(text);
    this.setter<readonly unknown[]>(
      'files',
      [],
    )((before) => [
      ...before,
      ...attachments.map((attachment) => ({
        key: `restored-${attachment.id}`,
        file: Object.defineProperty(
          new File([], attachment.filename, { type: attachment.mimeType }),
          'size',
          { value: attachment.size },
        ),
        preview: null,
        status: 'done',
        attachment,
        controller: null,
      })),
    ]);
  }
  public dispose(): void {
    this.active = false;
    this.beginIntent();
    for (const file of this.read<
      readonly {
        controller?: AbortController | null;
        preview?: string | null;
        attachment?: MessageAttachment | null;
      }[]
    >('files', [])) {
      file.controller?.abort();
      if (file.preview) URL.revokeObjectURL(file.preview);
      if (file.attachment) this.discard?.(file.attachment);
    }
    this.values.clear();
    this.listeners.clear();
  }
}
