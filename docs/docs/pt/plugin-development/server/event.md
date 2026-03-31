:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Eventos

O servidor do NocoBase (Server) dispara eventos correspondentes durante o ciclo de vida da aplicação, o ciclo de vida dos **plugins** e as operações de banco de dados. Desenvolvedores de **plugins** podem escutar esses eventos para implementar lógicas de extensão, operações automatizadas ou comportamentos personalizados.

O sistema de eventos do NocoBase é dividido principalmente em dois níveis:

- **`app.on()` - Eventos de Nível de Aplicação**: Para escutar eventos do ciclo de vida da aplicação, como inicialização, instalação, ativação de **plugins**, etc.
- **`db.on()` - Eventos de Nível de Banco de Dados**: Para escutar eventos de operações no nível do modelo de dados, como criação, atualização e exclusão de registros.

Ambos herdam do `EventEmitter` do Node.js, suportando as interfaces padrão `.on()`, `.off()` e `.emit()`. O NocoBase também estende o suporte para `emitAsync`, que é usado para disparar eventos de forma assíncrona e aguardar a conclusão da execução de todos os *listeners*.

## Onde Registrar Listeners de Eventos

Os *listeners* de eventos geralmente devem ser registrados no método `beforeLoad()` do **plugin**. Isso garante que os eventos estejam prontos durante a fase de carregamento do **plugin**, permitindo que a lógica subsequente responda corretamente.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Escuta eventos da aplicação
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase foi iniciado');
    });

    // Escuta eventos do banco de dados
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Novo post: ${model.get('title')}`);
      }
    });
  }
}
```

## Escutando Eventos da Aplicação `app.on()`

Os eventos da aplicação são usados para capturar mudanças no ciclo de vida da aplicação NocoBase e dos **plugins**, sendo ideais para lógicas de inicialização, registro de recursos ou detecção de dependências de **plugins**.

### Tipos Comuns de Eventos

| Nome do Evento | Momento do Disparo | Usos Típicos |
|---|---|---|
| `beforeLoad` / `afterLoad` | Antes / depois do carregamento da aplicação | Registrar recursos, inicializar configuração |
| `beforeStart` / `afterStart` | Antes / depois da inicialização do serviço | Iniciar tarefas, registrar logs de inicialização |
| `beforeInstall` / `afterInstall` | Antes / depois da instalação da aplicação | Inicializar dados, importar modelos |
| `beforeStop` / `afterStop` | Antes / depois da parada do serviço | Limpar recursos, salvar estado |
| `beforeDestroy` / `afterDestroy` | Antes / depois da destruição da aplicação | Excluir cache, desconectar conexões |
| `beforeLoadPlugin` / `afterLoadPlugin` | Antes / depois do carregamento do **plugin** | Modificar configuração do **plugin** ou estender funcionalidades |
| `beforeEnablePlugin` / `afterEnablePlugin` | Antes / depois da ativação do **plugin** | Verificar dependências, inicializar lógica do **plugin** |
| `beforeDisablePlugin` / `afterDisablePlugin` | Antes / depois da desativação do **plugin** | Limpar recursos do **plugin** |
| `afterUpgrade` | Após a conclusão da atualização da aplicação | Executar migração de dados ou correções de compatibilidade |

Exemplo: Escutando o evento de inicialização da aplicação

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 NocoBase serviço foi iniciado!');
});
```

Exemplo: Escutando o evento de carregamento de **plugin**

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Plugin ${plugin.name} foi carregado`);
});
```

## Escutando Eventos do Banco de Dados `db.on()`

Os eventos de banco de dados podem capturar várias mudanças de dados no nível do modelo, sendo adequados para operações de auditoria, sincronização, preenchimento automático, entre outras.

### Tipos Comuns de Eventos

| Nome do Evento | Momento do Disparo |
|---|---|
| `beforeSync` / `afterSync` | Antes / depois da sincronização da estrutura do banco de dados |
| `beforeValidate` / `afterValidate` | Antes / depois da validação de dados |
| `beforeCreate` / `afterCreate` | Antes / depois da criação de registros |
| `beforeUpdate` / `afterUpdate` | Antes / depois da atualização de registros |
| `beforeSave` / `afterSave` | Antes / depois de salvar (inclui criação e atualização) |
| `beforeDestroy` / `afterDestroy` | Antes / depois da exclusão de registros |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | Após operações que incluem dados associados |
| `beforeDefineCollection` / `afterDefineCollection` | Antes / depois da definição de **coleções** |
| `beforeRemoveCollection` / `afterRemoveCollection` | Antes / depois da remoção de **coleções** |

Exemplo: Escutando o evento após a criação de dados

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Dados foram criados!');
});
```

Exemplo: Escutando o evento antes da atualização de dados

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Dados estão prestes a ser atualizados!');
});
```