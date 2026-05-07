# Dicas de Bloco Markdown

O bloco Markdown é um dos blocos mais usados e poderosos. Ele vai de simples avisos textuais a estilos HTML básicos, podendo até carregar lógica de negócio importante — funcionalidades variadas e flexíveis.

## I. Funcionalidades Básicas do Bloco Markdown

Como o bloco Markdown é flexível, público e modificável a qualquer momento, é frequentemente usado para exibir avisos do sistema. Seja em módulo de negócio, funcionalidade, bloco ou campo, podemos «colar» pequenas dicas como notas adesivas onde quisermos.

Antes de usar o bloco Markdown, recomenda-se conhecer a sintaxe e o layout do Markdown. Você pode consultar o [exemplo do Vditor](https://docs.nocobase.com/api/field/markdown-vditor).

> Atenção: o bloco Markdown da página é relativamente leve; algumas funcionalidades (como fórmulas matemáticas, mapas mentais) ainda não são renderizadas. Mas podemos usar HTML para implementá-las, e o sistema também fornece o componente de campo Vditor — fica à vontade para experimentar.

### 1.1 Exemplo de Página

Podemos observar o uso de Markdown na página «Demo Online» do sistema, especificamente na home, na página de pedidos e em «Mais exemplos».

Por exemplo, os avisos e dicas da nossa home:
![20250227085425](https://static-docs.nocobase.com/20250227085425.png)

A lógica de cálculo do módulo de pedidos:
![20250227085536](https://static-docs.nocobase.com/20250227085536.png)

Os guias e imagens em «Mais exemplos»:
![20250227085730](https://static-docs.nocobase.com/20250227085730.png)

Alternando o modo de edição, podemos modificar o conteúdo Markdown a qualquer momento e observar a mudança na página.
![20250227085855](https://static-docs.nocobase.com/20250227085855.png)

### 1.2 Criar Bloco Markdown

Em páginas, popups e formulários, podemos criar blocos Markdown com flexibilidade.

#### Forma de criação

- **Criar em popup/página:**

  ![Bloco Markdown em popup/página](https://static-docs.nocobase.com/20250227091156.png)
- **Criar em bloco de formulário:**

  ![Bloco Markdown em formulário](https://static-docs.nocobase.com/20250227091309.png)

#### Exemplo de uso

Inserindo `---` na sintaxe Markdown, simulamos uma linha divisória de grupo, criando um efeito de separação simples:

![Exemplo de divisor 1](https://static-docs.nocobase.com/20250227092156.png)
![Exemplo de divisor 2](https://static-docs.nocobase.com/20250227092236.png)

---

## II. Exibição de Conteúdo Personalizado

Outra grande vantagem do bloco Markdown é o suporte a preenchimento com variáveis do sistema, ajudando a gerar títulos e mensagens personalizados, garantindo que cada usuário veja informações únicas em seu próprio formulário.

![Exibição personalizada 1](https://static-docs.nocobase.com/20250227092400.png)
![Exibição personalizada 2](https://static-docs.nocobase.com/20250227092430.png)

Além disso, é possível combinar dados do formulário em layouts simples, como:

**Exemplo de título destacado:**

```markdown
# #{{$nRecord.id}} {{$nPopupRecord.task_name}}

---
```

![Efeito de título destacado](https://static-docs.nocobase.com/20250227164055.png)

**Exemplo de divisor centralizado:**

![Efeito de campo centralizado](https://static-docs.nocobase.com/20250227164456.png)

## III. Preenchimento com Conteúdo Rico

Conforme você se familiariza com a sintaxe Markdown e variáveis, podemos preencher o bloco Markdown com conteúdos mais ricos, como HTML!

### 3.1 Exemplo HTML

Se você nunca viu sintaxe HTML, pode pedir ajuda ao Deepseek para escrever (atenção: tag `script` não é suportada; recomenda-se que todos os estilos fiquem dentro de uma `div` local).

Abaixo um exemplo de aviso elegante:

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 20px; padding: 20px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Join Us for a Fun Getaway!</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Hi Everyone,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We're excited to invite you to an awesome group outing filled with laughter, adventure, and great vibes!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Mark your calendars for <span style="color: red; font-weight: bold; font-size: 1.5em;">November 10, 2025</span>, and get ready to explore, relax, and enjoy some quality time together.</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We'll share more details about the itinerary and meeting spot soon—stay tuned!</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">Can't wait to see you there!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Cheers,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Your Event Team</p>
</div>

```

![20250227092832](https://static-docs.nocobase.com/20250227092832.png)

![20250227093003](https://static-docs.nocobase.com/20250227093003.png)

### 3.2 Exemplo de Animação

Podemos até combinar com CSS para implementar efeitos simples de animação, como exibição/ocultação dinâmica estilo slideshow (cole o código abaixo no Markdown e veja!):

```html
<div style="background-color: #f8e1e1; border: 2px solid #d14; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); animation: fadeInOut 3s infinite;">
    <h2 style="color: #d14; font-family: 'Arial', sans-serif;">🎉 Special Announcement 🎉</h2>
    <p style="color: #333; font-size: 18px; font-family: 'Georgia', serif;">Thank you for your support and attention! We will hold a special event next Monday, stay tuned!</p>
    <button style="background-color: #d14; color: white; border: none; border-radius: 5px; padding: 10px 20px; cursor: pointer;">Click to Learn More</button>
</div>

<style>
@keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translateY(-20px); }
    10%, 90% { opacity: 1; transform: translateY(0); }
}
</style>

```

![](https://static-docs.nocobase.com/202502270933fade-out.gif)
