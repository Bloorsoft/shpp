import { load } from "cheerio";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }

  try {
    const url = `https://${domain}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }

    const content = await response.text();
    const $ = load(content, { xml: false, xmlMode: false });

    const title = $("title").first().text() ?? "";
    const metaDescription =
      $('meta[name="description"]').first().attr("content") ?? "";
    const ogDescription =
      $('meta[property="og:description"]').first().attr("content") ?? "";
    const mainContent =
      $("main, article, #main, #content").first().text() ??
      $("body").first().text() ??
      "";

    return NextResponse.json({
      title,
      metaDescription,
      ogDescription,
      mainContent: mainContent.slice(0, 2000),
      success: true,
    });
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to scrape",
        success: false,
      },
      { status: 500 },
    );
  }
}
