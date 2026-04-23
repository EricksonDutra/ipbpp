import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { logAuth } from "@/lib/authTelemetry";

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin, isActive } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  logAuth("protected_route_check", {
    target: location.pathname,
    adminOnly,
    hasUser: !!user,
    isAdmin,
    isActive,
  });

  if (!user) {
    logAuth("protected_route_redirect", { from: location.pathname, to: "/membros", reason: "no_user" });
    return <Navigate to="/membros" replace />;
  }
  if (!isActive && !isAdmin) {
    logAuth("protected_route_redirect", { from: location.pathname, to: "/membros", reason: "inactive_non_admin" });
    return <Navigate to="/membros" replace />;
  }
  if (adminOnly && !isAdmin) {
    logAuth("protected_route_redirect", { from: location.pathname, to: "/dashboard", reason: "not_admin" });
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
