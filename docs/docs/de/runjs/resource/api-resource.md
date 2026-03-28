:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/resource/api-resource).
:::

# APIResource

Eine **allgemeine API-Ressource** für Anfragen basierend auf URLs, die für beliebige HTTP-Schnittstellen geeignet ist. Sie erbt von der Basisklasse `FlowResource` und erweitert diese um die Konfiguration von Anfragen sowie die Methode `refresh()`. Im Gegensatz zu [MultiRecordResource](./multi-record-resource.md) und [SingleRecordResource](./single-record-resource.md) hängt die `APIResource` nicht von einem Ressourcennamen ab, sondern stellt Anfragen direkt über die URL. Dies eignet sich für benutzerdefinierte Schnittstellen, Drittanbieter-APIs und andere Szenarien.

**Erstellungsmethode**: `ctx.makeResource('APIResource')` oder `ctx.initResource('APIResource')`. Vor der Verwendung muss `setURL()` aufgerufen werden. Im RunJS-Kontext wird `ctx.api` (APIClient) automatisch injiziert, sodass `setAPIClient` nicht manuell aufgerufen werden muss.

---

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **Benutzerdefinierte Schnittstelle** | Aufruf nicht standardisierter Ressourcen-APIs (z. B. `/api/custom/stats`, `/api/reports/summary`). |
| **Drittanbieter-API** | Abfrage externer Dienste über eine vollständige URL (erfordert CORS-Unterstützung durch das Ziel). |
| **Einmalige Abfrage** | Temporäres Abrufen von Daten, die nach der Verwendung verworfen werden und nicht an `ctx.resource` gebunden werden müssen. |
| **Abwägung zwischen APIResource und ctx.request** | Verwenden Sie `APIResource`, wenn reaktive Daten, Ereignisse oder Fehlerzustände benötigt werden; verwenden Sie `ctx.request()` für einfache, einmalige Anfragen. |

---

## Funktionen der Basisklasse (FlowResource)

Alle Ressourcen verfügen über folgende Funktionen:

| Methode | Beschreibung |
|------|------|
| `getData()` | Ruft die aktuellen Daten ab. |
| `setData(value)` | Setzt die Daten (nur lokal). |
| `hasData()` | Prüft, ob Daten vorhanden sind. |
| `getMeta(key?)` / `setMeta(meta)` | Lesen/Schreiben von Metadaten. |
| `getError()` / `setError(err)` / `clearError()` | Verwaltung des Fehlerzustands. |
| `on(event, callback)` / `once` / `off` / `emit` | Abonnieren und Auslösen von Ereignissen. |

---

## Konfiguration der Anfrage

| Methode | Beschreibung |
|------|------|
| `setAPIClient(api)` | Legt die APIClient-Instanz fest (in RunJS normalerweise automatisch injiziert). |
| `getURL()` / `setURL(url)` | URL der Anfrage. |
| `loading` | Lesen/Schreiben des Ladestatus (get/set). |
| `clearRequestParameters()` | Löscht die Anfrageparameter. |
| `setRequestParameters(params)` | Zusammenführen und Festlegen von Anfrageparametern. |
| `setRequestMethod(method)` | Legt die Anfragemethode fest (z. B. `'get'`, `'post'`, Standard ist `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Anfrage-Header. |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Hinzufügen, Löschen oder Abfragen einzelner Parameter. |
| `setRequestBody(data)` | Anfrage-Body (verwendet bei POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Allgemeine Anfrageoptionen. |

---

## URL-Format

- **Ressourcen-Stil**: Unterstützt die NocoBase-Kurzschreibweise für Ressourcen, wie `users:list` oder `posts:get`, die mit der `baseURL` kombiniert wird.
- **Relativer Pfad**: Z. B. `/api/custom/endpoint`, kombiniert mit der `baseURL` der Anwendung.
- **Vollständige URL**: Verwendung vollständiger Adressen für ursprungsübergreifende Anfragen; das Ziel muss CORS konfiguriert haben.

---

## Datenabruf

| Methode | Beschreibung |
|------|------|
| `refresh()` | Initiiert eine Anfrage basierend auf der aktuellen URL, Methode, Parametern, Headern und Daten. Schreibt die Antwort-`data` in `setData(data)` und löst das Ereignis `'refresh'` aus. Im Fehlerfall wird `setError(err)` gesetzt und ein `ResourceError` geworfen, ohne das `refresh`-Ereignis auszulösen. Erfordert, dass `api` und URL konfiguriert sind. |

---

## Beispiele

### Einfache GET-Anfrage

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL im Ressourcen-Stil

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST-Anfrage (mit Anfrage-Body)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'Test', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Auf das refresh-Ereignis hören

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Statistik: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Fehlerbehandlung

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'Anfrage fehlgeschlagen');
}
```

### Benutzerdefinierte Anfrage-Header

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Hinweise

- **Abhängigkeit von ctx.api**: In RunJS wird `ctx.api` von der Umgebung injiziert; ein manuelles `setAPIClient` ist normalerweise nicht erforderlich. Bei Verwendung in einem kontextlosen Szenario müssen Sie dies selbst festlegen.
- **Refresh bedeutet Anfrage**: `refresh()` initiiert eine Anfrage basierend auf der aktuellen Konfiguration; Methode, Parameter, Daten usw. müssen vor dem Aufruf konfiguriert sein.
- **Fehler aktualisieren die Daten nicht**: Bei einem Fehler behält `getData()` den vorherigen Wert bei; Fehlerinformationen können über `getError()` abgerufen werden.
- **Vergleich mit ctx.request**: Verwenden Sie `ctx.request()` für einfache, einmalige Anfragen; verwenden Sie `APIResource`, wenn reaktive Daten, Ereignisse und die Verwaltung des Fehlerzustands erforderlich sind.

---

## Verwandte Themen

- [ctx.resource](../context/resource.md) - Die Ressourcen-Instanz im aktuellen Kontext
- [ctx.initResource()](../context/init-resource.md) - Initialisieren und an `ctx.resource` binden
- [ctx.makeResource()](../context/make-resource.md) - Eine neue Ressourcen-Instanz erstellen, ohne sie zu binden
- [ctx.request()](../context/request.md) - Allgemeine HTTP-Anfrage, geeignet für einfache, einmalige Aufrufe
- [MultiRecordResource](./multi-record-resource.md) - Für Sammlungen/Listen, unterstützt CRUD und Paginierung
- [SingleRecordResource](./single-record-resource.md) - Für einzelne Datensätze