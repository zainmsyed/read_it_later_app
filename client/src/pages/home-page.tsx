import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Article, insertArticleSchema } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpenText, Settings, LogOut, Archive, Plus, Tag, X, PanelLeftClose, PanelRightClose, RefreshCw, Trash2, SearchIcon } from "lucide-react";
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    <div className="min-h-screen flex">
      <div 
        className={`fixed top-0 left-0 h-screen bg-muted border-r border-border overflow-y-auto transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-10">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3">
                <BookOpenText className="h-6 w-6" />
                <h1 className="text-xl font-medium tracking-tight">Postea</h1>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="ml-auto"
            >
              {isSidebarCollapsed ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="space-y-1">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost"
                  className={`w-full flex items-center justify-${isSidebarCollapsed ? 'center' : 'start'} bg-green-500/10 hover:bg-green-500/20`} 
                  size="sm"
                >
                  <Plus className="h-6 w-6" />
                  {!isSidebarCollapsed && <span className="ml-3 font-medium text-muted-foreground/70">Add Article</span>}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Article</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => addArticleMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://..." disabled={addArticleMutation.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={() => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
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
                                  disabled={addArticleMutation.isPending}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={addTag}
                                  disabled={addArticleMutation.isPending}
                                >
                                  <Tag className="h-4 w-4" />
                                </Button>
                              </div>
                              {form.watch("tags").length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {form.watch("tags").map((tag) => (
                                    <Badge key={tag} className="tag-badge gap-1">
                                      {tag}
                                      <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="hover:text-destructive"
                                        disabled={addArticleMutation.isPending}
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
                                      .filter(tag => !form.watch("tags").includes(tag))
                                      .map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="outline"
                                          className="cursor-pointer hover:bg-muted"
                                          onClick={() => addExistingTag(tag)}
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={addArticleMutation.isPending}
                    >
                      {addArticleMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Article'
                      )}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Link href="/">
              <Button 
                variant="ghost" 
                className={`w-full flex items-center justify-${isSidebarCollapsed ? 'center' : 'start'}`} 
                size="sm"
              >
                <BookOpenText className="h-6 w-6" />
                {!isSidebarCollapsed && <span className="ml-3">Reading List</span>}
              </Button>
            </Link>



            {existingTags.length > 0 && !isSidebarCollapsed && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold mb-2">Filter by Tags</h2>
                <div className="flex flex-wrap gap-2">
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
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 space-y-1">
            <Link href="/settings">
              <Button 
                variant="ghost" 
                className={`w-full flex items-center justify-${isSidebarCollapsed ? 'center' : 'start'}`} 
                size="sm"
              >
                <Settings className="h-4 w-4" />
                {!isSidebarCollapsed && <span className="ml-2">Settings</span>}
              </Button>
            </Link>
            <Button
              variant="ghost"
              className={`w-full flex items-center justify-${isSidebarCollapsed ? 'center' : 'start'}`}
              size="sm"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4" />
              {!isSidebarCollapsed && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>
      </div>

      <div 
        className={`flex-1 p-8 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold">{selectedTags.length > 0 ? 'Filtered Articles' : 'Reading List'}</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchOpen(true)}
              >
                <SearchIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
            <div className="space-y-4">
              {filteredArticles?.map((article) => (
                <Card key={article.id} className="hover:bg-muted/50 transition-colors article-list">
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
                    <div className="flex items-center gap-2">
                      {/* Added read status indicator */}
                      {article.read && (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 border border-green-500">
                          <Check className="h-4 w-4 text-green-500" />
                        </div>
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
  );
}