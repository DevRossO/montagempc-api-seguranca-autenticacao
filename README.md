💻 Montagem de PC API

API RESTful desenvolvida com TypeScript, Node.js, Express e Prisma ORM, simulando um sistema de e-commerce de peças de computador.
O projeto tem foco em segurança, integridade dos dados e boas práticas de backend, incluindo autenticação, controle de acesso e rotinas de proteção contra uso indevido.

🚀 Funcionalidades
✅ Gestão de Usuários (User)

* Cadastro de usuários com validação de dados e senha criptografada (bcrypt)

* Listagem de usuários (dados sensíveis controlados)

* Atualização de dados do usuário autenticado

* Exclusão de conta do usuário autenticado

🔐 Autenticação e Segurança

* Login com JWT (JSON Web Token)

* Middleware de autenticação (authMiddleware)

* Rota protegida para validação da sessão (/usuarios/me)

* Senhas armazenadas somente em formato criptografado

* Validação de senha forte:

Mínimo 8 caracteres

Letra maiúscula, minúscula, número e símbolo

🚫 Controle de Tentativas de Login

* Contador de tentativas inválidas de login

* Bloqueio automático do usuário após 3 tentativas inválidas

* Reset das tentativas após login bem-sucedido

* Registro de todas as tentativas no sistema de logs

🔑 Alteração de Senha

* Rota protegida para alteração de senha

* Validação da senha atual

* Criptografia da nova senha antes de salvar

* Retorno da senha criptografada após alteração (conforme solicitado em aula)

* Registro da ação em logs

🧾 Sistema de Logs

* Registro automático de ações importantes:

Cadastro

Login bem-sucedido

Tentativas inválidas

Alteração de senha

Exclusão de usuários

Consulta de logs via rota protegida

Logs associados ao usuário responsável pela ação

💾 Backup e Restore (Segurança Extra)

Backup:

Exporta usuários e logs para um arquivo .json

Armazena o backup no servidor

Restore:

Restaura completamente o banco de dados a partir do arquivo de backup

Remove dados atuais antes da restauração

Recria usuários e logs mantendo integridade histórica

🛠️ Tecnologias Utilizadas

* TypeScript – Tipagem estática e organização do código

* Node.js – Ambiente de execução

* Express – Framework web

* Prisma ORM – Comunicação com banco de dados

* MySQL – Banco de dados relacional

* JWT (jsonwebtoken) – Autenticação baseada em token

* bcrypt – Criptografia de senhas

* Zod – Validação de dados de entrada

* Nodemailer – Estrutura preparada para envio de emails

* File System (fs) – Geração e leitura de arquivos de backup

📂 Modelagem do Banco de Dados

O banco de dados é modelado com Prisma, representando:

Usuários

Logs de ações

Campos específicos para segurança:

tentativasLogin

bloqueado

ultimoLogin

As relações garantem integridade referencial e permitem auditoria completa das ações realizadas no sistema.