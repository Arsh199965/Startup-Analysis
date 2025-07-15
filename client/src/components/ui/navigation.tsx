"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Settings, BarChart3, Building2 } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Submit Startup", icon: Home },
    { href: "/analysis", label: "Analysis", icon: BarChart3 },
    { href: "/admin", label: "Admin Dashboard", icon: Settings },
  ];

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/10 backdrop-blur-xl rounded-full px-6 py-3 border border-white/20">
      <div className="flex items-center space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2
                  ${
                    isActive
                      ? "bg-white text-blue-600 shadow-lg"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-full -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
