# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

## How to add custom shortcuts to components?

```
const MyComponent = () => {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    registerShortcut("j", () => {
      // Navigate to next email
    });
    registerShortcut("k", () => {
      // Navigate to previous email
    });

    return () => {
      unregisterShortcut("j");
      unregisterShortcut("k");
    };
  }, [registerShortcut, unregisterShortcut]);

  return <div>...</div>;
};
```

## rate limiting with upstash

```
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10s"),
});

export const aiRouter = createTRPCRouter({
  analyzeEmailImportance: protectedProcedure
    .input(
      z.object({
        subject: z.string(),
        from: z.string(),
        snippet: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Rate limit by user
      const { success } = await ratelimit.limit(
        ctx.session?.user?.id ?? "anonymous"
      );

      if (!success) {
        throw new Error("Too many requests. Please try again later.");
      }

      return await analyzeEmailImportance(input);
    }),
});
```

## How to optimize the prompt for email generation?

- use structured outputs to create subject separately
- have context on who the main user of the application is
  -- maybe ask them to give their personal website, linkedin, or any other relevant info that they have when they are initially setting up their account -> store this content in a vector db

## Local development and migrations

You need to link the project by running `supabase link --project-ref zwxvmxrpmklucseotesg`

The other db related commands are written in our package.json file

## gmail watch api webhook

```
import { GmailService } from "@shpp/database";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Message as PubsubMessage } from "@google-cloud/pubsub";
import { auth } from "@/server/auth";
import type { Database } from "@shpp/database";

interface WebhookBody {
  message: PubsubMessage;
  subscription: string;
}

interface GmailNotification {
  emailAddress: string;
  historyId: string;
}

export async function POST(req: NextRequest) {
  const webhookData = (await req.json()) as WebhookBody;
  const session = await auth();

  if (!session?.accessToken || !session?.refreshToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const data = JSON.parse(
      Buffer.from(webhookData.message.data as unknown as string, "base64").toString()
    ) as GmailNotification;

    const supabase = createClient();

    const { data: mailAccount } = (await supabase
      .from("mail_accounts")
      .select("*")
      .eq("email_address", data.emailAddress)
      .single()) as {
      data: Database["public"]["Tables"]["mail_accounts"]["Row"] | null;
    };

    if (!mailAccount) {
      return NextResponse.json(
        { message: "Mail account not found" },
        { status: 404 },
      );
    }

    // Sync new messages
    const gmailService = new GmailService(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      session.accessToken,
      session.refreshToken,
    );

    await gmailService.syncMessages(
      mailAccount.user_id,
      mailAccount.id,
      mailAccount.history_id!,
    );

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
```
