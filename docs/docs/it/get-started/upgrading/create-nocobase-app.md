:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Aggiornamento di un'installazione create-nocobase-app

:::warning Preparazione prima dell'aggiornamento

- Assicuratevi di eseguire prima il backup del database.
- Fermate l'istanza di NocoBase in esecuzione.

:::

## 1. Fermare l'istanza di NocoBase in esecuzione

Se il processo non è in esecuzione in background, potete fermarlo con `Ctrl + C`. In un ambiente di produzione, eseguite il comando `pm2-stop` per arrestarlo.

```bash
yarn nocobase pm2-stop
```

## 2. Eseguire il comando di aggiornamento

È sufficiente eseguire il comando `yarn nocobase upgrade`.

```bash
# Spostatevi nella directory corrispondente
cd my-nocobase-app
# Eseguite il comando di aggiornamento
yarn nocobase upgrade
# Avviate
yarn dev
```

### Aggiornamento a una versione specifica

Modificate il file `package.json` nella directory principale del progetto, cambiando i numeri di versione per `@nocobase/cli` e `@nocobase/devtools` (è possibile solo aggiornare, non effettuare il downgrade). Ad esempio:

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

Quindi eseguite il comando di aggiornamento

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```