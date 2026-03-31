:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Integration von HTTP-Anfragen in Workflows

Mit dem HTTP-Anfrage-Knoten können NocoBase Workflows proaktiv Anfragen an beliebige HTTP-Dienste senden. Dies ermöglicht den Datenaustausch und die Geschäftsintegration mit externen Systemen.

## Übersicht

Der HTTP-Anfrage-Knoten ist eine zentrale Integrationskomponente in Workflows. Er ermöglicht es Ihnen, während der Workflow-Ausführung APIs von Drittanbietern, interne Dienstschnittstellen oder andere Webdienste aufzurufen, um Daten abzurufen oder externe Operationen auszulösen.

## Typische Anwendungsfälle

### Datenabruf

- **Abfragen von Drittanbieter-Daten**: Echtzeitdaten von Wetter-APIs, Wechselkurs-APIs usw. abrufen.
- **Adressauflösung**: Karten-Dienst-APIs für die Adressanalyse und Geokodierung aufrufen.
- **Synchronisierung von Unternehmensdaten**: Kunden- und Bestelldaten aus CRM- und ERP-Systemen abrufen.

### Geschäftliche Auslöser

- **Nachrichtenversand**: Benachrichtigungen über SMS-, E-Mail- oder WeCom-Dienste senden.
- **Zahlungsanfragen**: Zahlungen, Rückerstattungen usw. über Zahlungs-Gateways initiieren.
- **Auftragsbearbeitung**: Frachtbriefe an Logistiksysteme übermitteln, Logistikstatus abfragen.

### Systemintegration

- **Microservice-Aufrufe**: APIs anderer Dienste in Microservice-Architekturen aufrufen.
- **Datenmeldung**: Geschäftsdaten an Analyseplattformen und Überwachungssysteme melden.
- **Drittanbieter-Dienste**: KI-Dienste, OCR-Erkennung, Sprachsynthese usw. integrieren.

### Automatisierung

- **Geplante Aufgaben**: Externe APIs regelmäßig aufrufen, um Daten zu synchronisieren.
- **Ereignisreaktion**: Externe APIs bei Datenänderungen automatisch aufrufen, um relevante Systeme zu benachrichtigen.
- **Genehmigungs-Workflows**: Genehmigungsanfragen über APIs von Genehmigungssystemen einreichen.

## Funktionen

### Umfassende HTTP-Unterstützung

- Unterstützt alle HTTP-Methoden: GET, POST, PUT, PATCH, DELETE.
- Unterstützt benutzerdefinierte Anfrage-Header (Headers).
- Unterstützt verschiedene Datenformate: JSON, Formulardaten, XML usw.
- Unterstützt verschiedene Parameterarten: URL-Parameter, Pfadparameter, Anfragekörper (Request Body) usw.

### Flexible Datenverarbeitung

- **Variablenreferenzen**: Anfragen dynamisch mithilfe von Workflow-Variablen erstellen.
- **Antwort-Parsing**: JSON-Antworten automatisch parsen und benötigte Daten extrahieren.
- **Datentransformation**: Formatkonvertierung von Anfrage- und Antwortdaten.
- **Fehlerbehandlung**: Wiederholungsstrategien, Timeout-Einstellungen und Fehlerbehandlungslogik konfigurieren.

### Authentifizierung

- **Basic Auth**: HTTP-Basisauthentifizierung.
- **Bearer Token**: Token-Authentifizierung.
- **API Key**: Benutzerdefinierte API-Schlüssel-Authentifizierung.
- **Benutzerdefinierte Header**: Unterstützung für beliebige Authentifizierungsmethoden.

## Nutzungsschritte

### 1. Plugin aktivieren

Der HTTP-Anfrage-Knoten ist eine integrierte Funktion des Workflow-Plugins. Stellen Sie sicher, dass das **[Workflow](/plugins/@nocobase/plugin-workflow/)** Plugin aktiviert ist.

### 2. HTTP-Anfrage-Knoten zum Workflow hinzufügen

1. Erstellen oder bearbeiten Sie einen Workflow.
2. Fügen Sie an der gewünschten Stelle einen **HTTP-Anfrage**-Knoten hinzu.

![HTTP-Anfrage – Knoten hinzufügen](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. Konfigurieren Sie die Anfrageparameter.

### 3. Anfrageparameter konfigurieren

![HTTP-Anfrage-Knoten – Konfiguration](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Basiskonfiguration

- **Anfrage-URL**: Ziel-API-Adresse, unterstützt Variablen.
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **Anfragemethode**: Wählen Sie GET, POST, PUT, DELETE usw.

- **Anfrage-Header**: HTTP-Header konfigurieren.
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **Anfrageparameter**:
  - **Query-Parameter**: URL-Abfrageparameter.
  - **Body-Parameter**: Daten des Anfragekörpers (POST/PUT).

#### Erweiterte Konfiguration

- **Timeout**: Anfrage-Timeout einstellen (Standard: 30 Sekunden).
- **Wiederholung bei Fehler**: Anzahl der Wiederholungen und Wiederholungsintervall konfigurieren.
- **Fehler ignorieren**: Workflow wird auch bei fehlgeschlagener Anfrage fortgesetzt.
- **Proxy-Einstellungen**: HTTP-Proxy konfigurieren (falls erforderlich).

### 4. Antwortdaten verwenden

Nach der Ausführung des HTTP-Anfrage-Knotens können die Antwortdaten in nachfolgenden Knoten verwendet werden:

- `{{$node.data.status}}`: HTTP-Statuscode
- `{{$node.data.headers}}`: Antwort-Header
- `{{$node.data.data}}`: Daten des Antwortkörpers
- `{{$node.data.error}}`: Fehlermeldung (falls die Anfrage fehlgeschlagen ist)

![HTTP-Anfrage-Knoten – Verwendung der Antwort](https://static-docs.nocobase.com/20240529110610.png)

## Beispielszenarien

### Beispiel 1: Wetterinformationen abrufen

```javascript
// Konfiguration
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Antwort verwenden
Temperatur: {{$node.data.data.temperature}}
Wetter: {{$node.data.data.condition}}
```

### Beispiel 2: WeCom-Nachricht senden

```javascript
// Konfiguration
URL: https://qyapi.weixin.qq.com/cgi-bin/message/send
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "touser": "{{$context.userId}}",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "Bestellung {{$context.orderId}} wurde versandt"
  }
}
```

### Beispiel 3: Zahlungsstatus abfragen

```javascript
// Konfiguration
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// Bedingte Logik
Wenn {{$node.data.data.status}} gleich "paid" ist
  - Aktualisieren Sie den Bestellstatus auf "Bezahlt"
  - Senden Sie eine Benachrichtigung über den Zahlungserfolg
Andernfalls, wenn {{$node.data.data.status}} gleich "pending" ist
  - Behalten Sie den Bestellstatus "Zahlung ausstehend" bei
Andernfalls
  - Protokollieren Sie den Zahlungsfehler
  - Benachrichtigen Sie den Administrator, um die Ausnahme zu bearbeiten
```

### Beispiel 4: Daten mit CRM synchronisieren

```javascript
// Konfiguration
URL: https://api.crm.com/v1/customers
Method: POST
Headers:
  X-API-Key: {{$context.crmApiKey}}
  Content-Type: application/json
Body:
{
  "name": "{{$context.customerName}}",
  "email": "{{$context.email}}",
  "phone": "{{$context.phone}}",
  "source": "NocoBase",
  "created_at": "{{$context.createdAt}}"
}
```

## Authentifizierungskonfiguration

### Basic Authentication

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Bearer Token

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### API Key

```javascript
// Im Header
Headers:
  X-API-Key: your-api-key

// Oder in der Query
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

Zuerst `access_token` abrufen, dann verwenden:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Fehlerbehandlung und Debugging

### Häufige Fehler

1. **Verbindungs-Timeout**: Überprüfen Sie die Netzwerkverbindung, erhöhen Sie die Timeout-Zeit.
2. **401 Nicht autorisiert**: Überprüfen Sie, ob die Authentifizierungsinformationen korrekt sind.
3. **404 Nicht gefunden**: Überprüfen Sie, ob die URL korrekt ist.
4. **500 Serverfehler**: Überprüfen Sie den Dienststatus des API-Anbieters.

### Debugging-Tipps

1. **Log-Knoten verwenden**: Fügen Sie vor und nach HTTP-Anfragen Log-Knoten hinzu, um Anfrage- und Antwortdaten aufzuzeichnen.

2. **Ausführungs-Logs überprüfen**: Die Workflow-Ausführungs-Logs enthalten detaillierte Anfrage- und Antwortinformationen.

3. **Test-Tools**: Testen Sie die API zuerst mit Tools wie Postman, cURL usw.

4. **Fehlerbehandlung**: Fügen Sie bedingte Logik hinzu, um verschiedene Antwortstatus zu behandeln.

```javascript
Wenn {{$node.data.status}} >= 200 und {{$node.data.status}} < 300 ist
  - Erfolgslogik verarbeiten
Andernfalls
  - Fehlerlogik verarbeiten
  - Fehler protokollieren: {{$node.data.error}}
```

## Leistungsoptimierung

### 1. Asynchrone Verarbeitung verwenden

Für Anfragen, die keine sofortigen Ergebnisse erfordern, sollten Sie asynchrone Workflows in Betracht ziehen.

### 2. Angemessene Timeouts konfigurieren

Legen Sie Timeouts basierend auf den tatsächlichen API-Antwortzeiten fest, um übermäßige Wartezeiten zu vermeiden.

### 3. Caching-Strategien implementieren

Für selten geänderte Daten (Konfigurationen, Dictionaries) sollten Sie das Caching von Antworten in Betracht ziehen.

### 4. Stapelverarbeitung

Wenn Sie mehrere Aufrufe an dieselbe API tätigen müssen, sollten Sie die Verwendung von Batch-Schnittstellen der API in Betracht ziehen (falls unterstützt).

### 5. Fehlerwiederholung

Konfigurieren Sie angemessene Wiederholungsstrategien, aber vermeiden Sie übermäßige Wiederholungen, die zu einer API-Ratenbegrenzung führen könnten.

## Sicherheits-Best Practices

### 1. Sensible Informationen schützen

- Geben Sie keine sensiblen Informationen in URLs preis.
- Verwenden Sie HTTPS für die verschlüsselte Übertragung.
- Speichern Sie API-Schlüssel und andere sensible Daten in Umgebungsvariablen oder im Konfigurationsmanagement.

### 2. Antwortdaten validieren

```javascript
// Antwortstatus validieren
if (![200, 201].includes($node.data.status)) {
  throw new Error('API request failed');
}

// Datenformat validieren
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Invalid response data');
}
```

### 3. Anfragefrequenz begrenzen

Beachten Sie die Ratenbegrenzungen von Drittanbieter-APIs, um eine Blockierung zu vermeiden.

### 4. Log-Anonymisierung

Achten Sie beim Protokollieren darauf, sensible Informationen (Passwörter, Schlüssel usw.) zu anonymisieren.

## Vergleich mit Webhooks

| Merkmal | HTTP-Anfrage-Knoten | Webhook-Trigger |
|---------|---------------------|-----------------|
| Richtung | NocoBase ruft extern auf | Extern ruft NocoBase auf |
| Zeitpunkt | Während der Workflow-Ausführung | Bei externem Ereignis |
| Zweck | Daten abrufen, externe Operationen auslösen | Externe Benachrichtigungen, Ereignisse empfangen |
| Typische Szenarien | Zahlungs-API aufrufen, Wetter abfragen | Zahlungs-Callbacks, Nachrichtenbenachrichtigungen |

Diese beiden Funktionen ergänzen sich gegenseitig und bilden zusammen eine vollständige Systemintegrationslösung.

## Verwandte Ressourcen

- [Dokumentation des Workflow Plugins](/plugins/@nocobase/plugin-workflow/)
- [Workflow: HTTP-Anfrage-Knoten](/workflow/nodes/request)
- [Workflow: Webhook-Trigger](/integration/workflow-webhook/)
- [API-Schlüssel-Authentifizierung](/integration/api-keys/)
- [API-Dokumentations-Plugin](/plugins/@nocobase/plugin-api-doc/)