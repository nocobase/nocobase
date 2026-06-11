---
pkg: '@nocobase/plugin-app-supervisor'
title: 'Sub-App-APIs aufrufen'
description: 'So rufen Sie Sub-App-APIs in Multi-App auf: Zugriff über die Einstiegs-App und Angabe der Ziel-Sub-App per Pfadpräfix, Request-Header oder Query-Parameter.'
keywords: 'Multi-App,Sub-App API,AppSupervisor,Einstiegs-App,API-Aufruf,NocoBase'
---

# Sub-App-APIs aufrufen

In einer Multi-App-Umgebung hat jede Sub-App eigene unabhängige APIs. Beim Aufruf einer Sub-App-API muss die Einstiegs-App wissen, an welche Sub-App die Anfrage weitergeleitet werden soll.

Eine API der Haupt-App sieht zum Beispiel normalerweise so aus:

```bash
GET /api/users:list
```

`/api` ist das Standard-API-Präfix und kann über die Umgebungsvariable `API_BASE_PATH` angepasst werden.

Um dieselbe API in einer Sub-App aufzurufen, geben Sie den Namen der Sub-App in der Anfrage an.

## Pfadpräfix verwenden

Verwenden Sie das Präfix `/api/__app/<appName>/`, um Sub-App-APIs aufzurufen:

```bash
GET /api/__app/a_xxx/users:list
```

Dabei gilt:

- `a_xxx` ist der Name der Sub-App
- `users:list` ist die aufzurufende Ressource und Aktion
- `/api` ist der API-Basispfad des aktuellen Systems

Query-Parameter können wie gewohnt angehängt werden:

```bash
GET /api/__app/a_xxx/users:list?page=1&pageSize=20
```

Diese Methode ist eindeutig und eignet sich gut, wenn Sub-App-APIs in Multi-Umgebungsbereitstellungen einheitlich über die Einstiegs-App aufgerufen werden.

## Sub-App per Request-Header angeben

Wenn der Aufrufer bereits eine feste `/api/...`-Adresse verwendet, kann die Sub-App über den Header `X-App` angegeben werden:

```bash
curl \
  -H "X-App: a_xxx" \
  http://localhost:13003/api/users:list
```

Dies eignet sich für Backend-Service-Aufrufe oder wenn ein Frontend-Request-Werkzeug API-Adressen bereits zentral kapselt und nur ein zusätzlicher Header benötigt wird.

## Sub-App per Query-Parameter angeben

Die Sub-App kann auch über den Query-Parameter `__appName` angegeben werden:

```bash
GET /api/users:list?__appName=a_xxx
```

Weitere Query-Parameter können gemeinsam übergeben werden:

```bash
GET /api/users:list?__appName=a_xxx&page=1&pageSize=20
```

Im Allgemeinen sind Pfadpräfix oder Request-Header klarer, weil die Ziel-Sub-App deutlicher erkennbar ist.

## API-Adresse in Multi-Umgebungsbereitstellungen

In Multi-Umgebungsbereitstellungen gibt es normalerweise eine Einstiegs-App und mehrere Laufzeitumgebungen.

Beispiel:

- Adresse der Einstiegs-App: `http://localhost:13003`
- Adresse einer Laufzeitumgebung: `http://localhost:14000`

Beim Aufruf von Sub-App-APIs wird empfohlen, über die Einstiegs-App zuzugreifen:

```bash
GET http://localhost:13003/api/__app/a_xxx/users:list
```

Die Einstiegs-App leitet die Anfrage gemäß Anwendungskonfiguration an die entsprechende Sub-App weiter. Wenn klar ist, welche Laufzeitumgebung aufgerufen werden soll, kann auch deren Adresse verwendet werden.

```bash
GET http://localhost:14000/api/__app/a_xxx/users:list
```

## Eigene Domains von Sub-Apps

Wenn eine Sub-App eine eigene Zugriffs-Domain hat, können Sie die APIs dieser Sub-App auch direkt über diese Domain aufrufen:

```bash
GET https://app-example.example.com/api/users:list
```

Wenn Sie einheitlich über die Einstiegs-App gehen möchten, verwenden Sie weiterhin die Adresse `/api/__app/<appName>/...` der Einstiegs-App.

## Authentifizierung

Beim Aufruf von Sub-App-APIs basiert die Berechtigungsprüfung weiterhin auf der Ziel-Sub-App.

Das bedeutet:

- Es wird ein für die Sub-App gültiger Anmeldestatus oder Zugriffstoken benötigt
- Der Anmeldestatus der Haupt-App entspricht nicht automatisch API-Berechtigungen in der Sub-App

Wenn die Anfrage keine gültigen Authentifizierungsinformationen enthält, gibt die Sub-App gemäß ihrer eigenen Authentifizierungskonfiguration einen Nicht-angemeldet- oder Keine-Berechtigung-Fehler zurück.
