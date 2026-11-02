import type { AccountSwitcherResource } from './en-US.js';

const deDE: AccountSwitcherResource = {
  menu: {
    switchAccount: 'Konto wechseln',
    search: 'Name oder E-Mail suchen',
    loading: 'Konten werden geladen…',
    empty: 'Keine passenden Konten',
    more: '{{count}} weitere. Suchen Sie, um die Liste einzugrenzen.',
    loadFailed: 'Konten können nicht geladen werden.',
  },
  banner: {
    actingAs: 'Sie handeln als {{name}}',
    description: 'Änderungen werden unter diesem Konto erfasst.',
    return: 'Zurück zu {{name}}',
  },
  errors: {
    switchFailed:
      'Das Konto kann nicht gewechselt werden. Bitte versuchen Sie es erneut.',
    returnFailed:
      'Die Rückkehr zu Ihrem Konto ist nicht möglich. Bitte versuchen Sie es erneut.',
  },
};

export default deDE;
