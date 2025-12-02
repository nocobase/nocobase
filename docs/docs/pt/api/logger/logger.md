:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Logger

## Criar Logger

### `createLogger()`

Cria um logger personalizado.

#### Assinatura

- `createLogger(options: LoggerOptions)`

#### Tipo

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### Detalhes

| Propriedade  | Descrição                    |
| :----------- | :--------------------------- |
| `dirname`    | Diretório de saída dos logs  |
| `filename`   | Nome do arquivo de log       |
| `format`     | Formato do log               |
| `transports` | Método de saída dos logs     |

### `createSystemLogger()`

Cria logs de tempo de execução do sistema, impressos de uma forma específica. Consulte [Logger - Log do Sistema](/log-and-monitor/logger/index.md#system-log)

#### Assinatura

- `createSystemLogger(options: SystemLoggerOptions)`

#### Tipo

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // imprime erros separadamente, padrão é true
}
```

#### Detalhes

| Propriedade       | Descrição                                            |
| :---------------- | :--------------------------------------------------- |
| `seperateError` | Define se os logs de nível `error` devem ser emitidos separadamente. |

### `requestLogger()`

Middleware para o registro de requisições e respostas de API.

```ts
app.use(requestLogger(app.name));
```

#### Assinatura

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### Tipo

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### Detalhes

| Propriedade         | Tipo                              | Descrição                                                              | Padrão                                                                                                                                                  |
| :------------------ | :-------------------------------- | :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Ignora o registro de logs para certas requisições com base no contexto da requisição. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Lista de permissões (whitelist) das informações da requisição a serem impressas no log. | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Lista de permissões (whitelist) das informações da resposta a serem impressas no log. | `['status']`                                                                                                                                            |

### app.createLogger()

#### Definição

```ts
class Application {
  createLogger(options: LoggerOptions) {
    const { dirname } = options;
    return createLogger({
      ...options,
      dirname: getLoggerFilePath(this.name || 'main', dirname || ''),
    });
  }
}
```

Quando `dirname` é um caminho relativo, os arquivos de log serão enviados para o diretório com o nome da aplicação atual.

### plugin.createLogger()

O uso é o mesmo que `app.createLogger()`.

#### Definição

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Configuração de Log

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Obtém o nível de log configurado atualmente no sistema.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Concatena os caminhos de diretório com base no diretório de log configurado atualmente no sistema.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Obtém os métodos de saída de log configurados atualmente no sistema.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Obtém o formato de log configurado atualmente no sistema.

## Saída de Log

### Transports

Métodos de saída predefinidos.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Documentação Relacionada

- [Guia de Desenvolvimento - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/index.md)