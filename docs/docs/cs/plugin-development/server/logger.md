:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Logger

Logování v NocoBase je založeno na knihovně <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. Ve výchozím nastavení NocoBase dělí záznamy na logy požadavků API, logy běhu systému a logy provádění SQL dotazů. Logy požadavků API a provádění SQL dotazů jsou generovány interně aplikací. Vývojáři pluginů obvykle potřebují zaznamenávat pouze logy běhu systému související s jejich pluginy.

Tento dokument popisuje, jak vytvářet a zaznamenávat logy při vývoji pluginů.

## Výchozí metody logování

NocoBase poskytuje metody pro logování běhu systému. Logy jsou zaznamenávány podle předdefinovaných polí a ukládány do určených souborů.

```ts
// Výchozí metoda logování
app.log.info("message");

// Použití v middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Použití v pluginech
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Všechny výše uvedené metody se řídí následujícím použitím:

Prvním parametrem je zpráva logu a druhým volitelný objekt metadata, který může obsahovat libovolné páry klíč-hodnota. Zde budou `module`, `submodule` a `method` extrahovány jako samostatná pole, zatímco zbývající pole budou umístěna do pole `meta`.

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

## Výstup do jiných souborů

Pokud chcete použít výchozí metodu logování systému, ale nechcete výstup ukládat do výchozího souboru, můžete vytvořit vlastní instanci systémového loggeru pomocí `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Zda se mají logy úrovně error ukládat samostatně do 'xxx_error.log'
});
```

## Vlastní logger

Pokud nechcete používat systémové metody logování a preferujete nativní metody Winstonu, můžete logy vytvářet následujícími způsoby.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` rozšiřuje původní `winston.LoggerOptions`.

- `transports` – Můžete použít přednastavené metody výstupu: `'console' | 'file' | 'dailyRotateFile'`.
- `format` – Můžete použít přednastavené formáty logování: `'logfmt' | 'json' | 'delimiter'`.

### `app.createLogger`

Ve scénářích s více aplikacemi někdy chceme vlastní výstupní adresáře a soubory, které mohou být uloženy do adresáře pojmenovaného podle aktuální aplikace.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Výstup do /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Scénář použití a metoda jsou stejné jako u `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Výstup do /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```