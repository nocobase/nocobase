/** Model-facing feedback for a runner policy refusal, shared by every adapter. */
export function denialMessage(reason: string | undefined): string {
  const detail = reason || 'Denied by the runner policy';
  let alternative =
    'Use an allowed tool to continue the task within the working directories.';
  if (/outside the work directory|writable roots/i.test(detail)) {
    alternative =
      'Keep inputs, generated files and command output inside the working directories; use a file there or regenerate it there.';
  } else if (/push guard|hooksPath/i.test(detail)) {
    alternative =
      'Push only the assigned branch with the normal git push command and keep the push guard enabled.';
  } else if (/credentials|protected/i.test(detail)) {
    alternative =
      'Use the application CLI for authorized operations without reading credential files.';
  } else if (/download/i.test(detail)) {
    alternative =
      'Use a tool already installed by the project, such as pnpm exec or npx --no.';
  } else if (/allowlist|allow list|denied pattern|substitution/i.test(detail)) {
    alternative =
      'Use an allowed command or a file tool; split the operation into simple allowed calls.';
  } else if (/plan mode/i.test(detail)) {
    alternative =
      'Continue with read-only inspection and describe the proposed changes.';
  }
  // Models read "report the blocker" as leave to end the turn at the first refused step, so the text says the task
  // goes on and keeps the blocker report for when nothing else is left to do.
  return `The runner command policy denied this tool call: ${detail}. This is an automated policy refusal, not a user instruction to stop, and it does not end the task. Do not retry the refused action or bypass the policy; do not ask for permission for this call. ${alternative} Then carry on with the rest of the task: do a step that was refused another permitted way or skip it, and still do every other step. Report a blocker through the application CLI only when no remaining part of the task can be done.`;
}
