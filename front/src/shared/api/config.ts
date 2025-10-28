const DEFAULT_BASE_URLS = {
  catalog: "/api/catalog",
  users: "/api/users",
  orders: "/api/orders",
  recommendations: "/api/recommendations",
} as const;

export const API_CONFIG = {
  catalog: import.meta.env.VITE_API_CATALOG ?? DEFAULT_BASE_URLS.catalog,
  users: import.meta.env.VITE_API_USERS ?? DEFAULT_BASE_URLS.users,
  orders: import.meta.env.VITE_API_ORDERS ?? DEFAULT_BASE_URLS.orders,
  recommendations: import.meta.env.VITE_API_RECOMMENDATIONS ?? DEFAULT_BASE_URLS.recommendations,
} as const;

export const FEATURES = {
  recommendations: import.meta.env.VITE_ENABLE_RECOMMENDATIONS === "true",
} as const;

export const ENABLED_SERVICES = {
  catalog: Boolean(API_CONFIG.catalog),
  users: Boolean(API_CONFIG.users),
  orders: Boolean(API_CONFIG.orders),
  recommendations: FEATURES.recommendations && Boolean(API_CONFIG.recommendations),
} as const;

export const ACTIVE_CUSTOMER_ID = import.meta.env.VITE_ACTIVE_CUSTOMER_ID ?? null;
