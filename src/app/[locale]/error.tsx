"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">오류가 발생했습니다</h2>
        <p className="text-sm text-muted-foreground">
          예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          뒤로 가기
        </Button>
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </div>
  );
}
