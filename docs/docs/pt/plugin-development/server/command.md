:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Comandos

No NocoBase, os comandos são usados para executar operações relacionadas a aplicativos ou **plugins** na linha de comando, como rodar tarefas do sistema, executar operações de migração ou sincronização, inicializar configurações, ou interagir com instâncias de aplicativos em execução. Desenvolvedores podem definir comandos personalizados para **plugins** e registrá-los através do objeto `app`, executando-os na CLI como `nocobase <command>`.

## Tipos de Comandos

No NocoBase, o registro de comandos é dividido em dois tipos:

| Tipo | Método de Registro | O Plugin Precisa Estar Habilitado? | Cenários Típicos |
|------|--------------------|------------------------------------|------------------|
| Comando Dinâmico | `app.command()` | ✅ Sim | Comandos relacionados à lógica de negócio do **plugin** |
| Comando Estático | `Application.registerStaticCommand()` | ❌ Não | Comandos de instalação, inicialização e manutenção |

## Comandos Dinâmicos

Use `app.command()` para definir comandos de **plugins**. Os comandos só podem ser executados depois que o **plugin** estiver habilitado. Os arquivos de comando devem ser colocados em `src/server/commands/*.ts` dentro do diretório do **plugin**.

Exemplo

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

Descrição

- ``app.command('echo')``: Define um comando chamado `echo`.  
- ``.option('-v, --version')``: Adiciona uma opção ao comando.  
- ``.action()``: Define a lógica de execução do comando.  
- ``app.version.get()``: Obtém a versão atual do aplicativo.

Executar Comando

```bash
nocobase echo
nocobase echo -v
```

## Comandos Estáticos

Use `Application.registerStaticCommand()` para registrar. Os comandos estáticos podem ser executados sem a necessidade de habilitar os **plugins**, sendo ideais para tarefas de instalação, inicialização, migração ou depuração. Registre-os no método `staticImport()` da classe do **plugin**.

Exemplo

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

Executar Comando

```bash
nocobase echo
nocobase echo --version
```

Descrição

- ``Application.registerStaticCommand()`` registra os comandos antes que o aplicativo seja instanciado.  
- Comandos estáticos são geralmente usados para executar tarefas globais que não dependem do estado do aplicativo ou do **plugin**.  

## API de Comandos

Os objetos de comando fornecem três métodos auxiliares opcionais para controlar o contexto de execução do comando:

| Método | Propósito | Exemplo |
|--------|-----------|---------|
| `ipc()` | Comunica-se com instâncias de aplicativos em execução (via IPC) | `app.command('reload').ipc().action()` |
| `auth()` | Verifica se a configuração do banco de dados está correta | `app.command('seed').auth().action()` |
| `preload()` | Pré-carrega a configuração do aplicativo (executa `app.load()`) | `app.command('sync').preload().action()` |

Descrição da Configuração

- **`ipc()`**  
  Por padrão, os comandos são executados em uma nova instância do aplicativo.  
  Após habilitar `ipc()`, os comandos interagem com a instância do aplicativo atualmente em execução através de comunicação entre processos (IPC), sendo adequados para comandos de operação em tempo real (como atualizar cache, enviar notificações).

- **`auth()`**  
  Verifica se a configuração do banco de dados está disponível antes da execução do comando.  
  Se a configuração do banco de dados estiver incorreta ou a conexão falhar, o comando não continuará. É comumente usado para tarefas que envolvem escrita ou leitura no banco de dados.

- **`preload()`**  
  Pré-carrega a configuração do aplicativo antes de executar o comando, o que é equivalente a executar `app.load()`.  
  É adequado para comandos que dependem da configuração ou do contexto do **plugin**.

Para mais métodos da API, consulte [AppCommand](/api/server/app-command).

## Exemplos Comuns

Inicializar Dados Padrão

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Usuário admin padrão inicializado.');
  });
```

Recarregar Cache para Instância em Execução (Modo IPC)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Solicitando que o aplicativo em execução recarregue o cache...');
  });
```

Registro Estático de Comando de Instalação

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Configurando o ambiente NocoBase...');
    });
});
```