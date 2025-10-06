import { Folder, MoreVertical, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FolderCardProps {
  id: string;
  name: string;
  totalTopics: number;
  completedTopics: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const FolderCard = ({
  name,
  totalTopics,
  completedTopics,
  onClick,
  onEdit,
  onDelete,
}: FolderCardProps) => {
  const progress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

  return (
    <Card 
      className="card-hover cursor-pointer group relative overflow-hidden bg-card shadow-[var(--shadow-card)]"
      onClick={onClick}
    >
      <div className="absolute top-0 left-0 w-full h-1 gradient-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-secondary">
            <Folder className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold truncate max-w-[180px]">
            {name}
          </CardTitle>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-semibold text-primary">{Math.round(progress)}%</span>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        <div className="flex items-center justify-between text-sm pt-1">
          <span className="text-muted-foreground">
            {completedTopics} de {totalTopics} tópicos
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
