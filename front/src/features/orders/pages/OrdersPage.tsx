import { useState, useEffect } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import LoadingSpinner from "@/shared/components/LoadingSpinner";
import ErrorMessage from "@/shared/components/ErrorMessage";
import { ordersApi, Order, ORDER_STATUS_OPTIONS, OrderStatus } from "@/shared/api/orders";
import { usersApi, User } from "@/shared/api/users";
import { useCart } from "@/shared/contexts/CartContext";
import { toast } from "sonner";

const STATUS_COLORS: Record<OrderStatus, string> = {
  created: "bg-status-processing text-white",
  pending: "bg-status-pending text-white",
  processing: "bg-status-processing text-white",
  shipped: "bg-status-shipped text-white",
  delivered: "bg-status-delivered text-white",
  cancelled: "bg-status-cancelled text-white",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  created: "Criado",
  pending: "Pendente",
  processing: "Em processamento",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const OrdersPage = () => {
  const { items, totalPrice, removeItem, clearCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersData, usersData] = await Promise.all([
        ordersApi.getOrders(),
        usersApi.getUsers(),
      ]);
      setOrders(ordersData);
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedUserId) {
      toast.error("Selecione um cliente");
      return;
    }

    if (items.length === 0) {
      toast.error("O carrinho está vazio");
      return;
    }

    setSubmitting(true);
    try {
      await ordersApi.createOrder({
        userId: selectedUserId,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      toast.success("Pedido registrado com sucesso");
      clearCart();
      setSelectedUserId("");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível registrar o pedido");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await ordersApi.updateOrderStatus(orderId, { status });
      toast.success("Status do pedido atualizado");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o status");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestão de pedidos</h1>
          <p className="text-muted-foreground">Monte o carrinho, finalize pedidos e acompanhe o status</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Carrinho atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhum item no carrinho</p>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.productId} className="flex items-start justify-between pb-3 border-b border-border last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            R${item.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground">
                            R${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.productId)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-3 border-t border-border">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold text-foreground">Total:</span>
                        <span className="text-2xl font-bold text-primary">
                          R${totalPrice.toFixed(2)}
                        </span>
                      </div>

                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={handlePlaceOrder}
                        disabled={submitting || !selectedUserId}
                        className="w-full mt-3"
                      >
                        {submitting ? "Enviando pedido..." : "Finalizar pedido"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingSpinner />
                ) : error ? (
                  <ErrorMessage message={error} />
                ) : orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum pedido registrado</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-foreground">Pedido #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleUpdateStatus(order.id, value as OrderStatus)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUS_OPTIONS.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {STATUS_LABELS[status] ?? status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 mb-3">
                          {order.items.map((item, idx) => (
                            <p key={idx} className="text-sm text-muted-foreground">
                              {item.productName || item.productId} × {item.quantity}
                            </p>
                          ))}
                        </div>

                        <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                          <span>Total</span>
                          <span className="font-semibold text-foreground">
                            R${order.total.toFixed(2)}
                          </span>
                        </div>

                        <Badge className={STATUS_COLORS[order.status]}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
