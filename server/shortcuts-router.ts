import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";

// Define keyboard shortcuts
const SHORTCUTS = {
  "cmd+k": { action: "search", description: "Open search" },
  "cmd+/": { action: "help", description: "Open help" },
  "cmd+n": { action: "new_project", description: "Create new project" },
  "cmd+e": { action: "export", description: "Export current project" },
  "cmd+s": { action: "save", description: "Save changes" },
  "cmd+d": { action: "download", description: "Download project" },
  "cmd+p": { action: "palette", description: "Command palette" },
  "cmd+,": { action: "settings", description: "Open settings" },
  "esc": { action: "close_modal", description: "Close modal/dialog" },
  "cmd+b": { action: "toggle_sidebar", description: "Toggle sidebar" },
  "cmd+l": { action: "toggle_theme", description: "Toggle theme" },
  "cmd+g": { action: "go_to_gallery", description: "Go to gallery" },
  "cmd+h": { action: "go_to_home", description: "Go to home" },
  "cmd+shift+d": { action: "delete", description: "Delete item" },
  "cmd+shift+s": { action: "share", description: "Share project" },
};

export const shortcutsRouter = router({
  // Get all shortcuts
  getAll: publicProcedure.query(async () => {
    return SHORTCUTS;
  }),

  // Get shortcut by action
  getByAction: publicProcedure
    .input(z.object({ action: z.string() }))
    .query(async ({ input }) => {
      const shortcut = Object.entries(SHORTCUTS).find(
        ([_, value]) => value.action === input.action
      );
      return shortcut ? { key: shortcut[0], ...shortcut[1] } : null;
    }),

  // Get shortcuts for category
  getByCategory: publicProcedure
    .input(z.object({ category: z.enum(["navigation", "editing", "ui", "all"]) }))
    .query(async ({ input }) => {
      const categories: Record<string, string[]> = {
        navigation: ["go_to_gallery", "go_to_home"],
        editing: ["new_project", "save", "delete", "share"],
        ui: ["toggle_sidebar", "toggle_theme", "close_modal", "palette"],
        all: Object.values(SHORTCUTS).map(s => s.action),
      };

      const categoryActions = categories[input.category];
      const filtered: Record<string, typeof SHORTCUTS[keyof typeof SHORTCUTS]> = {};

      Object.entries(SHORTCUTS).forEach(([key, value]) => {
        if (categoryActions.includes(value.action)) {
          filtered[key] = value;
        }
      });

      return filtered;
    }),

  // Validate shortcut
  validate: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const shortcut = SHORTCUTS[input.key as keyof typeof SHORTCUTS];
      return { valid: !!shortcut, shortcut: shortcut || null };
    }),

  // Get help text for all shortcuts
  getHelp: publicProcedure.query(async () => {
    return Object.entries(SHORTCUTS).map(([key, value]) => ({
      key,
      action: value.action,
      description: value.description,
    }));
  }),
});
