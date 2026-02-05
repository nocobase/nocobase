:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Logger

Logowanie w NocoBase opiera się na bibliotece <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. Domyślnie NocoBase dzieli logi na logi żądań API, logi działania systemu oraz logi wykonywania zapytań SQL. Logi żądań API i logi wykonywania zapytań SQL są generowane wewnętrznie przez aplikację. Deweloperzy wtyczek zazwyczaj potrzebują jedynie rejestrować logi działania systemu związane z ich wtyczkami.

Ten dokument wyjaśnia, jak tworzyć i rejestrować logi podczas tworzenia wtyczek.

## Domyślne metody rejestrowania

NocoBase udostępnia metody rejestrowania logów działania systemu. Logi są rejestrowane zgodnie z określonymi polami i jednocześnie zapisywane do wskazanych plików.

```ts
// Domyślna metoda rejestrowania
app.log.info("message");

// Użycie w middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Użycie we wtyczkach
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Wszystkie powyższe metody stosuje się w poniższy sposób:

Pierwszym parametrem jest wiadomość logu, a drugim opcjonalny obiekt metadanych, który może zawierać dowolne pary klucz-wartość. Pola `module`, `submodule` i `method` zostaną wyodrębnione jako osobne pola, a pozostałe pola zostaną umieszczone w polu `meta`.

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## Zapisywanie do innych plików

Jeśli chcą Państwo używać domyślnych metod rejestrowania systemu, ale nie chcą Państwo zapisywać logów do domyślnego pliku, mogą Państwo utworzyć niestandardową instancję systemowego loggera za pomocą `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Czy logi poziomu error mają być zapisywane osobno do pliku 'xxx_error.log'
});
```

## Niestandardowy Logger

Jeśli nie chcą Państwo używać metod rejestrowania udostępnianych przez system, a zamiast tego wolą Państwo używać natywnych metod Winston, mogą Państwo tworzyć logi za pomocą następujących metod.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` rozszerza oryginalne `winston.LoggerOptions`.

- `transports` – Mogą Państwo użyć `'console' | 'file' | 'dailyRotateFile'`, aby zastosować predefiniowane metody wyjścia.
- `format` – Mogą Państwo użyć `'logfmt' | 'json' | 'delimiter'`, aby zastosować predefiniowane formaty rejestrowania.

### `app.createLogger`

W scenariuszach z wieloma aplikacjami czasami chcemy niestandardowych katalogów i plików wyjściowych, które mogą być zapisywane w katalogu nazwanym tak samo jak bieżąca aplikacja.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Zapis do /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Scenariusz użycia i sposób działania są takie same jak w przypadku `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Zapis do /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```