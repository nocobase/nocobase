:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przegląd

Rozwój wtyczek po stronie serwera NocoBase oferuje różnorodne funkcje i możliwości, aby pomóc deweloperom dostosowywać i rozszerzać podstawowe funkcje NocoBase. Poniżej przedstawiono główne możliwości rozwoju wtyczek po stronie serwera NocoBase oraz powiązane rozdziały:

| Moduł                                     | Opis                                                                                                     | Powiązany rozdział                                      |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| **Klasa wtyczki**                         | Tworzenie i zarządzanie wtyczkami po stronie serwera, rozszerzanie podstawowych funkcji.                 | [plugin.md](plugin.md)                                  |
| **Operacje na bazie danych**               | Zapewnia interfejsy do operacji na bazie danych, obsługując operacje CRUD i zarządzanie transakcjami.    | [database.md](database.md)                              |
| **Niestandardowe kolekcje**               | Dostosowywanie struktur kolekcji do potrzeb biznesowych w celu elastycznego zarządzania modelami danych. | [collections.md](collections.md)                        |
| **Kompatybilność danych przy aktualizacji wtyczek** | Zapewnia, że aktualizacje wtyczek nie wpływają na istniejące dane, poprzez migrację danych i obsługę kompatybilności. | [migration.md](migration.md)                            |
| **Zarządzanie zewnętrznymi źródłami danych** | Integracja i zarządzanie zewnętrznymi źródłami danych w celu umożliwienia interakcji z danymi.           | [data-source-manager.md](data-source-manager.md)        |
| **Niestandardowe API**                    | Rozszerzanie zarządzania zasobami API poprzez tworzenie niestandardowych interfejsów.                    | [resource-manager.md](resource-manager.md)              |
| **Zarządzanie uprawnieniami API**         | Dostosowywanie uprawnień API w celu precyzyjnej kontroli dostępu.                                        | [acl.md](acl.md)                                        |
| **Przechwytywanie i filtrowanie żądań/odpowiedzi API** | Dodawanie interceptorów lub middleware dla żądań i odpowiedzi w celu obsługi zadań takich jak logowanie, uwierzytelnianie itp. | [context.md](context.md) i [middleware.md](middleware.md) |
| **Nasłuchiwanie zdarzeń**                 | Nasłuchiwanie zdarzeń systemowych (np. z aplikacji lub bazy danych) i wyzwalanie odpowiednich procedur obsługi. | [event.md](event.md)                                    |
| **Zarządzanie pamięcią podręczną**         | Zarządzanie pamięcią podręczną w celu poprawy wydajności aplikacji i szybkości reakcji.                  | [cache.md](cache.md)                                    |
| **Zadania cykliczne**                     | Tworzenie i zarządzanie zadaniami cyklicznymi, takimi jak okresowe czyszczenie, synchronizacja danych itp. | [cron-job-manager.md](cron-job-manager.md)              |
| **Obsługa wielu języków**                 | Integracja obsługi wielu języków w celu wdrożenia internacjonalizacji i lokalizacji.                     | [i18n.md](i18n.md)                                      |
| **Wyprowadzanie logów**                   | Dostosowywanie formatów logów i metod wyprowadzania w celu zwiększenia możliwości debugowania i monitorowania. | [logger.md](logger.md)                                  |
| **Niestandardowe polecenia**              | Rozszerzanie NocoBase CLI poprzez dodawanie niestandardowych poleceń.                                    | [command.md](command.md)                                |
| **Pisanie przypadków testowych**          | Pisanie i uruchamianie przypadków testowych w celu zapewnienia stabilności wtyczki i dokładności funkcji. | [test.md](test.md)                                      |