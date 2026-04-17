type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cafe-brown-100 text-cafe-brown-500">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="font-medium text-cafe-brown-800">{title}</p>
        {description && (
          <p className="text-sm text-cafe-brown-500">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
