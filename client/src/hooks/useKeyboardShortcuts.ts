import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export function useKeyboardShortcuts() {
  const [, setLocation] = useLocation();
  const shortcutsQuery = trpc.shortcuts.getAll.useQuery();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Build key combination
      const keys: string[] = [];
      if (e.metaKey || e.ctrlKey) keys.push("cmd");
      if (e.shiftKey) keys.push("shift");
      keys.push(e.key.toLowerCase());
      const keyCombo = keys.join("+");

      // Get shortcuts data
      const shortcuts = shortcutsQuery.data;
      if (!shortcuts) return;

      const shortcut = shortcuts[keyCombo as keyof typeof shortcuts];
      if (!shortcut) return;

      // Prevent default browser behavior
      e.preventDefault();

      // Execute action
      switch (shortcut.action) {
        case "search":
          // Dispatch custom event for search modal
          window.dispatchEvent(new CustomEvent("open-search"));
          break;
        case "help":
          window.dispatchEvent(new CustomEvent("open-help"));
          break;
        case "new_project":
          setLocation("/studio");
          break;
        case "go_to_gallery":
          setLocation("/gallery");
          break;
        case "go_to_home":
          setLocation("/");
          break;
        case "settings":
          window.dispatchEvent(new CustomEvent("open-settings"));
          break;
        case "toggle_theme":
          window.dispatchEvent(new CustomEvent("toggle-theme"));
          break;
        case "toggle_sidebar":
          window.dispatchEvent(new CustomEvent("toggle-sidebar"));
          break;
        case "close_modal":
          window.dispatchEvent(new CustomEvent("close-modal"));
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcutsQuery.data, setLocation]);
}
