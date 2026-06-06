"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import Image from "next/image";
import type { PlaylistDTO, CategoryDTO } from "@/types";
import { localePath } from "@/lib/locale-path";

const formSchema = z.object({
  title: z.string().min(1, "제목을 입력하세요").max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean(),
  tagInput: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PlaylistFormProps {
  playlist?: PlaylistDTO;
  categories: CategoryDTO[];
}

export function PlaylistForm({ playlist, categories }: PlaylistFormProps) {
  const locale = useLocale();
  const router = useRouter();
  const isEdit = !!playlist;

  const [tags, setTags] = useState<string[]>(playlist?.tags.map((t) => t.name) ?? []);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    playlist?.categories.map((c) => c.id) ?? []
  );
  const [coverUrl, setCoverUrl] = useState<string | null>(playlist?.coverUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: playlist?.title ?? "",
      description: playlist?.description ?? "",
      isPublic: playlist?.isPublic ?? true,
      tagInput: "",
    },
  });

  const addTag = (value: string) => {
    const trimmed = value.trim().toLowerCase().replace(/\s+/g, "-");
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags((t) => [...t, trimmed]);
    }
    form.setValue("tagInput", "");
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const uploadCover = async (file: File) => {
    setIsUploading(true);
    try {
      const ext = file.type.split("/")[1];
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "covers", contentType: file.type, filename: `cover.${ext}` }),
      });
      const { uploadUrl, key } = await res.json();
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
      setCoverUrl(publicUrl);
    } catch {
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const body = {
        title: values.title,
        description: values.description || undefined,
        isPublic: values.isPublic,
        tagNames: tags,
        categoryIds: selectedCategoryIds,
        ...(coverUrl !== (playlist?.coverUrl ?? null) && { coverUrl }),
      };

      const url = isEdit ? `/api/playlists/${playlist.id}` : "/api/playlists";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      const saved: PlaylistDTO = await res.json();
      toast.success(isEdit ? "플레이리스트가 수정되었습니다." : "플레이리스트가 생성되었습니다!");
      router.push(localePath(locale, `/playlist/${saved.id}`));
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Cover upload */}
        <div className="space-y-2">
          <Label>커버 이미지</Label>
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
              {coverUrl ? (
                <>
                  <Image src={coverUrl} alt="Cover" fill className="object-cover" sizes="96px" />
                  <button
                    type="button"
                    onClick={() => setCoverUrl(null)}
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span className="text-[10px]">업로드</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP · 최대 10MB</p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목 *</FormLabel>
              <FormControl>
                <Input placeholder="플레이리스트 이름" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Textarea placeholder="플레이리스트에 대해 설명해주세요" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categories */}
        <div className="space-y-2">
          <Label>카테고리 (최대 5개)</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  selectedCategoryIds.includes(cat.id)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>태그 (최대 10개)</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                #{tag}
                <button type="button" onClick={() => setTags((t) => t.filter((x) => x !== tag))}>
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>
          <FormField
            control={form.control}
            name="tagInput"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="태그 입력 후 Enter (예: indie, 새벽감성)"
                    {...field}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(field.value ?? "");
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <FormLabel className="text-base">공개 플레이리스트</FormLabel>
                <p className="text-sm text-muted-foreground">누구나 이 플레이리스트를 볼 수 있습니다</p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "수정 완료" : "플레이리스트 만들기"}
        </Button>
      </form>
    </Form>
  );
}
