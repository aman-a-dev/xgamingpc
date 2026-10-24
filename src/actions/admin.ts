"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";

import prisma from "@/lib/prisma";
import type { ProductModel as Product } from "@/generated/prisma/models/Product";
import type { UserModel as User } from "@/generated/prisma/models/User";
import type { Prisma, $Enums } from "@/generated/prisma/client";
import type { ActionResult } from "./products";
import {
  createProductSchema,
  updateProductSchema,
  createUserSchema,
  updateUserSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/schemas";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`)
    .join("; ");
}

// ---------- PRODUCT: CREATE ----------
export async function createProduct(
  input: CreateProductInput,
): Promise<ActionResult<Product>> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const data = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        status: data.status,
        images: data.images?.length
          ? { createMany: { data: data.images } }
          : undefined,
      },
      include: { images: true },
    });

    revalidatePath("/");
    return { success: true, data: product };
  } catch (error) {
    console.error("createProduct error:", error);
    return { success: false, error: "Failed to create product" };
  }
}

// ---------- PRODUCT: UPDATE (with image sync) ----------
export async function updateProduct(
  id: number,
  input: UpdateProductInput,
): Promise<ActionResult<Product>> {
  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  const { images, ...rest } = parsed.data;

  try {
    // Fetch existing product with its images
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!existing) {
      return { success: false, error: "Product not found" };
    }

    // If images array is provided, sync the image list
    if (images !== undefined) {
      const newUrls = images.map((img) => img.url);
      const existingUrls = existing.images.map((img) => img.url);

      // URLs to remove: present in DB but not in the new list
      const toDelete = existingUrls.filter((url) => !newUrls.includes(url));
      // URLs to add: present in new list but not in DB
      const toAdd = images.filter((img) => !existingUrls.includes(img.url));

      // Delete from blob storage (best effort – log errors but continue)
      if (toDelete.length > 0) {
        await Promise.all(toDelete.map((url) => del(url))).catch((err) =>
          console.error("Failed to delete some images from blob:", err),
        );
        // Delete records from DB
        await prisma.image.deleteMany({
          where: { productId: id, url: { in: toDelete } },
        });
      }

      // Add new image records
      if (toAdd.length > 0) {
        await prisma.image.createMany({
          data: toAdd.map((img) => ({
            url: img.url,
            isCover: img.isCover || false,
            productId: id,
          })),
        });
      }
    }

    // Update the rest of the product fields
    const product = await prisma.product.update({
      where: { id },
      data: rest,
      include: { images: true },
    });

    revalidatePath("/");
    revalidatePath(`/${id}`);
    revalidatePath("/admin/products");
    return { success: true, data: product };
  } catch (error) {
    console.error("updateProduct error:", error);
    return { success: false, error: "Failed to update product" };
  }
}

// ---------- PRODUCT: DELETE ----------
export async function deleteProduct(
  id: number,
): Promise<ActionResult<{ id: number }>> {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/");
    return { success: true, data: { id } };
  } catch (error) {
    console.error("deleteProduct error:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

// ---------- USER: CREATE ----------
export async function createUser(
  input: CreateUserInput,
): Promise<ActionResult<User>> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  try {
    const user = await prisma.user.create({ data: parsed.data });
    revalidatePath("/admin/users");
    return { success: true, data: user };
  } catch (error) {
    console.error("createUser error:", error);
    return { success: false, error: "Failed to create user" };
  }
}

// ---------- USER: UPDATE ----------
export async function updateUser(
  id: number,
  input: UpdateUserInput,
): Promise<ActionResult<User>> {
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath("/admin/users");
    return { success: true, data: user };
  } catch (error) {
    console.error("updateUser error:", error);
    return { success: false, error: "Failed to update user" };
  }
}

// ---------- USER: DELETE ----------
export async function deleteUser(
  id: number,
): Promise<ActionResult<{ id: number }>> {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/users");
    return { success: true, data: { id } };
  } catch (error) {
    console.error("deleteUser error:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

// ---------- USER: Get ----------
export async function getUsers(query?: string): Promise<ActionResult<User[]>> {
  try {
    let whereClause: Prisma.UserWhereInput = {};
    if (query) {
      const isNumeric = !isNaN(Number(query));
      whereClause = {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { telegramId: { contains: query, mode: "insensitive" } },
          ...(isNumeric ? [{ id: Number(query) }] : []),
        ],
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: users };
  } catch (error) {
    console.error("getUsers error:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}


// ---------------------
// ... (after your existing user actions)

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }
  return session.userId;
}

// ─── ADMIN ORDER TYPES & ACTIONS ───────────────────────────────
// ...
// ─── ADMIN ORDER TYPES & ACTIONS ───────────────────────────────

export type AdminOrder = {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  user: { id: number; name: string; telegramId: string | null };
  receipt: {
    id: number;
    reference: string;
    bank: string;
    amount: number;
    status: string;
    payerName: string | null;
  } | null;
  items: {
    id: number;
    quantity: number;
    price: number;
    product: { name: string };
  }[];
};

export async function getAdminOrders(query?: string): Promise<ActionResult<AdminOrder[]>> {
  try {
    await requireAdmin();
    const whereClause: any = {};
    if (query) {
      const isNumeric = !isNaN(Number(query));
      whereClause.OR = [
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { telegramId: { contains: query, mode: "insensitive" } } },
        ...(isNumeric ? [{ id: Number(query) }] : []),
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, telegramId: true } },
        receipt: { select: { id: true, reference: true, bank: true, amount: true, status: true, payerName: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = orders.map((order) => ({
      ...order,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      receipt: order.receipt ? { ...order.receipt, amount: Number(order.receipt.amount) } : null,
      items: order.items.map((item) => ({ ...item, price: Number(item.price) })),
    }));

    return { success: true, data: serialized as AdminOrder[] };
  } catch (error) {
    console.error("getAdminOrders error:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

export async function updateOrderStatus(
  orderId: number,
  status: $Enums.OrderStatus // <-- CHANGED from 'string'
): Promise<ActionResult<boolean>> {
  try {
    await requireAdmin();
    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
    revalidatePath("/admin/orders");
    return { success: true, data: true };
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

// ─── ADMIN RECEIPT TYPES & ACTIONS ─────────────────────────────

export type AdminReceipt = {
  id: number;
  reference: string;
  bank: string;
  payerName: string | null;
  amount: number;
  status: string;
  createdAt: string;
  order: { id: number; total: number; status: string } | null;
  rawResponse: any;
};

export async function getAdminReceipts(query?: string): Promise<ActionResult<AdminReceipt[]>> {
  try {
    await requireAdmin();
    const whereClause: any = {};
    if (query) {
      whereClause.OR = [
        { reference: { contains: query, mode: "insensitive" } },
        { payerName: { contains: query, mode: "insensitive" } },
      ];
    }

    const receipts = await prisma.receipt.findMany({
      where: whereClause,
      include: {
        order: { select: { id: true, total: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = receipts.map((r) => ({
      ...r,
      amount: Number(r.amount),
      createdAt: r.createdAt.toISOString(),
      order: r.order ? { ...r.order, total: Number(r.order.total) } : null,
    }));

    return { success: true, data: serialized as AdminReceipt[] };
  } catch (error) {
    console.error("getAdminReceipts error:", error);
    return { success: false, error: "Failed to fetch receipts" };
  }
}