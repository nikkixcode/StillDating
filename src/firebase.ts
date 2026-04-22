import { LoveLanguages, UserProfile, Couple, DateIdea } from "./types";

export enum OperationType {
  GET = "GET",
  UPDATE = "UPDATE",
  CREATE = "CREATE",
  DELETE = "DELETE",
  LIST = "LIST",
}

export const handleFirestoreError = (error: any, operation: OperationType, path: string) => {
  console.error(`Local API Error [${operation}] at ${path}:`, error);
};

// Mock Auth - Use localStorage to persist session
export const login = async (mockData?: any) => {
  const data = mockData || {
    uid: "user_" + Math.random().toString(36).substring(7),
    email: "user@example.com",
    displayName: "Still Dating User",
    photoURL: "https://picsum.photos/seed/user/200",
  };
  
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const user = await res.json();
  localStorage.setItem("stilldating_user", JSON.stringify(user));
  window.location.reload();
};

export const logout = async () => {
  localStorage.removeItem("stilldating_user");
  window.location.reload();
};

export const getSessionUser = () => {
  const user = localStorage.getItem("stilldating_user");
  return user ? JSON.parse(user) : null;
};
