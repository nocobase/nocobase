:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Tencent Cloud COS

Un motore di archiviazione basato su Tencent Cloud COS. Prima dell'uso, è necessario preparare l'account e le autorizzazioni pertinenti.

## Parametri di configurazione

![Esempio di configurazione del motore di archiviazione Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Suggerimento}
Questa sezione introduce solo i parametri dedicati al motore di archiviazione Tencent Cloud COS. Per i parametri generali, si prega di consultare [Parametri generali del motore](./index.md#general-engine-parameters).
:::

### Regione

Inserisca la regione per l'archiviazione COS, ad esempio: `ap-chengdu`.

:::info{title=Suggerimento}
Può visualizzare le informazioni sulla regione del suo bucket nella [Console Tencent Cloud COS](https://console.cloud.tencent.com/cos). È sufficiente utilizzare il prefisso della regione (senza il nome di dominio completo).
:::

### SecretId

Inserisca l'ID della sua chiave di accesso Tencent Cloud.

### SecretKey

Inserisca il Secret della sua chiave di accesso Tencent Cloud.

### Bucket

Inserisca il nome del bucket COS, ad esempio: `qing-cdn-1234189398`.