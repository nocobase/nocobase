:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Workflow Webhook-Integration

Durch Webhook-Trigger kann NocoBase HTTP-Aufrufe von Drittsystemen empfangen und Workflows automatisch auslösen, was eine nahtlose Integration mit externen Systemen ermöglicht.

## Übersicht

Ein Webhook ist ein "Reverse-API"-Mechanismus, der es externen Systemen ermöglicht, NocoBase proaktiv Daten zu senden, wenn bestimmte Ereignisse eintreten. Im Vergleich zum aktiven Polling bieten Webhooks eine aktuellere und effizientere Integrationsmethode.

## Typische Anwendungsfälle

### Formulardatenübermittlung

Externe Umfragesysteme, Anmeldeformulare und Kundenfeedback-Formulare senden Daten nach der Benutzerübermittlung über Webhooks an NocoBase. Dies erstellt automatisch Datensätze und löst nachfolgende Verarbeitungsprozesse aus (z. B. das Senden von Bestätigungs-E-Mails, das Zuweisen von Aufgaben usw.).

### Nachrichtenbenachrichtigungen

Ereignisse von Drittanbieter-Nachrichtenplattformen (wie WeCom, DingTalk, Slack), z. B. neue Nachrichten, @-Erwähnungen oder abgeschlossene Genehmigungen, können über Webhooks automatisierte Verarbeitungsprozesse in NocoBase auslösen.

### Datensynchronisation

Wenn sich Daten in externen Systemen (wie CRM, ERP) ändern, werden diese in Echtzeit über Webhooks an NocoBase gesendet, um die Datensynchronisation aufrechtzuerhalten.

### Integration von Drittanbieter-Diensten

- **GitHub**: Code-Pushes, PR-Erstellung und ähnliche Ereignisse lösen Automatisierungsworkflows aus.
- **GitLab**: Statusbenachrichtigungen für CI/CD-Pipelines.
- **Formularübermittlungen**: Externe Formularsysteme übermitteln Daten an NocoBase.
- **IoT-Geräte**: Statusänderungen von Geräten, Übermittlung von Sensordaten.

## Funktionsmerkmale

### Flexibler Trigger-Mechanismus

- Unterstützt HTTP-Methoden wie GET, POST, PUT, DELETE.
- Automatische Analyse gängiger Formate wie JSON und Formulardaten.
- Konfigurierbare Anforderungsvalidierung zur Sicherstellung vertrauenswürdiger Quellen.

### Datenverarbeitungsfunktionen

- Empfangene Daten können in Workflows als Variablen verwendet werden.
- Unterstützt komplexe Datentransformations- und Verarbeitungslogiken.
- Kann mit anderen Workflow-Knoten kombiniert werden, um komplexe Geschäftslogiken zu implementieren.

### Sicherheitsgarantien

- Unterstützt Signaturprüfung, um gefälschte Anfragen zu verhindern.
- Konfigurierbare IP-Whitelist.
- HTTPS-verschlüsselte Übertragung.

## Anwendungsschritte

### 1. Plugin installieren

Suchen und installieren Sie im Plugin-Manager das **[Workflow: Webhook-Trigger](/plugins/@nocobase/plugin-workflow-webhook/)** Plugin.

> Hinweis: Dies ist ein kommerzielles Plugin, das separat erworben oder abonniert werden muss.

### 2. Webhook-Workflow erstellen

1. Navigieren Sie zur Seite **Workflow-Verwaltung**.
2. Klicken Sie auf **Workflow erstellen**.
3. Wählen Sie **Webhook-Trigger** als Auslösetyp.

![Create Webhook Workflow](https://static-docs.nocobase.com/20241210105049.png)

4. Webhook-Parameter konfigurieren.

![Webhook Trigger Configuration](https://static-docs.nocobase.com/20241210105441.png)
   - **Anforderungspfad**: Benutzerdefinierter Webhook-URL-Pfad.
   - **Anforderungsmethode**: Wählen Sie die erlaubten HTTP-Methoden (GET/POST/PUT/DELETE).
   - **Synchron/Asynchron**: Wählen Sie, ob auf den Abschluss der Workflow-Ausführung gewartet werden soll, bevor ein Ergebnis zurückgegeben wird.
   - **Validierung**: Konfigurieren Sie die Signaturprüfung oder andere Sicherheitsmechanismen.

### 3. Workflow-Knoten konfigurieren

Fügen Sie Workflow-Knoten entsprechend Ihren Geschäftsanforderungen hinzu, zum Beispiel:

- **Sammlungsoperationen**: Datensätze erstellen, aktualisieren, löschen.
- **Bedingte Logik**: Verzweigung basierend auf empfangenen Daten.
- **HTTP-Anfrage**: Aufruf anderer APIs.
- **Benachrichtigungen**: E-Mails, SMS usw. senden.
- **Benutzerdefinierter Code**: JavaScript-Code ausführen.

### 4. Webhook-URL abrufen

Nach der Workflow-Erstellung generiert das System eine eindeutige Webhook-URL, typischerweise im Format:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. In Drittsystem konfigurieren

Konfigurieren Sie die generierte Webhook-URL im Drittsystem:

- Legen Sie in Formularsystemen die Callback-Adresse für die Datenübermittlung fest.
- Konfigurieren Sie den Webhook in GitHub/GitLab.
- Konfigurieren Sie die Ereignis-Push-Adresse in WeCom/DingTalk.

### 6. Webhook testen

Testen Sie den Webhook mit Tools (wie Postman, cURL):

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Zugriff auf Anforderungsdaten

In Workflows können Sie auf die vom Webhook empfangenen Daten über Variablen zugreifen:

- `{{$context.data}}`: Daten des Anforderungstextes.
- `{{$context.headers}}`: Header-Informationen der Anfrage.
- `{{$context.query}}`: URL-Abfrageparameter.
- `{{$context.params}}`: Pfadparameter.

![Request Parameters Parsing](https://static-docs.nocobase.com/20241210111155.png)

![Request Body Parsing](https://static-docs.nocobase.com/20241210112529.png)

## Antwortkonfiguration

![Response Settings](https://static-docs.nocobase.com/20241210114312.png)

### Synchroner Modus

Gibt Ergebnisse nach Abschluss der Workflow-Ausführung zurück, konfigurierbar:

- **Antwort-Statuscode**: 200, 201 usw.
- **Antwortdaten**: Benutzerdefinierte JSON-Antwort.
- **Antwort-Header**: Benutzerdefinierte HTTP-Header.

### Asynchroner Modus

Gibt sofort eine Bestätigungsantwort zurück, der Workflow wird im Hintergrund ausgeführt. Geeignet für:

- Langlaufende Workflows.
- Szenarien, die keine Ausführungsergebnisse erfordern.
- Szenarien mit hoher Parallelität.

## Sicherheits-Best Practices

### 1. Signaturprüfung aktivieren

Die meisten Drittanbieter-Dienste unterstützen Signaturmechanismen:

```javascript
// Beispiel: GitHub Webhook-Signatur überprüfen
const crypto = require('crypto');
const signature = context.headers['x-hub-signature-256'];
const payload = JSON.stringify(context.data);
const secret = 'your-webhook-secret';
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. HTTPS verwenden

Stellen Sie sicher, dass NocoBase in einer HTTPS-Umgebung bereitgestellt wird, um die Sicherheit der Datenübertragung zu gewährleisten.

### 3. Anforderungsquellen einschränken

Konfigurieren Sie eine IP-Whitelist, um nur Anfragen von vertrauenswürdigen Quellen zuzulassen.

### 4. Datenvalidierung

Fügen Sie in Workflows eine Datenvalidierungslogik hinzu, um sicherzustellen, dass die empfangenen Daten das richtige Format und einen gültigen Inhalt haben.

### 5. Audit-Protokollierung

Protokollieren Sie alle Webhook-Anfragen, um die Nachverfolgung und Fehlerbehebung zu erleichtern.

## Fehlerbehebung

### Webhook wird nicht ausgelöst?

1. Überprüfen Sie, ob die Webhook-URL korrekt ist.
2. Bestätigen Sie, dass der Workflow-Status "Aktiviert" ist.
3. Überprüfen Sie die Sendeprotokolle des Drittsystems.
4. Überprüfen Sie die Firewall- und Netzwerkkonfiguration.

### Wie debuggt man Webhooks?

1. Überprüfen Sie die Workflow-Ausführungsaufzeichnungen für detaillierte Informationen zu Anfragen und Aufrufergebnissen.
2. Verwenden Sie Webhook-Testtools (wie Webhook.site), um Anfragen zu überprüfen.
3. Überprüfen Sie in den Ausführungsaufzeichnungen wichtige Daten und Fehlermeldungen.

### Wie geht man mit Wiederholungen um?

Einige Drittanbieter-Dienste versuchen erneut zu senden, wenn sie keine erfolgreiche Antwort erhalten:

- Stellen Sie sicher, dass der Workflow idempotent ist.
- Verwenden Sie eindeutige Identifikatoren zur Deduplizierung.
- Protokollieren Sie die IDs der verarbeiteten Anfragen.

### Tipps zur Leistungsoptimierung

- Verwenden Sie den asynchronen Modus für zeitaufwändige Operationen.
- Fügen Sie Bedingungsprüfungen hinzu, um unnötige Anfragen zu filtern.
- Erwägen Sie die Verwendung von Nachrichtenwarteschlangen für Szenarien mit hoher Parallelität.

## Beispielszenarien

### Verarbeitung externer Formularübermittlungen

```javascript
// 1. Datenquelle überprüfen
// 2. Formulardaten analysieren
const formData = context.data;

// 3. Kunden-Datensatz erstellen
// 4. Zuständigem Ansprechpartner zuweisen
// 5. Bestätigungs-E-Mail an den Absender senden
if (formData.email) {
  // E-Mail-Benachrichtigung senden
}
```

### GitHub Code-Push-Benachrichtigung

```javascript
// 1. Push-Daten analysieren
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Wenn es der Hauptzweig ist
if (branch === 'main') {
  // 3. Bereitstellungsprozess auslösen
  // 4. Teammitglieder benachrichtigen
}
```

![Webhook Workflow Example](https://static-docs.nocobase.com/20241210120655.png)

## Verwandte Ressourcen

- [Dokumentation zum Workflow-Plugin](/plugins/@nocobase/plugin-workflow/)
- [Workflow: Webhook-Trigger](/workflow/triggers/webhook)
- [Workflow: HTTP-Anfrage-Knoten](/integration/workflow-http-request/)
- [API-Schlüssel-Authentifizierung](/integration/api-keys/)