import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { parentApi, subjectApi, templateApi } from '@/services/api';
import { buildDynamicSchema, getDynamicDefaults } from '@/lib/schema-builder';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DynamicFormFields } from '@/components/DynamicFormFields';

export function InlineParentCreate({ onCreated }: { onCreated?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data: tplRes } = useQuery({ queryKey: ['templates'], queryFn: () => templateApi.get() });
  const fields = tplRes?.data?.parent?.fields || [];

  const schema = z.object({
    firstname: z.string().min(1, 'Required'),
    lastname: z.string().min(1, 'Required'),
    ...buildDynamicSchema(fields),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { firstname: '', lastname: '', ...getDynamicDefaults(fields) },
  });

  useEffect(() => {
    if (open) {
      form.reset({ firstname: '', lastname: '', ...getDynamicDefaults(fields) });
    }
  }, [open, fields, form]);

  const mut = useMutation({
    mutationFn: (d: any) => {
      const { firstname, lastname, ...rest } = d;
      return parentApi.create({ firstname, lastname, studentIds: [], dynamicFields: rest });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['parents'] });
      setOpen(false);
      form.reset();
      toast.success('Parent created');
      onCreated?.(res.data.id);
    },
  });

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-3 w-3" />New Parent
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Parent</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => mut.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstname" render={({ field }) => (
                  <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lastname" render={({ field }) => (
                  <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DynamicFormFields fields={fields} control={form.control} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mut.isPending}>{mut.isPending ? 'Creating...' : 'Create'}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function InlineSubjectCreate({ onCreated }: { onCreated?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const subjectSchema = z.object({
    name: z.string().min(1, 'Required'),
    code: z.string().min(1, 'Required'),
    description: z.string().optional(),
  });
  const form = useForm({ resolver: zodResolver(subjectSchema), defaultValues: { name: '', code: '', description: '' } });
  const mut = useMutation({
    mutationFn: (d: any) => subjectApi.create(d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      setOpen(false);
      form.reset();
      toast.success('Subject created');
      onCreated?.(res.data.id);
    },
  });

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-3 w-3" />New Subject
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => mut.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Code *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mut.isPending}>{mut.isPending ? 'Creating...' : 'Create'}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
