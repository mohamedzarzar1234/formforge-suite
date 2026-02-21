import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react';

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface Props {
  columns: Column[];
  data: any[];
  searchPlaceholder?: string;
  onRowClick?: (row: any) => void;
  actions?: (row: any) => React.ReactNode;
  pageSize?: number;
  headerExtra?: React.ReactNode;
}

export function DataTable({ columns, data, searchPlaceholder, onRowClick, actions, pageSize = 10, headerExtra }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(row => columns.some(c => String(row[c.key] ?? '').toLowerCase().includes(q)));
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={searchPlaceholder || 'Search...'} value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        {headerExtra}
      </div>
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => (
                  <TableHead key={col.key}
                    className={col.sortable ? 'cursor-pointer select-none hover:bg-muted/30' : ''}
                    onClick={() => col.sortable && (sortKey === col.key ? setSortDir(d => d === 'asc' ? 'desc' : 'asc') : (setSortKey(col.key), setSortDir('asc')))}>
                    <div className="flex items-center gap-1">{col.label}{col.sortable && <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}</div>
                  </TableHead>
                ))}
                {actions && <TableHead className="w-[120px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow><TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12 text-muted-foreground">No records found</TableCell></TableRow>
              ) : paged.map((row, i) => (
                <TableRow key={row.id || i} className={onRowClick ? 'cursor-pointer' : ''} onClick={() => onRowClick?.(row)}>
                  {columns.map(col => (
                    <TableCell key={col.key}>{col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}</TableCell>
                  ))}
                  {actions && <TableCell onClick={e => e.stopPropagation()}>{actions(row)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{sorted.length} records · Page {page + 1}/{totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
