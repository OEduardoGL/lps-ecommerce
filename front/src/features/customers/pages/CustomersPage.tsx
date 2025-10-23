import { useState, useEffect } from "react";
import { UserPlus, Mail } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import LoadingSpinner from "@/shared/components/LoadingSpinner";
import ErrorMessage from "@/shared/components/ErrorMessage";
import { usersApi, User, CreateUserInput } from "@/shared/api/users";
import { toast } from "sonner";

const CustomersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateUserInput>({
    name: "",
    email: "",
    favoriteCategories: [],
  });
  const [categoryInput, setCategoryInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddCategory = () => {
    if (categoryInput.trim() && !formData.favoriteCategories.includes(categoryInput.trim())) {
      setFormData({
        ...formData,
        favoriteCategories: [...formData.favoriteCategories, categoryInput.trim()],
      });
      setCategoryInput("");
    }
  };

  const handleRemoveCategory = (category: string) => {
    setFormData({
      ...formData,
      favoriteCategories: formData.favoriteCategories.filter((c) => c !== category),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Informe um e-mail válido");
      return;
    }

    setSubmitting(true);
    try {
      await usersApi.createUser(formData);
      toast.success("Cliente cadastrado com sucesso");
      setFormData({ name: "", email: "", favoriteCategories: [] });
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível cadastrar o cliente");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestão de clientes</h1>
          <p className="text-muted-foreground">Visualize e cadastre clientes rapidamente</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Lista de clientes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingSpinner />
                ) : error ? (
                  <ErrorMessage message={error} />
                ) : users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum cliente cadastrado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Nome</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">E-mail</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Categorias favoritas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-border hover:bg-secondary/50">
                            <td className="py-3 px-4 text-foreground">{user.name}</td>
                            <td className="py-3 px-4 text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {user.email}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {user.favoriteCategories.map((cat) => (
                                  <Badge key={cat} variant="secondary" className="text-xs">
                                    {cat}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Cadastrar cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Maria Souza"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="maria@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="categories">Categorias favoritas</Label>
                    <div className="flex gap-2">
                      <Input
                        id="categories"
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                        placeholder="Adicionar categoria"
                      />
                      <Button type="button" variant="outline" onClick={handleAddCategory}>
                        Adicionar
                      </Button>
                    </div>
                    {formData.favoriteCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.favoriteCategories.map((cat) => (
                          <Badge
                            key={cat}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => handleRemoveCategory(cat)}
                          >
                            {cat} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;
