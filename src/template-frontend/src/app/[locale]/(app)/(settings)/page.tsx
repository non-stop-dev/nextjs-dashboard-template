"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileSettings } from "./profile"; // Nuevo: Importamos el componente
import { PrivacySettings } from "./privacy"; // Ejemplo: Nuevo componente
import { SessionsSettings } from "./sessions"; // Ejemplo: Nuevo componente

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeCategory, setActiveCategory] = React.useState<"Profile" | "Privacy" | "Sessions">("Profile"); // Modificado: Añadimos nuevas categorías

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex h-[400px]">
          {/* Sidebar izquierda */}
          <div className="w-1/4 border-r p-4">
            <nav className="flex flex-col gap-2">
              <Button
                variant={activeCategory === "Profile" ? "default" : "ghost"}
                className="justify-start"
                onClick={() => setActiveCategory("Profile")}
              >
                Profile
              </Button>
              <Button
                variant={activeCategory === "Privacy" ? "default" : "ghost"}
                className="justify-start"
                onClick={() => setActiveCategory("Privacy")}
              >
                Privacy
              </Button>
              <Button
                variant={activeCategory === "Sessions" ? "default" : "ghost"}
                className="justify-start"
                onClick={() => setActiveCategory("Sessions")}
              >
                Sessions
              </Button>
            </nav>
          </div>
          {/* Área de contenido derecha */}
          <div className="w-3/4 p-4">
            {activeCategory === "Profile" && <ProfileSettings />}
            {activeCategory === "Privacy" && <PrivacySettings />}
            {activeCategory === "Sessions" && <SessionsSettings />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}