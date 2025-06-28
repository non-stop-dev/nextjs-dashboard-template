// app/[locale]/layout.tsx
// Este layout se encarga de:
// 1. Verificar la autenticación del usuario.
// 2. Redireccionar si el usuario no está autenticado (punto de seguridad primario para UI).
// 3. Renderizar el layout de la aplicación (sidebar, header, footer) SOLO si el usuario está autenticado.
// 4. Manejo del locale.

import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal'; // Importa tu función de verificación de sesión del DAL
import { SessionProvider } from '@/components/auth/session-provider'; // Componente necesario para `useSession` en Client Components
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "next-themes";
import React from 'react'; // Importar React si no está implícito

// --- Configuración de Internacionalización (i18n) ---
const locales = ['es', 'en']; // Idiomas soportados por tu aplicación

export default async function AppProtectedLocaleLayout({ // O el nombre que le hayas dado
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string } | Promise<{ locale: string }>; // Permite ambos tipos para mayor robustez
}) {
  // Await params si es una Promesa. Si no lo es, se resuelve inmediatamente.
  const resolvedParams = await params; 
  const { locale } = resolvedParams;
  
  console.log(`RENDER: app/[locale]/(app)/layout.tsx (Main App Layout) for locale: ${locale}`); 

  // 1. Validación del Locale de la URL
  if (!locales.includes(locale)) {
    console.log(`REDIRECT: app/[locale]/layout.tsx - Invalid locale: ${locale}. Redirecting to /es`); // <--- LOG AÑADIDO
    redirect('/es'); // Puedes ajustar esto a tu lógica de fallback o error 404
  }

  // --- 2. Lógica de Autenticación y Autorización (Servidor) ---
  // Esta es la comprobación CRÍTICA para proteger toda la UI de tu aplicación.
  // La función `verifySession` redirigirá automáticamente a la página de login
  // si el usuario no está autenticado o la sesión es inválida.
  // Si esta función lanza un redirect, el resto de este componente NO se ejecutará.
  console.log('CALL: verifySession from app/[locale]/layout.tsx'); // <--- LOG AÑADIDO
  const { isAuth, userId } = await verifySession(); //

  // Si llegamos aquí, significa que `verifySession()` ha validado exitosamente la sesión
  // y el usuario está autenticado. Ahora podemos renderizar el layout completo de la aplicación.
  console.log(`AUTH_STATUS: User isAuth: ${isAuth}, userId: ${userId} in app/[locale]/layout.tsx`); // <--- LOG AÑADIDO
  return (
    // 3. Proporcionar la sesión a los componentes cliente
    // SessionProvider debe envolver todo lo que necesite acceder a la sesión vía `useSession`
    <SessionProvider>
      {/* Set the lang attribute dynamically based on locale for SEO and accessibility */}
      {/* Ya no es necesario usar <script dangerouslySetInnerHTML> si Next.js lo maneja.
          Si tu RootLayout ya tiene <html lang="en">, considera mover esta lógica allí
          o asegurarte de que `lang` se establezca en el servidor.
          Para componentes de servidor, puedes pasar el 'lang' al <html> del RootLayout.
          Si aún quieres forzarlo aquí, esta es una forma, pero revisa si es la más idiomática en tu setup.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang = "${locale}";`,
        }}
      />
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              {/* Main content container */}
              <div className="flex flex-1 flex-col gap-2 p-4 md:p-6"> {/* @container/main eliminado para simplificar log */}
                {children} {/* Aquí se renderizarán las páginas de tu aplicación */}
              </div>
            </div>
            <footer className="bg-background border-t border-border text-foreground text-center p-4">
              © {new Date().getFullYear()} Built by Rawr-Labs for MediLeon. All rights reserved.
            </footer>
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}