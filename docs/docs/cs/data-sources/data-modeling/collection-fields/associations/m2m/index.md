:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Mnoho ku mnoha

V systému pro zápis do kurzů existují dvě entity: studenti a kurzy. Jeden student se může zapsat do více kurzů a jeden kurz může mít zapsáno více studentů, což vytváří vztah mnoho ku mnoha. V relační databázi se pro vyjádření vztahu mnoho ku mnoha mezi studenty a kurzy obvykle používá prostřední kolekce, například kolekce zápisů. Tato kolekce může zaznamenávat, které kurzy si každý student vybral a kteří studenti se zapsali do jednotlivých kurzů. Takový návrh dokáže efektivně reprezentovat vztah mnoho ku mnoha mezi studenty a kurzy.

ER diagram:

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Konfigurace pole:

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Popis parametrů

### Source collection

Zdrojová kolekce, tedy kolekce, ve které se aktuální pole nachází.

### Target collection

Cílová kolekce, tedy kolekce, se kterou se propojuje.

### Through collection

Prostřední kolekce, která se používá, když mezi dvěma entitami existuje vztah mnoho ku mnoha. Prostřední kolekce má dva cizí klíče, které slouží k udržení propojení mezi oběma entitami.

### Source key

Pole ve zdrojové kolekci, na které odkazuje cizí klíč. Musí být unikátní.

### Foreign key 1

Pole v prostřední kolekci, které vytváří propojení se zdrojovou kolekcí.

### Foreign key 2

Pole v prostřední kolekci, které vytváří propojení s cílovou kolekcí.

### Target key

Pole v cílové kolekci, na které odkazuje cizí klíč. Musí být unikátní.

### ON DELETE

ON DELETE odkazuje na pravidla aplikovaná na odkazy cizích klíčů v souvisejících podřízených kolekcích, když jsou záznamy v rodičovské kolekci smazány. Jedná se o volbu používanou při definování omezení cizího klíče. Běžné možnosti ON DELETE zahrnují:

- **CASCADE**: Když je záznam v rodičovské kolekci smazán, všechny související záznamy v podřízené kolekci jsou automaticky smazány.
- **SET NULL**: Když je záznam v rodičovské kolekci smazán, hodnoty cizích klíčů v souvisejících záznamech podřízené kolekce jsou nastaveny na NULL.
- **RESTRICT**: Výchozí možnost, která zabraňuje smazání záznamu rodičovské kolekce, pokud existují související záznamy v podřízené kolekci.
- **NO ACTION**: Podobně jako RESTRICT zabraňuje smazání záznamu rodičovské kolekce, pokud existují související záznamy v podřízené kolekci.