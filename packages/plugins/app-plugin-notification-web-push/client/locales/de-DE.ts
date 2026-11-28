import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  'push.deviceCount': 'Registriert: {{total}} · Aktiviert: {{active}}',
  'push.active': 'Enabled',
  'push.paused': 'Paused',
  'push.pause': 'Pause',
  'push.resume': 'Resume',
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
  'push.testSent': 'Der Push-Dienst hat die Testbenachrichtigung angenommen.',
  'push.invalid':
    'Der Browser hat ungültige Abonnementdaten geliefert. Versuchen Sie es erneut.',
  'push.endpoint':
    'Der Server unterstützt den Push-Dienst dieses Browsers nicht.',
  'push.owned':
    'Das Browser-Abonnement gehört zu einem anderen Konto. Entfernen Sie es dort und abonnieren Sie erneut.',
  'push.browserFailed':
    'Der Browser konnte kein Push-Abonnement erstellen. Prüfen Sie die Benachrichtigungseinstellungen und die Verbindung.',
  'push.expired':
    'Das Geräteabonnement ist abgelaufen oder wurde entfernt. Abonnieren Sie auf dem Gerät erneut.',
  'push.testPaused':
    'Aktivieren Sie Push auf diesem Gerät wieder, bevor Sie eine Testbenachrichtigung senden.',
  'push.testLimited': 'Warten Sie 30 Sekunden zwischen Testbenachrichtigungen.',
  'push.testNetwork':
    'Der Server konnte den Push-Dienst nicht erreichen. Bitten Sie die Administration, Netzwerk und Web-Push-Proxy zu prüfen.',
  'push.testGatewayAuth':
    'Der Push-Dienst hat die Zugangsdaten des Servers abgelehnt. Lassen Sie den VAPID-Schlüssel prüfen.',
  'push.testGatewayLimited':
    'Der Push-Dienst begrenzt die Anfragen. Versuchen Sie es später erneut.',
  'push.testGateway':
    'Der Push-Dienst konnte die Testbenachrichtigung nicht annehmen. Versuchen Sie es später erneut.',
  'push.failed':
    'Push-Benachrichtigungen können nicht aktualisiert werden. Bitte versuchen Sie es erneut.',
  'push.loadingFailed':
    'Geräte können nicht geladen werden. Bitte versuchen Sie es erneut.',
  'push.retry': 'Erneut versuchen',
  'channelType.title': 'Browser-Push',
  'channelType.testHint':
    'Sendet eine Testbenachrichtigung an die Browser, für die Sie Push aktiviert haben. Aktivieren Sie es zuerst unter Persönliche Einstellungen › Benachrichtigungen.',
};

export default deDE;
