"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useFollowUser(targetUserId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (isFollowing: boolean) => {
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed to update follow");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", targetUserId] });
    },
    onError: () => {
      toast.error("팔로우 상태를 변경하지 못했습니다.");
    },
  });

  return mutation;
}
