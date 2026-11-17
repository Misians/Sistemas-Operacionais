# SO Docente Hub

Base de apoio ao ensino de Sistemas Operacionais com simulados, banco de questões para montar avaliações, materiais pedagógicos e ferramentas externas. As questões podem ser administradas em português, inglês, espanhol e mandarim.

## Desenvolvimento local

1. Crie um projeto no Firebase e habilite **Authentication → Email/Password**.
2. Copie `.env.example` para `.env.local` e preencha os valores da configuração Web do Firebase.
3. Instale dependências e inicie a aplicação:

   ```sh
   npm install
   npm run dev
   ```

   Sem configuração Firebase, a aplicação usa os dados de demonstração locais. A autenticação e a persistência no Firestore exigem um projeto Firebase configurado.

## Configurar o painel administrativo

1. Instale e autentique o Firebase CLI (`npm install -g firebase-tools`, depois `firebase login`) e selecione o projeto (`firebase use <project-id>`).
2. Implante as regras e a Cloud Function. Durante o primeiro deploy, informe `BOOTSTRAP_ADMIN_EMAIL` com o endereço que será o primeiro administrador:

   ```sh
   firebase deploy --only firestore:rules,functions
   ```

   O valor do parâmetro pode ser guardado localmente em `functions/.env.<project-id>`; esse arquivo é ignorado pelo Git. Não coloque chaves de conta de serviço no cliente ou no repositório.
3. Preencha `.env.local` com a configuração Web do mesmo projeto e publique a aplicação.
4. Abra `#admin`, crie uma conta ou entre com uma conta Email/Password. A criação envia um e-mail de verificação; confirme-o e entre novamente.
5. A conta cujo e-mail verificado corresponde a `BOOTSTRAP_ADMIN_EMAIL` pode ativar o primeiro acesso. A Cloud Function limita esse bootstrap a uma única conta. Depois, administradores podem conceder ou remover a claim `admin` de outras contas verificadas pelo próprio painel.

As regras deixam a leitura de `resources` e `questions` pública e restringem escritas a contas com a Custom Claim `admin`. O primeiro salvamento administrativo importa os dados iniciais com IDs estáveis e grava um marcador para que exclusões posteriores não restaurem esses registros automaticamente. Questões novas exigem enunciado, alternativas e explicação nos quatro idiomas, com o mesmo número de alternativas.

## Verificação

```sh
npm run build
npm run lint
```

O deploy do Firebase é uma etapa separada e requer acesso ao projeto e ao Firebase CLI.
