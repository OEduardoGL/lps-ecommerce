import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import ProductCard from "@/features/catalog/components/ProductCard";
import LoadingSpinner from "@/shared/components/LoadingSpinner";
import ErrorMessage from "@/shared/components/ErrorMessage";
import { catalogApi, Product } from "@/shared/api/catalog";
import { recommendationsApi } from "@/shared/api/recommendations";
import { useCart } from "@/shared/contexts/CartContext";
import { FEATURES } from "@/shared/api/config";
import { toast } from "sonner";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const productData = await catalogApi.getProductById(id);
        setProduct(productData);

        if (FEATURES.recommendations) {
          const related = await recommendationsApi.getRelatedProducts(id);
          setRelatedProducts(related);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar o produto");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
    });
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return <ErrorMessage message="Produto não encontrado" />;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o catálogo
        </Link>

        <div className="bg-card rounded-lg border border-border p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="h-32 w-32 text-muted-foreground" />
              )}
            </div>

            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-foreground mb-4">{product.name}</h1>

              <div className="flex flex-wrap gap-2 mb-4">
                {product.categories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-4xl font-bold text-primary">R${product.price.toFixed(2)}</span>
                <span className="text-muted-foreground">
                  {product.stock > 0 ? `${product.stock} em estoque` : "Produto indisponível"}
                </span>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                size="lg"
                className="w-full md:w-auto"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Adicionar ao carrinho
              </Button>
            </div>
          </div>
        </div>

        {FEATURES.recommendations && relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Produtos relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
