"use client";

import { DomainInfo } from "./domain-info";
import { useSelectedEmail } from "@/contexts/selected-email";

const RightPanel = () => {
  const { selectedEmail } = useSelectedEmail();
  const domain = selectedEmail?.from.split("@")[1]?.split(">")[0];

  return (
    <div className="h-screen w-full max-w-sm overflow-y-auto border-l bg-gray-100">
      <div className="flex flex-col justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold">shpp</h1>
        <p className="text-gray-500">
          This right panel will contain a variety of AI features that will make
          your life simpler.
        </p>
        <DomainInfo domain={domain} />
      </div>
    </div>
  );
};

export default RightPanel;
