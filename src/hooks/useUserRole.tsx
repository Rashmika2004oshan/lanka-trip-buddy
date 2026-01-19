import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = 'admin' | 'user' | 'driver' | 'hotel_owner';

interface UserRoleState {
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  isHotelOwner: boolean;
  hasRole: (role: AppRole) => boolean;
  refetch: () => Promise<void>;
}

export const useUserRole = (): UserRoleState => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching roles:", error);
        setRoles([]);
      } else {
        setRoles((data || []).map((r) => r.role as AppRole));
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [user]);

  const hasRole = (role: AppRole) => roles.includes(role);

  return {
    roles,
    loading,
    isAdmin: hasRole('admin'),
    isDriver: hasRole('driver'),
    isHotelOwner: hasRole('hotel_owner'),
    hasRole,
    refetch: fetchRoles,
  };
};
