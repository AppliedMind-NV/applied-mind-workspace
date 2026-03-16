import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "student" | "professional";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: UserRole;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  setRole: (role: UserRole) => Promise<void>;
  refreshAvatar: (url: string) => void;
  completeOnboarding: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  role: "student",
  avatarUrl: null,
  onboardingCompleted: true,
  setRole: async () => {},
  refreshAvatar: () => {},
  completeOnboarding: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<UserRole>("student");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);

  // Load profile role from database
  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, avatar_url, onboarding_completed")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("Failed to load profile:", error);
      return;
    }
    if (!data) {
      // Profile not yet created by trigger — treat as new user
      setOnboardingCompleted(false);
      return;
    }
    if (data.role) {
      setRoleState(data.role as UserRole);
    }
    if (data.avatar_url) {
      setAvatarUrl(data.avatar_url as string);
    }
    setOnboardingCompleted(data.onboarding_completed ?? false);
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        if (session?.user) {
          // Defer profile load to avoid Supabase client deadlock
          setTimeout(() => loadProfile(session.user.id), 0);
        }
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // Persist role change to database
  const setRole = async (newRole: UserRole) => {
    const user = session?.user;
    if (!user) return;
    setRoleState(newRole);
    await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", user.id);
  };

  const refreshAvatar = (url: string) => setAvatarUrl(url);

  const completeOnboarding = async () => {
    const user = session?.user;
    if (!user) return;
    setOnboardingCompleted(true);
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoleState("student");
    setAvatarUrl(null);
    setOnboardingCompleted(true);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, role, avatarUrl, onboardingCompleted, setRole, refreshAvatar, completeOnboarding, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
