import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const toggleThemeMutation = trpc.theme.toggleTheme.useMutation();
  const getThemeQuery = trpc.theme.getTheme.useQuery();

  useEffect(() => {
    if (getThemeQuery.data) {
      setTheme(getThemeQuery.data.theme);
      // Apply theme to document
      document.documentElement.classList.toggle("dark", getThemeQuery.data.theme === "dark");
    }
  }, [getThemeQuery.data]);

  const handleToggle = async () => {
    const result = await toggleThemeMutation.mutateAsync();
    const newTheme = result.theme as "light" | "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={toggleThemeMutation.isPending}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
