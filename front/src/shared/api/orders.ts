import { API_CONFIG } from "./config";

export interface OrderItem {
  productId: string;
  quantity: number;
  productName?: string;
  price?: number;
}

export const ORDER_STATUS_OPTIONS = [
  "created",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_OPTIONS)[number];

export interface Order {
  id: string;
  userId: string | null;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  total: number;
}

export interface CreateOrderInput {
  userId: string;
  items: { productId: string; quantity: number }[];
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

const BASE_URL = API_CONFIG.orders;

const knownStatusSet = new Set<OrderStatus>(ORDER_STATUS_OPTIONS);

function normalizeOrder(order: any): Order {
  const items: OrderItem[] = Array.isArray(order?.items)
    ? order.items.map((item: any) => ({
        productId: item.productId,
        quantity: Number(item.quantity ?? 0),
        productName: item.productName,
        price: item.price !== undefined ? Number(item.price) : undefined,
      }))
    : [];

  const total = items.reduce((acc, item) => {
    const price = item.price ?? 0;
    return acc + price * item.quantity;
  }, 0);

  const rawStatus = typeof order?.status === "string" ? order.status : "created";
  const status = knownStatusSet.has(rawStatus as OrderStatus) ? (rawStatus as OrderStatus) : "created";

  return {
    id: order?.id,
    userId: order?.userId ?? null,
    items,
    status,
    createdAt: order?.createdAt ?? new Date().toISOString(),
    total,
  };
}

export const ordersApi = {
  async getOrders(): Promise<Order[]> {
    const response = await fetch(`${BASE_URL}/orders`);

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload?.error ?? "Não foi possível carregar os pedidos");
    }

    const payload = await response.json();
    if (Array.isArray(payload?.data)) {
      return payload.data.map(normalizeOrder);
    }
    console.warn("Formato inesperado no payload de pedidos", payload);
    return [];
  },

  async createOrder(order: CreateOrderInput): Promise<Order> {
    const response = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload?.error ?? "Não foi possível registrar o pedido");
    }

    const payload = await response.json();
    return normalizeOrder(payload);
  },

  async updateOrderStatus(orderId: string, data: UpdateOrderStatusInput): Promise<Order> {
    const response = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload?.error ?? "Não foi possível atualizar o status do pedido");
    }

    const payload = await response.json();
    return normalizeOrder(payload);
  },
};
