/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { url } from "../api-url";

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  message: string;
  email: string;
  name: string;

}

interface LoginState {
  loading: boolean;
  error: string | null;
  token: string | null;
  email: string | null;
  name: string | null;

  login: (payload: LoginPayload) => Promise<LoginResponse>;
  logout: () => void;
  hydrate: () => void;
  getAuthHeader: () => { Authorization: string } | null;
}

export const useLoginStore = create<LoginState>((set, get) => ({
  loading: false,
  error: null,
  token: null,
  email: null,
  name: null,

  hydrate: () => {
    if (typeof window === "undefined") return;

    set({
      token: localStorage.getItem("auth_token"),
      email: localStorage.getItem("user_email"),
      name: localStorage.getItem("user_name"),
    });
  },

  login: async (payload) => {
  try {
    set({ loading: true, error: null });

    const response = await fetch(`${url.backendUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.detail ||
        data?.message ||
        "Login failed";

      if (message.includes("Please sign up to create an account")) {
        throw new Error("Please sign up to create an account.");
      }

      throw new Error(message);
    }

    // ✅ Success case
    localStorage.setItem("auth_token", data.access_token);
    localStorage.setItem("user_email", data.email || payload.username);
    localStorage.setItem("user_name", data.name);

    set({
      loading: false,
      token: data.access_token,
      email: data.email || payload.username,
      name: data.name,
    });

    return data;

  } catch (err: any) {
    set({ loading: false, error: err.message });
    throw err;
  }
},


  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_email");
      localStorage.removeItem("token_type");
    }

    set({ token: null, email: null, error: null });
  },

  getAuthHeader: () => {
    const token = get().token;
    return token ? { Authorization: `Bearer ${token}` } : null;
  },
}));
