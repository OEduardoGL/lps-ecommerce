import { useState, useEffect, useMemo } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import LoadingSpinner from "@/shared/components/LoadingSpinner";
import ErrorMessage from "@/shared/components/ErrorMessage";
import {
  ordersApi,
  Order,
  OrderStatus,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
} from "@/shared/api/orders";
import { useCart } from "@/shared/contexts/CartContext";
import { useActiveCustomer } from "@/shared/contexts/ActiveCustomerContext";
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

const PAYMENT_METHOD_DETAILS: Record<
  PaymentMethod,
  { label: string; description: string }
> = {
  pix: {
    label: "PIX",
    description: "Pagamento instantâneo efetuado via QR Code ou chave PIX.",
  },
  credit_card: {
    label: "Cartão de crédito",
    description: "Pagamento parcelado ou à vista utilizando cartão de crédito.",
  },
  debit_card: {
    label: "Cartão de débito",
    description: "Pagamento à vista debitado diretamente da sua conta.",
  },
  boleto: {
    label: "Boleto bancário",
    description: "Geramos um boleto para pagamento em até 2 dias úteis.",
  },
};

const getPaymentMethodLabel = (method?: PaymentMethod) =>
  method ? PAYMENT_METHOD_DETAILS[method]?.label ?? method : undefined;

const OrdersPage = () => {
  const { items, totalPrice, removeItem, clearCart } = useCart();
  const { customer, loading: loadingCustomer, error: customerError } = useActiveCustomer();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");

  const fetchOrders = async () => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const ordersData = await ordersApi.getOrders();
      setOrders(ordersData);
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : "Não foi possível carregar seus pedidos");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePlaceOrder = async () => {
    if (!customer) {
      toast.error("Não foi possível identificar o cliente para registrar o pedido");
      return;
    }

    if (items.length === 0) {
      toast.error("O carrinho está vazio");
      return;
    }

    if (!paymentMethod) {
      toast.error("Selecione um método de pagamento");
      return;
    }

    setSubmitting(true);
    try {
      await ordersApi.createOrder({
        userId: customer.id,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod,
      });
      toast.success("Pedido registrado com sucesso");
      clearCart();
      setPaymentMethod("pix");
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível registrar o pedido");
    } finally {
      setSubmitting(false);
    }
  };

  const customerOrders = useMemo(
    () => (customer ? orders.filter((order) => order.userId === customer.id) : orders),
    [orders, customer]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Finalizar compra</h1>
          <p className="text-muted-foreground">Revise seu carrinho e acompanhe suas compras recentes</p>
        </div>

        {customerError && !loadingCustomer && (
          <div className="mb-6">
            <ErrorMessage message={customerError} />
          </div>
        )}

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

                      <div className="rounded-md border border-dashed border-border px-4 py-3 mb-3">
                        {loadingCustomer ? (
                          <p className="text-sm text-muted-foreground">Carregando informações do cliente...</p>
                        ) : customer ? (
                          <div>
                            <p className="text-xs uppercase text-muted-foreground tracking-wide">Compra para</p>
                            <p className="font-semibold text-foreground">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-destructive">
                            Não foi possível identificar o cliente ativo. Verifique a configuração.
                          </p>
                        )}
                      </div>

                      <div className="mb-3 space-y-3">
                        <p className="text-sm font-semibold text-foreground">Método de pagamento</p>
                        <RadioGroup
                          value={paymentMethod}
                          onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                          className="space-y-2"
                        >
                          {PAYMENT_METHOD_OPTIONS.map((method) => (
                            <div
                              key={method}
                              className="flex items-start gap-3 rounded-md border border-border px-4 py-3 transition hover:border-primary"
                            >
                              <RadioGroupItem
                                value={method}
                                id={`payment-${method}`}
                                className="mt-1"
                              />
                              <div>
                                <Label htmlFor={`payment-${method}`} className="font-medium">
                                  {PAYMENT_METHOD_DETAILS[method].label}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {PAYMENT_METHOD_DETAILS[method].description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      <Button
                        onClick={handlePlaceOrder}
                        disabled={submitting || !customer || items.length === 0}
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
                <CardTitle>Suas compras</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <LoadingSpinner />
                ) : ordersError ? (
                  <ErrorMessage message={ordersError} />
                ) : customerOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Você ainda não realizou nenhuma compra.</p>
                ) : (
                  <div className="space-y-4">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-foreground">Pedido #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={STATUS_COLORS[order.status]}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </Badge>
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

                        {order.paymentMethod && (
                          <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                            <span>Pagamento</span>
                            <span className="font-semibold text-foreground">
                              {getPaymentMethodLabel(order.paymentMethod) ?? order.paymentMethod}
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Status atualizado automaticamente conforme o andamento do pedido.
                        </p>
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
