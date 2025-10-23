import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Package, Users, ShoppingBag } from "lucide-react";
import { useCart } from "@/shared/contexts/CartContext";

const Header = () => {
  const location = useLocation();
  const { totalItems } = useCart();

  const navItems = [
    { path: "/", label: "Produtos", icon: Package },
    { path: "/customers", label: "Clientes", icon: Users },
    { path: "/orders", label: "Pedidos", icon: ShoppingBag },
  ];

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-foreground">E-commerce</span>
            </Link>

            <nav className="hidden md:flex space-x-1">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <Link
            to="/orders"
            className="flex items-center space-x-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="font-medium">Carrinho</span>
            {totalItems > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
