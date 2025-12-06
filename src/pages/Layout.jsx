
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  BookOpen, 
  BarChart2, 
  Inbox, 
  FileText, 
  Users, 
  Settings, 
  Bell,
  Search,
  Menu,
  LayoutGrid,
  MessageSquare,
  FolderKanban,
  ChevronDown,
  Briefcase,
  GraduationCap,
  TrendingUp,
  HeartHandshake,
  ClipboardList,
  Folder,
  BookMarked,
  MessageCircleQuestion,
  FileCheck,
  PieChart,
  Shield
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NoiProvider } from '@/components/core/NoiContext';
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';
import AIAssistantWidget from '@/components/ai/AIAssistantWidget';

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [workOpen, setWorkOpen] = useState(true);
  const [learningOpen, setLearningOpen] = useState(true);
  const [insightOpen, setInsightOpen] = useState(true);
  const [supportOpen, setSupportOpen] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.log("Not logged in");
      }
    };
    fetchUser();
    
    // Check if dark mode should be applied (default to dark for this app based on design)
    document.documentElement.classList.add('dark');
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role_type === 'org_admin' || user?.role_type === 'platform_admin';
  const isManager = isAdmin || user?.role_type === 'manager' || user?.role_type === 'exec';
  const isNDG = user?.role_type === 'ndg' || user?.role_type === 'sap';

  const navGroups = {
    home: { icon: Home, label: 'Home', path: 'Home' },
    work: {
      icon: Briefcase,
      label: 'Work',
      items: [
        { icon: Inbox, label: 'Inbox', path: 'Inbox' },
        { icon: CheckSquare, label: 'Tasks', path: 'Tasks' },
        { icon: FolderKanban, label: 'Projects', path: 'Projects' },
        { icon: LayoutGrid, label: 'Planner', path: 'Planner' },
        { icon: CalendarIcon, label: 'Calendar', path: 'Calendar' },
        { icon: FileText, label: 'Notes', path: 'Notes' },
      ]
    },
    learning: {
      icon: GraduationCap,
      label: 'Learning',
      items: [
        { icon: BookOpen, label: 'Learning', path: 'Learning' },
      ]
    },
    insight: {
      icon: TrendingUp,
      label: 'Insight',
      items: [
        { icon: BarChart2, label: 'Intelligence', path: 'Intelligence' },
        { icon: MessageSquare, label: 'Goals & KPIs', path: 'GoalsKPIs' },
        { icon: Users, label: 'Teams', path: 'Teams' },
        { icon: BarChart2, label: 'Team Insights', path: 'TeamInsights', adminOnly: true },
        { icon: Settings, label: 'Admin', path: 'Admin' },
      ]
    },
    support: {
      icon: HeartHandshake,
      label: 'Support',
      items: [
        { icon: HeartHandshake, label: 'My Support', path: 'MySupport' },
        { icon: ClipboardList, label: 'Intake & Referrals', path: 'IntakeReferrals' },
        { icon: Folder, label: 'Cases', path: 'Cases' },
        { icon: BookMarked, label: 'Strengths & Challenges', path: 'StrengthsChallenges' },
        { icon: MessageCircleQuestion, label: 'Manager Guidance', path: 'ManagerGuidance' },
        { icon: FileCheck, label: 'Alignment Plans', path: 'AlignmentPlans' },
        { icon: PieChart, label: 'Support Insights', path: 'SupportInsights', ndgOnly: true },
        { icon: Shield, label: 'Support Admin', path: 'SupportAdmin', ndgOnly: true },
      ]
    }
  };

  const isActive = (path) => currentPageName === path;

  return (
    <NoiProvider>
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
          fixed lg:relative w-64 ${isSidebarOpen ? 'lg:w-64' : 'lg:w-20'}
          h-full border-r border-border bg-sidebar transition-all duration-300 ease-in-out flex flex-col
          z-40 lg:z-20
        `}
      >
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              N
            </div>
            <span className={`${!isSidebarOpen ? 'lg:hidden' : ''}`}>Noi</span>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
          {/* Home */}
          <Link 
            to={createPageUrl(navGroups.home.path)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive(navGroups.home.path) 
                ? 'bg-[#2a2d32] text-[#1c9cf0]' 
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}
            `}
          >
            <navGroups.home.icon className="w-5 h-5" />
            {isSidebarOpen && <span>{navGroups.home.label}</span>}
          </Link>

          {/* Work Group */}
          <Collapsible open={workOpen} onOpenChange={setWorkOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
              <div className="flex items-center gap-2">
                <navGroups.work.icon className="w-4 h-4" />
                {isSidebarOpen && <span>{navGroups.work.label}</span>}
              </div>
              {isSidebarOpen && <ChevronDown className={`w-4 h-4 transition-transform ${workOpen ? 'rotate-180' : ''}`} />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {navGroups.work.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link 
                    key={item.path} 
                    to={createPageUrl(item.path)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive(item.path) 
                        ? 'bg-[#2a2d32] text-[#1c9cf0]' 
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}
                    `}
                  >
                    <IconComponent className="w-4 h-4 ml-2" />
                    {isSidebarOpen && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          {/* Learning Group */}
          <Collapsible open={learningOpen} onOpenChange={setLearningOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
              <div className="flex items-center gap-2">
                <navGroups.learning.icon className="w-4 h-4" />
                {isSidebarOpen && <span>{navGroups.learning.label}</span>}
              </div>
              {isSidebarOpen && <ChevronDown className={`w-4 h-4 transition-transform ${learningOpen ? 'rotate-180' : ''}`} />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {navGroups.learning.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link 
                    key={item.path} 
                    to={createPageUrl(item.path)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive(item.path) 
                        ? 'bg-[#2a2d32] text-[#1c9cf0]' 
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}
                    `}
                  >
                    <IconComponent className="w-4 h-4 ml-2" />
                    {isSidebarOpen && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          {/* Insight Group */}
          <Collapsible open={insightOpen} onOpenChange={setInsightOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
              <div className="flex items-center gap-2">
                <navGroups.insight.icon className="w-4 h-4" />
                {isSidebarOpen && <span>{navGroups.insight.label}</span>}
              </div>
              {isSidebarOpen && <ChevronDown className={`w-4 h-4 transition-transform ${insightOpen ? 'rotate-180' : ''}`} />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {navGroups.insight.items.map((item) => {
                if (item.adminOnly && !isAdmin && !isManager) return null;
                const IconComponent = item.icon;
                return (
                  <Link 
                    key={item.path} 
                    to={createPageUrl(item.path)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive(item.path) 
                        ? 'bg-[#2a2d32] text-[#1c9cf0]' 
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}
                    `}
                  >
                    <IconComponent className="w-4 h-4 ml-2" />
                    {isSidebarOpen && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          {/* Support Group */}
          <Collapsible open={supportOpen} onOpenChange={setSupportOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
              <div className="flex items-center gap-2">
                <navGroups.support.icon className="w-4 h-4" />
                {isSidebarOpen && <span>{navGroups.support.label}</span>}
              </div>
              {isSidebarOpen && <ChevronDown className={`w-4 h-4 transition-transform ${supportOpen ? 'rotate-180' : ''}`} />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {navGroups.support.items.map((item) => {
                if (item.ndgOnly && !isNDG && !isAdmin) return null;
                const IconComponent = item.icon;
                return (
                  <Link 
                    key={item.path} 
                    to={createPageUrl(item.path)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive(item.path) 
                        ? 'bg-[#2a2d32] text-[#1c9cf0]' 
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}
                    `}
                  >
                    <IconComponent className="w-4 h-4 ml-2" />
                    {isSidebarOpen && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
          </nav>

        <div className="p-4 border-t border-border/50">
          <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'lg:justify-center justify-start gap-3'}`}>
            <Avatar className="w-9 h-9 border border-border flex-shrink-0">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.first_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className={`flex-1 min-w-0 ${!isSidebarOpen ? 'lg:hidden' : ''}`}>
              <p className="text-sm font-medium truncate">{user?.first_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || 'guest@noi.os'}</p>
            </div>
            <Settings className={`w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground flex-shrink-0 ${!isSidebarOpen ? 'lg:hidden' : ''}`} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-900 relative w-full lg:w-auto overflow-x-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-border/50 bg-neutral-900/80 backdrop-blur-md sticky top-0 z-10 overflow-x-hidden">
          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="-ml-2"
            >
               <Menu className="w-5 h-5" />
            </Button>
            <div className="relative hidden lg:block w-96">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <input 
                  type="text" 
                  placeholder="Search tasks, notes, or learning..." 
                  className="w-full bg-input border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
               />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsDropdown user={user} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full overflow-x-hidden">
            {children}
          </div>
        </div>
      </main>

      {/* AI Assistant Widget */}
      <AIAssistantWidget currentPage={currentPageName} />
      </div>
      </NoiProvider>
      );
      }
