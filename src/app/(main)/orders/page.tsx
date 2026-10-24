import { Suspense } from "react";
import Link from "next/link";
import { Package, AlertCircle, CreditCard, Hash } from "lucide-react";
import { getOrders, type OrderWithDetails } from "@/actions/order";
import { formattedPrice } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
  ItemSeparator,
} from "@/components/ui/item";

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING_RECEIPT":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          Pending Receipt
        </Badge>
      );
    case "VERIFYING":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
          Verifying
        </Badge>
      );
    case "VERIFIED":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          Verified
        </Badge>
      );
    case "FULFILLED":
      return <Badge className="bg-green-600 hover:bg-green-700">Fulfilled</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    case "CANCELLED":
      return <Badge variant="secondary">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status.replace("_", " ")}</Badge>;
  }
}

async function OrdersContent() {
  const result = await getOrders();

  if (!result.success) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Failed to load orders</EmptyTitle>
          <EmptyDescription>{result.error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const orders = result.data;

  if (orders.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Package className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>No orders yet</EmptyTitle>
          <EmptyDescription>
            You haven't placed any orders yet. Start shopping to see your orders here!
          </EmptyDescription>
        </EmptyHeader>
        <div className="flex justify-center mt-4">
          <Link href="/" className={buttonVariants()}>
            Browse Products
          </Link>
        </div>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order: OrderWithDetails) => (
        <Card key={order.id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Order #{order.id}
              </CardTitle>
              <CardDescription>
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </CardDescription>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-bold">{formattedPrice(order.total)}</div>
              <div className="mt-1">{getStatusBadge(order.status)}</div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ItemGroup className="px-4 pb-4">
              {order.items.map((item: OrderWithDetails["items"][number], index: number) => (
                <div key={item.id}>
                  {index > 0 && <ItemSeparator className="my-0" />}
                  <Item variant="outline" size="sm" className="border-transparent hover:bg-muted/50 px-0 py-3">
                    <ItemMedia variant="image">
                      {item.product.images?.[0]?.url ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          className="h-12 w-12 rounded-md object-cover border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="text-base">{item.product.name}</ItemTitle>
                      <ItemDescription>
                        Qty: {item.quantity} × {formattedPrice(item.price)}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions className="font-semibold text-sm">
                      {formattedPrice(item.price * item.quantity)}
                    </ItemActions>
                  </Item>
                </div>
              ))}
            </ItemGroup>
          </CardContent>

          {order.receipt && (
            <CardFooter className="bg-muted/30 text-sm text-muted-foreground border-t flex flex-col sm:flex-row justify-between gap-3 py-3 px-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>
                  Paid via <span className="font-medium text-foreground">{order.receipt.bank}</span>
                </span>
              </div>
              <div className="flex flex-col sm:items-end gap-1">
                <span>Ref: <span className="font-mono font-medium text-foreground">{order.receipt.reference}</span></span>
                <span className="text-xs">Status: <span className="font-medium text-foreground">{order.receipt.status}</span></span>
              </div>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-7 w-24 ml-auto" />
              <Skeleton className="h-6 w-20 ml-auto" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-md shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-16 shrink-0" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Skeleton className="h-4 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default async function OrdersPage() {
  return (
    <div className="container mx-auto py-8 max-w-3xl px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">My Orders</h1>
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContent />
      </Suspense>
    </div>
  );
}

export const dynamic = "force-dynamic";

