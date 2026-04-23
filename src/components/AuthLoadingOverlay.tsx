import { useAuth } from "@/contexts/AuthContext";
import { Church } from "lucide-react";

/**
 * Full-screen overlay shown while the auth context is resolving the session
 * and the user profile/roles. Prevents the LoginPage form from flashing and
 * avoids visible redirects between /membros and /dashboard.
 */
export function AuthLoadingOverlay() {
  const { loading } = useAuth();

  if (!loading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando sessão"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Church className="h-8 w-8 text-primary" />
      </div>
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      <p className="text-sm text-muted-foreground">Carregando sua sessão...</p>
    </div>
  );
}
