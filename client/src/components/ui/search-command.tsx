import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Article } from "@shared/schema";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";

export function SearchCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = React.useState("");

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    enabled: open,
    select: (data) => {
      if (!search?.trim()) return data || [];
      const searchLower = search.toLowerCase();
      return (data || []).filter(article => 
        article.title?.toLowerCase().includes(searchLower) ||
        article.description?.toLowerCase().includes(searchLower)
      );
    }
  });

  const handleSelect = React.useCallback((articleId: string) => {
    setLocation(`/read/${articleId}`);
    onOpenChange(false);
  }, [setLocation, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          placeholder="Search articles..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No articles found.</CommandEmpty>
          {articles.length > 0 && (
            <CommandGroup heading="Articles">
              {articles.map((article) => (
                <CommandItem
                  key={article.id}
                  value={article.title}
                  onSelect={() => handleSelect(article.id.toString())}
                  className="cursor-pointer"
                >
                  <SearchIcon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="font-medium">{article.title}</span>
                    {article.description && (
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {article.description}
                      </span>
                    )}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}