import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Article, insertArticleSchema } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpenText, Settings, LogOut, Archive, Plus, Tag, X, PanelLeftClose, PanelRightClose, RefreshCw, Trash2, SearchIcon, Menu, StickyNote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { SearchCommandPalette } from "@/components/ui/search-command";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"


export default function HomePage() {
  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Article> }) => {
      const res = await apiRequest("PATCH", `/api/articles/${id}`, data);
      if (!res.ok) {
        throw new Error("Failed to update article");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/tags"] });
      toast({ title: "Tags updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update tags", description: error.message, variant: "destructive" });
    },
  });
  const { user, logoutMutation } = useAuth();
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [searchOpen, setSearchOpen] = useState(false);

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    select: (data) => data
  });

  const { data: archivedArticles, isLoading: isArchivedLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/archived"], // Assumed API endpoint for archived articles
  });

  const { data: existingTags = [] } = useQuery<string[]>({
    queryKey: ["/api/articles/tags"],
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article deleted" });
    },
  });

  const form = useForm({
    defaultValues: {
      url: "",
      tags: [] as string[],
    },
    resolver: zodResolver(insertArticleSchema.pick({ url: true, tags: true }))
  });

  const addTag = () => {
    if (!currentTag.trim()) return;
    const currentTags = form.getValues("tags");
    if (!currentTags.includes(currentTag.trim())) {
      form.setValue("tags", [...currentTags, currentTag.trim()]);
    }
    setCurrentTag("");
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const addExistingTag = (tag: string) => {
    const currentTags = form.getValues("tags");
    if (!currentTags.includes(tag)) {
      form.setValue("tags", [...currentTags, tag]);
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addArticleMutation = useMutation({
    mutationFn: async (data: { url: string; tags: string[] }) => {
      const res = await apiRequest("POST", "/api/articles", data);
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || "Failed to save article");
      }
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/archived"] }); //Invalidate archived articles
      toast({ title: "Article saved successfully" });
      form.reset();
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save article",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredArticles = articles?.filter(article => {
    if (selectedTags.length === 0) return true;
    return selectedTags.every(tag => article.tags?.includes(tag));
  });

  if (isLoading || isArchivedLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div>
      <div className="black-header-bar" />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col space-y-8">
        <div className="text-center relative">
          <div className="absolute right-0 top-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-10 w-10" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/settings">
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <h1 className="newspaper-title">Postea</h1>
          <div className="newspaper-subtitle">
            CAPTURE • READ • REMEMBER
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-center">


          <div className="flex items-center gap-2">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  className="w-full pl-9"
                  onClick={() => setSearchOpen(true)}
                  readOnly
                />
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost"
                  className="flex items-center gap-2 bg-black/90 hover:bg-black/70 text-white dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Article</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Article</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => addArticleMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="Enter URL" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                          placeholder="Add tags..."
                        />
                        <Button type="button" variant="outline" onClick={addTag}>
                          <Tag className="h-4 w-4" />
                        </Button>
                      </div>
                      {form.getValues("tags").length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {form.watch("tags", []).map((tag) => (
                            <Badge key={tag} className="gap-1">
                              {tag}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  const currentTags = form.getValues("tags");
                                  form.setValue(
                                    "tags",
                                    currentTags.filter((t) => t !== tag),
                                    { shouldValidate: true }
                                  );
                                }}
                                className="hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Available tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {existingTags
                            .filter(tag => !form.getValues("tags").includes(tag))
                            .map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="cursor-pointer hover:bg-muted"
                                onClick={() => {
                                  const currentTags = form.getValues("tags") || [];
                                  if (!currentTags.includes(tag)) {
                                    form.setValue("tags", [...currentTags, tag], { shouldDirty: true, shouldValidate: true });
                                    form.trigger("tags");
                                  }
                                }}
                              >
                                {tag}
                              </Badge>
                            ))}
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={addArticleMutation.isPending}>
                        {addArticleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Article
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

          </div>
        </div>

        {existingTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center justify-center mt-4">
            <span className="text-sm font-semibold">Tags:</span>
            {existingTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTagFilter(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {selectedTags.length > 0 && (
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtered by:</span>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="gap-1"
                >
                  {tag}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleTagFilter(tag);
                    }}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])}>
              Clear All
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        ) : filteredArticles?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>
              {selectedTags.length > 0
                ? "No articles found with the selected tags."
                : "No articles saved yet. Click 'Add Article' to get started."}
            </p>
          </div>
        ) : (
          <div className="article-grid">
            {filteredArticles?.map((article) => (
              <Card key={article.id} className={`hover:bg-muted/50 transition-colors article-list ${article.read ? 'bg-muted/75' : ''}`}>
                <CardContent className="p-6 flex justify-between items-start">
                  <Link href={`/read/${article.id}`} className="flex-1">
                    <CardTitle className="mb-3 hover:text-primary article-title">{article.title}</CardTitle>
                    {article.description && (
                      <p className="article-description line-clamp-2 mb-4">
                        {article.description}
                      </p>
                    )}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {article.tags?.map((tag) => (
                          <Badge 
                            key={tag} 
                            className="tag-badge group cursor-pointer hover:bg-destructive/10"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (confirm(`Remove tag "${tag}"?`)) {
                                const updatedTags = article.tags?.filter(t => t !== tag);
                                updateArticleMutation.mutate(
                                  { id: article.id, data: { tags: updatedTags } }
                                );
                              }
                            }}
                          >
                            {tag}
                            <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />
                          </Badge>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingArticle(article);
                            setPendingTags(article.tags || []);
                            setIsEditingTags(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Link>
                  <div className="flex items-center justify-end gap-4">
                    {(article.notes || (Array.isArray(article.highlights) && article.highlights.length > 0)) && (
                      <StickyNote className="h-4 w-4 text-black dark:text-white" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
                          deleteArticleMutation.mutate(article.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Tag Editing Dialog */}
      <Dialog open={isEditingTags} onOpenChange={(open) => !open && setIsEditingTags(false)}>
        <DialogContent className="sm:max-w-[425px] gap-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!currentTag.trim()) return;
                    if (!pendingTags.includes(currentTag.trim())) {
                      setPendingTags([...pendingTags, currentTag.trim()]);
                    }
                    setCurrentTag("");
                  }
                }}
                placeholder="Add tags..."
                className="h-8"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!currentTag.trim()) return;
                  if (!pendingTags.includes(currentTag.trim())) {
                    setPendingTags([...pendingTags, currentTag.trim()]);
                  }
                  setCurrentTag("");
                }}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>

            {pendingTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pendingTags.map((tag) => (
                  <Badge key={tag} className="tag-badge gap-1">
                    {tag}
                    <button
                      onClick={() => setPendingTags(pendingTags.filter(t => t !== tag))}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {existingTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Existing tags:</p>
                <div className="flex flex-wrap gap-2">
                  {existingTags
                    .filter(tag => !pendingTags.includes(tag))
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setPendingTags([...pendingTags, tag])}
                      >
                        {tag}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditingTags(false);
                  setPendingTags([]);
                  setCurrentTag("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  if (editingArticle) {
                    updateArticleMutation.mutate(
                      { id: editingArticle.id, data: { tags: pendingTags } },
                      {
                        onSuccess: () => {
                          setIsEditingTags(false);
                          setPendingTags([]);
                          setCurrentTag("");
                        }
                      }
                    );
                  }
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <SearchCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
    </div>
  );
}