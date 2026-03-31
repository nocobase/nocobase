:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Single Sign-On (SSO) Integration

NocoBase bietet umfassende Single Sign-On (SSO)-Lösungen, die verschiedene gängige Authentifizierungsprotokolle unterstützen und eine nahtlose Integration in bestehende Unternehmens-Identitätssysteme ermöglichen.

## Überblick

Single Sign-On ermöglicht es Benutzern, sich mit einem einzigen Satz von Anmeldeinformationen bei mehreren verwandten, aber unabhängigen Systemen anzumelden. Sie müssen sich nur einmal authentifizieren, um auf alle autorisierten Anwendungen zuzugreifen, ohne Benutzernamen und Passwörter wiederholt eingeben zu müssen. Dies verbessert nicht nur die Benutzerfreundlichkeit, sondern erhöht auch die Systemsicherheit und die Effizienz der Verwaltung.

## Unterstützte Authentifizierungsprotokolle

NocoBase unterstützt die folgenden Authentifizierungsprotokolle und -methoden über **Plugins**:

### Enterprise-SSO-Protokolle

- **[SAML 2.0](/auth-verification/auth-saml/)**: Ein XML-basierter offener Standard, der weit verbreitet für die Authentifizierung in Unternehmen eingesetzt wird. Ideal für Szenarien, die eine Integration mit einem Unternehmens-Identitätsprovider (IdP) erfordern.

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/)**: Eine moderne Authentifizierungsschicht, die auf OAuth 2.0 basiert und Mechanismen für Authentifizierung und Autorisierung bereitstellt. Unterstützt die Integration mit gängigen Identitätsprovidern (wie Google, Azure AD usw.).

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/)**: Ein von der Yale University entwickeltes Single-Sign-On-Protokoll, das in Hochschulen und Bildungseinrichtungen weit verbreitet ist.

- **[LDAP](/auth-verification/auth-ldap/)**: Das Lightweight Directory Access Protocol wird für den Zugriff auf und die Pflege von verteilten Verzeichnisinformationsdiensten verwendet. Es eignet sich für Szenarien, die eine Integration mit Active Directory oder anderen LDAP-Servern erfordern.

### Authentifizierung über Drittanbieter-Plattformen

- **[WeCom (WeChat Work)](/auth-verification/auth-wecom/)**: Unterstützt die Anmeldung per QR-Code und die nahtlose In-App-Authentifizierung innerhalb von WeCom.

- **[DingTalk](/auth-verification/auth-dingtalk/)**: Unterstützt die Anmeldung per QR-Code und die nahtlose In-App-Authentifizierung innerhalb von DingTalk.

### Weitere Authentifizierungsmethoden

- **[SMS-Verifizierung](/auth-verification/auth-sms/)**: Eine Authentifizierungsmethode, die auf Verifizierungscodes per SMS basiert.

- **[Benutzername/Passwort](/auth-verification/auth/)**: Die in NocoBase integrierte Standard-Authentifizierungsmethode.

## Integrationsschritte

### 1. Authentifizierungs-**Plugin** installieren

Suchen und installieren Sie das entsprechende Authentifizierungs-**Plugin** im **Plugin**-Manager, je nach Ihren Anforderungen. Die meisten SSO-Authentifizierungs-**Plugins** müssen separat erworben oder abonniert werden.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Installieren Sie beispielsweise das SAML 2.0 Authentifizierungs-**Plugin**:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

Oder installieren Sie das OIDC Authentifizierungs-**Plugin**:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Authentifizierungsmethode konfigurieren

1. Navigieren Sie zu **Systemeinstellungen > Benutzerauthentifizierung**.

![](https://static-docs.nocobase.com/202411130004459.png)

2. Klicken Sie auf **Authentifizierungsmethode hinzufügen**.
3. Wählen Sie den installierten Authentifizierungstyp aus (z. B. SAML).

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

Oder wählen Sie OIDC:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. Konfigurieren Sie die erforderlichen Parameter gemäß den Anweisungen.

### 3. Identitätsprovider konfigurieren

Jedes Authentifizierungsprotokoll erfordert die Konfiguration der entsprechenden Identitätsprovider-Informationen:

- **SAML**: Konfigurieren Sie IdP-Metadaten, Zertifikate usw.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: Konfigurieren Sie Client ID, Client Secret, Discovery-Endpunkt usw.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: Konfigurieren Sie die CAS-Serveradresse.
- **LDAP**: Konfigurieren Sie die LDAP-Serveradresse, Bind-DN usw.
- **WeCom/DingTalk**: Konfigurieren Sie Anwendungszugangsdaten, Corp ID usw.

### 4. Authentifizierung testen

Nach der Konfiguration empfehlen wir Ihnen, einen Test durchzuführen:

1. Melden Sie sich von der aktuellen Sitzung ab.
2. Wählen Sie auf der Anmeldeseite die konfigurierte SSO-Methode aus.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. Schließen Sie den Authentifizierungsablauf des Identitätsproviders ab.
4. Überprüfen Sie, ob die Anmeldung bei NocoBase erfolgreich war.

## Benutzerzuordnung und Rollenvergabe

Nach erfolgreicher SSO-Authentifizierung verwaltet NocoBase Benutzerkonten automatisch:

- **Erste Anmeldung**: Es wird automatisch ein neues Benutzerkonto erstellt und grundlegende Informationen (Spitzname, E-Mail usw.) vom Identitätsprovider synchronisiert.
- **Folgeanmeldungen**: Es wird das bestehende Konto verwendet; optional können aktualisierte Benutzerinformationen synchronisiert werden.
- **Rollenvergabe**: Sie können Standardrollen konfigurieren oder Rollen automatisch basierend auf den Rollenfeldern in den Benutzerinformationen zuweisen.

## Sicherheitsempfehlungen

1. **HTTPS verwenden**: Stellen Sie sicher, dass NocoBase in einer HTTPS-Umgebung bereitgestellt wird, um die Sicherheit der Authentifizierungsdatenübertragung zu gewährleisten.
2. **Regelmäßige Zertifikatsaktualisierungen**: Aktualisieren und rotieren Sie Sicherheitsschlüssel wie SAML-Zertifikate zeitnah.
3. **Callback-URL-Whitelist konfigurieren**: Konfigurieren Sie die Callback-URLs von NocoBase beim Identitätsprovider korrekt.
4. **Prinzip der geringsten Rechte**: Weisen Sie SSO-Benutzern angemessene Rollen und Berechtigungen zu.
5. **Audit-Protokollierung aktivieren**: Erfassen und überwachen Sie SSO-Anmeldeaktivitäten.

## Fehlerbehebung

### SSO-Anmeldung fehlgeschlagen?

1. Überprüfen Sie, ob die Konfiguration des Identitätsproviders korrekt ist.
2. Stellen Sie sicher, dass die Callback-URLs korrekt konfiguriert sind.
3. Überprüfen Sie die NocoBase-Protokolle auf detaillierte Fehlermeldungen.
4. Bestätigen Sie, dass Zertifikate und Schlüssel gültig sind.

### Benutzerinformationen werden nicht synchronisiert?

1. Überprüfen Sie die vom Identitätsprovider zurückgegebenen Benutzerattribute.
2. Überprüfen Sie, ob die Feldzuordnungskonfiguration korrekt ist.
3. Bestätigen Sie, dass die Option zur Synchronisierung von Benutzerinformationen aktiviert ist.

### Wie können mehrere Authentifizierungsmethoden gleichzeitig unterstützt werden?

NocoBase unterstützt die gleichzeitige Konfiguration mehrerer Authentifizierungsmethoden. Benutzer können auf der Anmeldeseite die passende Methode auswählen.

## Verwandte Ressourcen

- [Authentifizierungs-Dokumentation](/auth-verification/auth/)
- [API-Schlüssel-Authentifizierung](/integration/api-keys/)
- [Benutzer- und Berechtigungsverwaltung](/plugins/@nocobase/plugin-users/)