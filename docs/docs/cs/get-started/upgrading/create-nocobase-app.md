:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Upgrade instalace create-nocobase-app

:::warning Příprava před upgradem

- Nezapomeňte si nejprve zálohovat databázi.
- Zastavte běžící instanci NocoBase.

:::

## 1. Zastavte běžící instanci NocoBase

Pokud se nejedná o proces běžící na pozadí, zastavte jej pomocí klávesové zkratky `Ctrl + C`. V produkčním prostředí jej zastavíte spuštěním příkazu `pm2-stop`.

```bash
yarn nocobase pm2-stop
```

## 2. Spusťte příkaz pro upgrade

Stačí spustit příkaz pro upgrade `yarn nocobase upgrade`.

```bash
# Přejděte do příslušného adresáře
cd my-nocobase-app
# Spusťte příkaz pro upgrade
yarn nocobase upgrade
# Spusťte aplikaci
yarn dev
```

### Upgrade na konkrétní verzi

Upravte soubor `package.json` v kořenovém adresáři projektu a změňte čísla verzí pro `@nocobase/cli` a `@nocobase/devtools` (můžete pouze upgradovat, nikoli downgradovat). Například:

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

Poté spusťte příkaz pro upgrade

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```