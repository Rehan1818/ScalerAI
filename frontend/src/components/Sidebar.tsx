"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Globe,
  LayoutDashboard,
  Network,
  Route,
  Shield,
  UserCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hosted-zones", label: "Hosted zones", icon: Globe },
  { href: "/health-checks", label: "Health checks", icon: Activity },
  { href: "/traffic-policies", label: "Traffic policies", icon: Route },
  { href: "/resolver", label: "Resolver", icon: Network },
  { href: "/profiles", label: "Profiles", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-[#232f3e] text-white min-h-screen">
      <div className="border-b border-[#3b4752] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#ff9900] text-sm font-bold text-[#232f3e]">
            R53
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Route 53</p>
            <p className="text-[10px] text-[#aab7b8]">DNS management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2 text-sm transition ${
                active
                  ? "border-l-4 border-[#ff9900] bg-[#1a242f] text-white"
                  : "border-l-4 border-transparent text-[#d5dbdb] hover:bg-[#1a242f] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#3b4752] p-4">
        <div className="mb-3 flex items-center gap-2 text-xs text-[#aab7b8]">
          <UserCircle className="h-4 w-4" />
          <div>
            <p className="text-white">{user?.display_name || user?.username}</p>
            <p>Account: {user?.account_id}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full rounded border border-[#545b64] px-3 py-1.5 text-xs text-[#d5dbdb] hover:bg-[#1a242f] hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
