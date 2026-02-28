---
pkg: '@nocobase/plugin-app-supervisor'
---

# Gestione multi-applicazione

## Panoramica

La gestione multi-applicazione di NocoBase consente di creare e gestire più istanze **fisicamente isolate** in uno o più ambienti runtime. Con **AppSupervisor** tutto viene gestito da un unico ingresso.

## Applicazione singola

Nelle fasi iniziali, la maggior parte dei progetti parte da una sola applicazione.

Con la crescita emergono limiti naturali:

- Aumento continuo delle funzionalità
- Difficoltà di isolamento tra domini business
- Costi di manutenzione e scalabilità in crescita

## Multi-app in memoria condivisa

In questo modo più applicazioni girano nella stessa istanza NocoBase. Ogni app è indipendente (DB dedicato, ciclo vita separato), ma processo e memoria sono condivisi.

![](https://static-docs.nocobase.com/202512231055907.png)

Vantaggi:

- Separazione per applicazione
- Configurazione più chiara
- Minore consumo di risorse rispetto a multi-processo/multi-container

Limite: carichi elevati o errori di un'app possono impattare le altre.

## Deployment ibrido multi-ambiente

Quando aumentano scala e complessità, il modello shared-memory può non bastare. Il deployment ibrido multi-ambiente introduce un'app di ingresso e più ambienti di esecuzione.

![](https://static-docs.nocobase.com/202512231215186.png)

Questo approccio è adatto a SaaS, ambienti demo numerosi e scenari multi-tenant.
