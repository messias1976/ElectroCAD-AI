import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import AppRoutes from "./routes/AppRoutes";

const publicPaths = ["/", "/login", "/register"];

export default function App() {
  const location = useLocation();
  const isPublicLayout = useMemo(
    () => publicPaths.includes(location.pathname),
    [location.pathname],
  );

  if (isPublicLayout) {
    return (
      <div className="min-h-screen bg-slate-100">
        <main className="min-h-screen">
          <AppRoutes />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />

        <main className="flex-1 p-6 overflow-auto">
          <AppRoutes />
        </main>
      </div>
    </div>
  );
}
