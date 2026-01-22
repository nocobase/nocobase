---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# REST API Datenquelle

## Einführung

Dieses Plugin ermöglicht Ihnen die nahtlose Integration von Daten aus REST API Quellen.

## Installation

Dieses Plugin ist ein kommerzielles Plugin und muss über den Plugin-Manager hochgeladen und aktiviert werden.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## Hinzufügen einer REST API Datenquelle

Nach der Aktivierung des Plugins können Sie eine REST API Datenquelle hinzufügen, indem Sie diese im Dropdown-Menü „Neu hinzufügen“ der Datenquellenverwaltung auswählen.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Konfigurieren Sie die REST API Datenquelle.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Hinzufügen einer Sammlung

In NocoBase wird eine RESTful-Ressource einer Sammlung zugeordnet, zum Beispiel eine Benutzer-Ressource.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Diese API-Endpunkte werden in NocoBase wie folgt zugeordnet:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Eine umfassende Anleitung zu den NocoBase API-Designspezifikationen finden Sie in der API-Dokumentation.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Lesen Sie das Kapitel „NocoBase API – Core“ für detaillierte Informationen.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

Die Sammlungskonfiguration für eine REST API Datenquelle umfasst Folgendes:

### List

Konfigurieren Sie die Schnittstellen-Zuordnung für die Anzeige einer Ressourcenliste.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Get

Konfigurieren Sie die Schnittstellen-Zuordnung für die Anzeige von Ressourcendetails.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Create

Konfigurieren Sie die Schnittstellen-Zuordnung für die Erstellung einer Ressource.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Update

Konfigurieren Sie die Schnittstellen-Zuordnung für die Aktualisierung einer Ressource.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Destroy

Konfigurieren Sie die Schnittstellen-Zuordnung für das Löschen einer Ressource.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

Die Schnittstellen „List“ und „Get“ müssen beide konfiguriert werden.

## Debugging der API

### Integration von Anfrageparametern

Beispiel: Konfigurieren Sie Paginierungsparameter für die List-API. Falls die Drittanbieter-API selbst keine Paginierung unterstützt, paginiert NocoBase basierend auf den abgerufenen Listendaten.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

Bitte beachten Sie, dass nur Variablen wirksam werden, die in der Schnittstelle hinzugefügt wurden.

| Parametername der Drittanbieter-API | NocoBase-Parameter              |
| ----------------------------------- | ------------------------------- |
| page                                | {{request.params.page}}         |
| limit                               | {{request.params.pageSize}}     |

Sie können auf „Try it out“ klicken, um die Debugging-Funktion zu nutzen und die Antwort anzuzeigen.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Transformation des Antwortformats

Das Antwortformat der Drittanbieter-API entspricht möglicherweise nicht dem NocoBase-Standard und muss transformiert werden, bevor es korrekt im Frontend angezeigt werden kann.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

Passen Sie die Konvertierungsregeln basierend auf dem Antwortformat der Drittanbieter-API an, um sicherzustellen, dass die Ausgabe dem NocoBase-Standard entspricht.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

Beschreibung des Debugging-Prozesses

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## Variablen

Die REST API Datenquelle unterstützt drei Arten von Variablen für die API-Integration:

- Benutzerdefinierte Datenquellenvariablen
- NocoBase-Anfragevariablen
- Drittanbieter-Antwortvariablen

### Benutzerdefinierte Datenquellenvariablen

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### NocoBase-Anfrage

- Params: URL-Abfrageparameter (Search Params), die je nach Schnittstelle variieren.
- Headers: Benutzerdefinierte Anfrage-Header, die hauptsächlich spezifische X-Informationen von NocoBase bereitstellen.
- Body: Der Anfragetext (Body).
- Token: Der API-Token für die aktuelle NocoBase-Anfrage.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### Drittanbieter-Antworten

Derzeit ist nur der Antworttext (Body) verfügbar.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

Die für jede Schnittstelle verfügbaren Variablen sind unten aufgeführt:

### List

| Parameter               | Beschreibung                                                 |
| ----------------------- | ------------------------------------------------------------ |
| request.params.page     | Aktuelle Seite                                               |
| request.params.pageSize | Anzahl der Elemente pro Seite                                |
| request.params.filter   | Filterkriterien (müssen dem NocoBase Filter-Format entsprechen) |
| request.params.sort     | Sortierkriterien (müssen dem NocoBase Sort-Format entsprechen) |
| request.params.appends  | Bedarfsweise zu ladende Felder, typischerweise für Verknüpfungsfelder |
| request.params.fields   | Einzuschließende Felder (Whitelist)                          |
| request.params.except   | Auszuschließende Felder (Blacklist)                          |

### Get

| Parameter                 | Beschreibung                                                 |
| ------------------------- | ------------------------------------------------------------ |
| request.params.filterByTk | Erforderlich, typischerweise die ID des aktuellen Datensatzes |
| request.params.filter     | Filterkriterien (müssen dem NocoBase Filter-Format entsprechen) |
| request.params.appends    | Bedarfsweise zu ladende Felder, typischerweise für Verknüpfungsfelder |
| request.params.fields     | Einzuschließende Felder (Whitelist)                          |
| request.params.except     | Auszuschließende Felder (Blacklist)                          |

### Create

| Parameter                | Beschreibung                   |
| ------------------------ | ------------------------------ |
| request.params.whiteList | Whitelist                      |
| request.params.blacklist | Blacklist                      |
| request.body             | Anfangsdaten für die Erstellung |

### Update

| Parameter                 | Beschreibung                                                 |
| ------------------------- | ------------------------------------------------------------ |
| request.params.filterByTk | Erforderlich, typischerweise die ID des aktuellen Datensatzes |
| request.params.filter     | Filterkriterien (müssen dem NocoBase Filter-Format entsprechen) |
| request.params.whiteList  | Whitelist                                                    |
| request.params.blacklist  | Blacklist                                                    |
| request.body              | Daten für die Aktualisierung                                 |

### Destroy

| Parameter                 | Beschreibung                                                 |
| ------------------------- | ------------------------------------------------------------ |
| request.params.filterByTk | Erforderlich, typischerweise die ID des aktuellen Datensatzes |
| request.params.filter     | Filterkriterien (müssen dem NocoBase Filter-Format entsprechen) |

## Feldkonfiguration

Feldmetadaten (Felder) werden aus den CRUD-Schnittstellendaten der angepassten Ressource extrahiert, um als Felder der Sammlung zu dienen.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Extrahieren Sie Feldmetadaten.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

Felder und Vorschau.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Felder bearbeiten (ähnlich wie bei anderen Datenquellen).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Hinzufügen von REST API Datenquellen-Blöcken

Sobald die Sammlung konfiguriert ist, können Sie Blöcke zur Oberfläche hinzufügen.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)