import type { AuditLocaleResource } from './en-US.js';

const deDE: AuditLocaleResource = {
  audit: {
    operations: {
      createPersonalKey: 'Persönlichen API-Schlüssel erstellen',
      rotatePersonalKey: 'Persönlichen API-Schlüssel rotieren',
      revokePersonalKey: 'Persönlichen API-Schlüssel widerrufen',
      revokeMemberKey: 'Persönlichen API-Schlüssel eines Mitglieds widerrufen',
      updateRules: 'API-Schlüsselregeln aktualisieren',
      createSystemKey: 'System-API-Schlüssel erstellen',
      updateSystemKey: 'System-API-Schlüssel bearbeiten',
      replaceSystemKeyPermissions:
        'Berechtigungen eines System-API-Schlüssels ersetzen',
      rotateSystemKey: 'System-API-Schlüssel rotieren',
      disableSystemKey: 'System-API-Schlüssel deaktivieren',
      enableSystemKey: 'System-API-Schlüssel aktivieren',
      deleteSystemKey: 'System-API-Schlüssel löschen',
    },
  },
};

export default deDE;
