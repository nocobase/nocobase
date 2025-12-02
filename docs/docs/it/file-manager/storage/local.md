:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Motore di Archiviazione: Archiviazione Locale

I file caricati verranno salvati in una directory locale sul disco rigido del server. Questa soluzione è adatta per scenari in cui il volume totale di file caricati gestiti dal sistema è ridotto o per scopi sperimentali.

## Parametri di Configurazione

![Esempio di configurazione del motore di archiviazione file](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Nota}
Questa sezione introduce solo i parametri specifici del motore di archiviazione locale. Per i parametri generali, La preghiamo di consultare i [Parametri Generali del Motore](./index.md#parametri-generali-del-motore).
:::

### Percorso

Indica sia il percorso relativo per l'archiviazione dei file sul server sia il percorso URL per l'accesso. Ad esempio, "`user/avatar`" (senza slash iniziali o finali) rappresenta:

1.  Il percorso relativo sul server dove vengono archiviati i file caricati: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2.  Il prefisso URL per accedere ai file: `http://localhost:13000/storage/uploads/user/avatar`.