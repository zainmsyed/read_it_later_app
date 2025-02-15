import { useQuery, useMutation } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Archive, Tag, X, Check } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const [pendingTags, setPendingTags] = useState<string[]>([]);

  const { data: article, isLoading } = useQuery<Article>({
    queryKey: [`/api/articles/${params?.id}`],
  });

  const { data: existingTags = [] } = useQuery<string[]>({
    queryKey: ["/api/articles/tags"],
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
      setPendingTags([]);
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

  // Initialize pending tags when entering edit mode
  const startEditing = () => {
    setPendingTags(article?.tags || []);
    setIsEditingTags(true);
  };

  const addTag = () => {
    if (!currentTag.trim()) return;
    if (!pendingTags.includes(currentTag.trim())) {
      setPendingTags([...pendingTags, currentTag.trim()]);
    }
    setCurrentTag("");
  };

  const removeTag = (tagToRemove: string) => {
    setPendingTags(pendingTags.filter(tag => tag !== tagToRemove));
  };

  const addExistingTag = (tag: string) => {
    if (!pendingTags.includes(tag)) {
      setPendingTags([...pendingTags, tag]);
    }
  };

  const confirmTagChanges = () => {
    updateTagsMutation.mutate(pendingTags);
  };

  const cancelEditing = () => {
    setIsEditingTags(false);
    setPendingTags([]);
    setCurrentTag("");
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

  const unusedTags = existingTags.filter(tag => !pendingTags.includes(tag));

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center px-4 z-10">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1 flex items-center gap-4 mx-4">
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
            onClick={startEditing}
          >
            <Tag className="h-4 w-4 mr-2" />
            Edit Tags
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => archiveMutation.mutate()}>
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
      </header>

      <Dialog open={isEditingTags} onOpenChange={(open) => !open && cancelEditing()}>
        <DialogContent className="sm:max-w-[425px] gap-6">
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
                className="h-8"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={addTag}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>

            {pendingTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pendingTags.map((tag) => (
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

            {unusedTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Existing tags:</p>
                <div className="flex flex-wrap gap-2">
                  {unusedTags.map((tag) => (
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

            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelEditing}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={confirmTagChanges}
                disabled={updateTagsMutation.isPending}
              >
                {updateTagsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="max-w-prose mx-auto px-4 py-24">
        <article className="prose prose-lg dark:prose-invert">
          <h1 className="mb-8">{article.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>
      </main>
    </div>
  );
}