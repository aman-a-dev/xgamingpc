"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAdminOrders, updateOrderStatus, type AdminOrder } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Loader2, Eye, Search } from "lucide-react";
import { formattedPrice } from "@/lib/utils";

// Define the exact union type for Order Status to satisfy TS and Server Action
type OrderStatusType =
  | "PENDING_RECEIPT"
  | "VERIFYING"
  | "VERIFIED"
  | "REJECTED"
  | "FULFILLED"
  | "CANCELLED";

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING_RECEIPT":
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending Receipt</Badge>;
    case "VERIFYING":
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Verifying</Badge>;
    case "VERIFIED":
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Verified</Badge>;
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

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("search") || "";

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<AdminOrder["receipt"] | null>(null);
  const [searchInput, setSearchInput] = useState(query);

  const fetchOrders = async (searchQuery?: string) => {
    setLoading(true);
    const result = await getAdminOrders(searchQuery);
    if (result.success) {
      setOrders(result.data);
    } else {
      toast.add({ type: "error", title: "Error", description: result.error });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (searchInput) {
      params.set("search", searchInput);
    } else {
      params.delete("search");
    }
    router.push(`?${params.toString()}`);
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    // Cast to the exact union type expected by the server action to prevent TS errors
    const validStatus = newStatus as OrderStatusType;

    const result = await updateOrderStatus(orderId, validStatus);
    if (result.success) {
      toast.add({ type: "success", title: "Success", description: "Order status updated" });
      fetchOrders(query);
    } else {
      toast.add({ type: "error", title: "Error", description: result.error });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <form onSubmit={handleSearch} className="relative w-full sm:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, telegram ID, or ID..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" size="icon" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="mx-auto size-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{order.user.name}</div>
                    {order.user.telegramId && (
                      <div className="text-xs text-muted-foreground">{order.user.telegramId}</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{formattedPrice(order.total)}</TableCell>
                  <TableCell>
                    {order.receipt ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono truncate max-w-[100px]">{order.receipt.reference}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 shrink-0"
                          onClick={() => setSelectedReceipt(order.receipt)}
                        >
                          <Eye className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={order.status}
                      onValueChange={(value) => {
                        // Base UI Select can pass null, so we guard against it
                        if (value) {
                          handleStatusChange(order.id, value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING_RECEIPT">Pending Receipt</SelectItem>
                        <SelectItem value="VERIFYING">Verifying</SelectItem>
                        <SelectItem value="VERIFIED">Verified</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>
              Verification details for reference: {selectedReceipt?.reference}
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Bank</div>
                <div className="text-base font-medium">{selectedReceipt.bank}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Amount</div>
                <div className="text-base font-bold text-primary">{formattedPrice(selectedReceipt.amount)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Payer Name</div>
                <div className="text-base">{selectedReceipt.payerName || "Unknown"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Verification Status</div>
                <div className="text-base">{selectedReceipt.status}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-60">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}