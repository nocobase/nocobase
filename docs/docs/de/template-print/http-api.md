---
title: "Vorlagendruck HTTP-API"
description: "NocoBase Vorlagendruck HTTP-API: Über die Action templatePrint ausgewählte Datensätze, das aktuelle Filterergebnis oder alle passenden Daten drucken und die erzeugte Word-, Excel-, PowerPoint- oder PDF-Datei herunterladen."
keywords: "Vorlagendruck,HTTP API,templatePrint,PDF,Ausgewählte Datensätze drucken,Alle drucken,NocoBase"
---

# HTTP-API

Der Vorlagendruck unterstützt das direkte Auslösen der Dokumentengenerierung und des Downloads über eine HTTP-API. Sowohl beim Detail- als auch beim Tabellenblock wird letztlich die `templatePrint` Action auf der aktuellen Geschäftsresource ausgeführt.

```shell
curl -X POST \
	-H "Authorization: Bearer <JWT>" \
	-H "Content-Type: application/json" \
	"http://localhost:3000/api/<resource_name>:templatePrint" \
	--data-raw '{...}'
```

Erläuterungen:
- `<resource_name>` ist der Resource-Name der aktuellen Datentabelle.
- Die Schnittstelle gibt einen Binär-Datei-Stream zurück, keine JSON-Daten.
- Der Aufrufer benötigt die Abfrageberechtigung für die aktuelle Resource sowie die Nutzungsberechtigung für die zugehörige Vorlagendruck-Schaltfläche.
- Der Aufruf erfordert das Mitsenden eines benutzerbezogenen JWT-Tokens im Authorization-Header, sonst wird der Zugriff abgelehnt.

## Request-Body Parameter

| Parameter | Typ | Pflichtfeld | Beschreibung |
| --- | --- | --- | --- |
| `templateName` | `string` | Ja | Name der Vorlage – entspricht der in der Vorlagenverwaltung konfigurierten Kennung. |
| `blockName` | `string` | Ja | Block-Typ. Für Tabellenblock `table` übergeben, für Detailblock `details`. |
| `timezone` | `string` | Nein | Zeitzone, z. B. `Asia/Shanghai`. Wird beim Rendern von Datums- und Zeitangaben in der Vorlage verwendet. |
| `uid` | `string` | Nein | Schema-UID der Vorlagendruck-Schaltfläche, wird zur Berechtigungsprüfung verwendet. |
| `convertedToPDF` | `boolean` | Nein | Ob in PDF konvertiert werden soll. Bei `true` wird eine `.pdf`-Datei zurückgegeben. |
| `queryParams` | `object` | Nein | Parameter, die an die zugrunde liegende Datenabfrage weitergereicht werden. |
| `queryParams.page` | `number \| null` | Nein | Seitennummer für die Paginierung. `null` bedeutet keine Seitenbegrenzung. |
| `queryParams.pageSize` | `number \| null` | Nein | Anzahl der Einträge pro Seite. `null` bedeutet keine Seitenbegrenzung. |
| `queryParams.filter` | `object` | Nein | Filterbedingungen, werden automatisch mit den ACL-Filterbedingungen kombiniert. |
| `queryParams.appends` | `string[]` | Nein | Zusätzlich abzufragende Beziehungsfelder. |
| `queryParams.filterByTk` | `string \| object` | Nein | Häufig im Detailblock verwendet, gibt den Wert des Primärschlüssels an. |
| `queryParams.sort` und weitere | `any` | Nein | Weitere Abfrageparameter werden unverändert an die zugrunde liegende Resource-Abfrage weitergereicht. |

## Tabellenblock

Der Tabellenblock verwendet dieselbe Schnittstelle, durch `blockName: "table"` wird der Listen-Druckmodus angegeben. Serverseitig wird auf der Resource ein `find` ausgeführt und das Ergebnis-Array an die Vorlage übergeben.

### Ausgewählte Datensätze oder das aktuelle Seitenergebnis drucken

Geeignet, wenn ausgewählte Datensätze aus dem Tabellenblock gedruckt oder der aktuelle Paginierungskontext beibehalten werden soll. Übliches Vorgehen:

- `queryParams.page` und `queryParams.pageSize` auf die aktuelle Seitennummer und Seitengröße der Tabelle setzen.
- Die Primärschlüssel der ausgewählten Datensätze als Bedingung `filter.id.$in` formulieren.

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": 20,
			"filter": {
				"id": {
					"$in": [1, 2]
				}
			},
			"appends": [],
			"page": 1
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

Bedeutung dieser Anfrage:

- `blockName` ist `table`, d. h. die Vorlage wird mit Listendaten gerendert.
- `filter.id.$in` gibt die Menge der zu druckenden Datensätze an.
- `page` und `pageSize` behalten den aktuellen Paginierungskontext bei, um mit dem Verhalten in der Oberfläche übereinzustimmen.
- `appends` kann bei Bedarf um Beziehungsfelder ergänzt werden.

### Alle passenden Daten drucken

Geeignet für den Aufruf bei „Alle Datensätze drucken" im Tabellenblock. Hier wird nicht nach der aktuellen Seite paginiert, sondern es werden direkt alle Daten abgerufen, die der aktuellen Filterbedingung entsprechen.

Wichtig ist, `queryParams.page` und `queryParams.pageSize` explizit auf `null` zu setzen.

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": null,
			"filter": {},
			"appends": [],
			"page": null
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

Bedeutung dieser Anfrage:

- `page: null` und `pageSize: null` heben die Paginierungsbegrenzung auf.
- `filter: {}` bedeutet, dass keine zusätzlichen Filterbedingungen angefügt werden; falls in der Oberfläche bereits Filterbedingungen gesetzt sind, können sie hier direkt eingefügt werden.
- Der Server fragt alle passenden Datensätze ab und rendert die Vorlage stapelweise.

> Hinweis: Im Tabellenblock können maximal 300 Datensätze pro Druckvorgang gedruckt werden. Bei Überschreitung des Limits gibt die Schnittstelle einen `400`-Fehler zurück.

## Detailblock

Der Detailblock verwendet ebenfalls die Action `templatePrint`, üblicherweise mit folgenden Parametern:

- `blockName: "details"`
- `queryParams.filterByTk` mit dem Primärschlüssel des aktuellen Datensatzes
- `queryParams.appends` mit den zusätzlich abzufragenden Beziehungsfeldern

Serverseitig wird auf der Resource ein `findOne` ausgeführt und das Ergebnisobjekt an die Vorlage übergeben.

## Rückgabewert

Bei erfolgreichem Aufruf gibt die Schnittstelle direkt einen Datei-Stream zurück. Typische Antwort-Header:

```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="<template-title>-<suffix>.<ext>"
```

Erläuterungen:

- Wenn `convertedToPDF` auf `true` gesetzt ist, hat die zurückgegebene Datei die Erweiterung `.pdf`.
- Andernfalls wird eine Datei im Originalformat der Vorlage zurückgegeben, z. B. `.docx`, `.xlsx` oder `.pptx`.
- Im Frontend wird üblicherweise anhand des Dateinamens im `Content-Disposition`-Header der Browser-Download ausgelöst.

## Weitere Ressourcen
- [API-Schlüssel in NocoBase verwenden](../integration/api-keys/usage.md)
