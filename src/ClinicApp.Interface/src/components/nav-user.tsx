"use client"

import { useState, useEffect } from "react" 

import {
  Bell,
  BellDot,
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const [newUserNotif, setNewUserNotif] = useState(false)

  //   // Nuevo: useEffect para simular notificaciones (opcional, para pruebas)
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setNewUserNotif((prev) => !prev); // Alterna notificaciones cada 4s
  //   }, 20000);
  //   return () => clearInterval(timer);
  // }, []);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {/* Modificado: Reemplazamos SidebarMenuButton por un div con estilos similares */}
        <div
          className="flex w-full items-center gap-2 p-2 rounded-lg"
        >
          <Avatar className="h-10 w-10 rounded-lg grayscale">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg">CN</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {user.email}
            </span>
          </div>
          {/* Modificado: Contenedor para íconos, ajustado para alineación horizontal */}
          <div className="ml-auto flex items-center gap-1">
            {/* Nuevo: Botón para Notifications con condicional Bell/BellDot */}
            <SidebarMenuButton
              size="default"
              className="h-8 w-8 cursor-pointer hover:bg-transparent hover:shadow-none justify-center active:scale-95 transition-transform"
              tooltip="Notifications"
            >
              {newUserNotif ? (
                <BellDot
                className="
                  size-4 
                  animate-[shake_ease-in-out_infinite]
                " // Modificado: Usamos infinite, ajustamos a 3s ciclo completo (1s animación + 2s espera)
                style={{ animationDuration: '3s', animationIterationCount: newUserNotif ? 'infinite' : 0 }}
              />
              ) : (
                <Bell className="size-4" fill="transparent" />

              )}
            </SidebarMenuButton>
            {/* Nuevo: Botón para Log out */}
            <SidebarMenuButton
              size="default"
              className="h-8 w-8 cursor-pointer hover:bg-accent justify-center active:scale-95 transition-transform"
              tooltip="Log out"
            >
              <LogOut className="size-4" />
            </SidebarMenuButton>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// Nuevo: Definición de la animación de sacudida con @keyframes
const styles = `
  @keyframes shake {
    0% { transform: rotate(0deg); }
    10% { transform: rotate(10deg); }
    20% { transform: rotate(-10deg); }
    30% { transform: rotate(10deg); }
    40% { transform: rotate(-10deg); }
    50% { transform: rotate(0deg); }
    100% { transform: rotate(0deg); }
  }
`;

// Inyectar estilos en el DOM
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}