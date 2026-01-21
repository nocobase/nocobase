:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Komponenty relačních polí

## Úvod

Komponenty relačních polí v NocoBase jsou navrženy tak, aby vám pomohly lépe zobrazovat a zpracovávat související data. Bez ohledu na typ vztahu jsou tyto komponenty flexibilní a univerzální, což vám umožňuje vybrat a nakonfigurovat je podle vašich specifických potřeb.

### Rozbalovací seznam

U všech relačních polí, s výjimkou případů, kdy je cílová kolekce souborovou kolekcí, je výchozí komponentou v režimu úprav rozbalovací seznam. Možnosti v rozbalovacím seznamu zobrazují hodnotu titulního pole, což je ideální pro scénáře, kde lze související data rychle vybrat zobrazením klíčových informací o poli.

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

Více podrobností naleznete v [Rozbalovací seznam](/interface-builder/fields/specific/select)

### Výběr dat

Výběr dat prezentuje data ve vyskakovacím modálním okně. Uživatelé si mohou nakonfigurovat pole, která se mají zobrazit ve výběru dat (včetně polí z vnořených vztahů), což umožňuje přesnější výběr souvisejících dat.

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

Více podrobností naleznete v [Výběr dat](/interface-builder/fields/specific/picker)

### Podformulář

Při práci se složitějšími relačními daty může být použití rozbalovacího seznamu nebo výběru dat nepohodlné. V takových případech musíte často otevírat vyskakovací okna. Pro tyto scénáře lze použít podformulář. Umožňuje vám přímo spravovat pole související kolekce na aktuální stránce nebo v aktuálním bloku vyskakovacího okna, aniž byste museli opakovaně otevírat nová vyskakovací okna, což zefektivňuje pracovní postup. Víceúrovňové vztahy jsou zobrazeny jako vnořené formuláře.

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

Více podrobností naleznete v [Podformulář](/interface-builder/fields/specific/sub-form)

### Podtabulka

Podtabulka zobrazuje záznamy vztahů typu jedna k mnoha nebo mnoho k mnoha ve formátu tabulky. Poskytuje jasný a strukturovaný způsob zobrazení a správy souvisejících dat a podporuje hromadné vytváření nových dat nebo výběr stávajících dat k propojení.

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

Více podrobností naleznete v [Podtabulka](/interface-builder/fields/specific/sub-table)

### Podrobný detail

Podrobný detail je odpovídající komponentou podformuláře v režimu pouze pro čtení. Podporuje zobrazení dat s vnořenými víceúrovňovými vztahy.

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

Více podrobností naleznete v [Podrobný detail](/interface-builder/fields/specific/sub-detail)

### Správce souborů

Správce souborů je komponenta relačního pole, která se používá speciálně v případě, kdy je cílová kolekce vztahu souborovou kolekcí.

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

Více podrobností naleznete v [Správce souborů](/interface-builder/fields/specific/file-manager)

### Titulek

Komponenta titulního pole je komponenta relačního pole používaná v režimu pouze pro čtení. Konfigurací titulního pole můžete nakonfigurovat odpovídající komponentu pole.

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

Více podrobností naleznete v [Titulek](/interface-builder/fields/specific/title)