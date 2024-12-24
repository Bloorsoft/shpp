import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { LoginButton } from "@/app/_components/login-button";
import { EmailList } from "@/app/_components/email-list";
import { Sidebar } from "@/app/_components/sidebar";
import { KeyboardShortcutsFooter } from "@/app/_components/keyboard-shortcuts-footer";

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
        <div className="text-center">
          <h3 className="text-2xl">Welcome</h3>
          <p className="mb-4 mt-2">You&apos;re not connected to Gmail yet.</p>
          <LoginButton />
        </div>
      </main>
    );
  }

  const messages = await api.gmail.listMessages({
    labelId: params.label ?? "INBOX",
  });

  return (
    <>
      <main className="relative flex min-h-screen flex-col items-center p-4">
        <Sidebar
          currentLabel={params.label ?? "INBOX"}
          currEmail={session.user.email!}
        />
        <div className="w-full max-w-4xl py-8">
          <EmailList initialMessages={messages} />
        </div>
      </main>
      <KeyboardShortcutsFooter />
    </>
  );
}
