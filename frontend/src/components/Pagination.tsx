"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pages, total, onPageChange }: PaginationProps) {
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-[#eaeded] px-4 py-3 text-sm text-[#545b64]">
      <span>
        Page {page} of {pages} ({total} total)
      </span>
      <div className="flex gap-1">
        <button
          className="aws-btn-secondary !px-2 !py-1 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          className="aws-btn-secondary !px-2 !py-1 disabled:opacity-40"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
