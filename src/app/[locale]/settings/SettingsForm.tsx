"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "이름을 입력하세요").max(60),
  bio: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

interface UserData {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
}

export function SettingsForm({ user }: { user: UserData }) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, bio: user.bio ?? "" },
  });

  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "avatars", contentType: file.type, filename: "avatar" }),
      });
      const { uploadUrl, key } = await res.json();
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      const url = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
      setAvatarUrl(url);
    } catch {
      toast.error("아바타 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          bio: values.bio || null,
          avatarUrl: avatarUrl !== user.avatarUrl ? avatarUrl : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("프로필이 업데이트되었습니다.");
      router.refresh();
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="space-y-3">
        <Label>프로필 사진</Label>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
            </Avatar>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(null)}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              사진 변경
            </div>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      <Separator />

      {/* Account info (read-only) */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs uppercase tracking-wide">계정 정보</Label>
        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">사용자명</span>
            <span className="font-medium">@{user.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">이메일</span>
            <span className="font-medium">{user.email}</span>
          </div>
        </div>
      </div>

      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>표시 이름</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="이름" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>소개</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="나를 소개해주세요 (최대 200자)"
                    rows={3}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSaving || isUploading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            저장
          </Button>
        </form>
      </Form>
    </div>
  );
}
