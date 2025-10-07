import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Download, Paperclip, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopicItem, Topic } from "@/components/TopicItem";
import { TopicDialog } from "@/components/TopicDialog";
import { FileUpload } from "@/components/FileUpload";
import { AttachmentsList } from "@/components/AttachmentsList";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const FolderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) {
        navigate("/");
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (user && id) {
      fetchFolderData();
    }
  }, [user, id]);

  const fetchFolderData = async () => {
    try {
      const { data: folder, error: folderError } = await supabase
        .from("folders")
        .select("name")
        .eq("id", id)
        .single();

      if (folderError) throw folderError;
      setFolderName(folder.name);

      const { data: topicsData, error: topicsError } = await supabase
        .from("topics")
        .select("*")
        .eq("folder_id", id)
        .order("created_at", { ascending: true });

      if (topicsError) throw topicsError;

      const topicsWithAttachments = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { count } = await supabase
            .from("attachments")
            .select("*", { count: "exact", head: true })
            .eq("topic_id", topic.id);

          return {
            id: topic.id,
            title: topic.title,
            completed: topic.completed,
            attachments: count || 0,
          };
        })
      );

      setTopics(topicsWithAttachments);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados da pasta");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const completedCount = topics.filter((t) => t.completed).length;
  const progress = topics.length > 0 ? (completedCount / topics.length) * 100 : 0;

  const handleToggleTopic = async (topicId: string) => {
    try {
      const topic = topics.find((t) => t.id === topicId);
      if (!topic) return;

      const { error } = await supabase
        .from("topics")
        .update({ completed: !topic.completed })
        .eq("id", topicId);

      if (error) throw error;

      setTopics((prev) =>
        prev.map((t) =>
          t.id === topicId ? { ...t, completed: !t.completed } : t
        )
      );
      toast.success("Status atualizado!");
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleSaveTopic = async (title: string) => {
    try {
      if (editingTopic) {
        const { error } = await supabase
          .from("topics")
          .update({ title })
          .eq("id", editingTopic.id);

        if (error) throw error;
        toast.success("Tópico atualizado!");
      } else {
        const { error } = await supabase
          .from("topics")
          .insert({ title, folder_id: id });

        if (error) throw error;
        toast.success("Tópico criado!");
      }

      fetchFolderData();
      setEditingTopic(null);
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error("Erro ao salvar tópico");
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm("Deseja realmente excluir este tópico? Todos os anexos serão perdidos.")) {
      return;
    }

    try {
      const { error } = await supabase.from("topics").delete().eq("id", topicId);
      if (error) throw error;

      toast.success("Tópico excluído!");
      fetchFolderData();
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error("Erro ao excluir tópico");
    }
  };

  const openUploadDialog = (topicId: string) => {
    setSelectedTopicId(topicId);
    setUploadDialogOpen(true);
  };

  const handleUploadComplete = async () => {
    setRefreshKey((prev) => prev + 1);
    
    // Atualizar apenas o tópico específico sem reordenar a lista
    if (selectedTopicId) {
      const { count } = await supabase
        .from("attachments")
        .select("*", { count: "exact", head: true })
        .eq("topic_id", selectedTopicId);

      setTopics((prev) =>
        prev.map((t) =>
          t.id === selectedTopicId
            ? { ...t, completed: true, attachments: count || 0 }
            : t
        )
      );
    }
    
    setUploadDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gradient-subtle">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container max-w-4xl py-8 px-4">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              fetchFolderData();
              toast.success("Atualizado!");
            }} 
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <div className="mb-8 rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
          <h1 className="mb-4 text-3xl font-bold">{folderName}</h1>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso Geral</span>
              <span className="text-lg font-semibold text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {completedCount} de {topics.length} tópicos concluídos
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Tópicos</h2>
          <Button 
            onClick={() => { setEditingTopic(null); setDialogOpen(true); }} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Tópico
          </Button>
        </div>

        <div className="space-y-3">
          {topics.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">
                Nenhum tópico criado ainda. Clique em "Novo Tópico" para começar.
              </p>
            </div>
          ) : (
            topics.map((topic) => (
              <div key={topic.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <TopicItem
                      topic={topic}
                      onToggle={() => handleToggleTopic(topic.id)}
                      onEdit={() => { setEditingTopic(topic); setDialogOpen(true); }}
                      onDelete={() => handleDeleteTopic(topic.id)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openUploadDialog(topic.id)}
                    className="mt-4"
                    title="Adicionar anexos"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
                <div className="ml-11">
                  <AttachmentsList 
                    topicId={topic.id} 
                    refreshTrigger={refreshKey}
                    onAttachmentDeleted={(topicId, hasAttachments) => {
                      setTopics((prev) =>
                        prev.map((t) =>
                          t.id === topicId
                            ? { ...t, completed: hasAttachments, attachments: hasAttachments ? t.attachments - 1 : 0 }
                            : t
                        )
                      );
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <TopicDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSaveTopic}
          initialTitle={editingTopic?.title}
          title={editingTopic ? "Editar Tópico" : "Novo Tópico"}
          description={
            editingTopic
              ? "Atualize as informações do tópico."
              : "Adicione um novo tópico à pasta."
          }
        />

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Anexos</DialogTitle>
              <DialogDescription>
                Envie arquivos PNG, PDF, CSV e outros formatos
              </DialogDescription>
            </DialogHeader>
            {selectedTopicId && (
              <FileUpload
                topicId={selectedTopicId}
                onUploadComplete={handleUploadComplete}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FolderDetails;
