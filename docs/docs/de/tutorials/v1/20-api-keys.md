# Daten mit API-Keys abrufen

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114233060688108&bvid=BV1m8ZuY4E2V&cid=29092153179&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Willkommen zu diesem Tutorial. Wir zeigen Schritt für Schritt am Beispiel einer To-do-Liste, wie Sie in NocoBase einen API-Key zum Abrufen von Daten verwenden. Lesen Sie die folgenden Abschnitte aufmerksam und folgen Sie den Schritten.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Was ist ein API-Key?

Bevor wir starten, klären wir den Begriff API-Key. Stellen Sie ihn sich wie eine Eintrittskarte vor: Er bestätigt, dass eine API-Anfrage von einem legitimen Benutzer stammt. Ob Sie das NocoBase-System per Webbrowser, mobiler App oder Backend-Skript ansprechen - dieser „geheime Schlüssel" hilft dem System, Ihre Identität zu verifizieren.

Im HTTP-Request-Header sieht das so aus:

```txt
Authorization: Bearer {API-Key}
```

„Bearer" signalisiert, dass der API-Key folgt und der Anwender authentifiziert wird.

Typische Anwendungsfälle:

1. **Client-Anwendungen**: Wenn Anwender per Browser oder mobiler App APIs aufrufen, prüft das System die Identität anhand des API-Keys.
2. **Automatisierte Aufgaben**: Geplante Backend-Jobs oder Skripte nutzen API-Keys zur Sicherheit ihrer Anfragen.
3. **Entwicklung und Tests**: Entwickler simulieren Anfragen mit API-Keys, um Schnittstellen korrekt zu testen.

Kurz: API-Keys helfen, Identitäten zu verifizieren, Aufrufe zu überwachen, Anfragefrequenz zu begrenzen und Sicherheitsbedrohungen abzuwehren - so bleibt der Betrieb von NocoBase stabil.

## 2 API-Key in NocoBase erstellen

### 2.1 Plugin [API-Key](https://docs-cn.nocobase.com/handbook/api-keys) aktivieren

Aktivieren Sie zunächst das eingebaute Plugin „Authentifizierung: API-Keys". Im Anschluss erscheint im Einstellungs-Center eine [API-Keys](https://docs-cn.nocobase.com/handbook/api-keys)-Konfigurationsseite.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Test-Tabelle für To-dos anlegen

Für den Test legen wir eine Tabelle `todos` an mit den Feldern:

- `id`
- `title`
- `completed`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Erfassen Sie ein paar Test-To-dos, z. B.:

- Essen
- Schlafen
- Spielen

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Rolle anlegen und zuweisen

Da API-Keys an Rollen gebunden sind und das System Rechte auf dieser Basis prüft, legen wir vor der Erstellung des Keys eine Rolle mit den nötigen Rechten an.
Empfohlen: Eine Testrolle „Todo-API-Rolle" anlegen und ihr alle Rechte auf der Todo-Tabelle zuweisen.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Falls Sie beim Erstellen des API-Keys die Rolle „Todo-System-API-Rolle" nicht auswählen können, hat Ihr aktueller Benutzer diese Rolle vermutlich noch nicht. Weisen Sie ihm die Rolle zu:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Nach Zuweisung und Aktualisierung der Seite öffnen Sie die API-Key-Verwaltung und klicken auf „API-Key hinzufügen". Die Rolle „Todo-System-API-Rolle" erscheint nun:

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Für eine präzisere Verwaltung können Sie zudem einen separaten Benutzer „Todo-API-Benutzer" anlegen, ihm die „Todo-API-Rolle" zuweisen und mit ihm die API-Keys testen und verwalten.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 API-Key erstellen und sichern

Nach dem Senden zeigt das System einen Hinweis und blendet den API-Key im Popup ein. Kopieren und sichern Sie ihn sofort - aus Sicherheitsgründen wird er später nicht erneut angezeigt.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Beispielsweise erhalten Sie einen API-Key wie:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Hinweise

- Die Gültigkeitsdauer hängt von Ihrer Auswahl bei der Anlage ab.
- Generierung und Validierung des API-Keys sind eng mit der Umgebungsvariablen `APP_KEY` verbunden. Ändern Sie diese nicht ohne Grund - andernfalls werden alle bestehenden API-Keys ungültig.

## 3 Gültigkeit des API-Keys testen

### 3.1 Plugin [API-Doc](https://docs-cn.nocobase.com/handbook/api-doc) verwenden

Im API-Doc-Plugin sehen Sie für jede Schnittstelle Methode, URL, Parameter und Header.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Grundlegende CRUD-Endpunkte

NocoBase bietet folgende Standard-Endpunkte:

- **List:**

  ```txt
  GET {baseURL}/{collectionName}:list
  Header:
  - Authorization: Bearer <API-Key>

  ```
- **Create:**

  ```txt
  POST {baseURL}/{collectionName}:create

  Header:
  - Authorization: Bearer <API-Key>

  Body (JSON), z. B.:
      {
          "title": "123"
      }
  ```
- **Update:**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  Header:
  - Authorization: Bearer <API-Key>

  Body (JSON), z. B.:
      {
          "title": "123",
          "completed": true
      }
  ```
- **Delete:**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  Header:
  - Authorization: Bearer <API-Key>
  ```

`{baseURL}` ist die Adresse Ihres NocoBase-Systems, `{collectionName}` der Tabellenname. Lokal ist die URL z. B. `localhost:13000`, der Tabellenname `todos`, somit:

```txt
http://localhost:13000/todos:list
```

### 3.3 Test mit Postman (Beispiel: List)

Öffnen Sie Postman, legen Sie einen GET-Request mit obiger URL an und tragen Sie im Header `Authorization` Ihren API-Key ein:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)
Senden Sie die Anfrage. Bei erfolgreicher Authentifizierung erhalten Sie ein Ergebnis wie:

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

Bei fehlender Berechtigung kann eine Fehlermeldung wie folgt erscheinen:

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

In diesem Fall prüfen Sie Rollenrechte, API-Key-Bindung und das Format des Keys.

### 3.4 Code aus Postman kopieren

Nach erfolgreichem Test können Sie den Code des List-Requests kopieren. Beispielsweise dieser cURL-Aufruf:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 To-dos im [iframe-Block](https://docs-cn.nocobase.com/handbook/block-iframe) anzeigen

Damit Sie die API-Anfragen anschaulicher erleben, zeigen wir die abgerufene To-do-Liste in einer einfachen HTML-Seite:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List</title>
</head>
<body>
    <h1>Todo List</h1>
    <pre id="result"></pre>

    <script>
        fetch('http://localhost:13000/api/todos:list', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    </script>
</body>
</html>
```

Diese Seite zeigt im iframe-Block eine einfache „Todo List" - beim Laden ruft sie die API auf und gibt die Antwort als formatierten JSON aus.

In folgendem Animationsbeispiel sehen Sie die Anfrage live:

![202503031918-fetch](https://static-docs.nocobase.com/202503031918-fetch.gif)

## 5 Zusammenfassung

Schritt für Schritt haben wir gezeigt, wie Sie in NocoBase API-Keys erstellen und nutzen: Plugin aktivieren, Datentabelle anlegen, Rolle binden, Schnittstelle testen und Daten im iframe-Block anzeigen. Mit Hilfe von DeepSeek haben wir abschließend eine einfache To-do-Seite umgesetzt - passen Sie den Code nach Bedarf an.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

[Den Beispielcode](https://forum.nocobase.com/t/api-api-key/3314) finden Sie im Forum. Wir hoffen, dieses Dokument bietet Ihnen klare Orientierung. Viel Spaß beim Lernen!
