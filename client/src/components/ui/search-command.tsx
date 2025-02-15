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

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles/search", search, selectedTags],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (selectedTags.length) params.append("tags", selectedTags.join(","));
      const response = await fetch(`/api/articles/search?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to search articles");
      return response.json();
    },
    enabled: open,
  });

  const { data: allTags = [] } = useQuery<string[]>({
    queryKey: ["/api/articles/tags"],
    enabled: open,
  });

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={onOpenChange}
      aria-label="Search articles"
    >
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
                  onSelect={() => {
                    setLocation(`/read/${article.id}`);
                    onOpenChange(false);
                  }}
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
                  onSelect={() => {
                    setSelectedTags((prev) =>
                      prev.includes(tag)
                        ? prev.filter((t) => t !== tag)
                        : [...prev, tag]
                    );
                  }}
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
      </Command>
    </CommandDialog>
  );
}