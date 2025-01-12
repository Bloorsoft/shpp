import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { LoginButton } from "@/components/login-button";
import { EmailList } from "@/components/email-list";
import { KeyboardShortcutsFooter } from "@/components/keyboard-shortcuts-footer";
import { LabelsHeader } from "@/components/labels-header";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ label?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <LoginPrompt message="Welcome" />
      </main>
    );
  }

  try {
    const messages = await api.gmail.listMessages({
      labelId: params.label ?? "INBOX",
    });

    return (
      <>
        <LabelsHeader
          currentLabel={params.label ?? "INBOX"}
          currEmail={session.user.email!}
        />
        <main className="flex h-full">
          <div className="flex-1 overflow-y-auto pb-16">
            <EmailList initialMessages={messages} />
          </div>
        </main>
        <KeyboardShortcutsFooter />
      </>
    );
  } catch (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <LoginPrompt message="Session Expired" />
      </main>
    );
  }
}

function LoginPrompt({ message }: { message: string }) {
  return (
    <div className="text-center">
      <h3 className="text-2xl">{message}</h3>
      <p className="mb-4 mt-2">Please sign in to continue.</p>
      <LoginButton />
    </div>
  );
}
