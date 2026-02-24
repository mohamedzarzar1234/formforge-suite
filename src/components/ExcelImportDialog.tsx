import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload } from 'lucide-react';
import { parseExcelFile } from '@/lib/excel-utils';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onImport: (rows: Record<string, string>[]) => void;
  expectedColumns: string[];
}

export function ExcelImportDialog({ open, onOpenChange, onImport, expectedColumns }: Props) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseExcelFile(file);
      if (data.length === 0) { toast.error('Empty file'); return; }
      setColumns(Object.keys(data[0]));
      setRows(data);
    } catch {
      toast.error('Failed to parse file');
    }
  };

  const handleImport = () => {
    onImport(rows);
    setRows([]);
    setColumns([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setRows([]); setColumns([]); } onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Import from Excel</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Expected columns: {expectedColumns.join(', ')}</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />Select File
            </Button>
          </div>
          {rows.length > 0 && (
            <>
              <div className="rounded-md border overflow-auto max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>{columns.map(c => <TableHead key={c}>{c}</TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>{columns.map(c => <TableCell key={c}>{row[c]}</TableCell>)}</TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground">Showing {Math.min(10, rows.length)} of {rows.length} rows</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setRows([]); setColumns([]); }}>Clear</Button>
                <Button onClick={handleImport}>Import {rows.length} rows</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
