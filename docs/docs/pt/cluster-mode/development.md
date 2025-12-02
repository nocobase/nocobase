:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Desenvolvimento de **Plugins**

## Contexto

Em um ambiente de nó único, os **plugins** geralmente conseguem atender aos requisitos usando estados, eventos ou tarefas dentro do próprio processo. No entanto, em um modo de cluster, o mesmo **plugin** pode estar rodando em várias instâncias ao mesmo tempo, o que traz os seguintes problemas comuns:

- **Consistência de estado**: Se os dados de configuração ou de tempo de execução forem armazenados apenas na memória, é difícil sincronizá-los entre as instâncias, o que pode levar a leituras inconsistentes (dirty reads) ou execuções duplicadas.
- **Agendamento de tarefas**: Sem um mecanismo claro de enfileiramento e confirmação, tarefas de longa duração podem ser executadas simultaneamente por várias instâncias.
- **Condições de corrida**: Operações que envolvem alterações de esquema (schema) ou alocação de recursos precisam ser serializadas para evitar conflitos causados por escritas concorrentes.

O núcleo do NocoBase oferece várias interfaces de middleware na camada de aplicação para ajudar os **plugins** a reutilizar capacidades unificadas em um ambiente de cluster. A seguir, vamos apresentar o uso e as melhores práticas de cache, mensagens síncronas, filas de mensagens e bloqueios distribuídos, com referências ao código-fonte.

## Soluções

### Componente de Cache

Para dados que precisam ser armazenados em memória, recomendamos usar o componente de cache integrado do sistema para gerenciamento.

- Obtenha a instância de cache padrão via `app.cache`.
- O `Cache` oferece operações básicas como `set/get/del/reset`, e também suporta `wrap` e `wrapWithCondition` para encapsular a lógica de cache, além de métodos em lote como `mset/mget/mdel`.
- Ao implantar em um cluster, é recomendado colocar os dados compartilhados em um armazenamento persistente (como Redis) e definir um `ttl` (time-to-live) razoável para evitar a perda de cache em caso de reinício da instância.

Exemplo: [Inicialização e uso de cache no `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Criar e usar um cache em um plugin"
// packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts
async load() {
  this.cache = await this.app.cacheManager.createCache({
    name: 'auth',
    prefix: 'auth',
    store: 'redis',
  });

  await this.cache.wrap('token:config', async () => {
    const repo = this.app.db.getRepository('tokenPolicies');
    return repo.findOne({ filterByTk: 'default' });
  }, 60 * 1000);
}
```

### Gerenciador de Mensagens Síncronas (SyncMessageManager)

Se o estado em memória não puder ser gerenciado com um cache distribuído (por exemplo, se não puder ser serializado), então, quando o estado mudar devido a ações do usuário, essa mudança precisará ser notificada às outras instâncias por meio de um sinal síncrono para manter a consistência do estado.

- A classe base do **plugin** já implementa `sendSyncMessage`, que internamente chama `app.syncMessageManager.publish` e adiciona automaticamente um prefixo de nível de aplicação ao canal para evitar conflitos.
- O método `publish` pode especificar uma `transaction`, e a mensagem será enviada somente após a confirmação da transação do banco de dados, garantindo a sincronização entre o estado e a mensagem.
- Use `handleSyncMessage` para processar mensagens de outras instâncias. A inscrição durante a fase `beforeLoad` é muito adequada para cenários como alterações de configuração e sincronização de esquema.

Exemplo: [`plugin-data-source-main` usa mensagens síncronas para manter a consistência do esquema em múltiplos nós](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Sincronizar atualizações de esquema dentro de um plugin"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Automaticamente chama app.syncMessageManager.publish
  }
}
```

### Gerenciador de Publicação/Assinatura (PubSubManager)

A transmissão de mensagens é o componente subjacente dos sinais síncronos e também pode ser usada diretamente. Quando você precisar transmitir mensagens entre instâncias, pode usar este componente.

- `app.pubSubManager.subscribe(channel, handler, { debounce })` pode ser usado para assinar um canal entre instâncias; a opção `debounce` é usada para evitar chamadas de retorno frequentes causadas por transmissões repetidas.
- O método `publish` suporta `skipSelf` (padrão é `true`) e `onlySelf` para controlar se a mensagem é enviada de volta para a própria instância.
- É necessário configurar um adaptador (como Redis, RabbitMQ, etc.) antes da inicialização da aplicação; caso contrário, ela não se conectará a um sistema de mensagens externo por padrão.

Exemplo: [`plugin-async-task-manager` usa PubSub para transmitir eventos de cancelamento de tarefas](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Transmitir sinal de cancelamento de tarefa"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Componente de Fila de Eventos (EventQueue)

A fila de mensagens é usada para agendar tarefas assíncronas, sendo ideal para operações de longa duração ou que podem ser retentadas.

- Declare um consumidor com `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. O `process` retorna uma `Promise`, e você pode usar `AbortSignal.timeout` para controlar os tempos limite.
- O método `publish` adiciona automaticamente o prefixo do nome da aplicação e suporta opções como `timeout` e `maxRetries`. Por padrão, ele se adapta a uma fila em memória, mas pode ser alternado para adaptadores estendidos como RabbitMQ, conforme a necessidade.
- Em um cluster, certifique-se de que todos os nós usem o mesmo adaptador para evitar a fragmentação de tarefas entre eles.

Exemplo: [`plugin-async-task-manager` usa EventQueue para agendar tarefas](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Distribuir tarefas assíncronas em uma fila"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### Gerenciador de Bloqueio Distribuído (LockManager)

Quando você precisa evitar condições de corrida, pode usar um bloqueio distribuído para serializar o acesso a um recurso.

- Por padrão, ele oferece um adaptador `local` baseado em processo. Você pode registrar implementações distribuídas como Redis; use `app.lockManager.runExclusive(key, fn, ttl)` ou `acquire`/`tryAcquire` para controlar a concorrência.
- O `ttl` (time-to-live) é usado como uma salvaguarda para liberar o bloqueio, evitando que ele seja mantido indefinidamente em casos excepcionais.
- Cenários comuns incluem: alterações de esquema, prevenção de tarefas duplicadas, limitação de taxa (rate limiting), entre outros.

Exemplo: [`plugin-data-source-main` usa um bloqueio distribuído para proteger o processo de exclusão de campos](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Serializar operação de exclusão de campo"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Recomendações de Desenvolvimento

- **Consistência de estado em memória**: Tente evitar o uso de estado em memória durante o desenvolvimento. Em vez disso, use cache ou mensagens síncronas para manter a consistência do estado.
- **Priorize a reutilização de interfaces integradas**: Use capacidades unificadas como `app.cache` e `app.syncMessageManager` para evitar reimplementar a lógica de comunicação entre nós nos **plugins**.
- **Atenção aos limites de transação**: Operações com transações devem usar `transaction.afterCommit` (já integrado no `syncMessageManager.publish`) para garantir a consistência dos dados e das mensagens.
- **Defina uma estratégia de recuo (backoff)**: Para tarefas de fila e transmissão, defina valores razoáveis para `timeout`, `maxRetries` e `debounce` para evitar novos picos de tráfego em situações excepcionais.
- **Monitore e registre**: Faça bom uso dos logs da aplicação para registrar informações como nomes de canais, cargas de mensagens, chaves de bloqueio, etc., facilitando a solução de problemas intermitentes em um cluster.

Com essas capacidades, os **plugins** podem compartilhar estados com segurança, sincronizar configurações e agendar tarefas entre diferentes instâncias, atendendo aos requisitos de estabilidade e consistência em cenários de implantação em cluster.