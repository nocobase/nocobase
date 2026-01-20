---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Strukturovaný výstup

## Úvod

V některých aplikačních scénářích si uživatelé mohou přát, aby model LLM odpovídal strukturovaným obsahem ve formátu JSON. Toho lze dosáhnout konfigurací funkce „Strukturovaný výstup“.

![](https://static-docs.nocobase.com/202503041306405.png)

## Konfigurace

-   **JSON Schema** – Uživatelé mohou specifikovat očekávanou strukturu odpovědi modelu konfigurací [JSON Schematu](https://json-schema.org/).
-   **Název (Name)** – _Nepovinné_, slouží k tomu, aby model lépe porozuměl objektu reprezentovanému JSON Schematem.
-   **Popis (Description)** – _Nepovinné_, slouží k tomu, aby model lépe porozuměl účelu JSON Schematu.
-   **Strict** – Vyžaduje, aby model generoval odpověď striktně podle struktury JSON Schematu. V současné době tento parametr podporují pouze některé nové modely od OpenAI. Před povolením se prosím ujistěte, že je váš model kompatibilní.

## Způsob generování strukturovaného obsahu

Způsob, jakým model generuje strukturovaný obsah, závisí na použitém **modelu** a jeho konfiguraci **formátu odpovědi** (Response format):

1.  Modely, u kterých formát odpovědi (Response format) podporuje pouze `text`
    -   Při volání uzel naváže nástroj (Tool), který generuje obsah ve formátu JSON na základě JSON Schematu, a navede model k vygenerování strukturované odpovědi voláním tohoto nástroje.

2.  Modely, u kterých formát odpovědi (Response format) podporuje režim JSON (`json_object`)
    -   Pokud je při volání vybrán režim JSON, uživatel musí v promptu (Prompt) explicitně instruovat model, aby vrátil odpověď ve formátu JSON, a poskytnout popisy pro pole odpovědi.
    -   V tomto režimu se JSON Schema používá pouze k parsování JSON řetězce vráceného modelem a jeho převodu na cílový JSON objekt.

3.  Modely, u kterých formát odpovědi (Response format) podporuje JSON Schema (`json_schema`)
    -   JSON Schema se přímo používá k určení cílové struktury odpovědi pro model.
    -   Volitelný parametr **Strict** vyžaduje, aby model striktně dodržoval JSON Schema při generování odpovědi.

4.  Lokální modely Ollama
    -   Pokud je nakonfigurováno JSON Schema, uzel jej při volání předá modelu jako parametr `format`.

## Použití výsledku strukturovaného výstupu

Strukturovaný obsah odpovědi modelu je uložen jako JSON objekt v poli „Structured content“ uzlu a může být použit následnými uzly.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)