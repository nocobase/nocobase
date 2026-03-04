:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/interface-builder/blocks/block-settings/block-height).
:::

# Altezza del blocco

## Introduzione

L'altezza del blocco supporta tre modalità: **Altezza predefinita**, **Altezza specificata** e **Altezza intera**. La maggior parte dei blocchi supporta le impostazioni dell'altezza.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Modalità di altezza

### Altezza predefinita

La strategia dell'altezza predefinita varia a seconda del tipo di blocco. Ad esempio, i blocchi Tabella e Modulo adattano automaticamente la propria altezza in base al contenuto e non appariranno barre di scorrimento all'interno del blocco.

### Altezza specificata

È possibile specificare manualmente l'altezza totale della cornice esterna del blocco. Il blocco calcolerà e allocherà automaticamente l'altezza disponibile internamente.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Altezza intera

La modalità ad altezza intera è simile all'altezza specificata, ma l'altezza del blocco viene calcolata in base al **viewport** (area visibile) del browser corrente per raggiungere l'altezza massima a schermo intero. Non appariranno barre di scorrimento nella pagina del browser; le barre di scorrimento appariranno solo all'interno del blocco.

La gestione dello scorrimento interno nella modalità ad altezza intera differisce leggermente tra i vari blocchi:

- **Tabella**: scorrimento interno al `tbody`;
- **Modulo / Dettagli**: scorrimento all'interno della Griglia (scorrimento del contenuto esclusa l'area delle azioni);
- **Elenco / Scheda a griglia**: scorrimento all'interno della Griglia (scorrimento del contenuto esclusa l'area delle azioni e la barra di paginazione);
- **Mappa / Calendario**: altezza adattiva complessiva, senza barre di scorrimento;
- **Iframe / Markdown**: limita l'altezza totale della cornice del blocco, con le barre di scorrimento che appaiono all'interno del blocco.

#### Tabella ad altezza intera

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Modulo ad altezza intera

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)