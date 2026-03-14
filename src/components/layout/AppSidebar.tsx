import { 
  LayoutDashboard, GraduationCap, Users, UserCircle, Briefcase, 
  School, Layers, BookOpen, Settings, ChevronDown, GraduationCap as EduIcon,
  CalendarCheck, ClipboardList, FileQuestion, Library, FileText, Award,
  StickyNote, Star, FileStack, CalendarClock, ClipboardCheck
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useState } from 'react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const sections = [
  {
    key: 'management',
    labelKey: 'nav.management',
    items: [
      { titleKey: 'nav.students', url: '/students', icon: GraduationCap },
      { titleKey: 'nav.teachers', url: '/teachers', icon: Users },
      { titleKey: 'nav.parents', url: '/parents', icon: UserCircle },
      { titleKey: 'nav.managers', url: '/managers', icon: Briefcase },
      { titleKey: 'nav.classes', url: '/classes', icon: School },
      { titleKey: 'nav.levels', url: '/levels', icon: Layers },
    ],
  },
  {
    key: 'attendance',
    labelKey: 'nav.attendance',
    items: [
      { titleKey: 'nav.studentAttendance', url: '/attendance/students', icon: CalendarCheck },
      { titleKey: 'nav.teacherAttendance', url: '/attendance/teachers', icon: ClipboardList },
      { titleKey: 'nav.managerAttendance', url: '/attendance/managers', icon: CalendarCheck },
    ],
  },
  {
    key: 'exam',
    labelKey: 'nav.onlineExam',
    items: [
      { titleKey: 'nav.subjects', url: '/subjects', icon: BookOpen },
      { titleKey: 'nav.lessons', url: '/lessons', icon: Library },
      { titleKey: 'nav.questions', url: '/questions', icon: FileQuestion },
      { titleKey: 'nav.markRecords', url: '/mark-records', icon: Award },
      { titleKey: 'nav.exams', url: '/exams', icon: FileText },
      { titleKey: 'nav.externalExams', url: '/external-exams', icon: ClipboardList },
    ],
  },
  {
    key: 'notepoint',
    labelKey: 'nav.notePoint',
    items: [
      { titleKey: 'nav.noteTemplates', url: '/note-templates', icon: FileStack },
      { titleKey: 'nav.notes', url: '/notes', icon: StickyNote },
      { titleKey: 'nav.points', url: '/points', icon: Star },
    ],
  },
  {
    key: 'surveys',
    labelKey: 'nav.surveys',
    items: [
      { titleKey: 'nav.surveys', url: '/surveys', icon: ClipboardCheck },
    ],
  },
  {
    key: 'timetable',
    labelKey: 'nav.timetable',
    items: [
      { titleKey: 'nav.timetable', url: '/timetable', icon: CalendarClock },
    ],
  },
];

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [openSection, setOpenSection] = useState<string | null>('management');

  const toggleSection = (key: string) => {
    setOpenSection(prev => prev === key ? null : key);
  };

  return (
    <Sidebar className="border-r-0" side={isRTL ? 'right' : 'left'}>
      <div className="p-5 border-b border-sidebar-border flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <EduIcon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-bold text-sm tracking-tight text-sidebar-foreground">EduManage</h2>
          <p className="text-xs text-sidebar-foreground/50">School Management</p>
        </div>
      </div>

      <SidebarContent className="px-3 py-4">
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/" 
                    end 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    activeClassName="!bg-primary !text-primary-foreground font-medium"
                  >
                    <LayoutDashboard className="h-[18px] w-[18px]" />
                    <span className="text-sm">{t('nav.dashboard')}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {sections.map(section => (
          <SidebarGroup key={section.key}>
            <Collapsible open={openSection === section.key} onOpenChange={() => toggleSection(section.key)}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors">
                <span>{t(section.labelKey)}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", openSection === section.key && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map(item => (
                      <SidebarMenuItem key={item.titleKey}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={item.url}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                            activeClassName="!bg-primary !text-primary-foreground font-medium"
                          >
                            <item.icon className="h-[18px] w-[18px]" />
                            <span className="text-sm">{t(item.titleKey)}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        ))}

        <div className="flex-1" />

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    activeClassName="!bg-primary !text-primary-foreground font-medium"
                  >
                    <Settings className="h-[18px] w-[18px]" />
                    <span className="text-sm">{t('nav.settings')}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
