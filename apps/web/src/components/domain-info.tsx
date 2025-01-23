"use client";

import { api } from "@/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import type { DomainInfo as DomainInfoType } from "@/lib/ai/tools/dig";

export function DomainInfo({ domain }: { domain?: string }) {
  const { data, isLoading } = api.ai.getDomainInfo.useQuery(
    { domain: domain ?? "" },
    { enabled: !!domain },
  );

  if (!domain) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>About {domain}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-200" />
          </div>
        ) : data?.success ? (
          <div className="space-y-2">
            <p className="font-medium">{data.companyName}</p>
            {/* <p className="text-sm text-gray-600">{data.description}</p> */}
            <p className="text-sm text-gray-500">{data.summary}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Unable to fetch domain information
          </p>
        )}
      </CardContent>
    </Card>
  );
}
