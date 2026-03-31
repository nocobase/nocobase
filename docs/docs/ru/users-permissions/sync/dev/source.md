:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Расширение синхронизируемых источников данных

## Обзор

NocoBase позволяет расширять типы источников данных для синхронизации пользовательских данных по мере необходимости.

## Серверная часть

### Интерфейс источника данных

Встроенный плагин синхронизации пользовательских данных обеспечивает регистрацию и управление типами источников данных. Чтобы расширить тип источника данных, вам необходимо унаследовать абстрактный класс `SyncSource`, предоставляемый плагином, и реализовать соответствующие стандартные интерфейсы.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

Класс `SyncSource` содержит свойство `options`, которое используется для получения пользовательских конфигураций источника данных.

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

### Описание полей `UserData`

| Поле         | Описание                                    |
| ------------ | ------------------------------------------- |
| `dataType`   | Тип данных, возможные значения: `user` и `department` |
| `uniqueKey`  | Поле уникального идентификатора             |
| `records`    | Записи данных                               |
| `sourceName` | Название источника данных                   |

Если `dataType` имеет значение `user`, поле `records` содержит следующие поля:

| Поле          | Описание                  |
| ------------- | ------------------------- |
| `id`          | ID пользователя           |
| `nickname`    | Никнейм пользователя      |
| `avatar`      | Аватар пользователя       |
| `email`       | Электронная почта         |
| `phone`       | Номер телефона            |
| `departments` | Массив ID отделов         |

Если `dataType` имеет значение `department`, поле `records` содержит следующие поля:

| Поле       | Описание             |
| ---------- | -------------------- |
| `id`       | ID отдела            |
| `name`     | Название отдела      |
| `parentId` | ID родительского отдела |

### Пример реализации интерфейса источника данных

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

### Регистрация типа источника данных

Расширенный источник данных необходимо зарегистрировать в модуле управления данными.

```ts
import UserDataSyncPlugin from '@nocobase/plugin-user-data-sync';

class CustomSourcePlugin extends Plugin {
  async load() {
    const syncPlugin = this.app.pm.get(
      UserDataSyncPlugin,
    ) as UserDataSyncPlugin;
    if (syncPlugin) {
      syncPlugin.sourceManager.registerType('custom-source-type', {
        syncSource: CustomSyncSource,
        title: 'Custom Source',
      });
    }
  }
}
```

## Клиентская часть

Клиентский пользовательский интерфейс регистрирует типы источников данных с помощью метода `registerType`, предоставляемого клиентским интерфейсом плагина синхронизации пользовательских данных:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Форма управления бэкендом
      },
    });
  }
}
```

### Форма управления бэкендом

![](https://static-docs.nocobase.com/202412041429835.png)

Верхняя часть содержит общие настройки источника данных, а нижняя часть позволяет регистрировать пользовательские формы конфигурации.