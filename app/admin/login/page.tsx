import { signInWithMagicLink } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasSupabaseEnv } from "@/lib/supabase/server";

export default function AdminLoginPage() {
  const configured = hasSupabaseEnv();

  return (
    <Card className="mx-auto max-w-md bg-card/60">
      <CardHeader>
        <CardTitle>Editor login</CardTitle>
      </CardHeader>
      <CardContent>
        {!configured ? (
          <p className="text-sm text-muted-foreground">
            Add Supabase env vars to <code className="text-foreground">.env.local</code> to enable admin auth.
          </p>
        ) : (
          <form
            action={async (formData) => {
              "use server";
              await signInWithMagicLink(formData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <Button type="submit" className="w-full">
              Send magic link
            </Button>
            <p className="text-xs text-muted-foreground">
              Your Supabase user must have <code>app_metadata.role = editor</code> or a row in{" "}
              <code>editor_profiles</code>.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
