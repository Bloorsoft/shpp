import { auth } from "@/server/auth";
import { NextResponse } from "next/server";
import { api } from "@/trpc/server";

export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get("messageId");
  const attachmentId = searchParams.get("attachmentId");

  if (!session?.accessToken || !session?.refreshToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!messageId || !attachmentId) {
    return new NextResponse("Missing required parameters", { status: 400 });
  }

  try {
    const attachment = await api.gmail.getAttachment({
      messageId,
      attachmentId,
    });

    if (!attachment.data) {
      return new NextResponse("Attachment not found", { status: 404 });
    }

    const buffer = Buffer.from(attachment.data, "base64");

    const thread = await api.gmail.getThread({
      threadId: messageId,
    });

    const message = thread.find((msg) => msg.id === messageId);
    const attachmentInfo = message?.attachments?.find(
      (att) => att.id === attachmentId,
    );

    const headers = new Headers({
      "Content-Type": attachmentInfo?.mimeType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${attachmentInfo?.filename ?? "attachment"}"`,
    });

    return new NextResponse(buffer, { headers });
  } catch (error) {
    console.error("Error fetching attachment:", error);
    return new NextResponse("Error fetching attachment", { status: 500 });
  }
}
