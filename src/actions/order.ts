"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  verifyByReceiptUrl,
  verifyByTransactionNumber,
  type BankCode,
} from "@/lib/check-et";
import type { ActionResult } from "./products";


export type CheckoutResult =
  | { success: true; message: string }
  | { success: false; error: string };

async function requireUser() {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/");
  }
  return session.userId;
}

export async function placeOrder(input: {
  bank: "CBE" | "TELEBIRR";
  receiptInput: string;
  accountNumber?: string;
  expectedTotal: number;
}): Promise<CheckoutResult> {
  try {
    const userId = await requireUser();

    // 1. Fetch cart and recalculate total securely on the server
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Your cart is empty." };
    }

    const calculatedTotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    // Prevent client-side price tampering
    if (Math.abs(calculatedTotal - input.expectedTotal) > 0.01) {
      return { success: false, error: "Cart total mismatch. Please refresh and try again." };
    }

    // 2. Verify via Check.et API
    const isUrl =
      input.receiptInput.startsWith("http://") ||
      input.receiptInput.startsWith("https://");

    // Map Prisma enum to check-et BankCode (REMOVED TRAILING SPACES)
    const apiBankCode: BankCode = input.bank === "CBE" ? "cbe" : "telebirr"; // <-- FIXED


    const verifyResult = isUrl
      ? await verifyByReceiptUrl(input.receiptInput, input.accountNumber)
      : await verifyByTransactionNumber({
        bank: apiBankCode,
        transaction_number: input.receiptInput,
        account_number: input.accountNumber,
      });

    // 3. Validate Check.et response
    if (!verifyResult.success || !verifyResult.exists) {
      return { success: false, error: "Receipt not found or invalid. Please check your details." };
    }

    if (verifyResult.duplicate) {
      return { success: false, error: "This receipt has already been used for another order." };
    }

    // 3b. Reject duplicates against our own DB too — don't just trust
    // Check.et's `duplicate` flag, which only tracks what it has seen itself.
    // `reference` (the bank transaction number) is already @unique, so this
    // is a belt-and-suspenders check against the same column.
    const existingReceipt = await prisma.receipt.findUnique({
      where: { reference: verifyResult.data.transaction_number },
      select: { id: true },
    });
    if (existingReceipt) {
      return { success: false, error: "This receipt has already been used for another order." };
    }

    const receiverName = (verifyResult.data.receipt.receiver_name || "").toLowerCase();
    if (!receiverName.includes("amanuael hailegeorges argaw")) {
      // (was comparing a lowercased string against "Amanuael..." — always false)
      return { success: false, error: "Verification failed: Receiver name must be 'Amanuael Hailegeorges Argaw'." };
    }

    const paidAmount = Number(verifyResult.data.receipt.amount);
    if (Math.abs(paidAmount - calculatedTotal) > 0.01) {
      return { success: false, error: `Amount mismatch. Expected ${calculatedTotal} ETB, but receipt shows ${paidAmount} ETB.` };
    }

    // 4. Database Transaction: Create Receipt, Order, OrderItems, and Clear Cart
    try {
      await prisma.$transaction(async (tx) => {
        // Create Receipt record. `reference` is @unique, so this throws
        // (P2002) if two requests race past the check above with the same
        // receipt at the same time.
        const receipt = await tx.receipt.create({
          data: {
            reference: verifyResult.data.transaction_number,
            bank: input.bank,
            payerName: verifyResult.data.receipt.payer_name || "Unknown",
            amount: paidAmount,
            status: "VALID",
            rawResponse: verifyResult as any,
          },
        });

        // Create Order
        await tx.order.create({
          data: {
            userId,
            total: calculatedTotal,
            status: "VERIFIED",
            receiptId: receipt.id,
            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price, // Snapshot of price
              })),
            },
          },
        });

        // Clear the user's cart
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      });
    } catch (txError: any) {
      if (txError?.code === "P2002") {
        // Unique constraint hit on `reference` — someone else committed
        // the same receipt a moment before us.
        return { success: false, error: "This receipt has already been used for another order." };
      }
      throw txError;
    }

    revalidatePath("/cart");
    revalidatePath("/orders");

    return { success: true, message: "Order placed successfully!" };
  } catch (error) {
    console.error("Checkout error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}


export type OrderWithDetails = {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  receipt: {
    reference: string;
    bank: string;
    amount: number;
    status: string;
  } | null;
  items: {
    id: number;
    quantity: number;
    price: number;
    product: {
      id: number;
      name: string;
      images: { url: string }[];
    };
  }[];
};

export async function getOrders(): Promise<ActionResult<OrderWithDetails[]>> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      redirect("/");
    }
    const userId = session.userId;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        receipt: true,
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedOrders = orders.map((order) => ({
      ...order,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      receipt: order.receipt
        ? {
          ...order.receipt,
          amount: Number(order.receipt.amount),
        }
        : null,
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          images: item.product.images || [],
        },
      })),
    }));

    return { success: true, data: serializedOrders as OrderWithDetails[] };
  } catch (error) {
    console.error("getOrders error:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}


