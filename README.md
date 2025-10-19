# LPS de E-commerce

Implementação de uma **Linha de Produto de Software (LPS)** para e-commerce web. O foco está em mostrar como componentes reutilizáveis são combinados em microserviços para formar variantes funcionais (minimal, standard, premium) com recomendação de produtos.

## Conceitos Aplicados
- **Linha de Produto de Software (LPS)**: coleção de variantes construídas sobre um conjunto comum de artefatos. Cada variante seleciona um subconjunto de features no arquivo `config/product-line.json`.
- **Modelagem de Features**: catálogo, usuários, pedidos e recomendação são tratados como features independentes, podendo ser ativadas/desativadas por variante.
- **Componentes Compartilhados**: implementações únicas (dados em memória, estoque, perfis, pedidos, motor de recomendação) reutilizadas pelos serviços.
- **Microserviços HTTP**: cada feature ativa expõe uma API Express isolada, iniciada apenas quando necessária para a variante.
- **Recomendação baseada em Similaridade e Co-compra**: motor simples que combina categorias, tags, preferências do usuário e histórico de pedidos para sugerir itens.

## Estrutura do Projeto
```
.
├── config/product-line.json   # Definição de features e variantes da LPS
├── shared/                    # Componentes e dados reaproveitados
│   ├── components/            # Catálogo, usuários, pedidos, recomendação
│   └── data/                  # Dados de exemplo (produtos e usuários)
├── services/                  # Microserviços Express
│   ├── catalog/
│   ├── users/
│   ├── orders/
│   └── recommendation/
├── scripts/start-variant.js   # Orquestrador das variantes
└── README.md
```

### Modelo de Variantes

| Variante | Descrição | Serviços (portas) |
|----------|-----------|--------------------|
| `minimal` | Vitrine simples sem clientes ou pedidos | `catalog` (4101) |
| `standard` | Operação tradicional com usuários e pedidos | `catalog` (4101), `users` (4102), `orders` (4103) |
| `premium` | Todos os recursos, incluindo recomendações | `catalog` (4101), `users` (4102), `orders` (4103), `recommendation` (4104) |

## Arquitetura em Camadas
1. **Componentes compartilhados (`shared/components`)**
   - `catalog`: lista/busca produtos, controla estoque.
   - `userProfiles`: CRUD simples em memória para usuários.
   - `orderStore`: registra pedidos e status.
   - `recommendationEngine`: calcula recomendações e registra co-compra.
2. **Dados (`shared/data`)**: estado em memória populado com produtos e usuários fictícios.
3. **Serviços (`services/*`)**: cada serviço injeta os componentes relevantes e expõe rotas REST.
4. **Orquestração (`scripts/start-variant.js`)**: lê a variante, instancia os serviços necessários e compartilha dependências (ex.: `recommendationEngine` é injetado nos pedidos para registrar compras, e no serviço de recomendação para gerar respostas).

## APIs por Serviço

### Catálogo – `http://localhost:4101`
- `GET /health`
- `GET /products` — filtros opcionais `q`, `category`, `tag`.
- `GET /products/:id`

### Usuários – `http://localhost:4102`
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

### Pedidos – `http://localhost:4103`
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

### Recomendações – `http://localhost:4104`
- `GET /health`
- `GET /recommendations?userId=&productId=&limit=`
- `GET /recommendations/related/:productId`

## Instalação e Execução
1. Instale dependências:
   ```bash
   npm install
   ```
2. Inicie a variante desejada:
   ```bash
   # Variante padrão (standard)
   npm start

   # Variantes específicas
   npm run start:minimal
   npm run start:standard
   npm run start:premium

   # Ou usando o orquestrador diretamente
   node scripts/start-variant.js --variant=premium

   # Via variável de ambiente
   LPS_VARIANT=minimal node scripts/start-variant.js
   ```

## Testes Manuais

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
