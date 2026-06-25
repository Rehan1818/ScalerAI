"use client";

import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

export default function Modal({ open, title, onClose, children, footer, wide }: ModalProps) {
  if (!open) return null;

  return (
    <div className="aws-modal-overlay" onClick={onClose}>
      <div
        className={`aws-modal ${wide ? "max-w-2xl" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#eaeded] px-5 py-4">
          <h2 className="text-lg font-normal text-[#16191f]">{title}</h2>
          <button onClick={onClose} className="text-[#545b64] hover:text-[#16191f]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-[#eaeded] px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
