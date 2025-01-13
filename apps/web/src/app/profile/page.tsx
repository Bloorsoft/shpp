"use client";

import { useUserContext } from "@/contexts/use-user-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { userContext, setAdditionalInfo } = useUserContext();
  const [info, setInfo] = useState(userContext.additionalInfo);

  const handleSave = () => {
    setAdditionalInfo(info);
    toast.success("Profile information saved");
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Customize how AI understands and represents you in email
            communications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Name</Label>
            <p className="text-sm text-muted-foreground">
              {session?.user?.name}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional Context</Label>
            <Textarea
              id="additionalInfo"
              placeholder="Add any additional context about yourself that would help AI write better emails (e.g., your role, expertise, communication style preferences)"
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              className="min-h-[150px]"
            />
          </div>

          <Button onClick={handleSave}>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
