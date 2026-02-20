---
pkg: '@nocobase/plugin-acl'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Ruoli

## Centro di Gestione

### Gestione dei Ruoli

![](https://static-docs.nocobase.com/da7083c67d794e23dc6eb0f85b1de86c.png)

Al momento dell'installazione iniziale, l'applicazione include due ruoli predefiniti: "Admin" e "Member". Ciascuno di essi è configurato con impostazioni di permessi predefinite diverse.

### Aggiunta, Eliminazione e Modifica dei Ruoli

L'identificatore del ruolo, che è un identificatore univoco di sistema, Le permette di personalizzare i ruoli predefiniti. Tuttavia, i ruoli predefiniti di sistema non possono essere eliminati.

![](https://static-docs.nocobase.com/35f323b346db4f9f12f9bee4dea63302.png)

### Impostazione del Ruolo Predefinito

Il ruolo predefinito è quello che viene assegnato automaticamente ai nuovi utenti se non viene specificato un ruolo specifico durante la loro creazione.

![](https://static-docs.nocobase.com/f41b47ff55ca28715c486dc45bc1708.png)

## Centro Personale

### Cambio Ruolo

È possibile assegnare più ruoli a un utente. Se un utente possiede più ruoli, può cambiarli nel Centro Personale.

![](https://static-docs.nocobase.com/e331d11ec1ca3b8b7e0472105b167819.png)

Il ruolo predefinito all'accesso al sistema è determinato dal ruolo selezionato l'ultima volta (questo valore si aggiorna a ogni cambio di ruolo); in assenza di un ruolo selezionato in precedenza, viene utilizzato il primo ruolo (il ruolo predefinito di sistema).