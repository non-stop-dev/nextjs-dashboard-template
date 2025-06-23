import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "next-themes";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return (
    <>
      {/* Set the lang attribute dynamically based on locale */}
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
              <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:p-6">
                {children}
              </div>
            </div>
            <footer className="bg-background border-t border-border text-foreground text-center p-4">
              © {new Date().getFullYear()} Built by Rawr-Labs for MediLeon. All rights reserved.
            </footer>
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
    </>
  );
}