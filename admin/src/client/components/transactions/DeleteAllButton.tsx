"use client";

import { useState } from "react";
import { deleteAllTransactionsAction } from "@/server/contexts/data-import/presentation/actions/delete-all-transactions";
import { Button } from "@/client/components/ui";

interface DeleteAllButtonProps {
  disabled?: boolean;
  onDeleted?: () => void;
}

export function DeleteAllButton({
  disabled = false,
  onDeleted,
}: DeleteAllButtonProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAll = async () => {
    const message = "すべてのトランザクションを削除してもよろしいですか？この操作は取り消せません。";

    if (!window.confirm(message)) {
      return;
    }

    try {
      setDeleting(true);
      const result = await deleteAllTransactionsAction();

      if (result.success) {
        alert(`${result.deletedCount}件のトランザクションを削除しました。`);
        onDeleted?.();
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (err) {
      alert(`エラー: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={handleDeleteAll}
      disabled={deleting || disabled}
    >
      {deleting ? "削除中..." : "全ての取引を削除"}
    </Button>
  );
}
