---
pkg: "@nocobase/plugin-file-manager"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



# Gestore File

## Introduzione

Il plugin Gestore File offre una **collezione** di file, un campo allegato e motori di archiviazione file per gestire efficacemente i file. I file sono record all'interno di un tipo speciale di **collezione**, definita **collezione** di file, che memorizza i metadati e può essere gestita tramite il Gestore File. I campi allegato sono specifici campi di associazione collegati alla **collezione** di file. Il plugin supporta diversi metodi di archiviazione, tra cui l'archiviazione locale, Alibaba Cloud OSS, Amazon S3 e Tencent Cloud COS.

## Manuale Utente

### Collezione di File

È inclusa una **collezione** `attachments` predefinita per memorizzare tutti i file associati ai campi allegato. Inoltre, è possibile creare nuove **collezioni** di file per archiviare file specifici.

[Per maggiori dettagli, consulti la documentazione sulla **collezione** di file](/data-sources/file-manager/file-collection)

### Campo Allegato

I campi allegato sono specifici campi di associazione correlati alla **collezione** di file, che possono essere creati tramite il tipo di campo "Allegato" o configurati tramite un campo "Relazione".

[Per maggiori dettagli, consulti la documentazione sul campo allegato](/data-sources/file-manager/field-attachment)

### Motore di Archiviazione File

Il motore di archiviazione file viene utilizzato per salvare i file su servizi specifici, inclusa l'archiviazione locale (salvataggio sul disco rigido del server), l'archiviazione cloud, ecc.

[Per maggiori dettagli, consulti la documentazione sul motore di archiviazione file](./storage/index.md)

### API HTTP

Il caricamento dei file può essere gestito tramite l'API HTTP; per maggiori informazioni, consulti [API HTTP](./http-api.md).

## Sviluppo

*