:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

### Formatação de Texto

Esta seção apresenta vários formatadores para dados de texto. Nas subseções a seguir, vamos detalhar a sintaxe, exemplos e resultados de cada um.

#### 1. :lowerCase

##### Explicação da Sintaxe
Converte todas as letras para minúsculas.

##### Exemplo
```
'My Car':lowerCase()   // Retorna "my car"
'my car':lowerCase()   // Retorna "my car"
null:lowerCase()       // Retorna null
1203:lowerCase()       // Retorna 1203
```

##### Resultado
O resultado de cada exemplo é exibido nos comentários.

#### 2. :upperCase

##### Explicação da Sintaxe
Converte todas as letras para maiúsculas.

##### Exemplo
```
'My Car':upperCase()   // Retorna "MY CAR"
'my car':upperCase()   // Retorna "MY CAR"
null:upperCase()       // Retorna null
1203:upperCase()       // Retorna 1203
```

##### Resultado
O resultado de cada exemplo é exibido nos comentários.

#### 3. :ucFirst

##### Explicação da Sintaxe
Converte apenas a primeira letra da string para maiúscula, mantendo o restante inalterado.

##### Exemplo
```
'My Car':ucFirst()     // Retorna "My Car"
'my car':ucFirst()     // Retorna "My car"
null:ucFirst()         // Retorna null
undefined:ucFirst()    // Retorna undefined
1203:ucFirst()         // Retorna 1203
```

##### Resultado
O resultado é conforme descrito nos comentários.

#### 4. :ucWords

##### Explicação da Sintaxe
Converte a primeira letra de cada palavra na string para maiúscula.

##### Exemplo
```
'my car':ucWords()     // Retorna "My Car"
'My cAR':ucWords()     // Retorna "My CAR"
null:ucWords()         // Retorna null
undefined:ucWords()    // Retorna undefined
1203:ucWords()         // Retorna 1203
```

##### Resultado
O resultado é o que você vê nos exemplos.

#### 5. :print(message)

##### Explicação da Sintaxe
Sempre retorna a mensagem especificada, independentemente dos dados originais. É útil como um formatador de fallback.
Parâmetro:
- **message:** O texto a ser exibido.

##### Exemplo
```
'My Car':print('hello!')   // Retorna "hello!"
'my car':print('hello!')   // Retorna "hello!"
null:print('hello!')       // Retorna "hello!"
1203:print('hello!')       // Retorna "hello!"
```

##### Resultado
Em todos os casos, retorna a string especificada "hello!".

#### 6. :printJSON

##### Explicação da Sintaxe
Converte um objeto ou array em uma string formatada em JSON.

##### Exemplo
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Retorna "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Retorna ""my car""
```

##### Resultado
O resultado é a string formatada em JSON dos dados fornecidos.

#### 7. :unaccent

##### Explicação da Sintaxe
Remove os sinais diacríticos (acentos) do texto, convertendo-o para um formato sem acentuação.

##### Exemplo
```
'crÃ¨me brulÃ©e':unaccent()   // Retorna "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Retorna "CREME BRULEE"
'Ãªtre':unaccent()           // Retorna "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Retorna "euieea"
```

##### Resultado
Todos os exemplos retornam o texto sem acentos.

#### 8. :convCRLF

##### Explicação da Sintaxe
Converte os caracteres de retorno de carro e quebra de linha (`\r\n` ou `\n`) em tags de quebra de linha específicas do documento. Isso é útil para formatos como DOCX, PPTX, ODT, ODP e ODS.
**Observação:** Ao usar `:html` antes de `:convCRLF`, `\r\n` é convertido para uma tag `<br>`.

##### Exemplo
```
// Para formato ODT:
'my blue 
 car':convCRLF()    // Retorna "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // Retorna "my blue <text:line-break/> car"

// Para formato DOCX:
'my blue 
 car':convCRLF()    // Retorna "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // Retorna "my blue </w:t><w:br/><w:t> car"
```

##### Resultado
O resultado exibe os marcadores de quebra de linha apropriados para o formato de documento de destino.

#### 9. :substr(begin, end, wordMode)

##### Explicação da Sintaxe
Realiza operações de substring em uma string, começando no índice `begin` (base 0) e terminando logo antes do índice `end`.
Um parâmetro opcional, `wordMode` (booleano ou `last`), controla se a quebra de palavra deve ser evitada no meio de uma palavra, mantendo-a completa.

##### Exemplo
```
'foobar':substr(0, 3)            // Retorna "foo"
'foobar':substr(1)               // Retorna "oobar"
'foobar':substr(-2)              // Retorna "ar"
'foobar':substr(2, -1)           // Retorna "oba"
'abcd efg hijklm':substr(0, 11, true)  // Retorna "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Retorna "abcd efg "
```

##### Resultado
O resultado é a substring extraída de acordo com os parâmetros.

#### 10. :split(delimiter)

##### Explicação da Sintaxe
Divide uma string em um array usando o delimitador especificado.
Parâmetro:
- **delimiter:** A string delimitadora.

##### Exemplo
```
'abcdefc12':split('c')    // Retorna ["ab", "def", "12"]
1222.1:split('.')         // Retorna ["1222", "1"]
'ab/cd/ef':split('/')      // Retorna ["ab", "cd", "ef"]
```

##### Resultado
O exemplo resulta em um array dividido pelo delimitador fornecido.

#### 11. :padl(targetLength, padString)

##### Explicação da Sintaxe
Preenche o lado esquerdo de uma string com um caractere especificado até que a string final atinja o `targetLength`.
Se o comprimento alvo for menor que o comprimento da string original, a string original é retornada.
Parâmetros:
- **targetLength:** O comprimento total desejado.
- **padString:** A string usada para preenchimento (o padrão é um espaço).

##### Exemplo
```
'abc':padl(10)              // Retorna "       abc"
'abc':padl(10, 'foo')       // Retorna "foofoofabc"
'abc':padl(6, '123465')     // Retorna "123abc"
'abc':padl(8, '0')          // Retorna "00000abc"
'abc':padl(1)               // Retorna "abc"
```

##### Resultado
Cada exemplo retorna a string preenchida à esquerda, conforme esperado.

#### 12. :padr(targetLength, padString)

##### Explicação da Sintaxe
Preenche o lado direito de uma string com um caractere especificado até que a string final atinja o `targetLength`.
Os parâmetros são os mesmos que para `:padl`.

##### Exemplo
```
'abc':padr(10)              // Retorna "abc       "
'abc':padr(10, 'foo')       // Retorna "abcfoofoof"
'abc':padr(6, '123465')     // Retorna "abc123"
'abc':padr(8, '0')          // Retorna "abc00000"
'abc':padr(1)               // Retorna "abc"
```

##### Resultado
O resultado exibe a string preenchida à direita.

#### 13. :ellipsis(maximum)

##### Explicação da Sintaxe
Se o texto exceder o número especificado de caracteres, adiciona uma elipse ("...") no final.
Parâmetro:
- **maximum:** O número máximo de caracteres permitido.

##### Exemplo
```
'abcdef':ellipsis(3)      // Retorna "abc..."
'abcdef':ellipsis(6)      // Retorna "abcdef"
'abcdef':ellipsis(10)     // Retorna "abcdef"
```

##### Resultado
Os exemplos mostram o texto truncado e com uma elipse adicionada, se necessário.

#### 14. :prepend(textToPrepend)

##### Explicação da Sintaxe
Adiciona o texto especificado no início da string.
Parâmetro:
- **textToPrepend:** O texto do prefixo.

##### Exemplo
```
'abcdef':prepend('123')     // Retorna "123abcdef"
```

##### Resultado
O resultado exibe o texto com o prefixo especificado adicionado.

#### 15. :append(textToAppend)

##### Explicação da Sintaxe
Adiciona o texto especificado no final da string.
Parâmetro:
- **textToAppend:** O texto do sufixo.

##### Exemplo
```
'abcdef':append('123')      // Retorna "abcdef123"
```

##### Resultado
O resultado exibe o texto com o sufixo especificado adicionado.

#### 16. :replace(oldText, newText)

##### Explicação da Sintaxe
Substitui todas as ocorrências de `oldText` no texto por `newText`.
Parâmetros:
- **oldText:** O texto a ser substituído.
- **newText:** O novo texto para substituir.
**Observação:** Se `newText` for `null`, isso indica que o texto correspondente deve ser removido.

##### Exemplo
```
'abcdef abcde':replace('cd', 'OK')    // Retorna "abOKef abOKe"
'abcdef abcde':replace('cd')          // Retorna "abef abe"
'abcdef abcde':replace('cd', null)      // Retorna "abef abe"
'abcdef abcde':replace('cd', 1000)      // Retorna "ab1000ef ab1000e"
```

##### Resultado
O resultado é o texto após a substituição dos segmentos especificados.

#### 17. :len

##### Explicação da Sintaxe
Retorna o comprimento de uma string ou de um array.

##### Exemplo
```
'Hello World':len()     // Retorna 11
'':len()                // Retorna 0
[1,2,3,4,5]:len()       // Retorna 5
[1,'Hello']:len()       // Retorna 2
```

##### Resultado
Retorna o comprimento correspondente como um número.

#### 18. :t

##### Explicação da Sintaxe
Traduz o texto usando um dicionário de tradução.
Os exemplos e resultados dependem da configuração real do dicionário de tradução.

#### 19. :preserveCharRef

##### Explicação da Sintaxe
Por padrão, alguns caracteres inválidos do XML (como `&`, `>`, `<`, etc.) são removidos. Este formatador preserva as referências de caracteres (por exemplo, `&#xa7;` permanece inalterado) e é adequado para cenários específicos de geração de XML.
Os exemplos e resultados dependem do caso de uso específico.