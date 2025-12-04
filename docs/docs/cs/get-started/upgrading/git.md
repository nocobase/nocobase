:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Aktualizace instalace ze zdrojového kódu Git

:::warning Příprava před aktualizací

- Než začnete, nezapomeňte zálohovat databázi.
- Ukončete běžící NocoBase (`Ctrl + C`).

:::

## 1. Přejděte do adresáře projektu NocoBase

```bash
cd my-nocobase-app
```

## 2. Stáhněte nejnovější kód

```bash
git pull
```

## 3. Odstraňte mezipaměť a staré závislosti (volitelné)

Pokud běžný proces aktualizace selže, můžete zkusit vymazat mezipaměť a závislosti a poté je znovu stáhnout.

```bash
# Vymažte mezipaměť NocoBase
yarn nocobase clean
# Odstraňte závislosti
yarn rimraf -rf node_modules # ekvivalent k rm -rf node_modules
```

## 4. Aktualizujte závislosti

📢 V závislosti na síťovém prostředí a konfiguraci systému může tento krok trvat i déle než deset minut.

```bash
yarn install
```

## 5. Spusťte příkaz pro aktualizaci

```bash
yarn nocobase upgrade
```

## 6. Spusťte NocoBase

```bash
yarn dev
```

:::tip Tip pro produkční prostředí

Nedoporučuje se nasazovat instalaci NocoBase ze zdrojového kódu přímo v produkčním prostředí (pro produkční prostředí se prosím podívejte na [Nasazení v produkčním prostředí](../deployment/production.md)).

:::

## 7. Aktualizace pluginů třetích stran

Podívejte se na [Instalace a aktualizace pluginů](../install-upgrade-plugins.mdx)