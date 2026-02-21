import {
  LayoutDashboard, GraduationCap, Users, UserCheck, Shield,
  BookOpen, Layers, Library, Settings,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';

const sections = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'People',
    items: [
      { title: 'Students', url: '/students', icon: GraduationCap },
      { title: 'Teachers', url: '/teachers', icon: Users },
      { title: 'Parents', url: '/parents', icon: UserCheck },
      { title: 'Managers', url: '/managers', icon: Shield },
    ],
  },
  {
    label: 'Academic',
    items: [
      { title: 'Classes', url: '/classes', icon: BookOpen },
      { title: 'Levels', url: '/levels', icon: Layers },
      { title: 'Subjects', url: '/subjects', icon: Library },
    ],
  },
  {
    label: 'System',
    items: [{ title: 'Settings', url: '/settings', icon: Settings }],
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-4 py-5 border-b border-sidebar-border">
          <h2 className="text-lg font-bold tracking-tight text-sidebar-primary-foreground flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            SchoolMS
          </h2>
        </div>
        {sections.map(section => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent/70"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
