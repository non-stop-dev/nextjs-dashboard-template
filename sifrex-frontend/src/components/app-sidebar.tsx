"use client";

import * as React from "react";
import {
  ArrowRightLeft,
  BarChart2,
  Calendar,
  ClipboardPlus,
  FileText,
  HandCoins,
  Home,
  ListChecks,
  Receipt,
  Stethoscope,
  UserSearch,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavDocuments } from "@/components/nav-documents";
import { NavFinance } from "@/components/nav-finance";
import { NavUser } from "@/components/nav-user";
import { NavSidebarFooter } from "@/components/nav-sidebar-footer"; // Nuevo: Importamos el nuevo componente
import { TeamSwitcher } from "@/components/team-switcher";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

// Datos de ejemplo para la navegación
const data = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Tasks", url: "/tasks-reminders", icon: ListChecks },
    { title: "Appointments", url: "/appointments", icon: Calendar },
    { title: "Consultations", url: "/consultations", icon: Stethoscope },
    { title: "Patients", url: "/patients", icon: UserSearch },
    { title: "Clinical History", url: "/clinical-history", icon: ClipboardPlus },
    { title: "Billing", url: "/billing-invoice", icon: Receipt },
    { title: "Referrals", url: "/referrals", icon: ArrowRightLeft },
  ],
  navDocuments: [
    { name: "Documents", url: "/documents", icon: FileText },
  ],
  navFinance: [
    { title: "Analytics", url: "/reports-analytics", icon: BarChart2 },
    { title: "Accountant", url: "/accountant", icon: HandCoins },
  ],
  user: {
    name: "shadcn",
    email: "leo@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.navDocuments} />
        <NavFinance items={data.navFinance} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
        <Separator className="my-2" />
        <NavSidebarFooter /> {/* Nuevo: Reemplazamos el bloque SidebarMenu por NavSidebarFooter */}
      </SidebarFooter>
    </Sidebar>
  );
}