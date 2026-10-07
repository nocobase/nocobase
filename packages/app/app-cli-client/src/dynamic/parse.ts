// The command words of a line: those before its first flag. oclif splits words holding `:` and folds positional words
// into the command id, so the manifest's commands are resolved from the original argv.

/** The words before the first flag. */
export function leadingWords(argv: readonly string[]): string[] {
  const words: string[] = [];
  for (const word of argv) {
    if (word.startsWith('-')) break;
    words.push(word);
  }
  return words;
}
