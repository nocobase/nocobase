:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Gestione delle versioni

Dopo che un flusso di lavoro configurato è stato attivato almeno una volta, se desidera modificarne la configurazione o i suoi nodi, è necessario creare una nuova versione prima di apportare le modifiche. Ciò assicura anche che, quando si esamina la cronologia di esecuzione dei flussi di lavoro attivati in precedenza, essa non sia influenzata da modifiche future.

Nella pagina di configurazione del flusso di lavoro, può visualizzare le versioni esistenti del flusso di lavoro dal menu delle versioni nell'angolo in alto a destra:

![Visualizzare le versioni del flusso di lavoro](https://static-docs.nocobase.com/ad93d2c08166b0e3e643fb148713a63f.png)

Nel menu "Altre azioni" ("...") alla sua destra, può scegliere di copiare la versione attualmente visualizzata in una nuova versione:

![Copiare il flusso di lavoro in una nuova versione](https://static-docs.nocobase.com/280598e6caca2af004893390a744256.png)

Dopo aver copiato in una nuova versione, clicchi l'interruttore "Abilita"/"Disabilita" per portare la versione corrispondente allo stato abilitato, e la nuova versione del flusso di lavoro entrerà in vigore.

Se ha bisogno di riselezionare una vecchia versione, la selezioni dal menu delle versioni, quindi clicchi nuovamente l'interruttore "Abilita"/"Disabilita" per attivarla. La versione attualmente visualizzata entrerà in vigore e le attivazioni successive eseguiranno il processo di quella versione.

Quando deve disabilitare il flusso di lavoro, clicchi l'interruttore "Abilita"/"Disabilita" per portarlo allo stato disabilitato, e il flusso di lavoro non verrà più attivato.

:::info{title=Suggerimento}
A differenza della funzione "Copia" di un flusso di lavoro dall'elenco di gestione dei flussi di lavoro, un flusso di lavoro "copiato in una nuova versione" rimane raggruppato sotto lo stesso set di flussi di lavoro, distinguendosi solo per la versione. Tuttavia, copiare un flusso di lavoro viene trattato come un flusso di lavoro completamente nuovo, non correlato alle versioni del flusso di lavoro precedente, e il suo conteggio delle esecuzioni verrà azzerato.
:::