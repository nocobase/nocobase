:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vztah jeden k jednomu

Ve vztahu mezi zaměstnanci a osobními profily může mít každý zaměstnanec pouze jeden záznam osobního profilu a každý záznam osobního profilu může odpovídat pouze jednomu zaměstnanci. V takovém případě je vztah mezi zaměstnancem a osobním profilem jeden k jednomu.

Cizí klíč ve vztahu jedna k jedné může být umístěn buď ve zdrojové kolekci, nebo v cílové kolekci. Pokud vyjadřuje vztah „má jeden“ (has one), je vhodnější umístit cizí klíč do cílové kolekce; pokud vyjadřuje vztah „patří k“ (belongs to), pak je lepší umístit cizí klíč do zdrojové kolekce.

Například ve výše uvedeném případě, kdy má zaměstnanec pouze jeden osobní profil a osobní profil patří k zaměstnanci, je vhodné umístit cizí klíč do kolekce osobních profilů.

## Vztah jeden k jednomu (Má jeden)

To znamená, že zaměstnanec má záznam osobního profilu.

ER Vztah

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Konfigurace pole

![alt text](https://static-docs.nocobase.com/7659e128936bbd7c9ff51bcff1d646dd.png)

## Vztah jeden k jednomu (Patří k)

To znamená, že osobní profil patří ke konkrétnímu zaměstnanci.

ER Vztah

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Konfigurace pole

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a34982da43c187c.png)

## Popis parametrů

### Zdrojová kolekce

Zdrojová kolekce, tedy kolekce, ve které se aktuální pole nachází.

### Cílová kolekce

Cílová kolekce, tedy kolekce, ke které se vztah vytváří.

### Cizí klíč

Slouží k vytvoření vztahu mezi dvěma kolekcemi. Ve vztahu jedna k jedné může být cizí klíč umístěn buď ve zdrojové kolekci, nebo v cílové kolekci. Pokud vyjadřuje vztah „má jeden“ (has one), je vhodnější umístit cizí klíč do cílové kolekce; pokud vyjadřuje vztah „patří k“ (belongs to), pak je lepší umístit cizí klíč do zdrojové kolekce.

### Zdrojový klíč <- Cizí klíč (Cizí klíč v cílové kolekci)

Pole odkazované omezením cizího klíče musí být unikátní. Pokud je cizí klíč umístěn v cílové kolekci, značí vztah „má jeden“.

### Cílový klíč <- Cizí klíč (Cizí klíč ve zdrojové kolekci)

Pole odkazované omezením cizího klíče musí být unikátní. Pokud je cizí klíč umístěn ve zdrojové kolekci, značí vztah „patří k“.

### ON DELETE

ON DELETE odkazuje na pravidla akcí pro odkaz cizího klíče v související podřízené kolekci při mazání záznamů z nadřízené kolekce. Jedná se o volbu definovanou při vytváření omezení cizího klíče. Mezi běžné možnosti ON DELETE patří:

- CASCADE: Při smazání záznamu v nadřízené kolekci se automaticky smažou všechny související záznamy v podřízené kolekci.
- SET NULL: Při smazání záznamu v nadřízené kolekci se hodnota cizího klíče v související podřízené kolekci nastaví na NULL.
- RESTRICT: Výchozí možnost, kdy je smazání záznamu v nadřízené kolekci odmítnuto, pokud existují související záznamy v podřízené kolekci.
- NO ACTION: Podobně jako RESTRICT je smazání záznamu v nadřízené kolekci odmítnuto, pokud existují související záznamy v podřízené kolekci.