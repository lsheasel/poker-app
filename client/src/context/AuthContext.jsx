import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);

  // Sign up
  const signUpNewUser = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        data: {
          first_name: username,
        },
    }
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, data };
  };

  // Sign in
  const signInUser = async (email, password, username) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
        options: {
          data: {
            first_name: username,
        },
    }
      });

      // Handle Supabase error explicitly
      if (error) {
        return { success: false, error: error.message }; // Return the error
      }

      // If no error, return success
      
      return { success: true, data }; // Return the user data
    } catch (error) {
      // Handle unexpected issues
      
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  };
  // Update user profile
  const updateProfile = async ({ avatarUrl }) => {
    const { data, error } = await supabase.auth.updateUser({
      options: {
          data: {
            avatar_url: avatarUrl,
        },
      }
    });

    if (error) {
      
      return { success: false, error };
    }

    return { success: true, data };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // Sign out
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      
    }
  }

  return (
    <AuthContext.Provider
      value={{ signUpNewUser, signInUser, session, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};