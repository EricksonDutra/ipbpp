import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isPastor: boolean;
  isActive: boolean;
  roles: string[];
  profile: { full_name: string; phone: string | null; active: boolean } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPastor, setIsPastor] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchUserData = async (userId: string) => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, active").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setIsActive(profileRes.data.active);
      } else {
        setProfile(null);
        setIsActive(false);
      }

      if (rolesRes.data) {
        const roleList = rolesRes.data.map((r) => r.role);
        setRoles(roleList);
        setIsAdmin(roleList.includes("admin"));
        setIsPastor(roleList.includes("pastor"));
      } else {
        setRoles([]);
        setIsAdmin(false);
        setIsPastor(false);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const clearUserData = () => {
    setProfile(null);
    setIsAdmin(false);
    setIsPastor(false);
    setIsActive(false);
    setRoles([]);
    setProfileLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Mark profile as loading so consumers wait for roles/profile
          setProfileLoading(true);
          // Defer Supabase calls to avoid deadlocks inside the auth callback
          setTimeout(() => {
            fetchUserData(newSession.user.id);
          }, 0);
        } else {
          clearUserData();
        }
        setSessionLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        setProfileLoading(true);
        fetchUserData(currentSession.user.id);
      }
      setSessionLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Stay in loading state until we know the session AND (if logged in) the profile/roles
  const loading = sessionLoading || (!!user && profileLoading);

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isPastor, isActive, roles, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
