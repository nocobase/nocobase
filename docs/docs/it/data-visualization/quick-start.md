:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Guida rapida

Iniziamo configurando un grafico da zero, utilizzando le funzionalità essenziali. Le capacità opzionali verranno trattate nei capitoli successivi.

Prerequisiti:
- È stata configurata una **fonte dati** e una **collezione** (tabella), e Lei dispone dei permessi di lettura.

## Aggiungere un blocco grafico

Nel designer di pagina, clicchi su "Aggiungi blocco", selezioni "Grafico" e aggiunga un blocco grafico.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Dopo averlo aggiunto, clicchi su "Configura" nell'angolo in alto a destra del blocco.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

Si aprirà il pannello di configurazione del grafico sulla destra. Contiene tre sezioni: Query dati, Opzioni grafico ed Eventi.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Configurare la query dati
Nel pannello "Query dati", può configurare la **fonte dati**, i filtri di query e altre opzioni correlate.

- Selezioni la **fonte dati** e la **collezione**
  - Nel pannello "Query dati", selezioni la **fonte dati** e la **collezione** come base per la query.
  - Se la **collezione** non è selezionabile o è vuota, verifichi prima se è stata creata e se il Suo utente dispone dei permessi necessari.

- Configuri le misure (Measures)
  - Selezioni uno o più campi numerici come misure.
  - Imposti l'aggregazione per ogni misura: Somma / Conteggio / Media / Max / Min.

- Configuri le dimensioni (Dimensions)
  - Selezioni uno o più campi come dimensioni di raggruppamento (data, categoria, regione, ecc.).
  - Per i campi data/ora, può impostare un formato (ad esempio, `YYYY-MM`, `YYYY-MM-DD`) per una visualizzazione coerente.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

Altre opzioni come filtro, ordinamento e paginazione sono facoltative.

## Eseguire la query e visualizzare i dati

- Clicchi su "Esegui query" per recuperare i dati e visualizzare un'anteprima del grafico direttamente sulla sinistra.
- Può cliccare su "Visualizza dati" per visualizzare in anteprima i risultati dei dati restituiti; è possibile passare tra i formati Tabella e JSON. Clicchi di nuovo per chiudere l'anteprima dei dati.
- Se il risultato è vuoto o non corrisponde alle aspettative, torni al pannello della query e verifichi i permessi della **collezione**, le mappature dei campi per misure/dimensioni e i tipi di dati.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Configurare le opzioni del grafico

Nel pannello "Opzioni grafico", può scegliere il tipo di grafico e configurarne le opzioni.

- Per prima cosa selezioni un tipo di grafico (linea/area, colonna/barra, torta/anello, dispersione, ecc.).
- Completi le mappature dei campi principali:
  - Linea/area/colonna/barra: `xField` (dimensione), `yField` (misura), `seriesField` (serie, facoltativo)
  - Torta/anello: `Category` (dimensione categorica), `Value` (misura)
  - Dispersione: `xField`, `yField` (due misure o dimensioni)
  - Per ulteriori impostazioni del grafico, può fare riferimento alla documentazione di ECharts: [Axis](https://echarts.apache.org/handbook/en/concepts/axis)
- Dopo aver cliccato su "Esegui query", le mappature dei campi vengono compilate automaticamente per impostazione predefinita. Se modifica dimensioni/misure, La preghiamo di ricontrollare le mappature.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Anteprima e salvataggio
Le modifiche alla configurazione aggiornano automaticamente l'anteprima in tempo reale sulla sinistra, dove può visualizzare il grafico. Tuttavia, La preghiamo di notare che tutte le modifiche non vengono effettivamente salvate finché non clicca sul pulsante "Salva".

Può anche utilizzare i pulsanti in basso:

- Anteprima: Le modifiche alla configurazione aggiornano automaticamente l'anteprima in tempo reale, oppure può cliccare sul pulsante "Anteprima" in basso per attivare un aggiornamento manuale.
- Annulla: Se non desidera le modifiche attuali, può cliccare sul pulsante "Annulla" in basso o aggiornare la pagina per annullare le modifiche e tornare allo stato salvato in precedenza.
- Salva: Clicchi su "Salva" per salvare definitivamente tutte le query e le configurazioni del grafico nel database; queste diventeranno effettive per tutti gli utenti.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Consigli comuni

- Configurazione minima: Selezioni una **collezione** più almeno una misura; si consiglia di aggiungere dimensioni per una visualizzazione raggruppata.
- Per le dimensioni data, si consiglia di impostare un formato appropriato (ad esempio, `YYYY-MM` per statistiche mensili) per evitare un asse X discontinuo o disordinato.
- Se la query è vuota o il grafico non viene visualizzato:
  - Verifichi la **collezione**/i permessi e le mappature dei campi.
  - Utilizzi "Visualizza dati" per confermare che i nomi delle colonne e i tipi corrispondano alla mappatura del grafico.
- L'anteprima è temporanea: Serve solo per la convalida e le regolazioni. Diventa effettiva solo dopo aver cliccato su "Salva".