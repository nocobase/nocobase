:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Tencent COS

Un motore di archiviazione basato su Tencent Cloud COS. Prima dell'uso, è necessario preparare l'account e le autorizzazioni pertinenti.

## Opzioni di configurazione

![Esempio di configurazione del motore di archiviazione Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Suggerimento}
Questa sezione copre solo le opzioni specifiche per il motore di archiviazione Tencent Cloud COS. Per i parametri comuni, La preghiamo di fare riferimento a [Parametri comuni del motore](./index.md#common-engine-parameters).
:::

### Regione

Inserisca la regione di archiviazione COS, ad esempio: `ap-chengdu`.

:::info{title=Suggerimento}
Può visualizzare le informazioni sulla regione del bucket di archiviazione nella [Console Tencent Cloud COS](https://console.cloud.tencent.com/cos); è sufficiente prendere la parte del prefisso della regione (senza il nome di dominio completo).
:::

### SecretId

Inserisca l'ID della chiave di accesso autorizzata di Tencent Cloud.

### SecretKey

Inserisca il Secret della chiave di accesso autorizzata di Tencent Cloud.

### Bucket

Inserisca il nome del bucket di archiviazione COS, ad esempio: `qing-cdn-1234189398`.