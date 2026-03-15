:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/logger).
:::

# ctx.logger

Encapsulamento de logs baseado no [pino](https://github.com/pinojs/pino), fornecendo logs JSON estruturados de alto desempenho. Recomenda-se o uso de `ctx.logger` em vez de `console` para facilitar a coleta e análise de logs.

## Cenários de uso

O `ctx.logger` pode ser usado em todos os cenários de RunJS para depuração, rastreamento de erros, análise de desempenho, etc.

## Definição de tipo

```ts
logger: pino.Logger;
```

`ctx.logger` é uma instância de `engine.logger.child({ module: 'flow-engine' })`, ou seja, um logger filho do pino com um contexto de `module`.

## Níveis de log

O pino suporta os seguintes níveis (do mais alto para o mais baixo):

| Nível | Método | Descrição |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Erro fatal, geralmente leva ao encerramento do processo |
| `error` | `ctx.logger.error()` | Erro, indica que uma requisição ou operação falhou |
| `warn` | `ctx.logger.warn()` | Aviso, indica riscos potenciais ou situações anômalas |
| `info` | `ctx.logger.info()` | Informações gerais de tempo de execução |
| `debug` | `ctx.logger.debug()` | Informações de depuração, usadas durante o desenvolvimento |
| `trace` | `ctx.logger.trace()` | Rastreamento detalhado, usado para diagnósticos profundos |

## Escrita recomendada

Recomenda-se o formato `level(msg, meta)`: a mensagem primeiro, seguida por um objeto de metadados opcional.

```ts
ctx.logger.info('Carregamento do bloco concluído');
ctx.logger.info('Operação bem-sucedida', { recordId: 456 });
ctx.logger.warn('Aviso de desempenho', { duration: 5000 });
ctx.logger.error('Falha na operação', { userId: 123, action: 'create' });
ctx.logger.error('Falha na requisição', { err });
```

O pino também suporta `level(meta, msg)` (objeto primeiro) ou `level({ msg, ...meta })` (objeto único), que podem ser usados conforme a necessidade.

## Exemplos

### Uso básico

```ts
ctx.logger.info('Carregamento do bloco concluído');
ctx.logger.warn('Falha na requisição, usando cache', { err });
ctx.logger.debug('Salvando...', { recordId: ctx.record?.id });
```

### Usando child() para criar um logger filho

```ts
// Cria um logger filho com contexto para a lógica atual
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Executando passo 1');
log.debug('Executando passo 2', { step: 2 });
```

### Relação com o console

Recomenda-se usar o `ctx.logger` diretamente para obter logs JSON estruturados. Se você estiver acostumado a usar o `console`, as correspondências são: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Formato de log

O pino gera JSON estruturado, onde cada entrada de log contém:

- `level`: Nível do log (numérico)
- `time`: Timestamp (milissegundos)
- `msg`: Mensagem de log
- `module`: Fixo como `flow-engine`
- Outros campos personalizados (passados via objetos)

## Observações

- Os logs são JSON estruturados, facilitando a coleta, pesquisa e análise.
- Loggers filhos criados via `child()` também seguem a recomendação de escrita `level(msg, meta)`.
- Alguns ambientes de execução (como fluxos de trabalho) podem usar métodos de saída de log diferentes.

## Relacionado

- [pino](https://github.com/pinojs/pino) — Biblioteca de log subjacente