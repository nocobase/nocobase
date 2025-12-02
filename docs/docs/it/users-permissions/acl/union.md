---
pkg: '@nocobase/plugin-acl'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Unione dei ruoli

L'unione dei ruoli è una modalità di gestione dei permessi. In base alle impostazioni di sistema, gli sviluppatori possono scegliere di utilizzare `Ruoli indipendenti`, `Consenti unione dei ruoli` o `Solo unione dei ruoli`, per soddisfare diverse esigenze di permessi.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Ruoli indipendenti

Per impostazione predefinita, il sistema utilizza ruoli indipendenti: l'unione dei ruoli non viene utilizzata e gli utenti devono passare da un ruolo all'altro individualmente.

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Consenti unione dei ruoli

Consente agli sviluppatori di sistema di utilizzare l'unione dei ruoli, il che significa che possono utilizzare contemporaneamente i permessi di tutti i ruoli che possiedono, consentendo anche agli utenti di passare da un ruolo all'altro individualmente.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Solo unione dei ruoli

Forza gli utenti a utilizzare solo l'unione dei ruoli, impedendo loro di passare da un ruolo all'altro individualmente.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Regole per l'unione dei ruoli

L'unione dei ruoli garantisce i massimi permessi tra tutti i ruoli. Di seguito viene spiegato come determinare i permessi del ruolo quando le impostazioni dei ruoli sono in conflitto per lo stesso elemento.

### Unione dei permessi operativi

Esempio: Il Ruolo 1 (role1) è configurato per consentire la configurazione dell'interfaccia, e il Ruolo 2 (role2) è configurato per consentire l'installazione, l'attivazione e la disattivazione dei plugin.

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

Accedendo con il ruolo **Tutti i permessi**, l'utente avrà contemporaneamente entrambi i tipi di permessi.

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Unione dell'ambito dei dati

#### Righe di dati

Scenario 1: Più ruoli impostano condizioni sullo stesso campo

Ruolo A, condizione configurata: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Ruolo B, condizione configurata: Age > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

**Dopo l'unione:**

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Scenario 2: Ruoli diversi impostano condizioni su campi diversi

Ruolo A, condizione configurata: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Ruolo B, condizione configurata: Name contiene "Ja"

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

**Dopo l'unione:**

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Colonne di dati

Ruolo A, campi visibili configurati: Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Ruolo B, campi visibili configurati: Name, Sex

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Uomo  |
| 2      | Lily | Donna |

**Dopo l'unione:**

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Uomo  |
| 2      | Lily | 29  | Donna |

#### Righe e colonne miste

Ruolo A, condizione configurata: Age < 30, campi visibili: Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Ruolo B, condizione configurata: Name contiene "Ja", campi visibili: Name, Sex

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Donna |
| 4      | James | Uomo  |

**Dopo l'unione:**

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Uomo</span>  |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Donna</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Donna                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Uomo                                                |

**Nota:** Le celle con sfondo rosso indicano dati invisibili nei ruoli individuali ma visibili nel ruolo unito.

#### Riepilogo

Regole per l'unione dei ruoli nell'ambito dei dati:

1.  Tra le righe, se una qualsiasi condizione è soddisfatta, la riga ha i permessi.
2.  Tra le colonne, i campi vengono combinati.
3.  Quando righe e colonne sono configurate contemporaneamente, vengono unite separatamente (righe con righe, colonne con colonne), e non come combinazioni (riga+colonna) con (riga+colonna).