import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FolderCard } from "@/components/FolderCard";
import { FolderDialog } from "@/components/FolderDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AuthForm } from "@/components/AuthForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User, Session } from "@supabase/supabase-js";
import { downloadFolderAsZip } from "@/utils/downloadFolder";

const DEFAULT_TOPICS = [
  "Registro de Imóvel",
  "Recibo CAR",
  "DCAA",
  "CCIR",
  "DAP",
  "Ficha Sanitária",
  "Documento de Identidade",
  "Comprovante de residência",
  "Comprovante de Renda",
  "Certidão de casamento",
  "Documento de identidade do cônjuge",
  "Comprovante de renda do Cônjuge",
  "Declaração Consolidada",
  "Declaração de Não desmatamento Irregular",
  "Declaração de Regularidade Ambiental",
  "Autorização de Modificação no Projeto",
  "Contrato Particular de Prestação de Assessoria Empresarial e Técnica",
  "Documento de Identidade do Avalista",
  "Comprovante de residência do Avalista",
  "Comprovante de renda do Avalista",
  "Certidão de casamento do Avalista",
  "Comprovante de renda do cônjuge do avalista",
];

interface Folder {
  id: string;
  name: string;
  totalTopics: number;
  completedTopics: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user]);

  const fetchFolders = async () => {
    try {
      const { data: foldersData, error: foldersError } = await supabase
        .from("folders")
        .select("*")
        .order("created_at", { ascending: false });

      if (foldersError) throw foldersError;

      const foldersWithStats = await Promise.all(
        (foldersData || []).map(async (folder) => {
          const { data: topics, error: topicsError } = await supabase
            .from("topics")
            .select("completed")
            .eq("folder_id", folder.id);

          if (topicsError) throw topicsError;

          return {
            id: folder.id,
            name: folder.name,
            totalTopics: topics?.length || 0,
            completedTopics: topics?.filter((t) => t.completed).length || 0,
          };
        })
      );

      setFolders(foldersWithStats);
    } catch (error: any) {
      console.error("Erro ao carregar pastas:", error);
      toast.error("Erro ao carregar pastas");
    }
  };

  const handleSaveFolder = async (name: string) => {
    try {
      if (editingFolder) {
        const { error } = await supabase
          .from("folders")
          .update({ name })
          .eq("id", editingFolder.id);

        if (error) throw error;
        toast.success("Pasta atualizada!");
      } else {
        const { data: newFolder, error: folderError } = await supabase
          .from("folders")
          .insert({ name, user_id: user!.id })
          .select()
          .single();

        if (folderError) throw folderError;

        // Criar tópicos padrão
        const topicsToInsert = DEFAULT_TOPICS.map((title) => ({
          title,
          folder_id: newFolder.id,
          completed: false,
        }));

        const { error: topicsError } = await supabase
          .from("topics")
          .insert(topicsToInsert);

        if (topicsError) throw topicsError;

        toast.success("Pasta criada com tópicos padrão!");
      }

      fetchFolders();
      setEditingFolder(null);
    } catch (error: any) {
      console.error("Erro ao salvar pasta:", error);
      toast.error(error.message || "Erro ao salvar pasta");
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    setFolderToDelete({ id: folderId, name: folderName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      const { error } = await supabase.from("folders").delete().eq("id", folderToDelete.id);
      if (error) throw error;

      toast.success("Pasta excluída!");
      fetchFolders();
    } catch (error: any) {
      console.error("Erro ao excluir pasta:", error);
      toast.error("Erro ao excluir pasta");
    } finally {
      setFolderToDelete(null);
    }
  };

  const handleDownloadFolder = async (folderId: string, folderName: string) => {
    try {
      toast.loading("Preparando download...");
      const result = await downloadFolderAsZip(folderId, folderName);
      
      toast.dismiss();
      
      if (result.failedFiles > 0) {
        toast.success(
          `Download concluído! ${result.downloadedFiles} de ${result.totalFiles} arquivos baixados.`,
          { description: `${result.failedFiles} arquivo(s) apresentaram erro.` }
        );
      } else {
        toast.success(`Download concluído! ${result.downloadedFiles} arquivo(s) baixados.`);
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Erro ao baixar pasta");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado!");
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

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen gradient-subtle">
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
                  Bem-vindo, {user.email}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <ThemeToggle />
              <Button 
                onClick={() => { setEditingFolder(null); setDialogOpen(true); }} 
                className="gap-2 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Nova Pasta
              </Button>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

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
                onEdit={() => { setEditingFolder(folder); setDialogOpen(true); }}
                onDelete={() => handleDeleteFolder(folder.id, folder.name)}
                onDownload={() => handleDownloadFolder(folder.id, folder.name)}
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteFolder}
        title="Excluir Pasta"
        description={`Deseja realmente excluir a pasta "${folderToDelete?.name}"? Todos os tópicos e anexos serão perdidos permanentemente.`}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default Index;
