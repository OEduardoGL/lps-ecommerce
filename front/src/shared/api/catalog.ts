import { API_CONFIG } from "./config";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
  tags: string[];
  stock: number;
  imageUrl?: string;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  tag?: string;
}

const BASE_URL = API_CONFIG.catalog;

export const catalogApi = {
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filters.q) params.append("q", filters.q);
    if (filters.category) params.append("category", filters.category);
    if (filters.tag) params.append("tag", filters.tag);

    const url = `${BASE_URL}/products${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload?.error ?? "Não foi possível carregar os produtos");
    }

    const payload = await response.json();
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }
    console.warn("Formato inesperado no payload de produtos", payload);
    return [];
  },

  async getProductById(id: string): Promise<Product> {
    const response = await fetch(`${BASE_URL}/products/${id}`);
    
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload?.error ?? "Não foi possível carregar os detalhes do produto");
    }

    return response.json();
  },
};
