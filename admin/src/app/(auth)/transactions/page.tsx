import { Suspense } from "react";
import { TransactionsClient } from "@/client/components/transactions/TransactionsClient";

export default async function TransactionsPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <TransactionsClient />
    </Suspense>
  );
}
