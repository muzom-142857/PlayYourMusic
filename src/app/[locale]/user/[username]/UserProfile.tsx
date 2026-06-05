"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { UserPlus, UserCheck, Settings, Music2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { formatCount } from "@/lib/utils";
import type { PlaylistDTO } from "@/types";

interface UserData {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  isFollowing: boolean;
  playlists: PlaylistDTO[];
  _count: { playlists: number; followers: number; following: number };
}

interface UserProfileProps {
  user: UserData;
  isOwnProfile: boolean;
}

export function UserProfile({ user: initialUser, isOwnProfile }: UserProfileProps) {
  const locale = useLocale();
  const t = useTranslations("user");
  const queryClient = useQueryClient();
  const [user, setUser] = useState(initialUser);

  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${user.username}/follow`, {
        method: user.isFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onMutate: () => {
      // Optimistic update
      setUser((u) => ({
        ...u,
        isFollowing: !u.isFollowing,
        _count: {
          ...u._count,
          followers: u.isFollowing ? u._count.followers - 1 : u._count.followers + 1,
        },
      }));
    },
    onError: () => {
      // Revert
      setUser((u) => ({
        ...u,
        isFollowing: !u.isFollowing,
        _count: {
          ...u._count,
          followers: u.isFollowing ? u._count.followers - 1 : u._count.followers + 1,
        },
      }));
      toast.error("팔로우 상태를 변경하지 못했습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", user.username] });
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="relative px-6 pb-6 pt-8">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/40 to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-end gap-5">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-3xl">{user.name[0]}</AvatarFallback>
            </Avatar>
          </motion.div>

          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h1 className="text-2xl font-bold leading-tight">{user.name}</h1>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>

            {user.bio && <p className="text-sm text-muted-foreground max-w-lg">{user.bio}</p>}

            {/* Stats */}
            <div className="flex items-center gap-5 text-sm">
              <span>
                <strong className="text-foreground">{formatCount(user._count.playlists)}</strong>
                <span className="text-muted-foreground ml-1">{t("playlists")}</span>
              </span>
              <span>
                <strong className="text-foreground">{formatCount(user._count.followers)}</strong>
                <span className="text-muted-foreground ml-1">{t("followers")}</span>
              </span>
              <span>
                <strong className="text-foreground">{formatCount(user._count.following)}</strong>
                <span className="text-muted-foreground ml-1">{t("following")}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isOwnProfile ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${locale}/settings`}>
                  <Settings className="mr-1.5 h-3.5 w-3.5" />
                  {t("editProfile")}
                </Link>
              </Button>
            ) : (
              <Button
                variant={user.isFollowing ? "outline" : "default"}
                size="sm"
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
              >
                {user.isFollowing ? (
                  <>
                    <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                    {t("following")}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    {t("follow")}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Playlists */}
      <div className="px-4 py-6 lg:px-6">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t("playlists")}
        </h2>

        {user.playlists.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Music2 className="h-10 w-10 opacity-20" />
            <p className="text-sm">{t("noPlaylists")}</p>
            {isOwnProfile && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${locale}/playlist/new`}>{t("createFirstPlaylist")}</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {user.playlists.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
