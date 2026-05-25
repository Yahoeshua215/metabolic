import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAdminSession() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null, isEditor: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isEditor =
    user?.app_metadata?.role === "editor" ||
    user?.user_metadata?.role === "editor" ||
    false;

  return { supabase, user, isEditor };
}
