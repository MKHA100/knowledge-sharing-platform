"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useUser, useAuth } from "@clerk/nextjs";

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoggedIn: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  selectedDocument: string | null;
  setSelectedDocument: (id: string | null) => void;
  showThankYouPopup: boolean;
  setShowThankYouPopup: (show: boolean) => void;
  hasNewNotification: boolean;
  setHasNewNotification: (has: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { isSignedIn } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [showThankYouPopup, setShowThankYouPopup] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  // Wait for client mount to prevent hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Sync Clerk user to local state AND to Supabase
  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      setUser({
        name: clerkUser.fullName || clerkUser.firstName || "Student",
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        avatar: clerkUser.imageUrl || "/placeholder.svg",
      });

      // Sync user to Supabase (in case webhook didn't fire)
      fetch("/api/users/sync", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error("User sync error:", data.error);
          } else {
            console.log("User synced to Supabase");
          }
        })
        .catch((err) => console.error("User sync failed:", err));
    } else if (isLoaded && !isSignedIn) {
      setUser(null);
    }
  }, [clerkUser, isLoaded, isSignedIn]);

  // Only report logged in after mount to prevent hydration mismatch
  const isLoggedIn = hasMounted && !!user && isSignedIn === true;

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isLoggedIn,
        showLoginModal,
        setShowLoginModal,
        selectedDocument,
        setSelectedDocument,
        showThankYouPopup,
        setShowThankYouPopup,
        hasNewNotification,
        setHasNewNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
