import { cn } from "@/lib/utils";
import { type Tag } from "@shared/schema";
import { X } from "lucide-react";

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  className?: string;
  removable?: boolean;
}

export function TagBadge({ tag, onRemove, className, removable = false }: TagBadgeProps) {
  const bgStyle = {
    backgroundColor: `${tag.color}20`, // 20% opacity
  };
  
  const textStyle = {
    color: tag.color,
  };
  
  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-xs inline-flex items-center",
      className
    )} style={bgStyle}>
      <span className="mr-1" style={textStyle}>{tag.name}</span>
      {removable && onRemove && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-black/20 rounded-full p-0.5"
        >
          <X size={10} style={textStyle} />
        </button>
      )}
    </span>
  );
}
