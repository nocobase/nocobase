import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  'push.title': 'Push-Benachrichtigungen',
  'push.description':
    'Erhalten Sie Erinnerungen auf jedem Gerät, auch wenn die App geschlossen ist.',
  'push.subscribe': 'Dieses Gerät abonnieren',
  'push.name': 'Gerätename',
  'push.empty': 'Keine abonnierten Geräte',
  'push.emptyHint':
    'Abonnieren Sie dieses Gerät, um Erinnerungen zu erhalten, wenn die App geschlossen wird.',
  'push.ios':
    'Öffnen Sie unter iOS oder iPadOS 16.4 oder höher das Teilen-Menü von Safari, wählen Sie „Zum Startbildschirm hinzufügen“ und öffnen Sie dann die App über das entsprechende Symbol, um sie zu abonnieren.',
  'push.unsupported':
    'Push benötigt HTTPS und einen Browser mit Web Push-Unterstützung.',
  'push.unavailable':
    'Push ist nicht konfiguriert. Bitten Sie einen Administrator, VAPID und den geheimen Schlüssel zu konfigurieren.',
  'push.denied':
    'Benachrichtigungen sind blockiert. Erlauben Sie sie in den Website-Einstellungen Ihres Browsers und versuchen Sie es dann erneut.',
  'push.current': 'Dieses Gerät',
  'push.more': 'Geräteaktionen',
  'push.test': 'Testbenachrichtigung senden',
  'push.remove': 'Entfernen',
  'push.removeTitle': 'Gerät „{{name}}“ entfernen?',
  'push.removeHint':
    'Dieses Gerät empfängt keine Push-Benachrichtigungen mehr. Sie können sich von diesem Gerät aus erneut anmelden.',
  'push.cancel': 'Abbrechen',
  'push.saved': 'Geräteeinstellungen gespeichert',
  'push.saving': 'Geräteeinstellungen werden gespeichert',
  'push.testSent': 'Testbenachrichtigung in der Warteschlange',
  'push.failed':
    'Push-Benachrichtigungen können nicht aktualisiert werden. Bitte versuchen Sie es erneut.',
  'push.loadingFailed':
    'Geräte können nicht geladen werden. Bitte versuchen Sie es erneut.',
  'push.retry': 'Erneut versuchen',
};

export default deDE;
