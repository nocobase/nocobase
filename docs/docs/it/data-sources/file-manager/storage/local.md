:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Archiviazione locale

I file caricati verranno salvati in una directory locale sul server. Questa soluzione è adatta per scenari su piccola scala o sperimentali, dove il numero totale di file gestiti dal sistema è relativamente ridotto.

## Parametri di configurazione

![Esempio di configurazione del motore di archiviazione file](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Suggerimento}
Questa sezione illustra solo i parametri specifici del motore di archiviazione locale. Per i parametri comuni, La preghiamo di consultare i [Parametri Generali del Motore](./index.md#general-engine-parameters).
:::

### Percorso

Il percorso indica sia il percorso relativo del file archiviato sul server sia il percorso URL per l'accesso. Ad esempio, "`user/avatar`" (senza gli slash iniziali e finali "`/`") rappresenta:

1.  Il percorso relativo del file caricato e archiviato sul server: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2.  Il prefisso URL per accedere al file: `http://localhost:13000/storage/uploads/user/avatar`.