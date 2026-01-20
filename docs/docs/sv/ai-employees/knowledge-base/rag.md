:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# RAG-hämtning

## Introduktion

När ni har konfigurerat kunskapsbasen kan ni aktivera RAG-funktionen i inställningarna för AI-medarbetare.

När RAG är aktiverat kommer AI-medarbetaren, när en användare chattar med den, att använda RAG-hämtning för att hämta dokument från kunskapsbasen baserat på användarens meddelande och svara utifrån de hämtade dokumenten.

## Aktivera RAG

Gå till konfigurationssidan för AI-medarbetar-`plugin`en, klicka på fliken `AI employees` för att komma till hanteringssidan för AI-medarbetare.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

Välj den AI-medarbetare som ni vill aktivera RAG för, klicka på knappen `Edit` för att komma till redigeringssidan för AI-medarbetaren.

På fliken `Knowledge base` slår ni på reglaget `Enable`.

- I `Knowledge Base Prompt` anger ni uppmaningen för att referera till kunskapsbasen. `{knowledgeBaseData}` är en fast platshållare och ska inte ändras.
- I `Knowledge Base` väljer ni den konfigurerade kunskapsbasen. Se: [Kunskapsbas](/ai-employees/knowledge-base/knowledge-base).
- I inmatningsfältet `Top K` anger ni antalet dokument som ska hämtas, standardvärdet är 3.
- I inmatningsfältet `Score` anger ni tröskelvärdet för dokumentrelevans vid hämtning.

Klicka på knappen `Submit` för att spara inställningarna för AI-medarbetaren.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)