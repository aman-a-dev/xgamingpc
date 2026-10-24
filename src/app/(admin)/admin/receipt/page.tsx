"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getAdminReceipts, type AdminReceipt } from "@/actions/admin";
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

function getReceiptStatusBadge(status: string) {
  switch (status) {
    case "VALID":
      return <Badge className="bg-green-600 hover:bg-green-700">Valid</Badge>;
    case "INVALID":
      return <Badge variant="destructive">Invalid</Badge>;
    case "ALREADY_USED":
      return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">Already Used</Badge>;
    case "FAILED":
      return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>;
    case "PENDING":
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}

function ReceiptsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("search") || "";
  const [receipts, setReceipts] = useState<AdminReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRaw, setSelectedRaw] = useState<any>(null);

  const fetchReceipts = async (searchQuery?: string) => {
    setLoading(true);
    const result = await getAdminReceipts(searchQuery);
    if (result.success) {
      setReceipts(result.data);
    } else {
      toast.add({ type: "error", title: "Error", description: result.error });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReceipts(query);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference or payer name..."
            className="pl-9"
            defaultValue={query}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchReceipts((e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Payer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="mx-auto size-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : receipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No receipts found.
                </TableCell>
              </TableRow>
            ) : (
              receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-mono text-xs">#{receipt.id}</TableCell>
                  <TableCell className="font-medium max-w-[150px] truncate" title={receipt.reference}>
                    {receipt.reference}
                  </TableCell>
                  <TableCell>{receipt.bank}</TableCell>
                  <TableCell>{receipt.payerName || "Unknown"}</TableCell>
                  <TableCell className="font-medium">{formattedPrice(receipt.amount)}</TableCell>
                  <TableCell>{getReceiptStatusBadge(receipt.status)}</TableCell>
                  <TableCell>
                    {receipt.order ? (
                      <span className="text-xs font-mono">#{receipt.order.id}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unlinked</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setSelectedRaw(receipt.rawResponse)}
                      disabled={!receipt.rawResponse}
                      title="View Raw API Response"
                    >
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedRaw} onOpenChange={(open) => !open && setSelectedRaw(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Raw API Response</DialogTitle>
            <DialogDescription>
              Full JSON payload returned from the Check.et verification API.
            </DialogDescription>
          </DialogHeader>
          <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap font-mono border">
            {JSON.stringify(selectedRaw, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminReceiptsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-60">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ReceiptsContent />
    </Suspense>
  );
}