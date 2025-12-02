:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Motore di Archiviazione: Amazon S3

Un motore di archiviazione basato su Amazon S3. Prima di utilizzarlo, è necessario preparare l'account e le autorizzazioni pertinenti.

## Parametri di Configurazione

![Amazon S3 Storage Engine Configuration Example](https://static-docs.nocobase.com/20251031092524.png)

:::info{title=Nota}
Questa sezione presenta solo i parametri specifici del motore di archiviazione Amazon S3. Per i parametri comuni, La preghiamo di consultare [Parametri Comuni del Motore](./index#引擎通用参数).
:::

### Regione

Inserisca la regione di archiviazione S3, ad esempio: `us-west-1`.

:::info{title=Nota}
Può visualizzare le informazioni sulla regione del Suo bucket nella [console Amazon S3](https://console.aws.amazon.com/s3/). È sufficiente utilizzare il prefisso della regione (non il nome di dominio completo).
:::

### ID AccessKey

Inserisca l'ID AccessKey di Amazon S3.

### Secret AccessKey

Inserisca il Secret AccessKey di Amazon S3.

### Bucket

Inserisca il nome del bucket S3.