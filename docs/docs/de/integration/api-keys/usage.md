:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# API-Schlüssel in NocoBase verwenden

Diese Anleitung zeigt Ihnen anhand eines praktischen "To-Do"-Beispiels, wie Sie API-Schlüssel in NocoBase verwenden, um Daten abzurufen. Folgen Sie den Schritt-für-Schritt-Anweisungen, um den gesamten Workflow zu verstehen.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 API-Schlüssel verstehen

Ein API-Schlüssel ist ein sicheres Token, das API-Anfragen von autorisierten Benutzern authentifiziert. Er dient als Anmeldeinformation, die die Identität des Anfragenden überprüft, wenn dieser über Webanwendungen, mobile Apps oder Backend-Skripte auf das NocoBase-System zugreift.

Das Format im HTTP-Anfrage-Header sieht so aus:

```txt
Authorization: Bearer {API-Schlüssel}
```

Das Präfix "Bearer" zeigt an, dass die folgende Zeichenfolge ein authentifizierter API-Schlüssel ist, der zur Überprüfung der Berechtigungen des Anfragenden verwendet wird.

### Häufige Anwendungsfälle

API-Schlüssel werden typischerweise in den folgenden Szenarien verwendet:

1.  **Zugriff von Client-Anwendungen**: Webbrowser und mobile Apps verwenden API-Schlüssel, um die Benutzeridentität zu authentifizieren und sicherzustellen, dass nur autorisierte Benutzer auf Daten zugreifen können.
2.  **Ausführung automatisierter Aufgaben**: Hintergrundprozesse und geplante Aufgaben verwenden API-Schlüssel, um Aktualisierungen, Datensynchronisation und Protokollierungsoperationen sicher auszuführen.
3.  **Entwicklung und Tests**: Entwickler verwenden API-Schlüssel während des Debuggings und Testens, um authentifizierte Anfragen zu simulieren und API-Antworten zu überprüfen.

API-Schlüssel bieten mehrere Sicherheitsvorteile: Identitätsprüfung, Nutzungsüberwachung, Begrenzung der Anfragerate und Bedrohungsprävention, wodurch der stabile und sichere Betrieb von NocoBase gewährleistet wird.

## 2 API-Schlüssel in NocoBase erstellen

### 2.1 Plugin "Authentifizierung: API-Schlüssel" aktivieren

Stellen Sie sicher, dass das integrierte [Authentifizierung: API-Schlüssel](/plugins/@nocobase/plugin-api-keys/)-Plugin aktiviert ist. Nach der Aktivierung erscheint eine neue Konfigurationsseite für API-Schlüssel in den Systemeinstellungen.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Eine Test-Sammlung erstellen

Erstellen Sie zu Demonstrationszwecken eine Sammlung namens `todos` mit den folgenden Feldern:

- `id`
- `Titel (title)`
- `Abgeschlossen (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Fügen Sie der Sammlung einige Beispieldatensätze hinzu:

- Essen
- Schlafen
- Spiele spielen

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Eine Rolle erstellen und zuweisen

API-Schlüssel sind an Benutzerrollen gebunden, und das System bestimmt die Anfragerechte basierend auf der zugewiesenen Rolle. Bevor Sie einen API-Schlüssel erstellen, müssen Sie eine Rolle erstellen und die entsprechenden Berechtigungen konfigurieren. Erstellen Sie eine Rolle namens "To-Do-API-Rolle" und gewähren Sie ihr vollen Zugriff auf die `todos`-Sammlung.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Falls die "To-Do-API-Rolle" beim Erstellen eines API-Schlüssels nicht verfügbar ist, stellen Sie sicher, dass dem aktuellen Benutzer diese Rolle zugewiesen wurde:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Nach der Rollenzuweisung aktualisieren Sie die Seite und navigieren Sie zur Verwaltungsseite für API-Schlüssel. Klicken Sie auf "API-Schlüssel hinzufügen", um zu überprüfen, ob die "To-Do-API-Rolle" in der Rollenauswahl erscheint.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Für eine bessere Zugriffskontrolle können Sie erwägen, ein dediziertes Benutzerkonto (z. B. "To-Do-API-Benutzer") speziell für die API-Schlüsselverwaltung und -tests zu erstellen. Weisen Sie diesem Benutzer die "To-Do-API-Rolle" zu.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 API-Schlüssel generieren und speichern

Nach dem Absenden des Formulars zeigt das System eine Bestätigungsnachricht mit dem neu generierten API-Schlüssel an. **Wichtig**: Kopieren und speichern Sie diesen Schlüssel sofort sicher, da er aus Sicherheitsgründen nicht erneut angezeigt wird.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Beispiel-API-Schlüssel:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Wichtige Hinweise

- Die Gültigkeitsdauer des API-Schlüssels wird durch die bei der Erstellung konfigurierten Ablauf-Einstellungen bestimmt.
- Die Generierung und Überprüfung von API-Schlüsseln hängt von der Umgebungsvariable `APP_KEY` ab. **Ändern Sie diese Variable nicht**, da dies alle vorhandenen API-Schlüssel im System ungültig machen würde.

## 3 API-Schlüssel-Authentifizierung testen

### 3.1 Das API-Dokumentations-Plugin verwenden

Öffnen Sie das [API-Dokumentations-Plugin](/plugins/@nocobase/plugin-api-doc/), um die Anfragemethoden, URLs, Parameter und Header für jeden API-Endpunkt anzuzeigen.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Grundlegende CRUD-Operationen verstehen

NocoBase bietet Standard-CRUD-APIs (Create, Read, Update, Delete) für die Datenmanipulation:

- **Listenabfrage (list API):**

  ```txt
  GET {baseURL}/{collectionName}:list
  Anfrage-Header:
  - Authorization: Bearer <API-Schlüssel>

  ```
- **Datensatz erstellen (create API):**

  ```txt
  POST {baseURL}/{collectionName}:create

  Anfrage-Header:
  - Authorization: Bearer <API-Schlüssel>

  Anfragetext (im JSON-Format), zum Beispiel:
      {
          "title": "123"
      }
  ```
- **Datensatz aktualisieren (update API):**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  Anfrage-Header:
  - Authorization: Bearer <API-Schlüssel>

  Anfragetext (im JSON-Format), zum Beispiel:
      {
          "title": "123",
          "completed": true
      }
  ```
- **Datensatz löschen (delete API):**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  Anfrage-Header:
  - Authorization: Bearer <API-Schlüssel>
  ```

Dabei gilt:
- `{baseURL}`: Ihre NocoBase-System-URL
- `{collectionName}`: Der Name der Sammlung

Beispiel: Für eine lokale Instanz unter `localhost:13000` mit einer Sammlung namens `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Testen mit Postman

Erstellen Sie in Postman eine GET-Anfrage mit folgender Konfiguration:
- **URL**: Der Anfrage-Endpunkt (z. B. `http://localhost:13000/api/todos:list`)
- **Header**: Fügen Sie den `Authorization`-Header mit dem Wert hinzu:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Erfolgreiche Antwort:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**Fehlerantwort (ungültiger/abgelaufener API-Schlüssel):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**Fehlerbehebung**: Wenn die Authentifizierung fehlschlägt, überprüfen Sie die Rollenberechtigungen, die API-Schlüsselbindung und das Token-Format.

### 3.4 Anfragecode exportieren

Postman ermöglicht den Export von Anfragen in verschiedenen Formaten. Beispiel eines cURL-Befehls:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 API-Schlüssel in JS-Blöcken verwenden

NocoBase 2.0 unterstützt das direkte Schreiben von nativem JavaScript-Code auf Seiten mithilfe von JS-Blöcken. Dieses Beispiel zeigt, wie Sie API-Schlüssel verwenden, um externe API-Daten abzurufen.

### Einen JS-Block erstellen

Fügen Sie auf Ihrer NocoBase-Seite einen JS-Block hinzu und verwenden Sie den folgenden Code, um To-Do-Daten abzurufen:

```javascript
// To-Do-Daten mit API-Schlüssel abrufen
async function fetchTodos() {
  try {
    // Ladehinweis anzeigen
    ctx.message.loading('Daten werden abgerufen...');

    // axios-Bibliothek für HTTP-Anfragen laden
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('HTTP-Bibliothek konnte nicht geladen werden');
      return;
    }

    // API-Schlüssel (ersetzen Sie diesen durch Ihren tatsächlichen API-Schlüssel)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // API-Anfrage senden
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Ergebnisse anzeigen
    console.log('To-Do-Liste:', response.data);
    ctx.message.success(`Erfolgreich ${response.data.data.length} Elemente abgerufen`);

    // Hier können Sie die Daten verarbeiten
    // Zum Beispiel: in einer Tabelle anzeigen, Formularfelder aktualisieren usw.

  } catch (error) {
    console.error('Fehler beim Abrufen der Daten:', error);
    ctx.message.error('Daten konnten nicht abgerufen werden: ' + error.message);
  }
}

// Funktion ausführen
fetchTodos();
```

### Wichtige Punkte

- **ctx.requireAsync()**: Lädt externe Bibliotheken (wie axios) dynamisch für HTTP-Anfragen
- **ctx.message**: Zeigt Benutzerbenachrichtigungen an (Laden, Erfolg, Fehlermeldungen)
- **API-Schlüssel-Authentifizierung**: Übergeben Sie den API-Schlüssel im `Authorization`-Header mit dem `Bearer`-Präfix
- **Antwortverarbeitung**: Verarbeiten Sie die zurückgegebenen Daten nach Bedarf (anzeigen, umwandeln usw.)

## 5 Zusammenfassung

Diese Anleitung hat den vollständigen Workflow zur Verwendung von API-Schlüsseln in NocoBase behandelt:

1.  **Einrichtung**: Aktivierung des API-Schlüssel-Plugins und Erstellung einer Test-Sammlung
2.  **Konfiguration**: Erstellung von Rollen mit den entsprechenden Berechtigungen und Generierung von API-Schlüsseln
3.  **Testen**: Validierung der API-Schlüssel-Authentifizierung mithilfe von Postman und dem API-Dokumentations-Plugin
4.  **Integration**: Verwendung von API-Schlüsseln in JS-Blöcken

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**Weitere Ressourcen:**
- [Dokumentation des API-Schlüssel-Plugins](/plugins/@nocobase/plugin-api-keys/)
- [API-Dokumentations-Plugin](/plugins/@nocobase/plugin-api-doc/)