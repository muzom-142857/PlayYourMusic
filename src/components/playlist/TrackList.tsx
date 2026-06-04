"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TrackItem } from "./TrackItem";
import type { TrackDTO } from "@/types";

interface TrackListProps {
  tracks: TrackDTO[];
  currentTrackId?: string | null;
  isEditable?: boolean;
  onPlay?: (index: number) => void;
  onRemove?: (trackId: string) => void;
  onReorder?: (orderedIds: string[]) => void;
}

export function TrackList({
  tracks,
  currentTrackId,
  isEditable,
  onPlay,
  onRemove,
  onReorder,
}: TrackListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = tracks.findIndex((t) => t.id === active.id);
    const newIndex = tracks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...tracks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder?.(reordered.map((t) => t.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5">
          {tracks.map((track, index) => (
            <TrackItem
              key={track.id}
              track={track}
              index={index}
              isActive={track.id === currentTrackId}
              isEditable={isEditable}
              onPlay={onPlay}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
