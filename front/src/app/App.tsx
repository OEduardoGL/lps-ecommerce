import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/shared/contexts/CartContext";
import { ActiveCustomerProvider } from "@/shared/contexts/ActiveCustomerContext";
import Header from "@/app/layout/Header";
import CatalogPage from "@/features/catalog/pages/CatalogPage";
import ProductDetailPage from "@/features/catalog/pages/ProductDetailPage";
import OrdersPage from "@/features/orders/pages/OrdersPage";
import NotFoundPage from "@/app/routes/NotFoundPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ActiveCustomerProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Header />
            <Routes>
              <Route path="/" element={<CatalogPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </ActiveCustomerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
