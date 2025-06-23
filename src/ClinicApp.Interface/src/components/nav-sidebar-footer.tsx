"use client"

import * as React from "react"
import { Moon, Sun, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter, usePathname } from "next/navigation"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Component for sidebar footer with theme, language and settings buttons
export function NavSidebarFooter() {
  const [mounted, setMounted] = React.useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  // Get current locale from pathname
  const getCurrentLocale = () => {
    if (pathname.startsWith('/en/') || pathname === '/en') return 'EN'
    return 'ES' // Default to Spanish
  }
  
  const currentLocale = getCurrentLocale()

  // Handle theme hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Handle language switching with NextJS i18n routing
  const handleLanguageSwitch = () => {
    const newLocale = currentLocale === 'ES' ? 'en' : 'es'
    
    // Get the path without locale prefix
    let pathWithoutLocale = pathname
    if (pathname.startsWith('/en/')) {
      pathWithoutLocale = pathname.slice(3) // Remove '/en'
    } else if (pathname.startsWith('/es/')) {
      pathWithoutLocale = pathname.slice(3) // Remove '/es'
    } else if (pathname === '/en' || pathname === '/es') {
      pathWithoutLocale = '' // Root page
    }
    
    // Create new path with new locale
    const newPath = `/${newLocale}${pathWithoutLocale}`
    
    router.push(newPath)
  }

  // Prevent hydration mismatch for theme
  if (!mounted) {
    return (
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center gap-4">
          <SidebarMenuButton size="default" className="justify-center">
            <Moon />
          </SidebarMenuButton>
          <SidebarMenuButton size="sm" className="px-2 justify-center">
            <span className="font-medium">ES</span>
          </SidebarMenuButton>
          <SidebarMenuButton size="default" className="justify-center">
            <Settings />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center gap-4">
          {/* Theme toggle button */}
          <SidebarMenuButton
            tooltip={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            size="default"
            className="justify-center"
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </SidebarMenuButton>
          
          {/* Language toggle button */}
          <SidebarMenuButton
            tooltip={currentLocale === "ES" ? "Switch to English" : "Cambiar a Español"}
            onClick={handleLanguageSwitch}
            size="sm"
            className="px-2 justify-center"
          >
            <span className="font-medium flex justify-center">{currentLocale}</span>
          </SidebarMenuButton>
          
          {/* Settings dialog button */}
          <SidebarMenuButton
            tooltip="Settings"
            onClick={() => setIsSettingsOpen(true)}
            size="default"
            className="justify-center"
          >
            <Settings />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}