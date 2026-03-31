:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Migration

Durante o desenvolvimento e as atualizações de **plugins** do NocoBase, a estrutura do banco de dados ou as configurações dos **plugins** podem sofrer alterações incompatíveis. Para garantir que os upgrades sejam executados sem problemas, o NocoBase oferece um mecanismo de **Migration** para lidar com essas mudanças através da criação de arquivos de migration. Este guia vai te ajudar a entender sistematicamente como usar e desenvolver Migrations.

## Conceito de Migration

Migration é um script que é executado automaticamente durante os upgrades de **plugins**, e é usado para resolver os seguintes problemas:

- Ajustes na estrutura da tabela de dados (adicionar campos, modificar tipos de campos, etc.)
- Migração de dados (como atualizações em lote de valores de campos)
- Atualizações de configuração ou lógica interna do **plugin**

O momento de execução das Migrations é dividido em três tipos:

| Tipo | Momento de Acionamento | Cenário de Execução |
|------|------------------------|---------------------|
| `beforeLoad` | Antes de todas as configurações de **plugins** serem carregadas | |
| `afterSync` | Depois que as configurações de **coleções** são sincronizadas com o banco de dados (a estrutura da **coleção** já foi alterada) | |
| `afterLoad` | Depois que todas as configurações de **plugins** são carregadas | |

## Criar Arquivos de Migration

Os arquivos de Migration devem ser colocados no diretório do **plugin**, em `src/server/migrations/*.ts`. O NocoBase oferece o comando `create-migration` para gerar arquivos de migration rapidamente.

```bash
yarn nocobase create-migration [options] <name>
```

Parâmetros Opcionais

| Parâmetro | Descrição |
|------|----------|
| `--pkg <pkg>` | Especifica o nome do pacote do **plugin** |
| `--on [on]` | Especifica o momento de execução, opções: `beforeLoad`, `afterSync`, `afterLoad` |

Exemplo

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

O caminho do arquivo de migration gerado é o seguinte:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Conteúdo inicial do arquivo:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Escreva a lógica de upgrade aqui
  }
}
```

> ⚠️ `appVersion` é usado para identificar a versão alvo do upgrade. Ambientes com versões anteriores à versão especificada executarão esta migration.

## Escrevendo Migrations

Nos arquivos de Migration, você pode acessar as seguintes propriedades e APIs comuns através de `this` para operar facilmente o banco de dados, **plugins** e instâncias da aplicação:

Propriedades Comuns

- **`this.app`**  
  Instância atual da aplicação NocoBase. Pode ser usada para acessar serviços globais, **plugins** ou configurações.  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  Instância do serviço de banco de dados, fornece interfaces para operar **coleções** (modelos).  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  Instância do **plugin** atual, pode ser usada para acessar métodos personalizados do **plugin**.  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  Instância do Sequelize, pode executar diretamente SQL nativo ou operações de transação.  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  QueryInterface do Sequelize, comumente usada para modificar estruturas de tabela, como adicionar campos, excluir tabelas, etc.  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Exemplo de Escrita de Migration

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Use queryInterface para adicionar um campo
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Use db para acessar modelos de dados
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Execute um método personalizado do plugin
    await this.plugin.customMethod();
  }
}
```

Além das propriedades comuns listadas acima, a Migration também oferece APIs ricas. Para documentação detalhada, consulte a [API de Migration](/api/server/migration).

## Acionar Migrations

A execução das Migrations é acionada pelo comando `nocobase upgrade`:

```bash
$ yarn nocobase upgrade
```

Durante o upgrade, o sistema determinará a ordem de execução com base no tipo de Migration e no `appVersion`.

## Testando Migrations

No desenvolvimento de **plugins**, é recomendável usar um **Mock Server** para testar se a migration é executada corretamente, evitando danos aos dados reais.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Nome do plugin
      version: '0.18.0-alpha.5', // Versão antes do upgrade
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Escreva a lógica de verificação, como verificar se o campo existe, se a migração de dados foi bem-sucedida
  });
});
```

> Dica: Usar um Mock Server pode simular rapidamente cenários de upgrade e verificar a ordem de execução da Migration e as alterações de dados.

## Recomendações de Práticas de Desenvolvimento

1.  **Divida as Migrations**  
    Tente gerar um arquivo de migration por upgrade para manter a atomicidade e simplificar a solução de problemas.
2.  **Especifique o Momento de Execução**  
    Escolha `beforeLoad`, `afterSync` ou `afterLoad` com base nos objetos de operação, evite depender de módulos não carregados.
3.  **Gerencie o Versionamento**  
    Use `appVersion` para especificar claramente a versão aplicável à migration e evitar execuções repetidas.
4.  **Cobertura de Testes**  
    Verifique a migration em um Mock Server antes de executar o upgrade em um ambiente real.