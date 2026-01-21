:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Editor de Temas

> O recurso de tema atual é implementado com base no Ant Design 5.x. Recomendamos que você entenda os conceitos de [personalização de temas](https://ant.design/docs/react/customize-theme-cn#%E8%87%AA%E5%AE%9A%E4%B9%89%E4%B8%BB%E9%A2%98) antes de ler este documento.

## Introdução

O **plugin** Editor de Temas é usado para modificar os estilos de toda a página de frontend. Atualmente, ele suporta a edição global de [SeedToken](https://ant.design/docs/react/customize-theme-cn#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme-cn#maptoken) e [AliasToken](https://ant.design/docs/react/customize-theme-cn#aliastoken), além de permitir a [alternância](https://ant.design/docs/react/customize-theme-cn#%E4%BD%BF%E7%94%A8%E9%A2%84%E8%AE%BE%E7%AE%97%E6%B3%95) para o `Modo Escuro` e o `Modo Compacto`. No futuro, ele poderá suportar a personalização de temas em [nível de componente](https://ant.design/docs/react/customize-theme-cn#%E4%BF%AE%E6%94%B9%E7%BB%84%E4%BB%B6%E5%8F%98%E9%87%8F-component-token).

## Como Usar

### Habilitando o Plugin Editor de Temas

Primeiro, atualize o NocoBase para a versão mais recente (v0.11.1 ou superior). Em seguida, na página de gerenciamento de **plugins**, procure pelo cartão `Editor de Temas`. Clique no botão `Habilitar` no canto inferior direito do cartão e aguarde a página recarregar.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Acessando a Página de Configuração de Temas

Após habilitar o **plugin**, clique no botão de configurações no canto inferior esquerdo do cartão para acessar a página de edição de temas. Por padrão, quatro opções de tema são oferecidas: `Tema Padrão`, `Tema Escuro`, `Tema Compacto` e `Tema Escuro Compacto`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Adicionando um Novo Tema

Clique no botão `Adicionar Novo Tema` e selecione `Criar um Tema Totalmente Novo`. Um editor de temas será exibido no lado direito da página, permitindo que você edite opções como `Cores`, `Tamanhos` e `Estilos`. Após a edição, insira um nome para o tema e clique em salvar para concluir a criação do tema.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Aplicando um Novo Tema

Mova o mouse para o canto superior direito da página para ver o seletor de temas. Clique nele para alternar para outros temas, como o tema que você acabou de adicionar.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Editando um Tema Existente

Clique no botão `Editar` no canto inferior esquerdo do cartão. Um editor de temas será exibido no lado direito da página (semelhante ao de adicionar um novo tema). Após a edição, clique em salvar para concluir a modificação do tema.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Definindo Temas Selecionáveis pelo Usuário

Os temas recém-adicionados permitem que os usuários alternem para eles por padrão. Se você não quiser que os usuários alternem para um determinado tema, desative o interruptor `Selecionável pelo usuário` no canto inferior direito do cartão do tema. Dessa forma, os usuários não conseguirão alternar para esse tema.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Definindo como Tema Padrão

No estado inicial, o tema padrão é o `Tema Padrão`. Se você precisar definir um tema específico como padrão, ative o interruptor `Tema Padrão` no canto inferior direito do cartão desse tema. Isso garante que, quando os usuários abrirem a página pela primeira vez, eles verão esse tema. Atenção: O tema padrão não pode ser excluído.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Excluindo um Tema

Clique no botão `Excluir` abaixo do cartão e, em seguida, confirme na caixa de diálogo pop-up para excluir o tema.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)