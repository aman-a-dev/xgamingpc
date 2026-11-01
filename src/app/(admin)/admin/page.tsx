"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getUsers,
  getAdminOrders,
  getAdminReceipts,
  type AdminOrder,
  type AdminReceipt,
} from "@/actions/admin";
import { getAllProductsAdmin } from "@/actions/products";
import {
  Loader2,
  Users,
  Package,
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formattedPrice } from "@/lib/utils";

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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    receipts: 0,
    revenue: 0,
    pendingOrders: 0,
    verifiedOrders: 0,
    fulfilledOrders: 0,
    rejectedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<AdminReceipt[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersResult, productsResult, ordersResult, receiptsResult] =
          await Promise.all([
            getUsers(),
            getAllProductsAdmin(),
            getAdminOrders(),
            getAdminReceipts(),
          ]);

        const orders = ordersResult.success ? ordersResult.data : [];
        const receipts = receiptsResult.success ? receiptsResult.data : [];

        // Revenue = sum of orders that have been verified or fulfilled
        const revenue = orders
          .filter((o) => o.status === "VERIFIED" || o.status === "FULFILLED")
          .reduce((sum, o) => sum + Number(o.total), 0);

        setStats({
          users: usersResult.success ? usersResult.data.length : 0,
          products: productsResult.success ? productsResult.data.length : 0,
          orders: orders.length,
          receipts: receipts.length,
          revenue,
          pendingOrders: orders.filter(
            (o) => o.status === "PENDING_RECEIPT" || o.status === "VERIFYING"
          ).length,
          verifiedOrders: orders.filter((o) => o.status === "VERIFIED").length,
          fulfilledOrders: orders.filter((o) => o.status === "FULFILLED").length,
          rejectedOrders: orders.filter(
            (o) => o.status === "REJECTED" || o.status === "CANCELLED"
          ).length,
        });

        setRecentOrders(orders.slice(0, 5));
        setRecentReceipts(receipts.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your store activity
        </p>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formattedPrice(stats.revenue)}
          icon={DollarSign}
          accent="text-green-600"
        />
        <StatCard title="Total Orders" value={stats.orders.toLocaleString()} icon={ShoppingBag} />
        <StatCard title="Total Users" value={stats.users.toLocaleString()} icon={Users} />
        <StatCard title="Total Products" value={stats.products.toLocaleString()} icon={Package} />
      </div>

      {/* Order status breakdown */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Order Status
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending / Verifying"
            value={stats.pendingOrders.toLocaleString()}
            icon={Clock}
            accent="text-yellow-600"
          />
          <StatCard
            title="Verified"
            value={stats.verifiedOrders.toLocaleString()}
            icon={CheckCircle2}
            accent="text-green-600"
          />
          <StatCard
            title="Fulfilled"
            value={stats.fulfilledOrders.toLocaleString()}
            icon={CheckCircle2}
            accent="text-emerald-600"
          />
          <StatCard
            title="Rejected / Cancelled"
            value={stats.rejectedOrders.toLocaleString()}
            icon={XCircle}
            accent="text-red-600"
          />
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border bg-card shadow">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                    <TableCell className="font-medium">{order.user.name}</TableCell>
                    <TableCell>{formattedPrice(order.total)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Recent Receipts */}
        <div className="rounded-xl border bg-card shadow">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-semibold">Recent Receipts</h2>
            <Link href="/admin/receipts" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    No receipts yet
                  </TableCell>
                </TableRow>
              ) : (
                recentReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell
                      className="max-w-[140px] truncate font-mono text-xs"
                      title={receipt.reference}
                    >
                      {receipt.reference}
                    </TableCell>
                    <TableCell>{receipt.payerName || "Unknown"}</TableCell>
                    <TableCell>{formattedPrice(receipt.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {receipt.status.toLowerCase().replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: string;
}

function StatCard({ title, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {Icon && <Icon className={`size-4 ${accent ?? "text-muted-foreground"}`} />}
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}