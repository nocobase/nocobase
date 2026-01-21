:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Aggiornamento di un'installazione da sorgente Git

:::warning Preparazione prima dell'aggiornamento

- Si assicuri di eseguire prima il backup del database
- Interrompa l'istanza di NocoBase in esecuzione (`Ctrl + C`)

:::

## 1. Si sposti nella directory del progetto NocoBase

```bash
cd my-nocobase-app
```

## 2. Scarichi l'ultima versione del codice

```bash
git pull
```

## 3. Elimini la cache e le vecchie dipendenze (opzionale)

Se il processo di aggiornamento standard fallisce, può provare a svuotare la cache e le dipendenze per poi scaricarle nuovamente.

```bash
# Svuota la cache di nocobase
yarn nocobase clean
# Elimina le dipendenze
yarn rimraf -rf node_modules # equivalente a rm -rf node_modules
```

## 4. Aggiorni le dipendenze

📢 A causa di fattori come l'ambiente di rete e la configurazione del sistema, questo passaggio potrebbe richiedere più di dieci minuti.

```bash
yarn install
```

## 5. Esegua il comando di aggiornamento

```bash
yarn nocobase upgrade
```

## 6. Avvii NocoBase

```bash
yarn dev
```

:::tip Suggerimento per l'ambiente di produzione

Non è consigliabile distribuire un'installazione di NocoBase da codice sorgente direttamente in un ambiente di produzione (per gli ambienti di produzione, si prega di fare riferimento a [Distribuzione in produzione](../deployment/production.md)).

:::

## 7. Aggiornamento dei plugin di terze parti

Faccia riferimento a [Installazione e aggiornamento dei plugin](../install-upgrade-plugins.mdx)