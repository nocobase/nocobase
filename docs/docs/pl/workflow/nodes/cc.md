---
pkg: '@nocobase/plugin-workflow-cc'
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/workflow/nodes/cc).
:::

# Kopia do wiadomości <Badge>v1.8.2+</Badge>

## Wprowadzenie

Węzeł kopii do wiadomości służy do wysyłania określonych treści kontekstowych z procesu wykonywania przepływu pracy do wskazanych użytkowników w celu zapoznania się i wglądu. Na przykład w procesach zatwierdzania lub innych, odpowiednie informacje mogą zostać przesłane do wiadomości innych uczestników, aby mogli oni na bieżąco śledzić postępy prac.

W przepływie pracy można skonfigurować wiele węzłów kopii do wiadomości, aby po dotarciu przepływu do danego węzła wysłać odpowiednie informacje do wskazanych odbiorców.

Treści kopii do wiadomości będą wyświetlane w menu „Kopia do mnie” w Centrum zadań, gdzie użytkownicy mogą przeglądać wszystkie przesłane do nich treści. System będzie również informować o statusie nieprzeczytanych elementów, a po ich wyświetleniu użytkownik może ręcznie oznaczyć je jako przeczytane.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „Kopia do wiadomości”:

![抄送_添加](https://static-docs.nocobase.com/20250710222842.png)

## Konfiguracja węzła

![节点配置](https://static-docs.nocobase.com/20250710224041.png)

W interfejsie konfiguracji węzła mogą Państwo ustawić następujące parametry:

### Odbiorcy

Odbiorcy to kolekcja docelowych użytkowników kopii do wiadomości, którą może stanowić jeden lub wielu użytkowników. Źródłem wyboru może być wartość statyczna wybrana z listy użytkowników, wartość dynamiczna określona przez zmienną lub wynik zapytania do tabeli użytkowników.

![接收者配置](https://static-docs.nocobase.com/20250710224421.png)

### Interfejs użytkownika

Odbiorcy muszą przeglądać treści kopii do wiadomości w menu „Kopia do mnie” w Centrum zadań. Jako bloki treści można skonfigurować wyniki wyzwalacza oraz dowolnego węzła z kontekstu przepływu pracy.

![用户界面](https://static-docs.nocobase.com/20250710225400.png)

### Karta zadania <Badge>2.0+</Badge>

Służy do konfiguracji kart zadań na liście „Kopia do mnie” w Centrum zadań.

![20260213010947](https://static-docs.nocobase.com/20260213010947.png)

Na karcie można dowolnie konfigurować pola biznesowe, które mają być wyświetlane (z wyjątkiem pól relacji).

Po utworzeniu zadania kopii do wiadomości w przepływie pracy, na liście w Centrum zadań będzie widoczna spersonalizowana karta zadania:

![20260214124325](https://static-docs.nocobase.com/20260214124325.png)

### Tytuł zadania

Tytuł zadania to tytuł wyświetlany w Centrum zadań. Do dynamicznego generowania tytułu mogą Państwo użyć zmiennych z kontekstu przepływu pracy.

![任务标题](https://static-docs.nocobase.com/20250710225603.png)

## Centrum zadań

Użytkownicy mogą przeglądać i zarządzać wszystkimi treściami przesłanymi do nich jako kopia do wiadomości w Centrum zadań, a także filtrować i przeglądać je na podstawie statusu przeczytania.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Po wyświetleniu można oznaczyć treść jako przeczytaną, co spowoduje zmniejszenie liczby nieprzeczytanych elementów.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)