import { API_CONFIG, FEATURES } from "./config";
import { Product } from "./catalog";

const BASE_URL = API_CONFIG.recommendations;

export const recommendationsApi = {
  async getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    if (!FEATURES.recommendations) {
      return [];
    }

    try {
      const response = await fetch(`${BASE_URL}/recommendations/related/${productId}?limit=${limit}`);
      
      if (!response.ok) {
        console.warn("Serviço de recomendações indisponível");
        return [];
      }
      
      const payload = await response.json();
      if (Array.isArray(payload?.data)) {
        return payload.data;
      }
      console.warn("Formato inesperado no payload de recomendações relacionadas", payload);
      return [];
    } catch (error) {
      console.warn("Falha ao buscar recomendações:", error);
      return [];
    }
  },

  async getRecommendations(userId?: string, productId?: string, limit: number = 6): Promise<Product[]> {
    if (!FEATURES.recommendations) {
      return [];
    }

    try {
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      if (productId) params.append("productId", productId);
      params.append("limit", limit.toString());

      const response = await fetch(`${BASE_URL}/recommendations?${params.toString()}`);
      
      if (!response.ok) {
        console.warn("Serviço de recomendações indisponível");
        return [];
      }
      
      const payload = await response.json();
      if (Array.isArray(payload?.data)) {
        return payload.data;
      }
      console.warn("Formato inesperado no payload de recomendações", payload);
      return [];
    } catch (error) {
      console.warn("Falha ao buscar recomendações:", error);
      return [];
    }
  },
};
