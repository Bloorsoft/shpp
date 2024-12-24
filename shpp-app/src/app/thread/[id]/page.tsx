import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { ThreadView } from "@/app/_components/thread-view";

export default async function ThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user) {
    return notFound();
  }

  const thread = await api.gmail.getThread({ threadId: params.id });

  return (
    <main className="container mx-auto p-4">
      <ThreadView initialThread={thread} />
    </main>
  );
}
