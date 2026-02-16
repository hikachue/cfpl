"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/client/components/ui";

type NavItem = {
  href: string;
  label: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const navSections: NavSection[] = [
    {
      title: "経営管理",
      items: [
        { href: "/", label: "ダッシュボード" },
        { href: "/projects", label: "案件分析" },
        { href: "/profit-analysis", label: "収支分析" },
      ],
    },
    {
      title: "データ管理",
      items: [
        { href: "/transactions", label: "取引明細" },
        { href: "/entry", label: "フォーム入力" },
      ],
    },
    {
      title: "マスタ",
      items: [
        { href: "/project-master", label: "案件マスタ" },
      ],
    },
  ];

  return (
    <aside className="bg-card p-4 flex flex-col h-full border-r">
      <div className="mb-6 px-2">
        <h1 className="font-bold text-lg text-primary">CFPLSys2_BASE</h1>
      </div>
      <nav className="flex flex-col gap-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1 px-2.5">
              {section.title}
            </h3>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block text-foreground no-underline px-2.5 py-2 rounded-lg transition-colors duration-200 text-sm ${isActive(item.href) ? "bg-secondary font-medium" : "hover:bg-secondary/50"
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
