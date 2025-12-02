:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Estendendo Fontes de Dados Sincronizadas

## Visão Geral

O NocoBase permite que você estenda os tipos de **fonte de dados** para sincronização de dados do usuário conforme a sua necessidade.

## Lado do Servidor

### Interface da Fonte de Dados

O **plugin** de sincronização de dados do usuário integrado oferece o registro e o gerenciamento de tipos de **fonte de dados**. Para estender um tipo de **fonte de dados**, você precisa herdar a classe abstrata `SyncSource` fornecida pelo **plugin** e implementar as interfaces padrão correspondentes.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

A classe `SyncSource` inclui uma propriedade `options` para recuperar configurações personalizadas da **fonte de dados**.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    //...
    const { appid, secret } = this.options;
    //...
    return [];
  }
}
```

### Descrição dos Campos de `UserData`

| Campo        | Descrição                                    |
| ------------ | ---------------------------------------------- |
| `dataType`   | Tipo de dados, as opções são `user` e `department` |
| `uniqueKey`  | Campo de identificador único                        |
| `records`    | Registros de dados                                   |
| `sourceName` | Nome da **fonte de dados**                               |

Se `dataType` for `user`, o campo `records` contém os seguintes campos:

| Campo         | Descrição             |
| ------------- | ----------------------- |
| `id`          | ID do usuário                 |
| `nickname`    | Apelido do usuário           |
| `avatar`      | Avatar do usuário             |
| `email`       | E-mail                   |
| `phone`       | Número de telefone            |
| `departments` | Array de IDs de departamento |

Se `dataType` for `department`, o campo `records` contém os seguintes campos:

| Campo      | Descrição          |
| ---------- | -------------------- |
| `id`       | ID do departamento        |
| `name`     | Nome do departamento      |
| `parentId` | ID do departamento pai |

### Exemplo de Implementação da Interface da Fonte de Dados

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    // ...
    const ThirdClientApi = new ThirdClientApi(
      this.options.appid,
      this.options.secret,
    );
    const departments = await this.clientapi.getDepartments();
    const users = await this.clientapi.getUsers();
    // ...
    return [
      {
        dataType: 'department',
        uniqueKey: 'id',
        records: departments,
        sourceName: this.instance.name,
      },
      {
        dataType: 'user',
        uniqueKey: 'id',
        records: users,
        sourceName: this.instance.name,
      },
    ];
  }
}
```

### Registrando um Tipo de Fonte de Dados

A **fonte de dados** estendida deve ser registrada no módulo de gerenciamento de dados.

```ts
import UserDataSyncPlugin from '@nocobase/plugin-user-data-sync';

class CustomSourcePlugin extends Plugin {
  async load() {
    const syncPlugin = this.app.pm.get(
      UserDataSyncPlugin,
    ) as UserDataSyncPlugin;
    if (syncPlugin) {
      syncPlugin.sourceManager.reigsterType('custom-source-type', {
        syncSource: CustomSyncSource,
        title: 'Custom Source',
      });
    }
  }
}
```

## Lado do Cliente

A interface de usuário do cliente registra tipos de **fonte de dados** usando o método `registerType` fornecido pela interface do cliente do **plugin** de sincronização de dados do usuário:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Formulário de gerenciamento de back-end
      },
    });
  }
}
```

### Formulário de Gerenciamento de Back-end

![](https://static-docs.nocobase.com/202412041429835.png)

A seção superior apresenta a configuração geral da **fonte de dados**, enquanto a seção inferior permite o registro de formulários de configuração personalizados.