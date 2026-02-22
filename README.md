# Spy (Landing)

Site estático + API serverless, pronto para rodar localmente, versionar no Git e fazer deploy na Vercel.

## Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- Conta na [Vercel](https://vercel.com)
- Chave da API [RapidAPI](https://rapidapi.com) (WhatsApp Data) para a rota `/api/consulta`

## Instalação local

```bash
# Instalar dependências
npm install

# Subir servidor local (porta 3000)
npm run dev
```

Abrir no navegador: **http://localhost:3000**

**Nota:** A página `/consulta` chama a API em `/api/consulta`. Localmente, essa API só funciona se você rodar com o CLI da Vercel (veja abaixo) ou configurar a variável `RAPIDAPI_KEY` em um ambiente que exponha essa rota.

### Testar com API local (Vercel Dev)

```bash
npm i -g vercel
vercel dev
```

Isso sobe o site e as serverless functions; em **http://localhost:3000** a rota `/api/consulta` usará `RAPIDAPI_KEY` do arquivo `.env`.

### Modo desenvolvimento (página Consulta)

Para testar a página **consulta** (pergunta Esposo/Esposa, card de perfil e seções) sem esperar a barra e a VSL:

- Abra: **http://localhost:3000/consulta?dev=1**
- Opcional: use um número na URL para o card: `?dev=1&tel=5567999999999`

Com `dev=1` a barra já aparece em 100%, a pergunta "Esposo/Esposa" é exibida na hora, a VSL fica oculta e um badge **DEV** aparece no canto da tela. Assim você pode recarregar a página e ver as mudanças sem esperar o progresso.

## Variável de ambiente

Crie um arquivo `.env` na raiz (não commitar):

```env
RAPIDAPI_KEY=sua_chave_rapidapi
```

Use como referência o `.env.example`.

## Git

O projeto já está preparado para Git:

- `.gitignore` configurado (node_modules, .env, logs, .vercel, etc.)
- Nenhum segredo no repositório (use `.env` local e variáveis na Vercel)

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

## Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login.
2. **Import Project** → conecte o repositório Git (GitHub/GitLab/Bitbucket) ou use **Vercel CLI**:

   ```bash
   npx vercel
   ```

3. **Environment Variables** (no dashboard do projeto ou durante o `vercel`):
   - `RAPIDAPI_KEY` — chave da RapidAPI (WhatsApp Data) para a rota `/api/consulta`
   - `BLACKCAT_API_KEY` — chave da Blackcat Pagamentos para PIX (checkout e upsell). Sem ela, o checkout retornará erro "Gateway não configurado"
   - Ambiente: Production (e Preview se quiser)

4. Deploy: a Vercel detecta o projeto como estático + serverless (`api/`) e faz o deploy. As próximas alterações no Git (push) geram novo deploy automaticamente.

## Estrutura

- Raiz: HTML/CSS/JS estáticos (Tailwind via CDN).
- `api/consulta.js`: serverless function que substitui `consulta/api.php` na Vercel.
- `consulta/`, `escolha/`, `marido/`, `esposa/`, `concluido/`: páginas do fluxo.
- `vercel.json`: rewrites para `/consulta` e `/consulta/` apontando para `consulta/index.html`.
- Imagens (fundo, checkout, avaliações): ver lista em `consulta/images/IMAGENS-CHECKOUT.txt`. Se faltar alguma, a página segue funcionando (fallbacks e `onerror` no HTML).

## PHP (api.php)

O arquivo `consulta/api.php` permanece no repositório para referência ou uso em hospedagem com PHP. Na Vercel a rota usada é **`/api/consulta`** (implementada em `api/consulta.js`).
