:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Integration

## Überblick

NocoBase bietet umfassende Integrationsmöglichkeiten, die eine nahtlose Verbindung mit externen Systemen, Drittanbieterdiensten und verschiedenen Datenquellen ermöglichen. Durch flexible Integrationsmethoden können Sie die Funktionalität von NocoBase erweitern, um vielfältige Geschäftsanforderungen zu erfüllen.

## Integrationsmethoden

### API-Integration

NocoBase bietet leistungsstarke API-Funktionen, um die Integration mit externen Anwendungen und Diensten zu ermöglichen:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[API-Schlüssel](/integration/api-keys/)**: Verwenden Sie API-Schlüssel für die sichere Authentifizierung, um programmgesteuert auf NocoBase-Ressourcen zuzugreifen.
- **[API-Dokumentation](/integration/api-doc/)**: Integrierte API-Dokumentation zum Erkunden und Testen von Endpunkten.

### Single Sign-On (SSO)

Integrieren Sie sich mit Unternehmens-Identitätssystemen, um eine einheitliche Authentifizierung zu ermöglichen:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[SSO-Integration](/integration/sso/)**: Unterstützung für SAML, OIDC, CAS, LDAP und die Authentifizierung über Drittanbieterplattformen.
- Zentralisierte Benutzerverwaltung und Zugriffskontrolle.
- Nahtloses Authentifizierungserlebnis über Systeme hinweg.

### Workflow-Integration

Verbinden Sie NocoBase-Workflows mit externen Systemen:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Workflow-Webhook](/integration/workflow-webhook/)**: Empfangen Sie Ereignisse von externen Systemen, um Workflows auszulösen.
- **[Workflow-HTTP-Anfrage](/integration/workflow-http-request/)**: Senden Sie HTTP-Anfragen von Workflows an externe APIs.
- Automatisieren Sie Geschäftsprozesse plattformübergreifend.

### Externe Datenquellen

Verbinden Sie sich mit externen Datenbanken und Datensystemen:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Externe Datenbanken](/data-sources/)**: Stellen Sie eine direkte Verbindung zu MySQL-, PostgreSQL-, MariaDB-, MSSQL-, Oracle- und KingbaseES-Datenbanken her.
- Erkennen Sie externe Datenbanktabellenstrukturen und führen Sie CRUD-Operationen direkt in NocoBase für externe Daten durch.
- Einheitliche Datenverwaltungsoberfläche.

### Eingebettete Inhalte

Betten Sie externe Inhalte in NocoBase ein:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Iframe-Block](/integration/block-iframe/)**: Betten Sie externe Webseiten und Anwendungen ein.
- **JS-Blöcke**: Führen Sie benutzerdefinierten JavaScript-Code für erweiterte Integrationen aus.

## Häufige Integrationsszenarien

### Integration von Unternehmenssystemen

- Verbinden Sie NocoBase mit ERP-, CRM- oder anderen Unternehmenssystemen.
- Bidirektionale Datensynchronisation.
- Automatisieren Sie systemübergreifende Workflows.

### Integration von Drittanbieterdiensten

- Fragen Sie den Zahlungsstatus von Zahlungsgateways ab, integrieren Sie Nachrichtendienste oder Cloud-Plattformen.
- Nutzen Sie externe APIs, um die Funktionalität zu erweitern.
- Erstellen Sie benutzerdefinierte Integrationen mithilfe von Webhooks und HTTP-Anfragen.

### Datenintegration

- Verbinden Sie sich mit mehreren Datenquellen.
- Aggregieren Sie Daten aus verschiedenen Systemen.
- Erstellen Sie einheitliche Dashboards und Berichte.

## Sicherheitsaspekte

Berücksichtigen Sie bei der Integration von NocoBase mit externen Systemen die folgenden Best Practices für die Sicherheit:

1.  **HTTPS verwenden**: Verwenden Sie immer verschlüsselte Verbindungen für die Datenübertragung.
2.  **API-Schlüssel schützen**: Speichern Sie API-Schlüssel sicher und rotieren Sie diese regelmäßig.
3.  **Prinzip der geringsten Rechte**: Gewähren Sie nur die für die Integration erforderlichen Berechtigungen.
4.  **Audit-Protokollierung**: Überwachen und protokollieren Sie Integrationsaktivitäten.
5.  **Datenvalidierung**: Validieren Sie alle Daten aus externen Quellen.