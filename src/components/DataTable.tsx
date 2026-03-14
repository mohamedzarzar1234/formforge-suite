import { useState, useMemo, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Pencil, Trash2, ArrowUpDown, Download, Upload } from 'lucide-react';
import { exportToExcel } from '@/lib/excel-utils';
import { useTranslation } from 'react-i18next';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  isLoading?: boolean;
  pageSize?: number;
  exportFilename?: string;
  onImportClick?: () => void;
}

export function DataTable<T extends { id: string }>({ data, columns, searchPlaceholder, onEdit, onDelete, onView, isLoading, pageSize = 10, exportFilename, onImportClick }: Props<T>) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let items = data;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(item =>
        columns.some(col => {
          const val = col.render ? '' : (item as any)[col.key];
          return typeof val === 'string' && val.toLowerCase().includes(q);
        }) || Object.values((item as any).dynamicFields || {}).some(v => typeof v === 'string' && (v as string).toLowerCase().includes(q))
        || String((item as any).firstname || '').toLowerCase().includes(q)
        || String((item as any).lastname || '').toLowerCase().includes(q)
      );
    }
    if (sortKey) {
      items = [...items].sort((a, b) => {
        const aVal = String((a as any)[sortKey] ?? (a as any).dynamicFields?.[sortKey] ?? '');
        const bVal = String((b as any)[sortKey] ?? (b as any).dynamicFields?.[sortKey] ?? '');
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return items;
  }, [data, search, sortKey, sortOrder, columns]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortOrder(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('asc'); }
  };

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder={searchPlaceholder || `${t('common.search')}...`} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="max-w-sm" />
        <div className="ms-auto flex gap-2">
          {onImportClick && (
            <Button variant="outline" size="sm" onClick={onImportClick}>
              <Upload className="me-2 h-4 w-4" />{t('common.import')}
            </Button>
          )}
          {exportFilename && (
            <Button variant="outline" size="sm" onClick={() => exportToExcel(filtered, columns, exportFilename)}>
              <Download className="me-2 h-4 w-4" />{t('common.export')}
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col.key} className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(col.key)}>
                  <span className="inline-flex items-center gap-1">{col.label} <ArrowUpDown className="h-3 w-3 opacity-50" /></span>
                </TableHead>
              ))}
              {(onView || onEdit || onDelete) && <TableHead className="w-24">{t('common.actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground py-8">{t('common.noRecords')}</TableCell></TableRow>
            ) : paginated.map(item => (
              <TableRow key={item.id}>
                {columns.map(col => (
                  <TableCell key={col.key} className="whitespace-nowrap">
                    {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                  </TableCell>
                ))}
                {(onView || onEdit || onDelete) && (
                  <TableCell>
                    <div className="flex gap-1">
                      {onView && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(item)}><Eye className="h-4 w-4" /></Button>}
                      {onEdit && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>}
                      {onDelete && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(item)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t('common.page')} {page + 1} {t('common.of')} {totalPages} · {filtered.length} {t('common.records')}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>{t('common.previous')}</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>{t('common.next')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}