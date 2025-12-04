---
pkg: '@nocobase/plugin-acl'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Rolcombinatie

Rolcombinatie is een permissiebeheermodus. Afhankelijk van de systeeminstellingen kunnen systeemontwikkelaars kiezen om onafhankelijke rollen te gebruiken, rolcombinaties toe te staan, of alleen rolcombinaties te gebruiken, om aan verschillende permissiebehoeften te voldoen.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Onafhankelijke rollen

Standaard gebruikt het systeem onafhankelijke rollen. Er worden geen rolcombinaties gebruikt; gebruikers moeten handmatig wisselen tussen de rollen die zij hebben.

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Rolcombinaties toestaan

Systeemontwikkelaars kunnen rolcombinaties inschakelen, waardoor gebruikers tegelijkertijd de permissies van al hun toegewezen rollen kunnen gebruiken, terwijl het nog steeds mogelijk is voor gebruikers om individueel van rol te wisselen.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Alleen rolcombinaties

Gebruikers worden gedwongen om alleen rolcombinaties te gebruiken en kunnen niet individueel van rol wisselen.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Regels voor rolcombinaties

Een rolcombinatie verleent de maximale permissies van alle rollen. Hieronder vindt u uitleg over hoe permissieconflicten worden opgelost wanneer rollen verschillende instellingen hebben voor dezelfde permissie.

### Samenvoegen van operationele permissies

Voorbeeld: Rol 1 (role1) is geconfigureerd om de interface te configureren en Rol 2 (role2) is geconfigureerd om plugins te installeren, activeren en deactiveren.

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

Wanneer u inlogt met de rol **Volledige permissies**, beschikt u tegelijkertijd over beide permissies.

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Samenvoegen van gegevensbereik

#### Gegevensrijen

Scenario 1: Meerdere rollen stellen voorwaarden in op hetzelfde veld

Rol A filter: Leeftijd < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rol B filter: Leeftijd > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

**Na samenvoeging:**

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Scenario 2: Verschillende rollen stellen voorwaarden in op verschillende velden

Rol A filter: Leeftijd < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rol B filter: Naam bevat "Ja"

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

**Na samenvoeging:**

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Gegevenskolommen

Rol A zichtbare kolommen: Naam, Leeftijd

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rol B zichtbare kolommen: Naam, Geslacht

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

**Na samenvoeging:**

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Gemengde rijen en kolommen

Rol A filter: Leeftijd < 30, kolommen Naam, Leeftijd

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rol B filter: Naam bevat "Ja", kolommen Naam, Geslacht

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

**Na samenvoeging:**

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Opmerking:** Cellen met een rode achtergrond geven data aan die onzichtbaar is in individuele rollen, maar zichtbaar wordt in de samengevoegde rol.

#### Samenvatting

De regels voor het samenvoegen van rollen binnen het gegevensbereik zijn:

1. Tussen rijen: als aan één van de voorwaarden is voldaan, heeft de rij permissies.
2. Tussen kolommen: velden worden gecombineerd.
3. Wanneer zowel rijen als kolommen zijn geconfigureerd, worden rijen en kolommen afzonderlijk samengevoegd, niet door rij-kolomcombinaties.