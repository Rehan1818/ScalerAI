"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle, Info, X, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const value = useMemo(() => ({ showToast }), [showToast]);

  const icon = (type: ToastType) => {
    if (type === "success") return <CheckCircle className="h-5 w-5 text-[#1d8102]" />;
    if (type === "error") return <XCircle className="h-5 w-5 text-[#d13212]" />;
    return <Info className="h-5 w-5 text-[#0073bb]" />;
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="aws-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`aws-toast aws-toast-${t.type}`}>
            {icon(t.type)}
            <p className="flex-1 text-sm text-[#16191f]">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-[#545b64] hover:text-[#16191f]">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
