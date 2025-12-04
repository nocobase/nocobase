:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przegląd

## Wprowadzenie

Wtyczka AI: Baza wiedzy zapewnia agentom AI możliwości wyszukiwania RAG.

Możliwości wyszukiwania RAG pozwalają agentom AI dostarczać bardziej dokładne, profesjonalne i istotne dla przedsiębiorstwa odpowiedzi, gdy odpowiadają na pytania użytkowników.

Wykorzystanie dokumentów z profesjonalnych dziedzin oraz wewnętrznych dokumentów przedsiębiorstwa, pochodzących z bazy wiedzy utrzymywanej przez administratora, poprawia dokładność i identyfikowalność odpowiedzi agentów AI.

### Czym jest RAG

RAG (Retrieval Augmented Generation) oznacza „Wyszukiwanie-Rozszerzanie-Generowanie”.

- Wyszukiwanie: Pytanie użytkownika jest przekształcane w wektor przez model Embedding (np. BERT). Z biblioteki wektorowej pobierane są najbardziej trafne fragmenty tekstu (Top-K) za pomocą gęstego wyszukiwania (podobieństwo semantyczne) lub rzadkiego wyszukiwania (dopasowanie słów kluczowych).
- Rozszerzanie: Wyniki wyszukiwania są łączone z oryginalnym pytaniem w celu utworzenia rozszerzonego promptu, który jest następnie wstrzykiwany do okna kontekstowego LLM.
- Generowanie: LLM, łącząc rozszerzony prompt, generuje ostateczną odpowiedź, zapewniając jej faktograficzność i identyfikowalność.

## Instalacja

1. Proszę przejść do strony zarządzania wtyczkami.
2. Proszę znaleźć wtyczkę `AI: Knowledge base` i ją włączyć.

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)