import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-matrix-primary/10 border border-matrix-primary/20 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-matrix-muted" />
      </div>
      <h3 className="text-sm font-semibold mb-1 text-matrix-text">{title}</h3>
      {description && <p className="text-sm text-matrix-muted max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
