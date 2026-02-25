import { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

interface AttendanceItem {
  id: string;
  date: string;
  isJustified: boolean;
  reason?: string;
  period?: number;
  session?: string;
  [key: string]: any;
}

interface AttendanceCalendarViewProps {
  items: AttendanceItem[];
  type: 'absences' | 'lates';
  getEntityName?: (item: AttendanceItem) => string;
  onEdit?: (item: AttendanceItem) => void;
  onDelete?: (item: AttendanceItem) => void;
  showEntity?: boolean;
}

export function AttendanceCalendarView({ items, type, getEntityName, onEdit, onDelete, showEntity = true }: AttendanceCalendarViewProps) {
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const dateMap = useMemo(() => {
    const map = new Map<string, AttendanceItem[]>();
    items.forEach(item => {
      const key = item.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return map;
  }, [items]);

  const datesWithRecords = useMemo(() => {
    return Array.from(dateMap.keys()).map(d => parseISO(d));
  }, [dateMap]);

  const selectedItems = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return dateMap.get(key) || [];
  }, [selectedDate, dateMap]);

  const modifiers = useMemo(() => {
    const justified: Date[] = [];
    const unjustified: Date[] = [];
    const mixed: Date[] = [];

    dateMap.forEach((dayItems, dateStr) => {
      const date = parseISO(dateStr);
      const allJustified = dayItems.every(i => i.isJustified);
      const allUnjustified = dayItems.every(i => !i.isJustified);
      if (allJustified) justified.push(date);
      else if (allUnjustified) unjustified.push(date);
      else mixed.push(date);
    });

    return { justified, unjustified, mixed };
  }, [dateMap]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-shrink-0">
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={month}
              onMonthChange={setMonth}
              className="pointer-events-auto"
              modifiers={modifiers}
              modifiersClassNames={{
                justified: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-bold',
                unjustified: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 font-bold',
                mixed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 font-bold',
              }}
            />
            <div className="flex gap-3 px-3 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/50" /> Justified</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900/50" /> Unjustified</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-200 dark:bg-yellow-900/50" /> Mixed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-0">
          <CardContent className="p-4">
            {!selectedDate ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Click a date to view {type}</p>
            ) : (
              <div className="space-y-3">
                <h3 className="font-medium text-sm">{format(selectedDate, 'EEEE, MMMM d, yyyy')} — {selectedItems.length} {type}</h3>
                {selectedItems.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No {type} on this date</p>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map(item => (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-md border bg-muted/30">
                        <div className="flex-1 min-w-0 space-y-1">
                          {showEntity && getEntityName && <p className="font-medium text-sm">{getEntityName(item)}</p>}
                          {item.session && <p className="text-xs text-muted-foreground">{item.session}</p>}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={item.isJustified ? 'default' : 'destructive'} className="text-xs">
                              {item.isJustified ? 'Justified' : 'Unjustified'}
                            </Badge>
                            {type === 'lates' && item.period && <Badge variant="outline" className="text-xs">{item.period} min</Badge>}
                          </div>
                          {item.reason && <p className="text-xs text-muted-foreground">{item.reason}</p>}
                        </div>
                        {(onEdit || onDelete) && (
                          <div className="flex gap-1 flex-shrink-0">
                            {onEdit && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>}
                            {onDelete && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(item)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
