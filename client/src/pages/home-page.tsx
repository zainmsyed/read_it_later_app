import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Article, insertArticleSchema } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpenText, Settings, LogOut, Archive, Plus, Tag, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTag, setCurrentTag] = useState("");

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const { data: existingTags = [] } = useQuery<string[]>({
    queryKey: ["/api/articles/tags"],
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="w-64 bg-muted border-r border-border p-4">
        <div className="flex items-center gap-2 mb-8">
          <BookOpenText className="h-6 w-6" />
          <h1 className="text-xl font-semibold">ReadLater</h1>
        </div>

        <div className="space-y-1">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Article
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
                                  <Badge key={tag} variant="secondary" className="gap-1">
                                    {tag}
                                    <button
                                      type="button"
                                      onClick={() => removeTag(tag)}
                                      className="ml-1 hover:text-destructive"
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
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <BookOpenText className="h-4 w-4 mr-2" />
              Reading List
            </Button>
          </Link>
          <Link href="/archive">
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          </Link>
        </div>

        <div className="absolute bottom-4 left-4 right-4 space-y-1">
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Reading List</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          ) : articles?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No articles saved yet. Click "Add Article" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles?.map((article) => (
                <Link key={article.id} href={`/read/${article.id}`}>
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-6">
                      <CardTitle className="mb-2">{article.title}</CardTitle>
                      {article.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                          {article.description}
                        </p>
                      )}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {article.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}