const messages = {
  'push.deviceCount': 'Registered: {{total}} · Enabled: {{active}}',
  'push.active': 'Enabled',
  'push.paused': 'Paused',
  'push.pause': 'Pause',
  'push.resume': 'Resume',
  'push.title': 'Push devices',
  'push.description':
    'Receive reminders on each device, even when the app is closed.',
  'push.subscribe': 'Subscribe this device',
  'push.name': 'Device name',
  'push.empty': 'No subscribed devices',
  'push.emptyHint':
    'Subscribe this device to receive reminders when the app is closed.',
  'push.ios':
    'On iOS or iPadOS 16.4 or later, open Safari’s Share menu, choose Add to Home Screen, then open the app from its icon to subscribe.',
  'push.unsupported': 'Push needs HTTPS and a browser with Web Push support.',
  'push.unavailable':
    'Push is not configured. Ask an administrator to configure VAPID and the secrets key.',
  'push.denied':
    'Notifications are blocked. Allow them in your browser’s site settings, then try again.',
  'push.current': 'This device',
  'push.more': 'Device actions',
  'push.test': 'Send test notification',
  'push.remove': 'Remove',
  'push.removeTitle': 'Remove device “{{name}}”?',
  'push.removeHint':
    'This device will stop receiving push notifications. You can subscribe again from that device.',
  'push.cancel': 'Cancel',
  'push.saved': 'Device settings saved',
  'push.saving': 'Saving device settings',
  'push.testSent': 'The push service accepted the test notification.',
  'push.invalid':
    'The browser returned invalid subscription details. Try subscribing again.',
  'push.endpoint':
    'This browser uses a push service the server does not support.',
  'push.owned':
    'This browser subscription belongs to another account. Remove it from that account before subscribing again.',
  'push.browserFailed':
    'The browser could not create a push subscription. Check its notification settings and connection.',
  'push.expired':
    'This device subscription has expired or been removed. Subscribe again on that device.',
  'push.testPaused': 'Resume push for this device before sending a test.',
  'push.testLimited': 'Wait 30 seconds between test notifications.',
  'push.testNetwork':
    'The server could not reach the push service. Ask an administrator to check the network and Web Push proxy.',
  'push.testGatewayAuth':
    'The push service rejected the server’s credentials. Ask an administrator to check the VAPID key.',
  'push.testGatewayLimited':
    'The push service is limiting requests. Try again later.',
  'push.testGateway':
    'The push service could not accept the test notification. Try again later.',
  'push.failed': 'Unable to update push notifications. Please try again.',
  'push.loadingFailed': 'Unable to load devices. Please try again.',
  'push.retry': 'Retry',
  'channelType.title': 'Browser push',
  'channelType.testHint':
    'Sends a test notification to the browsers you turned push on for. Turn it on under Personal settings › Notifications first.',
};

export default messages;
