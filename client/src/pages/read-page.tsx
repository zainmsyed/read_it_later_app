import { useQuery, useMutation } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Archive } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ReadPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/read/:id");
  const { toast } = useToast();

  const { data: article, isLoading } = useQuery<Article>({
    queryKey: [`/api/articles/${params?.id}`],
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
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => archiveMutation.mutate()}>
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
      </header>

      <main className="max-w-prose mx-auto px-4 py-24">
        <article className="prose prose-lg dark:prose-invert">
          <h1 className="mb-8">{article.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>
      </main>
    </div>
  );
}
