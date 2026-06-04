"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PlaylistError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">플레이리스트를 불러올 수 없습니다</h2>
      <p className="text-sm text-muted-foreground">잠시 후 다시 시도해주세요.</p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/">홈으로</Link>
        </Button>
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </div>
  );
}
