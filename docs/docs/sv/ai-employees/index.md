---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/ai-employees/index).
:::

# Översikt

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

AI-medarbetare (`AI Employees`) är agent-förmågor som är djupt integrerade i NocoBase affärssystem.

De är inte bara "chattbotar", utan "digitala kollegor" som direkt kan förstå kontext och utföra åtgärder i affärsgränssnittet:

- **Förstår affärskontext**: Uppfattar aktuell sida, block, datastruktur och markerat innehåll.
- **Kan utföra åtgärder direkt**: Kan anropa färdigheter för att slutföra uppgifter som sökning, analys, ifyllnad, konfiguration och generering.
- **Rollbaserat samarbete**: Konfigurera olika medarbetare efter befattning och växla mellan modeller i konversationen för att samarbeta.

## 5 minuters startväg

Se först [Snabbstart](/ai-employees/quick-start) och slutför den minsta användbara konfigurationen i följande ordning:

1. Konfigurera minst en [LLM-tjänst](/ai-employees/features/llm-service).
2. Aktivera minst en [AI-medarbetare](/ai-employees/features/enable-ai-employee).
3. Öppna en konversation och börja [samarbeta med AI-medarbetare](/ai-employees/features/collaborate).
4. Aktivera [Webbsökning](/ai-employees/features/web-search) och [Snabbupgifter](/ai-employees/features/task) vid behov.

## Funktionskarta

### A. Grundläggande konfiguration (Administratör)

- [Konfigurera LLM-tjänst](/ai-employees/features/llm-service): Anslut Provider, konfigurera och hantera tillgängliga modeller.
- [Aktivera AI-medarbetare](/ai-employees/features/enable-ai-employee): Aktivera/inaktivera inbyggda medarbetare, kontrollera tillgänglighetsområde.
- [Skapa ny AI-medarbetare](/ai-employees/features/new-ai-employees): Definiera roll, rollinställning, välkomstmeddelande och förmågegränser.
- [Använda färdigheter](/ai-employees/features/tool): Konfigurera färdighetsbehörigheter (`Ask` / `Allow`), kontrollera körningsrisker.

### B. Dagligt samarbete (Affärsanvändare)

- [Samarbeta med AI-medarbetare](/ai-employees/features/collaborate): Växla medarbetare och modeller i konversationen för kontinuerligt samarbete.
- [Lägg till kontext - Block](/ai-employees/features/pick-block): Skicka sidblock som kontext till AI.
- [Snabbupgifter](/ai-employees/features/task): Förinställ vanliga uppgifter på sidan/blocket och kör dem med ett klick.
- [Webbsökning](/ai-employees/features/web-search): Aktivera sökförstärkta svar när ni behöver den senaste informationen.

### C. Avancerade förmågor (Tillägg)

- [Inbyggda AI-medarbetare](/ai-employees/features/built-in-employee): Förstå positionering och lämpliga scenarier för förinställda medarbetare.
- [Behörighetskontroll](/ai-employees/permission): Kontrollera åtkomst till medarbetare, färdigheter och data enligt organisationens behörighetsmodell.
- [AI-kunskapsbas](/ai-employees/knowledge-base/index): Importera företagskunskap för att förbättra svarens stabilitet och spårbarhet.
- [Arbetsflöde: LLM-nod](/ai-employees/workflow/nodes/llm/chat): Orquestrera AI-förmågor i automatiserade flöden.

## Kärnbegrepp (Rekommenderas att samordna först)

Följande termer är konsekventa med ordlistan och rekommenderas för enhetlig användning inom teamet:

- **AI-medarbetare (AI Employee)**: En körbar agent som består av rollinställning (Role setting) och färdigheter (Tool / Skill).
- **LLM-tjänst (LLM Service)**: Enhet för modelltillgång och förmågekonfiguration, används för att hantera Provider och modellistor.
- **Leverantör (Provider)**: Modellleverantören bakom en LLM-tjänst.
- **Aktiverade modeller (Enabled Models)**: Uppsättningen modeller som den aktuella LLM-tjänsten tillåter att man väljer i konversationen.
- **Medarbetarväxlare (AI Employee Switcher)**: Växla aktuell samarbetande medarbetare i konversationen.
- **Modellväxlare (Model Switcher)**: Växla modell i konversationen och kom ihåg preferenser per medarbetare.
- **Färdighet (Tool / Skill)**: En körbar förmågeenhet som AI kan anropa.
- **Färdighetsbehörighet (Permission: Ask / Allow)**: Om mänsklig bekräftelse krävs innan en färdighet anropas.
- **Kontext (Context)**: Information om affärsmiljön såsom sidor, block, datastrukturer etc.
- **Konversation (Chat)**: En kontinuerlig interaktionsprocess mellan en användare och en AI-medarbetare.
- **Webbsökning (Web Search)**: Förmågan att komplettera med realtidsinformation baserat på extern sökning.
- **Kunskapsbas (Knowledge Base / RAG)**: Introduktion av företagskunskap via sökförstärkt generering.
- **Vektorlagring (Vector Store)**: Vektoriserad lagring som ger semantisk sökförmåga för kunskapsbasen.

## Installationsinstruktioner

AI-medarbetare är en inbyggd plugin i NocoBase (`@nocobase/plugin-ai`), redo att användas direkt utan separat installation.