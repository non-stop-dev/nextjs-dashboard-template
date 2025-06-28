"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeCategory, setActiveCategory] = React.useState<"Profile" | "Appearance">("Profile");

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
                variant={activeCategory === "Appearance" ? "default" : "ghost"}
                className="justify-start"
                onClick={() => setActiveCategory("Appearance")}
              >
                Appearance
              </Button>
            </nav>
          </div>
          {/* Área de contenido derecha */}
          <div className="w-3/4 p-4">
            {activeCategory === "Profile" && (
              <div>
                <h3 className="text-lg font-semibold">Profile Settings</h3>
                <p className="mt-2">Manage your user profile here (placeholder).</p>
              </div>
            )}
            {activeCategory === "Appearance" && (
              <div>
                <h3 className="text-lg font-semibold">Appearance Settings</h3>
                <p className="mt-2">Customize the look of your app (placeholder).</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}