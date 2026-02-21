import { FieldDefinition } from '@/types';
import { Badge } from '@/components/ui/badge';

interface DynamicViewProps {
  fields: FieldDefinition[];
  data: Record<string, any>;
  extraSections?: React.ReactNode;
}

export function DynamicView({ fields, data, extraSections }: DynamicViewProps) {
  const visible = fields.filter(f => f.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map(field => (
          <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{field.label}</p>
            <div className="text-sm">{renderValue(field, data[field.name])}</div>
          </div>
        ))}
      </div>
      {extraSections}
    </div>
  );
}

function renderValue(field: FieldDefinition, value: any) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-muted-foreground italic">—</span>;
  }
  switch (field.type) {
    case 'multi-select':
      if (!Array.isArray(value) || value.length === 0) return <span className="text-muted-foreground italic">—</span>;
      return (
        <div className="flex gap-1 flex-wrap">
          {value.map((v: string) => {
            const opt = field.options?.find(o => o.value === v);
            return <Badge key={v} variant="secondary">{opt?.label || v}</Badge>;
          })}
        </div>
      );
    case 'select': {
      const opt = field.options?.find(o => o.value === value);
      return <span>{opt?.label || value}</span>;
    }
    default:
      return <span>{String(value)}</span>;
  }
}
