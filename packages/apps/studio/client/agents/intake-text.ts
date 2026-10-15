/** What "Let an agent organize" sends: the intake's text and file texts, within one chat message. */
import { MESSAGE_CONTENT_MAX } from '@nocobase/app-plugin-agents/shared/conversations';

import {
  INTAKE_FILE_TEXT_MAX as START_FILE_TEXT_MAX,
  INTAKE_FILES_MAX as START_FILES_MAX,
} from '../../shared/intake.js';

/** Room Studio's wrapping of an intake message takes (instructions, fences, file headers). */
const WRAPPING_RESERVE = 2_000;

export interface IntakeFileText {
  readonly name: string;
  readonly text: string;
}

/**
 * Keeps the complete text and every file, or returns null when they cannot fit in one message.
 * Silently cutting a file would hide requirements from the agent.
 */
export function fitIntake(
  text: string,
  files: readonly IntakeFileText[],
  budget: number = MESSAGE_CONTENT_MAX - WRAPPING_RESERVE,
): { readonly text: string; readonly files: IntakeFileText[] } | null {
  if (files.length > START_FILES_MAX || text.length > budget) return null;
  let left = budget - text.length;
  for (const file of files) {
    // A file's name and fences count too.
    if (file.text.length > START_FILE_TEXT_MAX) return null;
    left -= file.text.length + file.name.length + 20;
    if (left < 0) return null;
  }
  return { text, files: [...files] };
}

/** A conversation title from the intake's first line, without Markdown markers, at most `max` characters. */
export function intakeTitleText(text: string, max: number): string {
  const line =
    text
      .split('\n')
      .map((value) =>
        value
          .replace(
            /^\s*(?:#{1,6}\s+|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)/u,
            '',
          )
          .trim(),
      )
      .find((value) => value !== '') ?? '';
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}
