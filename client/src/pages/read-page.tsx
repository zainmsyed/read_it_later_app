import { useQuery, useMutation } from "@tanstack/react-query";
import { Article, Highlight } from "@shared/schema";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Archive, Tag, X, Check, StickyNote, Bold, Italic, List, ListOrdered, Quote, Highlighter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ReadPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/read/:id");
  const { toast } = useToast();
  const [currentTag, setCurrentTag] = useState("");
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isCreatingHighlight, setIsCreatingHighlight] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [highlightColor, setHighlightColor] = useState<string>("yellow");
  const [highlightNote, setHighlightNote] = useState("");
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [pendingNotes, setPendingNotes] = useState("");
  const [noteTab, setNoteTab] = useState<"write" | "preview">("write");

  const { data: article, isLoading } = useQuery<Article>({
    queryKey: [`/api/articles/${params?.id}`],
  });

  const { data: highlights = [] } = useQuery<Highlight[]>({
    queryKey: [`/api/articles/${params?.id}/highlights`],
    enabled: !!params?.id,
  });

  const { data: existingTags = [] } = useQuery<string[]>({
    queryKey: ["/api/articles/tags"],
  });

  const updateArticleMutation = useMutation({
    mutationFn: async (data: Partial<Article>) => {
      await apiRequest("PATCH", `/api/articles/${params?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${params?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Changes saved" });
      setIsEditingTags(false);
      setIsEditingNotes(false);
      setPendingTags([]);
    },
  });

  const createHighlightMutation = useMutation({
    mutationFn: async (data: { text: string; startOffset: string; endOffset: string; color?: string; note?: string }) => {
      await apiRequest("POST", `/api/articles/${params?.id}/highlights`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${params?.id}/highlights`] });
      toast({ title: "Highlight saved" });
      setIsCreatingHighlight(false);
      setSelectedText("");
      setHighlightColor("yellow");
      setHighlightNote("");
    },
  });

  const deleteHighlightMutation = useMutation({
    mutationFn: async (highlightId: number) => {
      await apiRequest("DELETE", `/api/highlights/${highlightId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${params?.id}/highlights`] });
      toast({ title: "Highlight deleted" });
    },
  });

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const range = selection.getRangeAt(0);
      const content = range.commonAncestorContainer.parentElement;

      // Only allow highlighting within the article content
      if (!content?.closest('.article-content')) return;

      const text = selection.toString().trim();
      if (text) {
        setSelectedText(text);
        setIsCreatingHighlight(true);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  // Rest of the tag-related functions remain unchanged
  const startEditing = () => {
    setPendingTags(article?.tags || []);
    setIsEditingTags(true);
  };

  const startEditingNotes = () => {
    setPendingNotes(article?.notes || "");
    setIsEditingNotes(true);
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
    updateArticleMutation.mutate({ tags: pendingTags });
  };

  const saveNotes = () => {
    updateArticleMutation.mutate({ notes: pendingNotes });
  };

  const cancelEditing = () => {
    setIsEditingTags(false);
    setPendingTags([]);
    setCurrentTag("");
  };

  const cancelEditingNotes = () => {
    setIsEditingNotes(false);
    setPendingNotes(article?.notes || "");
  };

  const archiveArticle = () => {
    updateArticleMutation.mutate({ archived: true }, {
      onSuccess: () => {
        toast({ title: "Article archived" });
        setLocation("/");
      }
    });
  };

  const createHighlight = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer.parentElement;
    if (!container) return;

    // Calculate offsets relative to the article content
    const articleContent = container.closest('.article-content');
    if (!articleContent) return;

    const startOffset = range.startOffset.toString();
    const endOffset = range.endOffset.toString();

    createHighlightMutation.mutate({
      text: selectedText,
      startOffset,
      endOffset,
      color: highlightColor,
      note: highlightNote,
    });
  };

  const insertMarkdown = (syntax: string) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    let newText = '';
    let newCursorPos = 0;

    switch (syntax) {
      case 'bold':
        newText = `${before}**${selected || 'bold text'}**${after}`;
        newCursorPos = selected ? end + 4 : start + 11;
        break;
      case 'italic':
        newText = `${before}_${selected || 'italic text'}_${after}`;
        newCursorPos = selected ? end + 2 : start + 12;
        break;
      case 'list':
        newText = `${before}\n- ${selected || 'list item'}${after}`;
        newCursorPos = selected ? end + 3 : start + 12;
        break;
      case 'ordered-list':
        newText = `${before}\n1. ${selected || 'numbered item'}${after}`;
        newCursorPos = selected ? end + 4 : start + 15;
        break;
      case 'quote':
        newText = `${before}\n> ${selected || 'quoted text'}${after}`;
        newCursorPos = selected ? end + 3 : start + 13;
        break;
    }

    setPendingNotes(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
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
        <Button variant="ghost" size="sm" onClick={archiveArticle}>
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
      </header>

      {/* Highlight Creation Dialog */}
      <Dialog open={isCreatingHighlight} onOpenChange={(open) => !open && setIsCreatingHighlight(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Highlight</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected Text:</label>
              <p className="text-sm border rounded-md p-2 bg-muted">{selectedText}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color:</label>
              <Select value={highlightColor} onValueChange={setHighlightColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="pink">Pink</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (optional):</label>
              <Textarea
                value={highlightNote}
                onChange={(e) => setHighlightNote(e.target.value)}
                placeholder="Add a note to your highlight..."
                className="h-24"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsCreatingHighlight(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={createHighlight}
                disabled={createHighlightMutation.isPending}
              >
                {createHighlightMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Highlight"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tag Editing Dialog */}
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
                      disabled={updateArticleMutation.isPending}
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
                disabled={updateArticleMutation.isPending}
              >
                {updateArticleMutation.isPending ? (
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

      {/* Notes Dialog */}
      <Dialog open={isEditingNotes} onOpenChange={(open) => !open && cancelEditingNotes()}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Notes</DialogTitle>
          </DialogHeader>
          <Tabs value={noteTab} onValueChange={(value) => setNoteTab(value as "write" | "preview")}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertMarkdown('bold')}
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertMarkdown('italic')}
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertMarkdown('list')}
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertMarkdown('ordered-list')}
                  title="Numbered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertMarkdown('quote')}
                  title="Quote"
                >
                  <Quote className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="write" className="mt-0">
              <Textarea
                value={pendingNotes}
                onChange={(e) => setPendingNotes(e.target.value)}
                placeholder="Write your notes here using Markdown..."
                className="min-h-[400px] font-mono"
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <div className="min-h-[400px] p-4 border rounded-md prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {pendingNotes || '*No content to preview*'}
                </ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Using Markdown syntax for formatting
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelEditingNotes}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={saveNotes}
                disabled={updateArticleMutation.isPending}
              >
                {updateArticleMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Notes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="max-w-prose mx-auto px-4 py-24">
        <article className="prose prose-lg dark:prose-invert">
          <h1 className="mb-8">{article.title}</h1>
          <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>

        {/* Highlights Section */}
        {highlights.length > 0 && (
          <div className="mt-12 border-t pt-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Highlighter className="h-5 w-5" />
              Highlights
            </h2>
            <div className="space-y-4">
              {highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="p-4 border rounded-lg space-y-2"
                  style={{
                    borderColor: highlight.color,
                    backgroundColor: `${highlight.color}10`
                  }}
                >
                  <p className="text-lg">{highlight.text}</p>
                  {highlight.note && (
                    <p className="text-sm text-muted-foreground">{highlight.note}</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteHighlightMutation.mutate(highlight.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Notes Button */}
        <Button
          className="fixed right-8 top-1/2 transform -translate-y-1/2 shadow-lg"
          size="lg"
          onClick={startEditingNotes}
        >
          <StickyNote className="h-5 w-5 mr-2" />
          {article.notes ? "Edit Notes" : "Add Notes"}
        </Button>

        {/* Display formatted notes in the article view */}
        {article.notes && (
          <div className="mt-12 border-t pt-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <StickyNote className="h-5 w-5" />
              Notes
            </h2>
            <div className="prose prose-sm dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.notes}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}