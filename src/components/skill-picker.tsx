"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { SKILL_CATEGORIES } from "@/lib/skills";

type Props = {
  selected: string[];
  onChange: (skills: string[]) => void;
};

export function SkillPicker({ selected, onChange }: Props) {
  const [openCategories, setOpenCategories] = useState<string[]>(
    SKILL_CATEGORIES.map((c) => c.label)
  );

  const toggleCategory = (label: string) => {
    setOpenCategories((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const toggleSkill = (skill: string) => {
    if (selected.includes(skill)) {
      onChange(selected.filter((s) => s !== skill));
    } else {
      onChange([...selected, skill]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selected.length} skill{selected.length === 1 ? "" : "s"} selected
        </p>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/40 border border-border/50">
          {selected.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground"
            >
              {skill}
              <button
                type="button"
                onClick={() => toggleSkill(skill)}
                className="hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {SKILL_CATEGORIES.map((category) => {
          const isOpen = openCategories.includes(category.label);
          const selectedInCategory = category.skills.filter((s) =>
            selected.includes(s)
          ).length;

          return (
            <div
              key={category.label}
              className="rounded-lg border border-border/50 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleCategory(category.label)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{category.label}</span>
                  {selectedInCategory > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                      {selectedInCategory}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {category.skills.length}
                </span>
              </button>

              {isOpen && (
                <div className="flex flex-wrap gap-1.5 p-3">
                  {category.skills.map((skill) => {
                    const isSelected = selected.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}