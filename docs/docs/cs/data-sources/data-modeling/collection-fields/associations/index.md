:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Relační pole

V NocoBase nejsou relační pole skutečná pole, ale slouží k navázání propojení mezi kolekcemi. Tento koncept je ekvivalentní vztahům v relačních databázích.

V relačních databázích se nejčastěji setkáváme s následujícími typy vztahů:

- [Jeden k jednomu](./o2o/index.md): Každá entita ve dvou kolekcích odpovídá pouze jedné entitě v druhé kolekci. Tento typ vztahu se obvykle používá k ukládání různých aspektů entity v samostatných kolekcích, aby se snížila redundance a zlepšila konzistence dat.
- [Jeden k mnoha](./o2m/index.md): Každá entita v jedné kolekci může být spojena s více entitami v jiné kolekci. Jedná se o jeden z nejběžnějších typů vztahů. Například jeden autor může napsat více článků, ale jeden článek může mít pouze jednoho autora.
- [Mnoho k jednomu](./m2o/index.md): Více entit v jedné kolekci může být spojeno s jednou entitou v jiné kolekci. Tento typ vztahu je také běžný v datovém modelování. Například více studentů může patřit do stejné třídy.
- [Mnoho k mnoha](./m2m/index.md): Více entit ve dvou kolekcích může být vzájemně propojeno. Tento typ vztahu obvykle vyžaduje zprostředkující kolekci pro zaznamenání propojení mezi entitami. Například vztah mezi studenty a kurzy – student se může zapsat do více kurzů a jeden kurz může mít více studentů.

Tyto typy vztahů hrají důležitou roli v návrhu databází a datovém modelování, pomáhají popisovat složité vztahy a datové struktury reálného světa.