:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# API klíč

## Úvod

## Instalace

## Pokyny k použití

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Přidání API klíče

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Důležité poznámky**

- Přidaný API klíč patří aktuálnímu uživateli a dědí jeho roli.
- Ujistěte se, že je nakonfigurována proměnná prostředí `APP_KEY` a že zůstane důvěrná. Pokud se `APP_KEY` změní, všechny dříve přidané API klíče se stanou neplatnými.

### Jak nakonfigurovat APP_KEY

Pro Docker verzi upravte soubor `docker-compose.yml`:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Pro instalaci ze zdrojového kódu nebo pomocí `create-nocobase-app` můžete přímo upravit `APP_KEY` v souboru `.env`:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```