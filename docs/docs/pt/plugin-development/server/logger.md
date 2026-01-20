:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Logger

A funcionalidade de log do NocoBase é baseada no <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. Por padrão, o NocoBase categoriza os logs em logs de requisições de API, logs de execução do sistema e logs de execução de SQL. Os logs de requisições de API e de SQL são gerados internamente pela aplicação. Desenvolvedores de **plugins** geralmente só precisam se preocupar em gerar logs de execução do sistema relacionados aos seus **plugins**.

Este documento explica como criar e gerar logs durante o desenvolvimento de **plugins**.

## Métodos de Geração de Log Padrão

O NocoBase oferece métodos para gerar logs de execução do sistema. Esses logs são formatados com campos específicos e direcionados para arquivos pré-definidos.

```ts
// Método de geração de log padrão
app.log.info("message");

// Uso em middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Uso em plugins
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Todos os métodos acima seguem o mesmo padrão de uso: o primeiro parâmetro é a mensagem do log, e o segundo é um objeto de metadados opcional, que pode conter qualquer par chave-valor. Os campos `module`, `submodule` e `method` serão extraídos como campos separados, enquanto os demais campos serão agrupados no campo `meta`.

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

## Saída para Outros Arquivos

Se você deseja usar o método de geração de log padrão do sistema, mas não quer que os logs sejam gravados nos arquivos padrão, você pode criar uma instância de logger de sistema personalizada usando `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Define se os logs de nível 'error' devem ser gravados separadamente em 'xxx_error.log'
});
```

## Logger Personalizado

Caso você prefira usar os métodos nativos do Winston em vez dos fornecidos pelo sistema, você pode criar logs das seguintes maneiras.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

O objeto `options` estende as opções originais de `winston.LoggerOptions`.

- `transports` - Você pode usar `'console' | 'file' | 'dailyRotateFile'` para aplicar os métodos de saída predefinidos.
- `format` - Você pode usar `'logfmt' | 'json' | 'delimiter'` para aplicar os formatos de impressão predefinidos.

### `app.createLogger`

Em cenários com múltiplas aplicações, às vezes queremos diretórios e arquivos de saída personalizados, que podem ser gravados em um diretório com o nome da aplicação atual.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Saída para /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

O caso de uso e o método são os mesmos de `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Saída para /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```