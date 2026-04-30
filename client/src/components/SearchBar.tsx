import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = "Search projects..." }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const searchQuery = trpc.search.searchMyProjects.useQuery(
    { query, limit: 10 },
    { enabled: query.length > 0 && isOpen }
  );

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {searchQuery.isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {searchQuery.data && searchQuery.data.length > 0 ? (
            <ul className="divide-y divide-border">
              {searchQuery.data.map((project) => (
                <li
                  key={project.id}
                  className="p-3 hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="font-medium text-sm">{project.appName}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {project.appDescription}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !searchQuery.isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No projects found
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
