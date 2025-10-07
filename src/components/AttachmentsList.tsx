import { useState, useEffect } from "react";
import { FileText, Image as ImageIcon, File, Download, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FilePreview } from "./FilePreview";

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

interface AttachmentsListProps {
  topicId: string;
  refreshTrigger?: number;
  onAttachmentDeleted?: () => void;
}

export const AttachmentsList = ({ topicId, refreshTrigger, onAttachmentDeleted }: AttachmentsListProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("topic_id", topicId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar anexos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [topicId, refreshTrigger]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-blue-500" />;
    if (fileType === "application/pdf") return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from("attachments")
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Download iniciado!");
    } catch (error: any) {
      console.error("Erro no download:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Tem certeza que deseja excluir o arquivo "${attachment.file_name}"?`)) return;

    try {
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("attachments")
        .delete()
        .eq("id", attachment.id);

      if (dbError) throw dbError;

      toast.success("Arquivo excluído!");
      
      // Verificar se ainda há anexos restantes
      const { count } = await supabase
        .from("attachments")
        .select("*", { count: "exact", head: true })
        .eq("topic_id", topicId);

      // Se não houver mais anexos, desmarcar o tópico como concluído
      if (count === 0) {
        await supabase
          .from("topics")
          .update({ completed: false })
          .eq("id", topicId);
      }

      fetchAttachments();
      onAttachmentDeleted?.();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir arquivo");
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando anexos...</p>;
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-2 mt-3">
        <p className="text-sm font-medium text-muted-foreground">
          {attachments.length} anexo{attachments.length !== 1 ? "s" : ""}
        </p>
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 rounded-lg border bg-card/50 p-3 text-sm"
            >
              {getFileIcon(attachment.file_type)}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{attachment.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {(attachment.file_size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewFile(attachment)}
                  className="h-8 w-8"
                  title="Visualizar"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(attachment)}
                  className="h-8 w-8"
                  title="Baixar"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(attachment)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {previewFile && (
        <FilePreview
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          fileName={previewFile.file_name}
          filePath={previewFile.file_path}
          fileType={previewFile.file_type}
        />
      )}
    </>
  );
};
