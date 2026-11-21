/** Everything about onboarding cases; a write to one case names `onboarding/<id>`. */
export const onboardingScope = 'onboarding';
export const caseScope = (id: string) => `${onboardingScope}/${id}`;
