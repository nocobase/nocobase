:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Motore di Archiviazione: Aliyun OSS

Un motore di archiviazione basato su Aliyun OSS. Prima di utilizzarlo, deve preparare l'account e le autorizzazioni necessarie.

## Parametri di Configurazione

![Esempio di configurazione del motore di archiviazione Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Nota}
Questa sezione presenta solo i parametri specifici del motore di archiviazione Aliyun OSS. Per i parametri generali, La invitiamo a consultare [Parametri Generali del Motore](./index#引擎通用参数).
:::

### Regione

Inserisca la regione di archiviazione OSS, ad esempio: `oss-cn-hangzhou`.

:::info{title=Nota}
Può visualizzare le informazioni sulla regione del Suo bucket nella [Console Aliyun OSS](https://oss.console.aliyun.com/). È sufficiente utilizzare il prefisso della regione (senza il nome di dominio completo).
:::

### ID AccessKey

Inserisca l'ID della Sua chiave di accesso Aliyun.

### Secret AccessKey

Inserisca il Secret della Sua chiave di accesso Aliyun.

### Bucket

Inserisca il nome del bucket OSS.

### Timeout

Inserisca il tempo di timeout per il caricamento su Aliyun OSS, in millisecondi. Il valore predefinito è `60000` millisecondi (ovvero 60 secondi).