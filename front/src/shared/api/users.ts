import { API_CONFIG } from "./config";

export interface User {
  id: string;
  name: string;
  email: string;
  favoriteCategories: string[];
}

export interface CreateUserInput {
  name: string;
  email: string;
  favoriteCategories: string[];
}

const BASE_URL = API_CONFIG.users;

export const usersApi = {
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${BASE_URL}/users`);
    
    if (!response.ok) {
      throw new Error("Não foi possível carregar os clientes");
    }
    
    const payload = await response.json();
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }
    console.warn("Formato inesperado no payload de clientes", payload);
    return [];
  },

  async createUser(user: CreateUserInput): Promise<User> {
    const response = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload?.error ?? "Não foi possível cadastrar o cliente");
    }
    
    return response.json();
  },
};
