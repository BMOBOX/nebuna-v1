import React from "react";
import type { QuickAction } from "@/types/chat";

interface QuickActionsProps {
  actions: QuickAction[];
  onActionClick: (prompt: string) => void;
}

export function QuickActions({ actions, onActionClick }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onActionClick(action.prompt)}
          className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm"
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
