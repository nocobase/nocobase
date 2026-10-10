/** The steps of the New project wizard (`pages/projects/new`). */
export type WizardStep = 1 | 2 | 3;

/** The steps a project goes through: Deploy only for a repository. */
export function wizardSteps(repository: boolean): readonly WizardStep[] {
  return repository ? [1, 2, 3] : [1, 2];
}
