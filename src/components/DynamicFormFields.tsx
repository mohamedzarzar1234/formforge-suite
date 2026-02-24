import type { Control } from 'react-hook-form';
import type { FieldDefinition } from '@/types';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  fields: FieldDefinition[];
  control: Control<any>;
}

export function DynamicFormFields({ fields, control }: Props) {
  const visibleFields = [...fields].filter(f => f.visible).sort((a, b) => a.order - b.order);

  return (
    <>
      {visibleFields.map(field => (
        <DynamicField key={field.name} field={field} control={control} />
      ))}
    </>
  );
}

function DynamicField({ field, control }: { field: FieldDefinition; control: Control<any> }) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'number':
      return (
        <FormField control={control} name={field.name} render={({ field: f }) => (
          <FormItem>
            <FormLabel>{field.label}{field.required && ' *'}</FormLabel>
            <FormControl>
              <Input
                type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : 'text'}
                placeholder={field.placeholder || ''}
                {...f}
                value={f.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      );

    case 'date':
      return (
        <FormField control={control} name={field.name} render={({ field: f }) => (
          <FormItem>
            <FormLabel>{field.label}{field.required && ' *'}</FormLabel>
            <FormControl>
              <Input type="date" {...f} value={f.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      );

    case 'textarea':
      return (
        <FormField control={control} name={field.name} render={({ field: f }) => (
          <FormItem>
            <FormLabel>{field.label}{field.required && ' *'}</FormLabel>
            <FormControl>
              <Textarea placeholder={field.placeholder || ''} {...f} value={f.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      );

    case 'select':
      return (
        <FormField control={control} name={field.name} render={({ field: f }) => (
          <FormItem>
            <FormLabel>{field.label}{field.required && ' *'}</FormLabel>
            <Select onValueChange={f.onChange} value={f.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder || 'Select...'} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {field.options?.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      );

    case 'multi-select':
      return (
        <FormField control={control} name={field.name} render={({ field: f }) => (
          <FormItem>
            <FormLabel>{field.label}{field.required && ' *'}</FormLabel>
            <div className="space-y-2 rounded-md border p-3 max-h-40 overflow-auto">
              {field.options?.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={(f.value || []).includes(opt.value)}
                    onCheckedChange={(checked) => {
                      const val = f.value || [];
                      f.onChange(checked ? [...val, opt.value] : val.filter((v: string) => v !== opt.value));
                    }}
                  />
                  {opt.label}
                </label>
              ))}
              {(!field.options || field.options.length === 0) && (
                <p className="text-sm text-muted-foreground">No options configured</p>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )} />
      );

    case 'file':
      return (
        <FormField control={control} name={field.name} render={({ field: f }) => (
          <FormItem>
            <FormLabel>{field.label}{field.required && ' *'}</FormLabel>
            <FormControl>
              <Input type="file" onChange={(e) => f.onChange(e.target.files?.[0]?.name || '')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      );

    default:
      return null;
  }
}
