# 💻 Montagem de PC API

Uma API RESTful desenvolvida com **TypeScript** e **Prisma** que simula um sistema de e-commerce de peças de computador. O projeto permite que usuários se cadastrem, comprem peças de lojas virtuais e gerenciem seus pedidos, com foco na aplicação de **transações atômicas** para garantir a integridade dos dados de estoque e saldo.

---

## 🚀 Funcionalidades

As seguintes funcionalidades foram implementadas na API:

### **CRUD em Entidades Básicas**

-   **`User` (Usuário):** Cadastro, listagem e atualização de informações de usuários.
-   **`Store` (Loja):** Gestão de lojas de eletrônicos.
-   **`Part` (Peça):** Gestão das peças de computador, incluindo nome, tipo, preço e estoque.

### **Transações**

-   **Compra de Peças:** Uma transação que registra a compra de um usuário. A transação é atômica e garante que:
    1.  O saldo do usuário seja suficiente.
    2.  O estoque das peças seja atualizado.
    3.  O pedido e os itens do pedido sejam criados.
-   **Cancelamento de Pedido:** Uma transação que permite a exclusão de um pedido. A transação garante que:
    1.  O pedido e os itens do pedido sejam removidos.
    2.  O estoque das peças seja restabelecido.

---

## 🛠️ Tecnologias

-   **TypeScript:** Linguagem de programação.
-   **Node.js:** Ambiente de execução.
-   **Express:** Framework web para construção da API.
-   **Prisma ORM:** Ferramenta para mapeamento objeto-relacional (ORM) para interagir com o banco de dados.
-   **MySQL:** Sistema de gerenciamento de banco de dados relacional.
-   **JSON Web Tokens (JWT):** Para autenticação de usuários (opcional, mas recomendado).

---

## 📂 Modelagem do Banco de Dados

O projeto utiliza o Prisma para a modelagem do banco de dados. A estrutura de dados (schema) é projetada para representar as relações entre usuários, lojas, peças e pedidos.