:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Jeden k mnoha

Vztah mezi třídou a jejími studenty je příkladem vztahu jeden k mnoha: jedna třída může mít více studentů, ale každý student patří pouze do jedné třídy.

ER diagram:

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Konfigurace pole:

![alt text](https://static-docs.nocobase.com/a608ce5481172dad7e8ab760107ff4e.png)

## Popis parametrů

### Source collection

Zdrojová kolekce, tedy kolekce, ve které se aktuální pole nachází.

### Target collection

Cílová kolekce, tedy kolekce, se kterou se má provést propojení.

### Source key

Pole ve zdrojové kolekci, na které odkazuje cizí klíč. Musí být unikátní.

### Foreign key

Pole v cílové kolekci, které se používá k vytvoření propojení mezi dvěma kolekcemi.

### Target key

Pole v cílové kolekci, které se používá k zobrazení každého záznamu řádku v bloku vztahu, obvykle unikátní pole.

### ON DELETE

ON DELETE odkazuje na pravidla, která se aplikují na reference cizích klíčů v souvisejících podřízených kolekcích, když jsou záznamy v nadřazené kolekci smazány. Jedná se o volbu používanou při definování omezení cizího klíče. Běžné možnosti ON DELETE zahrnují:

- **CASCADE**: Když je záznam v nadřazené kolekci smazán, všechny související záznamy v podřízené kolekci jsou automaticky smazány.
- **SET NULL**: Když je záznam v nadřazené kolekci smazán, hodnoty cizího klíče v souvisejících záznamech podřízené kolekce jsou nastaveny na NULL.
- **RESTRICT**: Výchozí volba, která zabraňuje smazání záznamu nadřazené kolekce, pokud existují související záznamy v podřízené kolekci.
- **NO ACTION**: Podobné jako RESTRICT, zabraňuje smazání záznamu nadřazené kolekce, pokud existují související záznamy v podřízené kolekci.