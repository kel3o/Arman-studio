"use client";

import { Check } from "lucide-react";

import { VOICE_GROUPS, VOICES, type VoiceOption } from "@/lib/voices";
import { cn } from "@/lib/utils";

type VoiceTableProps = {
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
};

export function VoiceTable({ value, onChange, disabled }: VoiceTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full caption-bottom border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
            <tr className="border-b border-border text-muted-foreground">
              <th className="h-9 px-3 text-right font-medium">اسم</th>
              <th className="h-9 px-3 text-right font-medium">حس صدا</th>
              <th className="h-9 w-20 px-3 text-right font-medium">جنسیت</th>
            </tr>
          </thead>
          <tbody>
            {VOICE_GROUPS.map((group) => {
              const voices = VOICES.filter((item) => item.group === group);
              return (
                <VoiceGroup
                  key={group}
                  group={group}
                  voices={voices}
                  value={value}
                  disabled={disabled}
                  onChange={onChange}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VoiceGroup({
  group,
  voices,
  value,
  disabled,
  onChange,
}: {
  group: string;
  voices: readonly VoiceOption[];
  value: string;
  disabled?: boolean;
  onChange: (name: string) => void;
}) {
  return (
    <>
      <tr className="border-b border-border bg-muted/70">
        <td
          colSpan={3}
          className="px-3 py-1.5 text-xs font-medium text-muted-foreground"
        >
          {group}
        </td>
      </tr>
      {voices.map((voice, index) => (
        <VoiceRow
          key={voice.name}
          voice={voice}
          selected={voice.name === value}
          zebra={index % 2 === 1}
          disabled={disabled}
          onSelect={() => onChange(voice.name)}
        />
      ))}
    </>
  );
}

function VoiceRow({
  voice,
  selected,
  zebra,
  disabled,
  onSelect,
}: {
  voice: VoiceOption;
  selected: boolean;
  zebra: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      className={cn(
        "cursor-pointer border-b border-border/70 last:border-0",
        zebra && !selected && "bg-muted/40",
        selected && "bg-primary/12",
        !selected && "hover:bg-primary/8",
        disabled && "pointer-events-none opacity-60",
      )}
      onClick={onSelect}
    >
      <td className="px-3 py-2">
        <span className="flex items-center gap-2 font-medium">
          {selected ? (
            <Check className="size-3.5 shrink-0 text-primary" />
          ) : (
            <span className="size-3.5 shrink-0" />
          )}
          {voice.name}
        </span>
      </td>
      <td className="px-3 py-2 text-muted-foreground">{voice.mood}</td>
      <td className="px-3 py-2 text-muted-foreground">{voice.gender}</td>
    </tr>
  );
}
