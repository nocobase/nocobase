:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Обновление установки create-nocobase-app

:::warning Подготовка перед обновлением

- Обязательно сначала сделайте резервную копию базы данных.
- Остановите запущенный экземпляр NocoBase.

:::

## 1. Остановите запущенный экземпляр NocoBase

Если процесс не запущен в фоновом режиме, остановите его с помощью `Ctrl + C`. В production-среде используйте команду `pm2-stop`.

```bash
yarn nocobase pm2-stop
```

## 2. Выполните команду обновления

Просто выполните команду обновления `yarn nocobase upgrade`.

```bash
# Перейдите в соответствующую директорию
cd my-nocobase-app
# Выполните команду обновления
yarn nocobase upgrade
# Запустите
yarn dev
```

### Обновление до определенной версии

Измените файл `package.json` в корневой директории проекта, обновив номера версий для `@nocobase/cli` и `@nocobase/devtools` (можно только обновить, но не понизить версию). Например:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

Затем выполните команду обновления

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```