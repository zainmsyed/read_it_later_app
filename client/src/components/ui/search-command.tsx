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
import { SearchIcon, Tag } from "lucide-react";

export function SearchCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Reset search when closing
    if (!open) {
      setSearch("");
      setSelectedTags([]);
    }
  }, [open]);

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    enabled: open,
    select: (data) => {
      let filtered = data;
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(article => 
          article.title?.toLowerCase().includes(searchLower)
        );
      }
      if (selectedTags.length > 0) {
        filtered = filtered.filter(article => 
          selectedTags.every(tag => article.tags?.includes(tag))
        );
      }
      return filtered;
    }
  });

  const { data: allTags = [] } = useQuery<string[]>({
    queryKey: ["/api/articles/tags"],
    enabled: open,
  });

  const handleSelect = React.useCallback((value: string) => {
    if (value.startsWith("tag:")) {
      const tag = value.replace("tag:", "");
      setSelectedTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
      return;
    }

    if (value.startsWith("article:")) {
      const id = value.replace("article:", "");
      setLocation(`/read/${id}`);
      handleClose();
    }
  }, [setLocation]);

  const handleSearch = React.useCallback(() => {
    if (articles.length > 0 && articles[0].id) {
      setLocation(`/read/${articles[0].id}`);
      handleClose();
    }
  }, [articles, setLocation]);

  const handleClose = React.useCallback(() => {
    setSearch("");
    setSelectedTags([]);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={handleClose}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          placeholder={selectedTags.length > 0 ? "Search in filtered articles..." : "Search articles..."}
          value={search}
          onValueChange={setSearch}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && articles.length > 0) {
              handleSearch();
            }
          }}
        />
        <CommandList>
          <CommandEmpty>No articles found.</CommandEmpty>
          {(articles && articles.length > 0) && (
            <CommandGroup heading="Articles">
              {articles.map((article) => (
                <CommandItem
                  key={article.id}
                  value={`article:${article.id}`}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  <SearchIcon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{article.title}</span>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
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
          {allTags.length > 0 && (
            <CommandGroup heading="Filter by tag">
              {allTags.map((tag) => (
                <CommandItem
                  key={tag}
                  value={`tag:${tag}`}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  <Tag className="mr-2 h-4 w-4" />
                  <span>{tag}</span>
                  {selectedTags.includes(tag) && (
                    <Badge variant="secondary" className="ml-auto">
                      Selected
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleSearch}
          >
            Search
          </Button>
        </div>
      </Command>
    </CommandDialog>
  );
}