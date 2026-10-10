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
 * The text and files within what one message may carry: the text first, then the files in order, each cut at
 * `START_FILE_TEXT_MAX`, until the budget is spent; files that no longer fit are left out.
 */
export function fitIntake(
  text: string,
  files: readonly IntakeFileText[],
  budget: number = MESSAGE_CONTENT_MAX - WRAPPING_RESERVE,
): { readonly text: string; readonly files: IntakeFileText[] } {
  let left = budget;
  const fittedText = text.slice(0, left);
  left -= fittedText.length;
  const fitted: IntakeFileText[] = [];
  for (const file of files.slice(0, START_FILES_MAX)) {
    // A file's name and fences count too.
    const room = Math.min(START_FILE_TEXT_MAX, left - file.name.length - 20);
    if (room <= 0) break;
    const kept = file.text.slice(0, room);
    fitted.push({ name: file.name, text: kept });
    left -= kept.length + file.name.length + 20;
  }
  return { text: fittedText, files: fitted };
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
