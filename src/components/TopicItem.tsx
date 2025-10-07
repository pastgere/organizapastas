import { CheckCircle2, Circle, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Topic {
  id: string;
  title: string;
  completed: boolean;
  attachments?: number;
}

interface TopicItemProps {
  topic: Topic;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const TopicItem = ({ topic, onToggle, onEdit, onDelete }: TopicItemProps) => {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
      <button
        onClick={onToggle}
        className="flex-shrink-0 transition-transform hover:scale-110"
      >
        {topic.completed ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-medium transition-all">
          {topic.title}
        </p>
        {topic.attachments !== undefined && topic.attachments > 0 && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {topic.attachments} {topic.attachments === 1 ? "anexo" : "anexos"}
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
