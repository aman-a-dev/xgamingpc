"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { placeOrder } from "@/actions/order";
import { formattedPrice } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/toast";

interface CheckoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
}

export function CheckoutDialog({ isOpen, onOpenChange, totalAmount }: CheckoutDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [bank, setBank] = useState<"CBE" | "TELEBIRR">("TELEBIRR");
  const [receiptInput, setReceiptInput] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!receiptInput.trim()) {
      setError("Please enter a receipt URL or transaction number.");
      return;
    }

    if (bank === "CBE" && !accountNumber.trim()) {
      setError("Account number is required for CBE payments.");
      return;
    }

    startTransition(async () => {
      const result = await placeOrder({
        bank,
        receiptInput: receiptInput.trim(),
        accountNumber: bank === "CBE" ? accountNumber.trim() : undefined,
        expectedTotal: totalAmount,
      });

      if (result.success) {
        toast.add({
          title: "Order Placed!",
          description: result.message,
          type: "success",
        });
        onOpenChange(false);
        router.push("/orders");
        router.refresh();
      } else {
        setError(result.error);
        toast.add({
          title: "Checkout Failed",
          description: result.error,
          type: "error",
        });
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!isPending) {
      onOpenChange(open);
      if (!open) {
        setError(null);
        setReceiptInput("");
        setAccountNumber("");
        setBank("TELEBIRR");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Order</DialogTitle>
          <DialogDescription>
            Verify your payment to finalize your purchase.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Amount to Pay</p>
            <p className="text-3xl font-bold text-primary">{formattedPrice(totalAmount)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank">Payment Bank</Label>

            {/* FIXED: Added null to type and added a guard clause */}
            <Select value={bank} onValueChange={(v: "CBE" | "TELEBIRR" | null) => { if (v) setBank(v); }}>
              <SelectTrigger id="bank">
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TELEBIRR">Telebirr</SelectItem>
                <SelectItem value="CBE">CBE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {bank === "CBE" && (
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Your CBE Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="e.g., 1000123456789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                disabled={isPending}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="receipt">Receipt URL or Transaction Number</Label>
            <Input
              id="receipt"
              placeholder="https://... or 123456789"
              value={receiptInput}
              onChange={(e) => setReceiptInput(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Paste the share link from your banking app or enter the transaction reference number.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="min-w-[120px]">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Place Order
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


interface CheckoutWrapperProps {
  totalAmount: number;
}

export function CheckoutWrapper({ totalAmount }: CheckoutWrapperProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="w-full sm:w-auto"
        onClick={() => setIsCheckoutOpen(true)}
      >
        Check Out
      </Button>

      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        totalAmount={totalAmount}
      />
    </>
  );
}