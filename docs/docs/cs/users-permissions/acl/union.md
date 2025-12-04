---
pkg: '@nocobase/plugin-acl'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Sjednocení rolí

Sjednocení rolí je režim správy oprávnění. V závislosti na nastavení systému si vývojáři systému mohou vybrat, zda budou používat `Nezávislé role`, `Povolit sjednocení rolí`, nebo `Pouze sjednocení rolí`, aby splnili různé požadavky na oprávnění.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Nezávislé role

Systém ve výchozím nastavení používá nezávislé role. Uživatelé musí přepínat mezi rolemi, které vlastní, jednotlivě.

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Povolit sjednocení rolí

Vývojáři systému mohou povolit `sjednocení rolí`, což uživatelům umožňuje současně mít oprávnění všech přiřazených rolí a zároveň jim stále umožňuje přepínat role jednotlivě.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Pouze sjednocení rolí

Uživatelé jsou nuceni používat pouze sjednocení rolí a nemohou přepínat role jednotlivě.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Pravidla pro sjednocení rolí

Sjednocení rolí uděluje maximální oprávnění napříč všemi rolemi. Níže jsou vysvětlení, jak řešit konflikty oprávnění, když mají role různá nastavení pro stejné oprávnění.

### Sloučení provozních oprávnění

Příklad: Role1 je nakonfigurována tak, aby `Povolovala konfiguraci rozhraní`, a Role2 je nakonfigurována tak, aby `Povolovala instalaci, aktivaci, deaktivaci pluginů`.

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

Při přihlášení s rolí s **úplnými oprávněními** bude mít uživatel obě oprávnění současně.

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Sloučení rozsahu dat

#### Datové řádky

Scénář 1: Více rolí nastavuje podmínky na stejném poli

Filtr role A: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Filtr role B: Age > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

**Po sloučení:**

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Scénář 2: Různé role nastavují podmínky na různých polích

Filtr role A: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Filtr role B: Name obsahuje "Ja"

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

**Po sloučení:**

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Datové sloupce

Viditelné sloupce role A: Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Viditelné sloupce role B: Name, Sex

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

**Po sloučení:**

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Kombinace řádků a sloupců

Filtr role A: Age < 30, sloupce Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Filtr role B: Name obsahuje "Ja", sloupce Name, Sex

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

**Po sloučení:**

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Poznámka:** Buňky s červeným pozadím označují data, která jsou neviditelná v jednotlivých rolích, ale viditelná ve sloučené roli.

#### Shrnutí

Pravidla pro sloučení rolí v rámci rozsahu dat:

1.  Mezi řádky: Pokud je splněna kterákoli podmínka, řádek má oprávnění.
2.  Mezi sloupci: Pole se kombinují.
3.  Při současném nastavení řádků i sloupců se řádky a sloupce slučují samostatně, nikoli kombinací (řádek + sloupec) s (řádek + sloupec).