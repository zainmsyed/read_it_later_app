import { useQuery, useMutation } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Archive, Tag, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function ReadPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/read/:id");
  const { toast } = useToast();
  const [currentTag, setCurrentTag] = useState("");
  const [isEditingTags, setIsEditingTags] = useState(false);

  const { data: article, isLoading } = useQuery<Article>({
    queryKey: [`/api/articles/${params?.id}`],
  });

  const updateTagsMutation = useMutation({
    mutationFn: async (tags: string[]) => {
      await apiRequest("PATCH", `/api/articles/${params?.id}`, { tags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${params?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Tags updated" });
      setIsEditingTags(false);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/articles/${params?.id}`, { archived: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article archived" });
      setLocation("/");
    },
  });

  const addTag = () => {
    if (!currentTag.trim() || !article) return;
    const newTags = [...(article.tags || [])];
    if (!newTags.includes(currentTag.trim())) {
      newTags.push(currentTag.trim());
      updateTagsMutation.mutate(newTags);
    }
    setCurrentTag("");
  };

  const removeTag = (tagToRemove: string) => {
    if (!article) return;
    const newTags = (article.tags || []).filter(tag => tag !== tagToRemove);
    updateTagsMutation.mutate(newTags);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center px-4 z-10">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1 flex items-center gap-4 mx-4">
          {isEditingTags ? (
            <div className="flex items-center gap-2 flex-1">
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
                className="h-8"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={addTag}
                disabled={updateTagsMutation.isPending}
              >
                <Tag className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingTags(false)}
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {article.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingTags(true)}
              >
                <Tag className="h-4 w-4 mr-2" />
                Edit Tags
              </Button>
            </>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => archiveMutation.mutate()}>
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
      </header>

      <main className="max-w-prose mx-auto px-4 py-24">
        <article className="prose prose-lg dark:prose-invert">
          <h1 className="mb-8">{article.title}</h1>
          {isEditingTags && article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8 not-prose">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                    disabled={updateTagsMutation.isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>
      </main>
    </div>
  );
}