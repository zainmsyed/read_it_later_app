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
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchIcon, Calendar, Tag, X, Filter } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";

type DateFilter = "today" | "week" | "month" | "all";

interface SearchFilters {
  tags: string[];
  dateRange: DateFilter;
}

interface ArticleWithHighlights extends Article {
  highlights?: { text: string; note?: string }[];
  notes?: string;
}

export function SearchCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<SearchFilters>({
    tags: [],
    dateRange: "all"
  });
  const [showFilters, setShowFilters] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setFilters({ tags: [], dateRange: "all" });
      setShowFilters(false);
    }
  }, [open]);

  const { data: articles = [] } = useQuery<ArticleWithHighlights[]>({
    queryKey: ["/api/articles", { includeHighlights: true }],
    enabled: open,
    queryFn: async () => {
      const articles = await fetch("/api/articles?includeHighlights=true").then(r => r.json());
      return articles;
    },
    select: (data) => {
      let filtered = data || [];

      // Text search (title, description, notes, highlights)
      if (search?.trim()) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(article => {
          const hasHighlightMatch = Array.isArray(article.highlights) && article.highlights.some(h =>
            h.text.toLowerCase().includes(searchLower) ||
            (h.note && h.note.toLowerCase().includes(searchLower))
          );
          
          return article.title?.toLowerCase().includes(searchLower) ||
                 article.description?.toLowerCase().includes(searchLower) ||
                 article.notes?.toLowerCase().includes(searchLower) ||
                 hasHighlightMatch;
        });
      }

      // Tag filtering
      if (filters.tags.length > 0) {
        filtered = filtered.filter(article =>
          filters.tags.every(tag => article.tags?.includes(tag))
        );
      }

      // Date filtering
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (filters.dateRange) {
          case 'today':
            startDate = startOfDay(now);
            break;
          case 'week':
            startDate = subDays(now, 7);
            break;
          case 'month':
            startDate = subDays(now, 30);
            break;
          default:
            startDate = new Date(0); // Beginning of time
        }

        filtered = filtered.filter(article => {
          const articleDate = new Date(article.created);
          return isWithinInterval(articleDate, {
            start: startDate,
            end: endOfDay(now)
          });
        });
      }

      return filtered;
    }
  });

  const { data: allTags = [] } = useQuery<string[]>({
    queryKey: ["/api/articles/tags"],
    enabled: open,
  });

  const handleSelect = React.useCallback((articleId: string) => {
    setLocation(`/read/${articleId}`);
    onOpenChange(false);
  }, [setLocation, onOpenChange]);

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const setDateRange = (range: DateFilter) => {
    setFilters(prev => ({
      ...prev,
      dateRange: range
    }));
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="rounded-lg border shadow-md">
        <div className="flex items-center gap-2 p-2 w-full">
          <CommandInput
            className="flex-1"
            placeholder="Search articles..."
            value={search}
            onValueChange={setSearch}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-muted" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && (
          <>
            <div className="p-2 border-t border-border">
              <div className="space-y-4">
                {/* Date filters */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Date Range</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "All Time", value: "all" },
                      { label: "Today", value: "today" },
                      { label: "This Week", value: "week" },
                      { label: "This Month", value: "month" }
                    ].map(({ label, value }) => (
                      <Badge
                        key={value}
                        variant={filters.dateRange === value ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setDateRange(value as DateFilter)}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tag filters */}
                {allTags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={filters.tags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTag(tag)}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <CommandSeparator />
          </>
        )}

        <CommandList>
          <CommandEmpty>No articles found.</CommandEmpty>
          {articles.length > 0 && (
            <CommandGroup heading="Articles">
              {articles.map((article) => (
                <CommandItem
                  key={article.id}
                  value={`${article.title} ${article.tags?.join(" ")} ${article.notes || ""}`}
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(article.created), 'MMM d, yyyy')}
                      </span>
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
                    {search && article.notes?.toLowerCase().includes(search.toLowerCase()) && (
                      <span className="text-sm text-muted-foreground mt-1">
                        Matches in notes
                      </span>
                    )}
                    {search && article.highlights?.some(h =>
                      h.text.toLowerCase().includes(search.toLowerCase()) ||
                      h.note?.toLowerCase().includes(search.toLowerCase())
                    ) && (
                      <span className="text-sm text-muted-foreground mt-1">
                        Matches in highlights
                      </span>
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