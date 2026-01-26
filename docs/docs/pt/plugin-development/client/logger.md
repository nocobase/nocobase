:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Logger

O NocoBase oferece um sistema de logs de alta performance baseado no [pino](https://github.com/pinojs/pino). Em qualquer lugar onde você tiver acesso ao `context`, você pode obter uma instância do logger através de `ctx.logger` para registrar logs importantes durante a execução de um `plugin` ou do sistema.

## Uso Básico

```ts
// Registra erros fatais (ex: falha na inicialização)
ctx.logger.fatal('Falha na inicialização do aplicativo', { error });

// Registra erros gerais (ex: erros em requisições de API)
ctx.logger.error('Falha ao carregar dados', { status, message });

// Registra avisos (ex: riscos de performance ou operações inesperadas do usuário)
ctx.logger.warn('O formulário atual contém alterações não salvas');

// Registra informações gerais de execução (ex: componente carregado)
ctx.logger.info('Componente de perfil do usuário carregado');

// Registra informações de depuração (ex: mudanças de estado)
ctx.logger.debug('Estado atual do usuário', { user });

// Registra informações detalhadas de rastreamento (ex: fluxo de renderização)
ctx.logger.trace('Componente renderizado', { component: 'UserProfile' });
```

Esses métodos correspondem a diferentes níveis de log (do mais alto para o mais baixo):

| Nível   | Método              | Descrição                                                              |
| ------- | ------------------- | ---------------------------------------------------------------------- |
| `fatal` | `ctx.logger.fatal()` | Erros fatais, geralmente causando a saída do programa                   |
| `error` | `ctx.logger.error()` | Logs de erro, indicando falha na requisição ou operação                |
| `warn`  | `ctx.logger.warn()`  | Informações de aviso, alertando sobre riscos potenciais ou situações inesperadas |
| `info`  | `ctx.logger.info()`  | Informações de execução regulares                                      |
| `debug` | `ctx.logger.debug()` | Informações de depuração para ambiente de desenvolvimento              |
| `trace` | `ctx.logger.trace()` | Informações detalhadas de rastreamento, geralmente para diagnóstico aprofundado |

## Formato do Log

Cada saída de log está no formato JSON estruturado, contendo os seguintes campos por padrão:

| Campo      | Tipo   | Descrição                                |
| ---------- | ------ | ---------------------------------------- |
| `level`    | number | Nível do log                             |
| `time`     | number | Timestamp (milissegundos)                |
| `pid`      | number | ID do processo                           |
| `hostname` | string | Nome do host                             |
| `msg`      | string | Mensagem do log                          |
| Outros     | object | Informações de contexto personalizadas |

Saída de exemplo:

```json
{
  "level": 30,
  "time": 1730540153064,
  "pid": 12765,
  "hostname": "nocobase.local",
  "msg": "HelloModel rendered",
  "a": "a"
}
```

## Vinculação de Contexto

`ctx.logger` injeta automaticamente informações de contexto, como o `plugin` atual, módulo ou origem da requisição, permitindo que os logs rastreiem a fonte com mais precisão.

```ts
plugin.context.logger.info('Plugin inicializado');
model.context.logger.error('Falha na validação do modelo', { model: 'User' });
```

Saída de exemplo (com contexto):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Logger Personalizado

Você pode criar instâncias de logger personalizadas em `plugins`, herdando ou estendendo as configurações padrão:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submódulo iniciado');
```

Loggers filhos herdam a configuração do logger principal e anexam automaticamente o contexto.

## Hierarquia de Níveis de Log

Os níveis de log do Pino seguem uma definição numérica do mais alto para o mais baixo, onde números menores indicam menor prioridade. Abaixo está a tabela completa da hierarquia de níveis de log:

| Nome do Nível | Valor     | Nome do Método    | Descrição                                                              |
| ------------- | --------- | ----------------- | ---------------------------------------------------------------------- |
| `fatal`       | 60        | `logger.fatal()`  | Erros fatais, geralmente fazendo com que o programa não consiga continuar a execução |
| `error`       | 50        | `logger.error()`  | Erros gerais, indicando falha na requisição ou exceções na operação    |
| `warn`        | 40        | `logger.warn()`   | Informações de aviso, alertando sobre riscos potenciais ou situações inesperadas |
| `info`        | 30        | `logger.info()`   | Informações gerais, registrando o status do sistema ou operações normais |
| `debug`       | 20        | `logger.debug()`  | Informações de depuração para análise de problemas na fase de desenvolvimento |
| `trace`       | 10        | `logger.trace()`  | Informações detalhadas de rastreamento para diagnóstico aprofundado    |
| `silent`      | -Infinity | (sem método correspondente) | Desativa todas as saídas de log                                        |

O Pino só exibirá logs maiores ou iguais à configuração de `level` atual. Por exemplo, quando o nível de log for `info`, os logs de `debug` e `trace` serão ignorados.

## Boas Práticas no Desenvolvimento de Plugins

1.  **Use o Logger de Contexto**
    Use `ctx.logger` em contextos de `plugin`, modelo ou aplicativo para que as informações de origem sejam automaticamente incluídas.

2.  **Diferencie os Níveis de Log**
    -   Use `error` para registrar exceções de negócio
    -   Use `info` para registrar mudanças de status
    -   Use `debug` para registrar informações de depuração de desenvolvimento

3.  **Evite Logs Excessivos**
    Especialmente nos níveis `debug` e `trace`, é recomendado ativá-los apenas em ambientes de desenvolvimento.

4.  **Use Dados Estruturados**
    Passe parâmetros de objeto em vez de concatenar strings, o que ajuda na análise e filtragem de logs.

Ao seguir essas práticas, os desenvolvedores podem rastrear a execução de `plugins` com mais eficiência, solucionar problemas e manter um sistema de logs estruturado e extensível.