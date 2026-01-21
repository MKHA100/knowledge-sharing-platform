"use client";

import { SUBJECTS } from "@/lib/constants/subjects";
import { cn } from "@/lib/utils";

interface CategoryGridProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

// Generate colors for subjects based on their index
const colors = [
  "bg-rose-100 text-rose-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
];

export function CategoryGrid({
  selectedCategory,
  onSelectCategory,
}: CategoryGridProps) {
  // Show only first 12 subjects for the grid, others are in the filter bar
  const displaySubjects = SUBJECTS.slice(0, 12);

  return (
    <div className="py-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Browse by Subject
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {displaySubjects.map((subject, index) => (
          <button
            key={subject.id}
            onClick={() =>
              onSelectCategory(
                selectedCategory === subject.id ? null : subject.id,
              )
            }
            className={cn(
              "group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md",
              selectedCategory === subject.id &&
                "border-primary bg-primary/5 shadow-md",
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold transition-transform group-hover:scale-110",
                colors[index % colors.length],
              )}
            >
              {subject.displayName.slice(0, 3)}
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-foreground line-clamp-2">
                {subject.displayName}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
