---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/multi-app/multi-app/index).
:::

# Gestione multi-applicazione

## Panoramica delle funzionalità

La gestione multi-applicazione è la soluzione di gestione unificata delle applicazioni fornita da NocoBase, utilizzata per creare e gestire più istanze di applicazioni NocoBase fisicamente isolate in uno o più ambienti di runtime. Attraverso il supervisore delle applicazioni (AppSupervisor), gli utenti possono creare e mantenere più applicazioni da un unico punto di accesso, soddisfacendo le esigenze di diverse attività e diverse fasi di scala.

## Applicazione singola

Nella fase iniziale del progetto, la maggior parte degli utenti inizierà con una singola applicazione.

In questa modalità, il sistema deve solo implementare un'istanza di NocoBase e tutte le funzioni aziendali, i dati e gli utenti vengono eseguiti nella stessa applicazione. L'implementazione è semplice, i costi di configurazione sono bassi ed è molto adatta per la verifica di prototipi, piccoli progetti o strumenti interni.

Tuttavia, man mano che l'attività diventa gradualmente complessa, una singola applicazione dovrà affrontare alcune limitazioni naturali:

- Le funzioni continuano a sovrapporsi, rendendo il sistema ingombrante
- È difficile isolare le diverse attività tra loro
- I costi di espansione e manutenzione dell'applicazione continuano a salire

In questo momento, gli utenti desidereranno suddividere le diverse attività in più applicazioni per migliorare la manutenibilità e la scalabilità del sistema.

## Multi-applicazione a memoria condivisa

Quando gli utenti desiderano suddividere le attività, ma non vogliono introdurre architetture di implementazione e manutenzione complesse, possono passare alla modalità multi-applicazione a memoria condivisa.

In questa modalità, più applicazioni possono essere eseguite contemporaneamente in un'unica istanza di NocoBase. Ogni applicazione è indipendente, può connettersi a un database indipendente, può essere creata, avviata e arrestata separatamente, ma condividono lo stesso processo e lo stesso spazio di memoria; l'utente deve comunque mantenere solo un'istanza di NocoBase.

![](https://static-docs.nocobase.com/202512231055907.png)

Questo approccio porta miglioramenti evidenti:

- Le attività possono essere suddivise in base alla dimensione dell'applicazione
- Le funzioni e le configurazioni tra le applicazioni sono più chiare
- Rispetto alle soluzioni multi-processo o multi-container, l'occupazione delle risorse è inferiore

Tuttavia, poiché tutte le applicazioni vengono eseguite nello stesso processo, esse condividono risorse come CPU e memoria; un'anomalia o un carico elevato di una singola applicazione potrebbe influire sulla stabilità delle altre applicazioni.

Quando il numero di applicazioni continua ad aumentare, o quando vengono richiesti requisiti più elevati di isolamento e stabilità, è necessario aggiornare ulteriormente l'architettura.

## Distribuzione ibrida multi-ambiente

Quando la scala e la complessità dell'attività raggiungono un certo livello e il numero di applicazioni deve essere ampliato su scala, la modalità multi-applicazione a memoria condivisa dovrà affrontare sfide come la contesa delle risorse, la stabilità e la sicurezza. Nella fase di scalabilità, gli utenti possono considerare l'adozione di una modalità di distribuzione ibrida multi-ambiente per supportare scenari aziendali più complessi.

Il cuore di questa architettura è l'introduzione di un'applicazione di ingresso, ovvero l'implementazione di un NocoBase come centro di gestione unificato e, allo stesso tempo, l'implementazione di più NocoBase come ambienti di runtime delle applicazioni per l'esecuzione effettiva delle applicazioni aziendali.

L'applicazione di ingresso è responsabile di:

- Creazione, configurazione e gestione del ciclo di vita delle applicazioni
- Invio dei comandi di gestione e riepilogo dello stato

L'ambiente dell'applicazione dell'istanza è responsabile di:

- Ospitare ed eseguire effettivamente le applicazioni aziendali attraverso la modalità multi-applicazione a memoria condivisa

Per gli utenti, più applicazioni possono ancora essere create e gestite attraverso un unico punto di accesso, ma internamente:

- Diverse applicazioni possono essere eseguite su diversi nodi o cluster
- Ogni applicazione può utilizzare database e middleware indipendenti
- È possibile espandere o isolare le applicazioni ad alto carico secondo necessità

![](https://static-docs.nocobase.com/202512231215186.png)

Questo approccio è adatto per piattaforme SaaS, un gran numero di ambienti demo o scenari multi-tenant, garantendo flessibilità e migliorando al contempo la stabilità e la manutenibilità del sistema.