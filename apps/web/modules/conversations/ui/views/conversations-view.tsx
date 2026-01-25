import Image from "next/image";

export function ConversationsView() {
  return (
    <div className="flex flex-1 flex-col gap-y-4 bg-muted h-full">
      <div className="flex flex-1 items-center justify-center gap-x-2">
        <Image width={40} height={40} alt="logo" src="/icons/agent-logo.svg" />
        <p className="font-semibold text-lg">Beemo AI</p>
      </div>
    </div>
  );
}
