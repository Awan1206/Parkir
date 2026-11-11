const useAuth = {
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  },

  getToken: () => localStorage.getItem("token"),

  isAuthenticated: () => !!localStorage.getItem("token"),

  getRole: () => {
    try {
      return JSON.parse(localStorage.getItem("user"))?.role ?? null;
    } catch {
      return null;
    }
  },

  setSession: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event("auth-change"));
  },

  clearSession: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
  },
};

export default useAuth;