"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="aws-breadcrumb">
      <Link href="/hosted-zones">Route 53</Link>
      {items.map((item, i) => (
        <span key={i}>
          {" "}
          /{" "}
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
