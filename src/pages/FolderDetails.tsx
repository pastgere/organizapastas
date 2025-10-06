import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopicItem, Topic } from "@/components/TopicItem";
import { TopicDialog } from "@/components/TopicDialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// Mock data - in a real app, this would come from a database
const mockFolders = {
  "1": {
    id: "1",
    name: "João Silva",
    topics: [
      { id: "t1", title: "Contrato Social", completed: true, attachments: 2 },
      { id: "t2", title: "Documentação Fiscal", completed: false, attachments: 1 },
      { id: "t3", title: "Certidões", completed: true, attachments: 3 },
    ] as Topic[],
  },
};

const FolderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>(
    mockFolders[id as keyof typeof mockFolders]?.topics || []
  );
  const [folderName] = useState(
    mockFolders[id as keyof typeof mockFolders]?.name || "Pasta"
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const completedCount = topics.filter((t) => t.completed).length;
  const progress = topics.length > 0 ? (completedCount / topics.length) * 100 : 0;

  const handleToggleTopic = (topicId: string) => {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, completed: !t.completed } : t
      )
    );
    toast.success("Status atualizado!");
  };

  const handleSaveTopic = (title: string) => {
    if (editingTopic) {
      setTopics((prev) =>
        prev.map((t) => (t.id === editingTopic.id ? { ...t, title } : t))
      );
      toast.success("Tópico atualizado!");
    } else {
      const newTopic: Topic = {
        id: `t${Date.now()}`,
        title,
        completed: false,
        attachments: 0,
      };
      setTopics((prev) => [...prev, newTopic]);
      toast.success("Tópico criado!");
    }
    setEditingTopic(null);
  };

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setDialogOpen(true);
  };

  const handleDeleteTopic = (topicId: string) => {
    setTopics((prev) => prev.filter((t) => t.id !== topicId));
    toast.success("Tópico excluído!");
  };

  const handleExport = () => {
    toast.success("Exportando pasta... (funcionalidade em desenvolvimento)");
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container max-w-4xl py-8 px-4">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
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
          <Button onClick={() => { setEditingTopic(null); setDialogOpen(true); }} className="gap-2">
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
              <TopicItem
                key={topic.id}
                topic={topic}
                onToggle={() => handleToggleTopic(topic.id)}
                onEdit={() => handleEditTopic(topic)}
                onDelete={() => handleDeleteTopic(topic.id)}
              />
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
      </div>
    </div>
  );
};

export default FolderDetails;
