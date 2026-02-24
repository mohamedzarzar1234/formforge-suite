import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Index";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Teachers from "./pages/Teachers";
import TeacherDetail from "./pages/TeacherDetail";
import Parents from "./pages/Parents";
import ParentDetail from "./pages/ParentDetail";
import Managers from "./pages/Managers";
import ManagerDetail from "./pages/ManagerDetail";
import Classes from "./pages/Classes";
import Levels from "./pages/Levels";
import Subjects from "./pages/Subjects";
import Settings from "./pages/Settings";
import StudentAttendance from "./pages/StudentAttendance";
import TeacherAttendance from "./pages/TeacherAttendance";
import ManagerAttendance from "./pages/ManagerAttendance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/teachers/:id" element={<TeacherDetail />} />
            <Route path="/parents" element={<Parents />} />
            <Route path="/parents/:id" element={<ParentDetail />} />
            <Route path="/managers" element={<Managers />} />
            <Route path="/managers/:id" element={<ManagerDetail />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/levels" element={<Levels />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/attendance/students" element={<StudentAttendance />} />
            <Route path="/attendance/teachers" element={<TeacherAttendance />} />
            <Route path="/attendance/managers" element={<ManagerAttendance />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
