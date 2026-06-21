`# Обновление установки create-nocobase-app

:::warning Подготовка перед обновлением

- Сначала обязательно сделайте резервную копию базы данных
- Остановите запущенный экземпляр NocoBase

:::

## 1. Остановите запущенный экземпляр NocoBase

Если это не фоновый процесс, остановите его с помощью `Ctrl + C`. В производственной среде выполните команду `pm2-stop`, чтобы остановить его.

```bash
yarn nocobase pm2-stop
```

## 2. Выполните команду обновления

Просто выполните команду `yarn nocobase upgrade`.

```bash
# Перейдите в соответствующий каталог
cd my-nocobase-app
# Выполните команду обновления
yarn nocobase upgrade
# Запуск
yarn dev
```

### Обновление до определенной версии

Измените файл `package.json` в корневом каталоге проекта и обновите номера версий для `@nocobase/cli` и `@nocobase/devtools` (поддерживаются только обновления, откаты не поддерживаются). Например:

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