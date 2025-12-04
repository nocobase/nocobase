---
pkg: '@nocobase/plugin-acl'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Rollunion

Rollunion är ett läge för behörighetshantering. Beroende på systeminställningarna kan systemutvecklare välja att använda `separata roller`, `tillåta rollunion`, eller `endast rollunion` för att uppfylla olika behörighetsbehov.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Separata roller

Som standard använder systemet separata roller. Användare måste växla mellan de roller de har individuellt.

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Tillåt rollunion

Systemutvecklare kan aktivera `Tillåt rollunion`, vilket gör att användare samtidigt kan ha behörigheter från alla tilldelade roller, samtidigt som de fortfarande kan växla mellan roller individuellt.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Endast rollunion

Användare tvingas att endast använda rollunion och kan inte växla mellan roller individuellt.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Regler för rollunion

Rollunion ger maximala behörigheter från alla roller. Nedan förklaras hur behörighetskonflikter ska lösas när roller har olika inställningar för samma behörighet.

### Sammanslagning av åtgärdsbehörigheter

Exempel: Roll1 är konfigurerad för att `tillåta konfiguration av gränssnitt` och Roll2 är konfigurerad för att `tillåta installation, aktivering och inaktivering av plugin`.

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

När en användare loggar in med rollen **Fulla behörigheter** kommer den att ha båda behörigheterna samtidigt.

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Sammanslagning av dataskop

#### Datarader

Scenario 1: Flera roller med villkor på samma fält

Roll A, konfigurerat villkor: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Roll B, konfigurerat villkor: Age > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

**Efter sammanslagning:**

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Scenario 2: Olika roller med villkor på olika fält

Roll A, konfigurerat villkor: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Roll B, konfigurerat villkor: Name innehåller "Ja"

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

**Efter sammanslagning:**

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Datakolumner

Roll A, konfigurerade synliga fält: Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Roll B, konfigurerade synliga fält: Name, Sex

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Kvinna |

**Efter sammanslagning:**

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Kvinna |

#### Blandade rader och kolumner

Roll A, konfigurerat villkor för Age < 30, synliga fält Namn, Ålder

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Roll B, konfigurerat villkor för Name innehåller "Ja", synliga fält Namn, Kön

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Kvinna |
| 4      | James | Man   |

**Efter sammanslagning:**

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Kvinna                                              |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Obs:** Celler med röd bakgrund indikerar data som är osynliga i individuella roller men synliga i den sammanslagna rollen.

#### Sammanfattning

Regler för sammanslagning av roller i dataskop:

1. Mellan rader: Om något villkor är uppfyllt har raden behörighet.
2. Mellan kolumner: Fält kombineras.
3. När både rader och kolumner är konfigurerade slås de samman separat, rad för rad och kolumn för kolumn, inte som kombinationer av (rad + kolumn).