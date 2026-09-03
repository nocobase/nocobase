# Расширение источников синхронизируемых данных

## Обзор

NocoBase позволяет пользователям расширять типы источников данных для синхронизации пользовательских данных по необходимости.

## Серверная сторона

### Интерфейс источника данных

Встроенный плагин синхронизации пользовательских данных предоставляет регистрацию и управление типами источников данных. Чтобы расширить тип источника данных, унаследуйтесь от абстрактного класса `SyncSource`, предоставляемого плагином, и реализуйте соответствующие стандартные интерфейсы.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

Класс `SyncSource` включает свойство `options`, которое используется для получения пользовательских конфигураций источника данных.

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

| Поле         | Описание                                              |
| ------------ | ----------------------------------------------------- |
| `dataType`   | Тип данных, варианты: `user` (пользователь) и `department` (отдел) |
| `uniqueKey`  | Поле уникального идентификатора                       |
| `records`    | Записи данных                                         |
| `sourceName` | Имя источника данных                                  |

Если `dataType` равен `user`, поле `records` содержит следующие поля:

| Поле          | Описание                    |
| ------------- | --------------------------- |
| `id`          | ID пользователя             |
| `nickname`    | Никнейм пользователя        |
| `avatar`      | Аватар пользователя         |
| `email`       | Электронная почта           |
| `phone`       | Номер телефона              |
| `departments` | Массив ID отделов           |

Если `dataType` равен `department`, поле `records` содержит следующие поля:

| Поле       | Описание                |
| ---------- | ----------------------- |
| `id`       | ID отдела               |
| `name`     | Название отдела         |
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

Расширенный источник данных должен быть зарегистрирован в модуле управления данными.

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

## Клиентская сторона

В клиентском интерфейсе типы источников данных регистрируются методом `registerType`, предоставляемым клиентским интерфейсом плагина синхронизации пользовательских данных:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Форма управления серверной частью
      },
    });
  }
}
```

### Форма управления серверной частью

![](https://static-docs.nocobase.com/202412041429835.png)

Верхняя секция предоставляет общую конфигурацию источника данных, а нижняя позволяет регистрировать пользовательские формы конфигурации.