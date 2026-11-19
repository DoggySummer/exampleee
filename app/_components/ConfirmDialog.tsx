"use client";

import { Button } from "./Button";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 되돌릴 수 없는 작업이나 덮어쓰기 전에 묻는 창 */
export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel = "취소", pending, onConfirm, onCancel }: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title} variant="dialog">
      <p className="text-muted">{message}</p>
      <div className="mt-5 flex gap-2">
        <Button variant="ghost" size="md" onClick={onCancel} className="flex-1">
          {cancelLabel}
        </Button>
        <Button size="md" onClick={onConfirm} disabled={pending} className="flex-[1.6]">
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
