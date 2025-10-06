import { useState, useEffect } from "react";
import { X, Download, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  filePath: string;
  fileType: string;
}

export const FilePreview = ({
  isOpen,
  onClose,
  fileName,
  filePath,
  fileType,
}: FilePreviewProps) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && filePath) {
      loadFile();
    }
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [isOpen, filePath]);

  const loadFile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from("attachments")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setFileUrl(url);
    } catch (error: any) {
      console.error("Erro ao carregar arquivo:", error);
      toast.error("Erro ao carregar visualização");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (fileUrl) {
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Download iniciado!");
    }
  };

  const canPreview = fileType.startsWith("image/") || fileType === "application/pdf";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{fileName}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : canPreview ? (
            <div className="w-full h-full">
              {fileType.startsWith("image/") ? (
                <img
                  src={fileUrl || ""}
                  alt={fileName}
                  className="max-w-full h-auto mx-auto rounded-lg"
                />
              ) : fileType === "application/pdf" ? (
                <iframe
                  src={fileUrl || ""}
                  className="w-full h-[70vh] rounded-lg border"
                  title={fileName}
                />
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <File className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Visualização não disponível
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Este tipo de arquivo não pode ser visualizado no navegador.
              </p>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Baixar Arquivo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
