---
pkg: '@nocobase/plugin-acl'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Applicazione nella UI

## Permessi dei blocchi di dati

La visibilità dei blocchi di dati in una **collezione** è controllata dai permessi dell'operazione di visualizzazione. Le configurazioni individuali hanno la precedenza su quelle globali.

Ad esempio, con i permessi globali, il ruolo "admin" ha accesso completo, ma la **collezione** Ordini potrebbe avere permessi individuali configurati che la rendono invisibile.

Configurazione dei permessi globali:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

Configurazione dei permessi individuali per la **collezione** Ordini:

![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)

Nella UI, tutti i blocchi della **collezione** Ordini non vengono visualizzati.

Il processo di configurazione completo è il seguente:

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Permessi dei campi

**Visualizzazione**: Determina se specifici campi sono visibili a livello di campo, permettendole di controllare quali campi sono visibili a determinati ruoli all'interno della **collezione** Ordini.

![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)

Nella UI, all'interno del blocco della **collezione** Ordini, sono visibili solo i campi con permessi configurati. I campi di sistema (Id, CreatedAt, LastUpdatedAt) mantengono i permessi di visualizzazione anche senza una configurazione specifica.

![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)

- **Modifica**: Controlla se i campi possono essere modificati e salvati (aggiornati).

  Come mostrato, configuri i permessi di modifica per i campi della **collezione** Ordini (quantità e articoli associati hanno permessi di modifica):

  ![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

  Nella UI, all'interno del blocco del modulo di modifica della **collezione** Ordini, vengono mostrati solo i campi con permessi di modifica.

  ![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

  Il processo di configurazione completo è il seguente:

  ![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- **Aggiungi**: Determina se i campi possono essere aggiunti (creati).

  Come mostrato, configuri i permessi di aggiunta per i campi della **collezione** Ordini (numero ordine, quantità, articoli e spedizione hanno permessi di aggiunta):

  ![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

  Nella UI, all'interno del blocco del modulo di aggiunta della **collezione** Ordini, vengono visualizzati solo i campi con permessi di aggiunta.

  ![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Esporta**: Controlla se i campi possono essere esportati.
- **Importa**: Controlla se i campi supportano l'importazione.

## Permessi delle operazioni

I permessi configurati individualmente hanno la massima priorità. Se sono configurati permessi specifici, questi sovrascrivono le impostazioni globali; altrimenti, vengono applicate le impostazioni globali.

- **Aggiungi**: Controlla se il pulsante dell'operazione di aggiunta è visibile all'interno di un blocco.

  Come mostrato, configuri i permessi delle operazioni individuali per la **collezione** Ordini per consentire l'aggiunta:

  ![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

  Quando l'operazione di aggiunta è consentita, il pulsante "Aggiungi" appare nell'area delle operazioni del blocco della **collezione** Ordini nella UI.

  ![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **Visualizza**: Determina se il blocco di dati è visibile.

  La configurazione dei permessi globali è la seguente (nessun permesso di visualizzazione):

  ![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

  La configurazione dei permessi individuali per la **collezione** Ordini è la seguente:

  ![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

  Nella UI: i blocchi di dati per tutte le altre **collezioni** rimangono nascosti, ma il blocco della **collezione** Ordini viene mostrato.

  Il processo di configurazione dell'esempio completo è il seguente:

  ![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Modifica**: Controlla se il pulsante dell'operazione di modifica è visualizzato all'interno di un blocco.

  ![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

  I permessi delle operazioni possono essere ulteriormente affinati impostando l'ambito dei dati.

  Ad esempio, impostando la **collezione** Ordini in modo che gli utenti possano modificare solo i propri dati:

  ![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Elimina**: Controlla la visualizzazione del pulsante dell'operazione di eliminazione all'interno di un blocco.

  ![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Esporta**: Controlla la visualizzazione del pulsante dell'operazione di esportazione all'interno di un blocco.

- **Importa**: Controlla la visualizzazione del pulsante dell'operazione di importazione all'interno di un blocco.

## Permessi delle relazioni

### Come campo

- I permessi di un campo di relazione sono controllati dai permessi dei campi della **collezione** di origine. Questo controlla se l'intero componente del campo di relazione viene visualizzato.

Ad esempio, nella **collezione** Ordini, il campo di relazione "Cliente" ha solo permessi di visualizzazione, importazione ed esportazione.

![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

Nella UI, ciò significa che il campo di relazione "Cliente" non verrà visualizzato nei blocchi delle operazioni di aggiunta e modifica della **collezione** Ordini.

Il processo di configurazione dell'esempio completo è il seguente:

![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- I permessi per i campi all'interno del componente del campo di relazione (come una sotto-tabella o un sotto-modulo) sono determinati dai permessi della **collezione** di destinazione.

Quando il componente del campo di relazione è un sotto-modulo:

Come mostrato di seguito, il campo di relazione "Cliente" nella **collezione** Ordini ha tutti i permessi, mentre la **collezione** Clienti stessa è impostata come sola lettura.

Configurazione dei permessi individuali per la **collezione** Ordini, dove il campo di relazione "Cliente" ha tutti i permessi sui campi:

![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

Configurazione dei permessi individuali per la **collezione** Clienti, dove i campi hanno permessi di sola visualizzazione:

![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

Nella UI, il campo di relazione "Cliente" è visibile nel blocco della **collezione** Ordini. Tuttavia, quando si passa a un sotto-modulo, i campi all'interno del sotto-modulo sono visibili nella vista dei dettagli ma non vengono visualizzati nelle operazioni di aggiunta e modifica.

Il processo di configurazione dell'esempio completo è il seguente:

![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

Per controllare ulteriormente i permessi per i campi all'interno del sotto-modulo, è possibile concedere permessi a singoli campi.

Come mostrato, la **collezione** Clienti è configurata con permessi sui campi individuali (il nome del cliente non è visibile e non è modificabile).

![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

Il processo di configurazione dell'esempio completo è il seguente:

![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

Quando il componente del campo di relazione è una sotto-tabella, la situazione è coerente con quella di un sotto-modulo:

Come mostrato, il campo di relazione "Spedizione" nella **collezione** Ordini ha tutti i permessi, mentre la **collezione** Spedizioni è impostata come sola lettura.

Nella UI, questo campo di relazione è visibile. Tuttavia, quando si passa a una sotto-tabella, i campi all'interno della sotto-tabella sono visibili nell'operazione di visualizzazione ma non nelle operazioni di aggiunta e modifica.

![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

Per controllare ulteriormente i permessi per i campi all'interno della sotto-tabella, è possibile concedere permessi a singoli campi:

![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### Come blocco

- La visibilità di un blocco di relazione è controllata dai permessi della **collezione** di destinazione del campo di relazione corrispondente ed è indipendente dai permessi del campo di relazione stesso.

Ad esempio, la visualizzazione del blocco di relazione "Cliente" è controllata dai permessi della **collezione** Clienti.

![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- I campi all'interno di un blocco di relazione sono controllati dai permessi dei campi nella **collezione** di destinazione.

Come mostrato, è possibile impostare i permessi di visualizzazione per singoli campi nella **collezione** Clienti.

![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)