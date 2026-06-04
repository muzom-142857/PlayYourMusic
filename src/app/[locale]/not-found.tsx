import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Music2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">404</h1>
        <h2 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          요청하신 페이지가 존재하지 않거나 삭제되었습니다.
        </p>
      </div>
      <Button asChild>
        <Link href="/">홈으로 돌아가기</Link>
      </Button>
    </div>
  );
}
