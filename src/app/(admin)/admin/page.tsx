"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getUsers,
  getAdminOrders,
  getAdminReceipts,
} from "@/actions/admin";
import { getAllProductsAdmin } from "@/actions/products";
import { getAllCarts } from "@/actions/cart";
import {
  Loader2,
  Users,
  Package,
  ShoppingBag,
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Receipt,
} from "lucide-react";
import { formattedPrice } from "@/lib/utils";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    carts: 0,
    orders: 0,
    receipts: 0,
    revenue: 0,
    pendingOrders: 0,
    verifiedOrders: 0,
    fulfilledOrders: 0,
    rejectedOrders: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          usersResult,
          productsResult,
          cartsResult,
          ordersResult,
          receiptsResult,
        ] = await Promise.all([
          getUsers(),
          getAllProductsAdmin(),
          getAllCarts(),
          getAdminOrders(),
          getAdminReceipts(),
        ]);

        const orders = ordersResult.success ? ordersResult.data : [];
        const receipts = receiptsResult.success ? receiptsResult.data : [];

        // Revenue = sum of orders that are VERIFIED or FULFILLED
        const revenue = orders
          .filter((o) => o.status === "VERIFIED" || o.status === "FULFILLED")
          .reduce((sum, o) => sum + Number(o.total), 0);

        setStats({
          users: usersResult.success ? usersResult.data.length : 0,
          products: productsResult.success ? productsResult.data.length : 0,
          carts: cartsResult.success ? cartsResult.data.length : 0,
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
          href="/admin/orders"
        />
        <StatCard
          title="Total Orders"
          value={stats.orders.toLocaleString()}
          icon={ShoppingBag}
          href="/admin/orders"
        />
        <StatCard
          title="Total Users"
          value={stats.users.toLocaleString()}
          icon={Users}
          href="/admin/users"
        />
        <StatCard
          title="Total Products"
          value={stats.products.toLocaleString()}
          icon={Package}
          href="/admin/products"
        />
        <StatCard
          title="Total Receipts"
          value={stats.receipts.toLocaleString()}
          icon={Receipt}
          href="/admin/receipt"
        />
        <StatCard
          title="Total Carts"
          value={stats.carts.toLocaleString()}
          icon={ShoppingCart}
          href="/admin/cart"
        />
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
            href="/admin/orders"
          />
          <StatCard
            title="Verified"
            value={stats.verifiedOrders.toLocaleString()}
            icon={CheckCircle2}
            accent="text-green-600"
            href="/admin/orders"
          />
          <StatCard
            title="Fulfilled"
            value={stats.fulfilledOrders.toLocaleString()}
            icon={CheckCircle2}
            accent="text-emerald-600"
            href="/admin/orders"
          />
          <StatCard
            title="Rejected / Cancelled"
            value={stats.rejectedOrders.toLocaleString()}
            icon={XCircle}
            accent="text-red-600"
            href="/admin/orders"
          />
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
  href: string;
}

function StatCard({ title, value, icon: Icon, accent, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-xl border bg-card text-card-foreground shadow p-6 transition-colors hover:border-primary hover:bg-accent/40"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
          {title}
        </h3>
        {Icon && (
          <Icon
            className={`size-4 ${accent ?? "text-muted-foreground"}`}
          />
        )}
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent ?? ""}`}>{value}</p>
    </Link>
  );
}