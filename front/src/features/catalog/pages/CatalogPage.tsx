import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import ProductCard from "@/features/catalog/components/ProductCard";
import LoadingSpinner from "@/shared/components/LoadingSpinner";
import ErrorMessage from "@/shared/components/ErrorMessage";
import { catalogApi, Product, ProductFilters } from "@/shared/api/catalog";
import { recommendationsApi } from "@/shared/api/recommendations";
import { FEATURES } from "@/shared/api/config";
import { useActiveCustomer } from "@/shared/contexts/ActiveCustomerContext";

const CatalogPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsEnabled, setRecommendationsEnabled] = useState<boolean>(() => FEATURES.recommendations);

  const { customer } = useActiveCustomer();

  const categories = Array.from(new Set(products.flatMap((p) => p.categories)));
  const tags = Array.from(new Set(products.flatMap((p) => p.tags)));

  const fetchProducts = async (override?: Partial<ProductFilters>) => {
    setLoading(true);
    setError(null);
    try {
      const filters: ProductFilters = {
        q: searchQuery || undefined,
        category: selectedCategory || undefined,
        tag: selectedTag || undefined,
        ...override,
      };
      const data = await catalogApi.getProducts(filters);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadRecommendations = async () => {
      if (!FEATURES.recommendations || !recommendationsEnabled || !customer) {
        if (isMounted) {
          setRecommendedProducts([]);
          setRecommendationsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setRecommendationsLoading(true);
      }

      const data = await recommendationsApi.getRecommendations(customer.id);
      if (isMounted) {
        setRecommendedProducts(data);
        setRecommendationsLoading(false);
      }
    };

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, [customer, recommendationsEnabled]);

  const customerFirstName = customer?.name?.split(" ")[0] ?? "você";
  const showRecommendations =
    recommendationsEnabled && FEATURES.recommendations && customer && (recommendationsLoading || recommendedProducts.length > 0);

  const handleSearch = () => {
    fetchProducts();
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedTag("");
    fetchProducts({ q: undefined, category: undefined, tag: undefined });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Catálogo de Produtos</h1>
          <p className="text-muted-foreground">Busque e filtre os itens disponíveis na loja</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 mb-8">
          {FEATURES.recommendations && (
            <div className="flex items-center justify-end mb-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="recommendations-toggle" className="text-sm text-muted-foreground">
                  Recomendações no catálogo
                </Label>
                <Switch
                  id="recommendations-toggle"
                  checked={recommendationsEnabled}
                  onCheckedChange={setRecommendationsEnabled}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={selectedCategory || "all"}
              onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedTag || "all"}
              onValueChange={(value) => setSelectedTag(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch}>Aplicar filtros</Button>
            <Button variant="outline" onClick={handleReset}>
              Limpar
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        ) : (
          <>
            {showRecommendations && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Recomendados para {customerFirstName}
                </h2>
                {recommendationsLoading ? (
                  <LoadingSpinner />
                ) : recommendedProducts.length === 0 ? (
                  <p className="text-muted-foreground">
                    Nenhuma recomendação disponível no momento. Explore o catálogo e volte mais tarde.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                    {recommendedProducts.map((product) => (
                      <ProductCard key={`recommended-${product.id}`} product={product} />
                    ))}
                  </div>
                )}
              </section>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CatalogPage;
