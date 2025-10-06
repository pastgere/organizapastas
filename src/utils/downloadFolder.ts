import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  topic_id: string;
}

interface Topic {
  id: string;
  title: string;
}

export async function downloadFolderAsZip(folderId: string, folderName: string) {
  try {
    // Buscar todos os tópicos da pasta
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, title')
      .eq('folder_id', folderId);

    if (topicsError) throw topicsError;

    if (!topics || topics.length === 0) {
      throw new Error('Esta pasta não possui tópicos com anexos');
    }

    // Buscar todos os anexos de todos os tópicos
    const topicIds = topics.map(t => t.id);
    const { data: attachments, error: attachmentsError } = await supabase
      .from('attachments')
      .select('*')
      .in('topic_id', topicIds);

    if (attachmentsError) throw attachmentsError;

    if (!attachments || attachments.length === 0) {
      throw new Error('Esta pasta não possui arquivos para download');
    }

    // Criar um mapa de tópicos para fácil acesso
    const topicsMap = new Map<string, Topic>(
      topics.map(t => [t.id, t])
    );

    // Criar o ZIP
    const zip = new JSZip();

    // Baixar e adicionar cada arquivo ao ZIP
    let successCount = 0;
    let errorCount = 0;

    for (const attachment of attachments) {
      try {
        const topic = topicsMap.get(attachment.topic_id);
        if (!topic) continue;

        // Baixar o arquivo do storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('attachments')
          .download(attachment.file_path);

        if (downloadError) {
          console.error(`Erro ao baixar ${attachment.file_name}:`, downloadError);
          errorCount++;
          continue;
        }

        // Sanitizar o nome do tópico para usar como nome de pasta
        const sanitizedTopicName = topic.title
          .replace(/[^a-z0-9]/gi, '_')
          .replace(/_+/g, '_')
          .substring(0, 50);

        // Adicionar arquivo ao ZIP dentro de uma pasta com nome do tópico
        const folderPath = `${sanitizedTopicName}/${attachment.file_name}`;
        zip.file(folderPath, fileData);
        successCount++;
      } catch (err) {
        console.error(`Erro ao processar anexo ${attachment.file_name}:`, err);
        errorCount++;
      }
    }

    if (successCount === 0) {
      throw new Error('Não foi possível baixar nenhum arquivo');
    }

    // Gerar o ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Criar link de download
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${folderName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      downloadedFiles: successCount,
      failedFiles: errorCount,
      totalFiles: attachments.length
    };
  } catch (error) {
    console.error('Erro ao baixar pasta:', error);
    throw error;
  }
}
