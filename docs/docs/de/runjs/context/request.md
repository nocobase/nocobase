:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/request).
:::

# ctx.request()

Startet eine authentifizierte HTTP-Anfrage in RunJS. Die Anfrage überträgt automatisch die `baseURL`, den `Token`, die `locale`, die `role` usw. der aktuellen Anwendung und folgt der Logik für Anfrage-Interceptors und die Fehlerbehandlung der Anwendung.

## Anwendungsfälle

Anwendbar auf jedes Szenario in RunJS, in dem eine entfernte HTTP-Anfrage initiiert werden muss, wie z. B. JSBlock, JSField, JSItem, JSColumn, Workflow, Verknüpfungen, JSAction usw.

## Typdefinition

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` erweitert die `AxiosRequestConfig` von Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Ob globale Fehlermeldungen bei einem Fehlschlagen der Anfrage übersprungen werden sollen
  skipAuth?: boolean;                                 // Ob die Authentifizierungs-Weiterleitung übersprungen werden soll (z. B. keine Weiterleitung zur Login-Seite bei 401)
};
```

## Häufige Parameter

| Parameter | Typ | Beschreibung |
|------|------|------|
| `url` | string | Anfrage-URL. Unterstützt den Ressourcen-Stil (z. B. `users:list`, `posts:create`) oder eine vollständige URL |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP-Methode, Standard ist `'get'` |
| `params` | object | Abfrageparameter, die in die URL serialisiert werden |
| `data` | any | Anfragetext (Body), verwendet für post/put/patch |
| `headers` | object | Benutzerdefinierte Anfrage-Header |
| `skipNotify` | boolean \| (error) => boolean | Wenn true oder die Funktion true zurückgibt, erscheint bei einem Fehler keine globale Fehlermeldung |
| `skipAuth` | boolean | Wenn true, lösen 401-Fehler usw. keine Authentifizierungs-Weiterleitung aus (z. B. Weiterleitung zur Login-Seite) |

## Ressourcen-Stil URL

Die NocoBase Ressourcen-API unterstützt ein Kurzformat im Stil `Ressource:Aktion`:

| Format | Beschreibung | Beispiel |
|------|------|------|
| `collection:action` | CRUD für eine einzelne Sammlung | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Verknüpfte Ressourcen (erfordert die Übergabe des Primärschlüssels via `resourceOf` oder URL) | `posts.comments:list` |

Relative Pfade werden mit der `baseURL` der Anwendung (normalerweise `/api`) verkettet; Cross-Origin-Anfragen müssen eine vollständige URL verwenden, und der Zieldienst muss für CORS konfiguriert sein.

## Antwortstruktur

Der Rückgabewert ist ein Axios-Antwortobjekt. Häufige Felder sind:

- `response.data`: Antwortkörper (Response Body)
- Listen-Schnittstellen geben normalerweise `data.data` (Array von Datensätzen) + `data.meta` (Paginierung usw.) zurück
- Schnittstellen für einzelne Datensätze/Erstellen/Aktualisieren geben den Datensatz meist in `data.data` zurück

## Beispiele

### Listenabfrage

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Paginierung und andere Informationen
```

### Daten übermitteln

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Max Mustermann', email: 'max@example.com' },
});

const newRecord = res?.data?.data;
```

### Mit Filterung und Sortierung

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### Fehlermeldung überspringen

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Bei Fehler keine globale Nachricht anzeigen
});

// Oder basierend auf dem Fehlertyp entscheiden
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Cross-Origin-Anfrage

Wenn eine vollständige URL verwendet wird, um andere Domänen anzufragen, muss der Zieldienst so konfiguriert sein, dass er CORS für den Ursprung der aktuellen Anwendung zulässt. Wenn die Zielschnittstelle einen eigenen Token benötigt, kann dieser über die Header übergeben werden:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <ziel_service_token>',
  },
});
```

### Anzeige mit ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Benutzerliste') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Hinweise

- **Fehlerbehandlung**: Ein Fehlschlagen der Anfrage löst eine Ausnahme aus, und standardmäßig wird eine globale Fehlermeldung angezeigt. Verwenden Sie `skipNotify: true`, um Fehler selbst abzufangen und zu behandeln.
- **Authentifizierung**: Anfragen an dieselbe Domäne tragen automatisch den Token, die Sprache (Locale) und die Rolle des aktuellen Benutzers. Cross-Origin-Anfragen erfordern, dass das Ziel CORS unterstützt und der Token bei Bedarf in den Headern übergeben wird.
- **Ressourcenberechtigungen**: Anfragen unterliegen den ACL-Beschränkungen (Access Control List) und können nur auf Ressourcen zugreifen, für die der aktuelle Benutzer eine Berechtigung hat.

## Verwandte Themen

- [ctx.message](./message.md) - Anzeige von leichten Hinweisen nach Abschluss der Anfrage
- [ctx.notification](./notification.md) - Anzeige von Benachrichtigungen nach Abschluss der Anfrage
- [ctx.render](./render.md) - Rendern von Anfrageergebnissen in die Benutzeroberfläche
- [ctx.makeResource](./make-resource.md) - Erstellen eines Ressourcen-Objekts für verkettetes Laden von Daten (Alternative zu `ctx.request`)