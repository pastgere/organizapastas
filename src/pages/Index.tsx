import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FolderCard } from "@/components/FolderCard";
import { FolderDialog } from "@/components/FolderDialog";
import { toast } from "sonner";

interface Folder {
  id: string;
  name: string;
  totalTopics: number;
  completedTopics: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([
    {
      id: "1",
      name: "João Silva",
      totalTopics: 3,
      completedTopics: 2,
    },
    {
      id: "2",
      name: "Maria Santos",
      totalTopics: 5,
      completedTopics: 5,
    },
    {
      id: "3",
      name: "Tech Solutions LTDA",
      totalTopics: 4,
      completedTopics: 1,
    },
  ]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const handleSaveFolder = (name: string) => {
    if (editingFolder) {
      setFolders((prev) =>
        prev.map((f) => (f.id === editingFolder.id ? { ...f, name } : f))
      );
      toast.success("Pasta atualizada com sucesso!");
    } else {
      const newFolder: Folder = {
        id: `f${Date.now()}`,
        name,
        totalTopics: 0,
        completedTopics: 0,
      };
      setFolders((prev) => [...prev, newFolder]);
      toast.success("Pasta criada com sucesso!");
    }
    setEditingFolder(null);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setDialogOpen(true);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    toast.success("Pasta excluída!");
  };

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Organizador de Pastas</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie seus documentos com eficiência
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => { setEditingFolder(null); setDialogOpen(true); }} 
              className="gap-2 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Nova Pasta
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">Suas Pastas</h2>
          <p className="text-sm text-muted-foreground">
            {folders.length} {folders.length === 1 ? "pasta criada" : "pastas criadas"}
          </p>
        </div>

        {folders.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card p-16 text-center shadow-[var(--shadow-card)]">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <FolderOpen className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Nenhuma pasta ainda</h3>
            <p className="mb-6 text-muted-foreground">
              Crie sua primeira pasta de cliente para começar a organizar documentos
            </p>
            <Button 
              onClick={() => { setEditingFolder(null); setDialogOpen(true); }}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Criar Primeira Pasta
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                {...folder}
                onClick={() => navigate(`/folder/${folder.id}`)}
                onEdit={() => handleEditFolder(folder)}
                onDelete={() => handleDeleteFolder(folder.id)}
              />
            ))}
          </div>
        )}
      </main>

      <FolderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveFolder}
        initialName={editingFolder?.name}
        title={editingFolder ? "Editar Pasta" : "Nova Pasta de Cliente"}
        description={
          editingFolder
            ? "Atualize o nome da pasta."
            : "Crie uma nova pasta personalizada para organizar documentos."
        }
      />
    </div>
  );
};

export default Index;
