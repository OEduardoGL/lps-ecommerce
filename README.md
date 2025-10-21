# LPS de E-commerce

Implementação de uma **Linha de Produto de Software (LPS)** para e-commerce web.

## Conceitos Aplicados
- **Linha de Produto de Software (LPS)** – a configuração de features (`catalog`, `users`, `orders`, `recommendation`) define variantes `minimal`, `standard` e `premium` em `config/product-line.json`.
- **Componentização** – catálogos, perfis de usuários, pedidos e motor de recomendação moram em `shared/` e são reutilizados por múltiplos serviços.
- **Microserviços** – cada feature é exposta por um serviço Express independente, iniciado isoladamente ou pelo orquestrador.
- **Persistência** – dados são armazenados em PostgreSQL (`db/init.sql` cria o esquema e popula dados base).
- **Recomendação híbrida** – combina similaridade de categorias/tags, preferências do usuário e contagem de co-compra obtida a partir dos pedidos registrados.

## Estrutura
```
.
├── config/product-line.json   # Definição das features e variantes
├── db/init.sql                # Script SQL para criar tabelas e dados iniciais
├── docker-compose.yml         # Define Postgres + microserviços containerizados
├── services/                  # APIs Express (catalog, users, orders, recommendation)
├── shared/                    # Componentes reutilizados e conexão com o banco
├── scripts/                   # Orquestrador da LPS e utilitários de seed
├── Dockerfile 
└── README.md
```

## Variantes da LPS
| Variante  | Descrição                                                        | Serviços (portas)                                |
|-----------|------------------------------------------------------------------|--------------------------------------------------|
| `minimal` | Apenas vitrine de produtos                                       | `catalog` (4101)                                 |
| `standard`| Cadastro de clientes + pedidos (sem recomendações)               | `catalog` (4101), `users` (4102), `orders` (4103) |
| `premium` | Todos os recursos incluindo recomendações de produtos            | `catalog` (4101), `users` (4102), `orders` (4103), `recommendation` (4104) |

## Persistência em PostgreSQL
### Esquema
- `products`: catálogo com preço, estoque, categorias e tags (`TEXT[]`).
- `users`: clientes com preferências (`TEXT[]`).
- `orders` e `order_items`: pedidos com itens, status e histórico.

`npm run db:seed` para recomeçar com o estado base em um banco local.

## Execução Local (Node + Postgres)
1. **Suba/PostgreSQL**: use `docker compose up db`.
2. **Instale dependências**:
   ```bash
   npm install
   ```
3. **Prepare os dados (recomendado)** — certifique-se de que o banco está acessível (ex.: `docker compose up -d db`):
   ```bash
   npm run db:seed
   ```
4. **Inicie uma variante**:
   ```bash
   npm run start:minimal      # catálogo
   npm run start:standard     # catálogo + usuários + pedidos
   npm run start:premium      # todos os serviços
   ```
   O orquestrador lê `config/product-line.json` e sobe apenas os serviços necessários na mesma instância Node.

## Execução com Docker Compose
```bash
docker compose up --build
```
Serviços expostos:
- `catalog`: http://localhost:4101
- `users`: http://localhost:4102
- `orders`: http://localhost:4103
- `recommendation`: http://localhost:4104

O container `db` inicializa o PostgreSQL com `db/init.sql`. Todos os serviços compartilham a mesma imagem Node (definida no `Dockerfile`) com comandos diferentes.

### Encerrando
```bash
docker compose down
```
Use `docker compose down -v` para apagar o volume e recriar o banco do zero.

## APIs Disponíveis
### Catálogo (`:4101`)
- `GET /health`
- `GET /products?q=&category=&tag=`
- `GET /products/:id`

### Usuários (`:4102`)
- `GET /health`
- `GET /users`
- `GET /users/:id`
- `POST /users`
  ```json
  {
    "name": "Nome",
    "email": "email@example.com",
    "favoriteCategories": ["eletronicos"]
  }
  ```

### Pedidos (`:4103`)
- `GET /health`
- `GET /orders`
- `GET /orders/:id`
- `POST /orders`
  ```json
  {
    "userId": "u-1",
    "items": [
      { "productId": "p-100", "quantity": 1 }
    ]
  }
  ```
- `PATCH /orders/:id/status`
  ```json
  { "status": "sent" }
  ```

### Recomendações (`:4104`)
- `GET /health`
- `GET /recommendations?userId=&productId=&limit=`
- `GET /recommendations/related/:productId`

## Testes Manuais 
1. **Variante minimal**
   ```bash
   npm run start:minimal
   curl http://localhost:4101/products
   ```
   
## Testes

### 1. Variante `minimal`
```bash
npm run start:minimal
# Em outro terminal
curl http://localhost:4101/health
curl "http://localhost:4101/products?q=notebook"
```

### 2. Variante `standard`
```bash
npm run start:standard
curl http://localhost:4102/users
curl -X POST http://localhost:4103/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"u-1","items":[{"productId":"p-100","quantity":1}]}'
curl http://localhost:4103/orders
```
> pedido criado com preço e status `created`. Estoque do produto reduzido.

### 3. Variante `premium`
```bash
npm run start:premium
curl "http://localhost:4104/recommendations?productId=p-100"
curl -X POST http://localhost:4103/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"u-3","items":[{"productId":"p-102","quantity":1},{"productId":"p-104","quantity":1}]}'
curl "http://localhost:4104/recommendations?userId=u-3"
```
> recomendações priorizam categorias/tag relacionadas e evoluem após registrar o pedido (co-compra aumenta o score dos itens envolvidos).
