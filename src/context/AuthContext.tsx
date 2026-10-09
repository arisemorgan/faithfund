import React, { createContext, useContext, useState, useEffect } from "react";

// User interface
interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  profile_photo?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ user: User; token: string }>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage (runs once)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  // ------------------------------------------------------
  // 🔑 GLOBAL AUTH FETCH WRAPPER
  // Adds token automatically + logs out on 401
  // ------------------------------------------------------
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    // Token expired or invalid
    if (res.status === 401) {
      logout();
      window.location.href = "/login";
    }

    return res;
  };

  // ------------------------------------------------------
  // 🔐 LOGIN
  // ------------------------------------------------------
  const login = async (email: string, password: string) => {
    const res = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    // Save to storage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setUser(data.user); // update React state

    return { token: data.token, user: data.user };
  };

  // ------------------------------------------------------
  // 🆕 REGISTER
  // ------------------------------------------------------
  const register = async (
    fullName: string,
    email: string,
    password: string
  ) => {
    const res = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");

    // Auto login after register
    await login(email, password);
  };

  // ------------------------------------------------------
  // 🚪 LOGOUT
  // ------------------------------------------------------
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // ------------------------------------------------------
  // 🛠 UPDATE USER LOCALLY (once profile updates)
  // ------------------------------------------------------
  const updateUser = (data: Partial<User>) => {
    if (!user) return;

    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        authFetch, // exported
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
