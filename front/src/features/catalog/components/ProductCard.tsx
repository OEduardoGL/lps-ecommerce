import { Link } from "react-router-dom";
import { ShoppingCart, Package } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Product } from "@/shared/api/catalog";
import { useCart } from "@/shared/contexts/CartContext";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
    });
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="aspect-square bg-secondary rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="h-16 w-16 text-muted-foreground" />
          )}
        </div>

        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{product.name}</h3>

        <div className="flex flex-wrap gap-1 mb-3">
          {product.categories.slice(0, 2).map((category) => (
            <Badge key={category} variant="secondary" className="text-xs">
              {category}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-primary">R${product.price.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground">Estoque: {product.stock}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Link to={`/products/${product.id}`} className="flex-1">
          <Button variant="outline" className="w-full">
            Ver detalhes
          </Button>
        </Link>
        <Button 
          onClick={handleAddToCart} 
          disabled={product.stock === 0}
          className="flex-1"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
