import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Article, insertArticleSchema } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpenText, Settings, LogOut, Archive, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const form = useForm({
    defaultValues: {
      url: "",
    },
    resolver: zodResolver(insertArticleSchema.pick({ url: true }).extend({
      url: insertArticleSchema.shape.url
    }))
  });

  const addArticleMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/articles", { url });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save article");
      }
      return data;
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

        <div className="space-y-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Article
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Article</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => addArticleMutation.mutate(data.url))} className="space-y-4">
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

        <div className="absolute bottom-4 left-4 right-4 space-y-2">
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
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {article.description}
                        </p>
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