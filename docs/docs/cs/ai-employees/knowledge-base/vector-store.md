:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vektorové úložiště

## Úvod

V rámci znalostní báze, při ukládání dokumentů dochází k jejich vektorizaci, a při vyhledávání dokumentů jsou vektorizovány vyhledávací termíny. Oba tyto procesy vyžadují použití `Embedding modelu` pro vektorizaci původního textu.

V pluginu AI Znalostní báze představuje vektorové úložiště propojení `Embedding modelu` a vektorové databáze.

## Správa vektorových úložišť

Přejděte na konfigurační stránku pluginu AI Zaměstnanci, klikněte na záložku `Vector store` a vyberte `Vector store` pro vstup na stránku správy vektorových úložišť.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Klikněte na tlačítko `Add new` v pravém horním rohu pro přidání nového vektorového úložiště:

- Do vstupního pole `Name` zadejte název vektorového úložiště;
- V části `Vector store` vyberte již nakonfigurovanou vektorovou databázi. Viz: [Vektorová databáze](/ai-employees/knowledge-base/vector-database);
- V části `LLM service` vyberte již nakonfigurovanou službu LLM. Viz: [Správa služeb LLM](/ai-employees/quick-start/llm-service);
- Do vstupního pole `Embedding model` zadejte název `Embedding` modelu, který chcete použít;
  
Klikněte na tlačítko `Submit` pro uložení informací o vektorovém úložišti.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)