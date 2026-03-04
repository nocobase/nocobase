:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/get-var).
:::

# ctx.getVar()

**Asynchronicznie** odczytuje wartości zmiennych z bieżącego kontekstu wykonawczego. Rozpoznawanie zmiennych jest zgodne z `{{ctx.xxx}}` w SQL i szablonach, zazwyczaj pochodzą one od bieżącego użytkownika, bieżącego rekordu, parametrów widoku, kontekstu okna wyskakującego (popup) itp.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSBlock / JSField** | Pobieranie informacji o bieżącym rekordzie, użytkowniku, zasobie itp. do renderowania lub logiki. |
| **Reguły powiązań / Przepływ zdarzeń** | Odczyt `ctx.record`, `ctx.formValues` itp. do sprawdzania warunków. |
| **Formuły / Szablony** | Korzysta z tych samych reguł rozpoznawania zmiennych co `{{ctx.xxx}}`. |

## Definicja typu

```ts
getVar(path: string): Promise<any>;
```

| Parametr | Typ | Opis |
|------|------|------|
| `path` | `string` | Ścieżka zmiennej; **musi zaczynać się od `ctx.`**. Obsługuje notację kropkową i indeksy tablic. |

**Wartość zwracana**: `Promise<any>`. Należy użyć `await`, aby uzyskać rozpoznaną wartość; zwraca `undefined`, jeśli zmienna nie istnieje.

> Jeśli zostanie przekazana ścieżka, która nie zaczyna się od `ctx.`, zostanie zgłoszony błąd: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Często używane ścieżki zmiennych

| Ścieżka | Opis |
|------|------|
| `ctx.record` | Bieżący rekord (dostępny, gdy blok formularza/szczegółów jest powiązany z rekordem) |
| `ctx.record.id` | Klucz główny bieżącego rekordu |
| `ctx.formValues` | Bieżące wartości formularza (często używane w regułach powiązań i przepływach pracy; w scenariuszach formularzy zaleca się użycie `ctx.form.getFieldsValue()` do odczytu w czasie rzeczywistym) |
| `ctx.user` | Bieżący zalogowany użytkownik |
| `ctx.user.id` | ID bieżącego użytkownika |
| `ctx.user.nickname` | Pseudonim bieżącego użytkownika |
| `ctx.user.roles.name` | Nazwy ról bieżącego użytkownika (tablica) |
| `ctx.popup.record` | Rekord wewnątrz okna wyskakującego (popup) |
| `ctx.popup.record.id` | Klucz główny rekordu wewnątrz okna wyskakującego |
| `ctx.urlSearchParams` | Parametry zapytania URL (wyodrębnione z `?key=value`) |
| `ctx.token` | Bieżący token API |
| `ctx.role` | Bieżąca rola |

## ctx.getVarInfos()

Pobiera **informacje o strukturze** (typ, tytuł, właściwości podrzędne itp.) zmiennych możliwych do rozpoznania w bieżącym kontekście, co ułatwia eksplorację dostępnych ścieżek. Wartość zwracana jest statycznym opisem opartym na `meta` i nie zawiera rzeczywistych wartości wykonawczych.

### Definicja typu

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

W zwracanej wartości każdy klucz jest ścieżką zmiennej, a wartość to informacje o strukturze dla tej ścieżki (zawierające `type`, `title`, `properties` itp.).

### Parametry

| Parametr | Typ | Opis |
|------|------|------|
| `path` | `string \| string[]` | Ścieżka przycięcia; zbiera strukturę zmiennych tylko pod tą ścieżką. Obsługuje `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; tablica oznacza połączenie wielu ścieżek. |
| `maxDepth` | `number` | Maksymalna głębokość rozwinięcia, domyślnie `3`. Gdy `path` nie jest podana, właściwości najwyższego poziomu mają `depth=1`. Gdy `path` jest podana, węzeł odpowiadający ścieżce ma `depth=1`. |

### Przykład

```ts
// Pobierz strukturę zmiennych pod record (rozwiniętą do 3 poziomów)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Pobierz strukturę popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Pobierz pełną strukturę zmiennych najwyższego poziomu (domyślnie maxDepth=3)
const vars = await ctx.getVarInfos();
```

## Różnica względem ctx.getValue

| Metoda | Scenariusz | Opis |
|------|----------|------|
| `ctx.getValue()` | Pola edytowalne, takie jak JSField lub JSItem | Synchronicznie pobiera wartość **bieżącego pola**; wymaga powiązania z formularzem. |
| `ctx.getVar(path)` | Dowolny kontekst RunJS | Asynchronicznie pobiera **dowolną zmienną ctx**; ścieżka musi zaczynać się od `ctx.`. |

W JSField używaj `getValue`/`setValue` do odczytu/zapisu bieżącego pola; używaj `getVar`, aby uzyskać dostęp do innych zmiennych kontekstowych (takich jak `record`, `user`, `formValues`).

## Uwagi

- **Ścieżka musi zaczynać się od `ctx.`**: np. `ctx.record.id`, w przeciwnym razie zostanie zgłoszony błąd.
- **Metoda asynchroniczna**: Musisz użyć `await`, aby uzyskać wynik, np. `const id = await ctx.getVar('ctx.record.id')`.
- **Zmienna nie istnieje**: Zwraca `undefined`. Możesz użyć `??` po wyniku, aby ustawić wartość domyślną: `(await ctx.getVar('ctx.user.nickname')) ?? 'Gość'`.
- **Wartości formularza**: `ctx.formValues` muszą być pobierane przez `await ctx.getVar('ctx.formValues')`; nie są one bezpośrednio udostępniane jako `ctx.formValues`. W kontekście formularza zaleca się używanie `ctx.form.getFieldsValue()` do odczytu najnowszych wartości w czasie rzeczywistym.

## Przykłady

### Pobieranie ID bieżącego rekordu

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Bieżący rekord: ${recordId}`);
}
```

### Pobieranie rekordu wewnątrz okna wyskakującego

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Bieżący rekord w popupie: ${recordId}`);
}
```

### Odczytywanie elementów podrzędnych pola tablicowego

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Zwraca tablicę nazw ról, np. ['admin', 'member']
```

### Ustawianie wartości domyślnej

```ts
// getVar nie posiada parametru defaultValue; użyj ?? po wyniku
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Gość';
```

### Odczytywanie wartości pól formularza

```ts
// Zarówno ctx.formValues, jak i ctx.form dotyczą scenariuszy formularzy; użyj getVar do odczytu pól zagnieżdżonych
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### Odczytywanie parametrów zapytania URL

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // Odpowiada ?id=xxx
```

### Eksploracja dostępnych zmiennych

```ts
// Pobierz strukturę zmiennych pod record (rozwiniętą do 3 poziomów)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars wygląda jak { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Powiązane

- [ctx.getValue()](./get-value.md) - Synchroniczne pobieranie wartości bieżącego pola (tylko JSField/JSItem itp.)
- [ctx.form](./form.md) - Instancja formularza; `ctx.form.getFieldsValue()` pozwala na odczyt wartości formularza w czasie rzeczywistym
- [ctx.model](./model.md) - Model, w którym znajduje się bieżący kontekst wykonawczy
- [ctx.blockModel](./block-model.md) - Blok nadrzędny, w którym znajduje się bieżący kod JS
- [ctx.resource](./resource.md) - Instancja zasobu (resource) w bieżącym kontekście
- `{{ctx.xxx}}` w SQL / Szablonach - Korzysta z tych samych reguł rozpoznawania co `ctx.getVar('ctx.xxx')`