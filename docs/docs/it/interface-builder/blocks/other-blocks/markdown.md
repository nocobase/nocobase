:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Blocco Markdown

## Introduzione

Il blocco Markdown non richiede il collegamento a una fonte dati. Utilizza la sintassi Markdown per definire il contenuto testuale e può essere impiegato per visualizzare testo formattato.

## Aggiungere un Blocco

Può aggiungere un blocco Markdown a una pagina o a un popup.

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

Può anche aggiungere un blocco Markdown inline (inline-block) all'interno dei blocchi Modulo e Dettagli.

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Motore di Template

Utilizza il **[motore di template Liquid](https://liquidjs.com/tags/overview.html)** per offrire capacità di rendering dei template potenti e flessibili, permettendo di generare e visualizzare contenuti in modo dinamico e personalizzato. Con il motore di template, Lei può:

-   **Interpolazione Dinamica**: Utilizzi i segnaposto nel template per fare riferimento a variabili, ad esempio, `{{ ctx.user.userName }}` viene automaticamente sostituito con il nome utente corrispondente.
-   **Rendering Condizionale**: Supporta istruzioni condizionali (`{% if %}...{% else %}`), visualizzando contenuti diversi in base a stati dei dati differenti.
-   **Iterazione (Looping)**: Utilizzi `{% for item in list %}...{% endfor %}` per iterare su array o collezioni, generando liste, tabelle o moduli ripetuti.
-   **Filtri Integrati**: Offre un ricco set di filtri (come `upcase`, `downcase`, `date`, `truncate`, ecc.) per formattare ed elaborare i dati.
-   **Estensibilità**: Supporta variabili e funzioni personalizzate, rendendo la logica del template riutilizzabile e manutenibile.
-   **Sicurezza e Isolamento**: Il rendering del template viene eseguito in un ambiente sandbox, prevenendo l'esecuzione diretta di codice pericoloso e migliorando la sicurezza.

Grazie al motore di template Liquid, sviluppatori e creatori di contenuti possono **facilmente realizzare la visualizzazione dinamica dei contenuti, la generazione personalizzata di documenti e il rendering di template per strutture di dati complesse**, migliorando significativamente efficienza e flessibilità.

## Uso delle Variabili

Il Markdown in una pagina supporta variabili di sistema comuni (come l'utente corrente, il ruolo corrente, ecc.).

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Invece, il Markdown all'interno di un popup di azione di riga di un blocco (o sottopagina) supporta più variabili di contesto dei dati (come il record corrente, il record del popup corrente, ecc.).

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

## Codice QR

Il Markdown supporta la configurazione dei codici QR.

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```