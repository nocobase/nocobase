---
title: "REST-API-Datenquelle"
description: "Binden Sie Daten aus REST-API-Quellen an, ordnen Sie RESTful-Ressourcen Collections zu, konfigurieren Sie Zuordnungen für List/Get/Create/Update/Destroy-Schnittstellen und unterstützen Sie CRUD-Operationen."
keywords: "REST-API-Datenquelle,externe API,Schnittstellenzuordnung,Collection-Zuordnung,NocoBase"
---

# REST-API-Datenquelle

<PluginInfo commercial="true" name="data-source-rest-api"></PluginInfo>

## Einführung

Dient zum Anbinden von Daten aus REST-API-Quellen.

## Installation

Dieses Plugin ist ein kommerzielles Plugin. Einzelheiten zur Aktivierung finden Sie unter [Leitfaden zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).

## REST-API-Quelle hinzufügen

Wählen Sie nach der Aktivierung des Plugins im Dropdown-Menü „Add new“ der Datenquellenverwaltung die Option REST API aus.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

REST-API-Quelle konfigurieren

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Collection hinzufügen

RESTful-Ressourcen entsprechen den Collections von NocoBase, zum Beispiel der Ressource Users.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Die entsprechende Konfiguration in der NocoBase-API lautet:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Die vollständige Spezifikation des NocoBase-API-Designs finden Sie in der API-Dokumentation.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Siehe den Abschnitt „NocoBase API - Core“.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

Die Collection-Konfiguration der REST-API-Datenquelle sieht wie folgt aus:

### List

Konfigurieren Sie die Zuordnung der Schnittstelle zum Abrufen der Ressourcenliste.

![20251201162457](https://static-docs.nocobase.com/20251201162457.png)

### Get

Konfigurieren Sie die Zuordnung der Schnittstelle zum Abrufen der Ressourcendetails.

![20251201162744](https://static-docs.nocobase.com/20251201162744.png)

### Create

Konfigurieren Sie die Zuordnung der Schnittstelle zum Erstellen einer Ressource.

![20251201163000](https://static-docs.nocobase.com/20251201163000.png)

### Update

Konfigurieren Sie die Zuordnung der Schnittstelle zum Aktualisieren einer Ressource.
![20251201163058](https://static-docs.nocobase.com/20251201163058.png)

### Destroy

Konfigurieren Sie die Zuordnung der Schnittstelle zum Löschen einer Ressource.

![20251201163204](https://static-docs.nocobase.com/20251201163204.png)

Die Schnittstellen List und Get müssen konfiguriert werden.
## API debuggen

### Anforderungsparameter anbinden

Beispiel: Konfigurieren Sie Seitenparameter für die List-Schnittstelle. (Wenn die Drittanbieter-API selbst keine Seitennummerierung unterstützt, werden die abgerufenen Listendaten nachträglich paginiert.)

![20251201163500](https://static-docs.nocobase.com/20251201163500.png)

Beachten Sie, dass nur Variablen wirksam werden, die bereits in der Schnittstelle hinzugefügt wurden.

| Parametername für die Drittanbieter-API | NocoBase-Parameter          |
| -------------------------------------- | --------------------------- |
| page                                   | {{request.params.page}}     |
| limit                                  | {{request.params.pageSize}} |

Klicken Sie auf „Try it out“, um die Konfiguration zu testen und das Antwortergebnis anzuzeigen.

![20251201163635](https://static-docs.nocobase.com/20251201163635.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Antwortformat konvertieren

Das Antwortformat der Drittanbieter-API entspricht möglicherweise nicht dem NocoBase-Standard und muss konvertiert werden, damit es im Frontend korrekt angezeigt werden kann.

![20251201164529](https://static-docs.nocobase.com/20251201164529.png)

Passen Sie die Konvertierungsregeln entsprechend dem Antwortformat der Drittanbieter-API an, damit sie dem NocoBase-Ausgabestandard entsprechen.

![20251201164629](https://static-docs.nocobase.com/20251201164629.png)

Beschreibung des Debugging-Ablaufs

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

### Fehlerinformationen konvertieren

Wenn bei der Drittanbieter-API ein Fehler auftritt, entspricht das Format der Fehlerantwort möglicherweise nicht dem NocoBase-Standard und muss konvertiert werden, damit es im Frontend korrekt angezeigt werden kann.

![20251201170545](https://static-docs.nocobase.com/20251201170545.png)

Wenn keine Konvertierung der Fehlerinformationen konfiguriert ist, werden sie standardmäßig in eine Fehlermeldung mit HTTP-Statuscode umgewandelt.

![20251201170732](https://static-docs.nocobase.com/20251201170732.png)

Nach der Konfiguration der Fehlerinformationskonvertierung entsprechen die Fehlerinformationen dem NocoBase-Ausgabestandard, sodass das Frontend die Fehler der Drittanbieter-API korrekt anzeigen kann.

![20251201170946](https://static-docs.nocobase.com/20251201170946.png)
![20251201171113](https://static-docs.nocobase.com/20251201171113.png)

## Variablen

Die REST-API-Datenquelle stellt drei Arten von Variablen für die Anbindung von Schnittstellen bereit:

- Benutzerdefinierte Variablen der Datenquelle
- NocoBase-Anfrage
- Antwort der Drittanbieter-API

### Benutzerdefinierte Variablen der Datenquelle

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### NocoBase-Anfrage

- Params: URL-Abfrageparameter (Search Params); die Params unterscheiden sich je nach Schnittstelle.
- Headers: Anfrage-Header; stellen hauptsächlich einige benutzerdefinierte X-Informationen von NocoBase bereit.
- Body: Body der Anfrage.
- Token: API-Token der aktuellen NocoBase-Anfrage.

![20251201164833](https://static-docs.nocobase.com/20251201164833.png)

### Antwort der Drittanbieter-API

Derzeit wird nur der Body der Antwort bereitgestellt.

![20251201164915](https://static-docs.nocobase.com/20251201164915.png)

Bei der Anbindung der einzelnen Schnittstellen stehen die folgenden Variablen zur Verfügung:

### List

| Parameter                 | Beschreibung                                           |
| ------------------------- | ------------------------------------------------------ |
| request.params.page      | Aktuelle Seitenzahl                                    |
| request.params.pageSize  | Anzahl der Einträge pro Seite                         |
| request.params.filter    | Filterbedingungen (müssen dem NocoBase-Filterformat entsprechen) |
| request.params.sort      | Sortierregeln (müssen dem NocoBase-Sortierformat entsprechen)   |
| request.params.appends   | Bei Bedarf zu ladende Felder, normalerweise zum bedarfsgesteuerten Laden von Beziehungsfeldern |
| request.params.fields    | Welche Felder die Schnittstelle ausgibt (Allowlist)   |
| request.params.except    | Welche Felder ausgeschlossen werden (Denylist)        |

### Get

| Parameter                   | Beschreibung                                           |
| --------------------------- | ------------------------------------------------------ |
| request.params.filterByTk   | Erforderlich, normalerweise die ID des aktuellen Datensatzes |
| request.params.filter       | Filterbedingungen (müssen dem NocoBase-Filterformat entsprechen) |
| request.params.appends      | Bei Bedarf zu ladende Felder, normalerweise zum bedarfsgesteuerten Laden von Beziehungsfeldern |
| request.params.fields       | Welche Felder die Schnittstelle ausgibt (Allowlist)   |
| request.params.except       | Welche Felder ausgeschlossen werden (Denylist)        |

### Create

| Parameter                | Beschreibung                  |
| ------------------------ | ---------------------------- |
| request.params.whiteList | Allowlist                    |
| request.params.blacklist | Denylist                     |
| request.body             | Initialdaten für die Erstellung |

### Update

| Parameter                   | Beschreibung                                           |
| --------------------------- | ------------------------------------------------------ |
| request.params.filterByTk   | Erforderlich, normalerweise die ID des aktuellen Datensatzes |
| request.params.filter       | Filterbedingungen (müssen dem NocoBase-Filterformat entsprechen) |
| request.params.whiteList    | Allowlist                                              |
| request.params.blacklist    | Denylist                                               |
| request.body                | Zu aktualisierende Daten                                |

### Destroy

| Parameter                 | Beschreibung                                           |
| ------------------------- | ------------------------------------------------------ |
| request.params.filterByTk | Erforderlich, normalerweise die ID des aktuellen Datensatzes |
| request.params.filter     | Filterbedingungen (müssen dem NocoBase-Filterformat entsprechen) |

## Felder konfigurieren

Extrahieren Sie aus den Daten der CRUD-Schnittstellen der angebundenen Ressource die Metadaten der Felder (Fields) und verwenden Sie sie als Felder der Collection.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Feldmetadaten extrahieren.

![20251201165133](https://static-docs.nocobase.com/20251201165133.png)

Felder und Vorschau.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Felder bearbeiten (ähnlich wie bei anderen Datenquellen).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Block für REST-API-Datenquelle hinzufügen

Nachdem die Collection konfiguriert wurde, können Sie im Interface einen Block hinzufügen.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)