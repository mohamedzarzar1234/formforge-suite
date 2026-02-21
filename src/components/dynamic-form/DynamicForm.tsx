import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, ReactNode } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FieldDefinition } from '@/types';

function buildZodSchema(fields: FieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  fields.forEach(field => {
    let s: z.ZodTypeAny;
    switch (field.type) {
      case 'email':
        s = field.required
          ? z.string().min(1, `${field.label} is required`).email('Invalid email')
          : z.union([z.string().email('Invalid email'), z.literal('')]).optional();
        break;
      case 'number':
        s = field.required
          ? z.coerce.number({ invalid_type_error: `${field.label} must be a number` })
          : z.union([z.coerce.number(), z.literal('')]).optional();
        break;
      case 'multi-select':
        s = field.required
          ? z.array(z.string()).min(1, 'Select at least one')
          : z.array(z.string()).optional();
        break;
      case 'file':
        s = z.any().optional();
        break;
      default:
        s = field.required
          ? z.string().min(1, `${field.label} is required`)
          : z.string().optional();
    }
    shape[field.name] = s;
  });
  return z.object(shape);
}

interface DynamicFormProps {
  fields: FieldDefinition[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  extraFieldsBefore?: ReactNode;
  extraFieldsAfter?: ReactNode;
}

export function DynamicForm({ fields, initialData, onSubmit, onCancel, isLoading, extraFieldsBefore, extraFieldsAfter }: DynamicFormProps) {
  const visible = useMemo(() => fields.filter(f => f.visible).sort((a, b) => a.order - b.order), [fields]);
  const schema = useMemo(() => buildZodSchema(visible), [visible]);

  const defaults = useMemo(() => {
    const d: Record<string, any> = {};
    visible.forEach(f => {
      d[f.name] = initialData?.[f.name] ?? f.defaultValue ?? (f.type === 'multi-select' ? [] : '');
    });
    return d;
  }, [visible, initialData]);

  const form = useForm({ resolver: zodResolver(schema), defaultValues: defaults });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {extraFieldsBefore}
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map(field => (
            <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <FormField
                control={form.control}
                name={field.name}
                render={({ field: ff }) => (
                  <FormItem>
                    <FormLabel>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
                    <FormControl>{renderInput(field, ff)}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
        {extraFieldsAfter}
        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        </div>
      </form>
    </Form>
  );
}

function renderInput(fd: FieldDefinition, ff: any) {
  switch (fd.type) {
    case 'textarea': return <Textarea {...ff} placeholder={fd.placeholder} />;
    case 'select': return (
      <Select onValueChange={ff.onChange} value={ff.value || ''}>
        <SelectTrigger><SelectValue placeholder={fd.placeholder || 'Select...'} /></SelectTrigger>
        <SelectContent>
          {fd.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
    case 'multi-select': return (
      <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-auto">
        {fd.options?.length ? fd.options.map(o => (
          <label key={o.value} className="flex items-center gap-2">
            <Checkbox checked={ff.value?.includes(o.value)} onCheckedChange={checked => {
              ff.onChange(checked ? [...(ff.value || []), o.value] : (ff.value || []).filter((v: string) => v !== o.value));
            }} />
            <span className="text-sm">{o.label}</span>
          </label>
        )) : <p className="text-sm text-muted-foreground">No options configured</p>}
      </div>
    );
    case 'file': return <Input type="file" onChange={e => ff.onChange(e.target.files?.[0])} />;
    case 'date': return <Input type="date" {...ff} />;
    case 'email': return <Input type="email" {...ff} placeholder={fd.placeholder} />;
    case 'phone': return <Input type="tel" {...ff} placeholder={fd.placeholder} />;
    case 'number': return <Input type="number" {...ff} placeholder={fd.placeholder} />;
    default: return <Input {...ff} placeholder={fd.placeholder} />;
  }
}
