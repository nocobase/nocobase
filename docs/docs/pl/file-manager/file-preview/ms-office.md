---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/file-manager/file-preview/ms-office).
:::

# Podgląd plików Office <Badge>v1.8.11+</Badge>

Wtyczka Podgląd plików Office służy do wyświetlania podglądu plików w formacie Office, takich jak Word, Excel czy PowerPoint, bezpośrednio w aplikacjach NocoBase.  
Opiera się ona na publicznej usłudze online udostępnianej przez firmę Microsoft, która umożliwia osadzanie plików dostępnych pod publicznym adresem URL w interfejsie podglądu. Dzięki temu użytkownicy mogą przeglądać te pliki w przeglądarce bez konieczności ich pobierania lub korzystania z aplikacji pakietu Office.

## Instrukcja obsługi

Domyślnie wtyczka jest **wyłączona**. Można z niej korzystać po aktywacji w menedżerze wtyczek; nie jest wymagana żadna dodatkowa konfiguracja.

![Interfejs aktywacji wtyczki](https://static-docs.nocobase.com/20250731140048.png)

Po pomyślnym przesłaniu pliku Office (Word / Excel / PowerPoint) do pola pliku w kolekcji, należy kliknąć odpowiednią ikonę pliku lub link, aby wyświetlić jego zawartość w wyskakującym okienku lub osadzonym interfejsie podglądu.

![Przykład operacji podglądu](https://static-docs.nocobase.com/20250731143231.png)

## Zasada działania

Podgląd osadzony przez tę wtyczkę opiera się na publicznej usłudze online firmy Microsoft (Office Web Viewer). Główny proces wygląda następująco:

- Frontend generuje publicznie dostępny adres URL dla pliku przesłanego przez użytkownika (w tym podpisane adresy URL S3);
- Wtyczka ładuje podgląd pliku w ramce iframe, korzystając z następującego adresu:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<Publiczny URL pliku>
  ```

- Usługa Microsoft wysyła żądanie o zawartość pliku pod ten adres URL, renderuje ją i zwraca stronę możliwą do wyświetlenia.

## Uwagi

- Ponieważ wtyczka ta zależy od usługi online firmy Microsoft, należy upewnić się, że połączenie sieciowe działa prawidłowo i że dostęp do powiązanych usług Microsoft jest możliwy.
- Microsoft uzyska dostęp do podanego adresu URL pliku, a jego zawartość zostanie na krótko zapisana w pamięci podręcznej serwera w celu wyrenderowania strony podglądu. Wiąże się to z pewnym ryzykiem dotyczącym prywatności. Jeśli mają Państwo wątpliwości w tej kwestii, zaleca się niekorzystanie z funkcji podglądu oferowanej przez tę wtyczkę[^1].
- Plik do podglądu musi być dostępny pod publicznym adresem URL. W normalnych warunkach pliki przesyłane do NocoBase automatycznie generują dostępne linki publiczne (w tym podpisane adresy URL generowane przez wtyczkę S3-Pro), jednak jeśli plik ma ustawione uprawnienia dostępu lub jest przechowywany w sieci wewnętrznej, podgląd nie będzie możliwy[^2].
- Usługa ta nie obsługuje uwierzytelniania logowania ani zasobów w pamięci prywatnej. Na przykład pliki dostępne tylko w sieci wewnętrznej lub wymagające logowania nie mogą korzystać z tej funkcji podglądu.
- Po pobraniu zawartości pliku przez usługę Microsoft, może ona być przechowywana w pamięci podręcznej przez krótki czas. Nawet jeśli plik źródłowy zostanie usunięty, podgląd może być nadal dostępny przez pewien czas.
- Istnieją zalecane limity rozmiaru plików: dla plików Word i PowerPoint zaleca się, aby nie przekraczały 10 MB, a dla plików Excel – 5 MB, aby zapewnić stabilność podglądu[^3].
- Obecnie nie ma oficjalnego, jasnego opisu licencji na komercyjne wykorzystanie tej usługi. Prosimy o samodzielną ocenę ryzyka podczas korzystania z niej[^4].

## Obsługiwane formaty plików

Wtyczka obsługuje podgląd wyłącznie dla następujących formatów plików Office, na podstawie typu MIME lub rozszerzenia pliku:

- Dokumenty Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) lub `application/msword` (`.doc`)
- Arkusze Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) lub `application/vnd.ms-excel` (`.xls`)
- Prezentacje PowerPoint:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) lub `application/vnd.ms-powerpoint` (`.ppt`)
- Tekst OpenDocument: `application/vnd.oasis.opendocument.text` (`.odt`)

Podgląd dla plików w innych formatach nie będzie obsługiwany przez tę wtyczkę.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)