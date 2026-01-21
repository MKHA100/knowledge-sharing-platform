"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUBJECTS } from "@/lib/constants/subjects";

interface FilterBarProps {
  medium: string;
  onMediumChange: (value: string) => void;
  documentType: string;
  onDocumentTypeChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (value: string | null) => void;
}

export function FilterBar({
  medium,
  onMediumChange,
  documentType,
  onDocumentTypeChange,
  sortBy,
  onSortByChange,
  selectedCategory,
  onCategoryChange,
}: FilterBarProps) {
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = (direction: "left" | "right") => {
    const container = document.getElementById("category-scroll");
    if (container) {
      const scrollAmount = 300;
      if (direction === "left") {
        container.scrollLeft -= scrollAmount;
        setScrollPosition(container.scrollLeft - scrollAmount);
      } else {
        container.scrollLeft += scrollAmount;
        setScrollPosition(container.scrollLeft + scrollAmount);
      }
    }
  };

  const documentTypes = [
    { value: "all", label: "All Types" },
    { value: "paper", label: "Past Papers" },
    { value: "short_note", label: "Short Notes" },
    { value: "book", label: "Books" },
  ];

  return (
    <div className="space-y-4">
      {/* Subject Categories - Horizontal Scrollable */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleScroll("left")}
          className="h-8 w-8 rounded-full p-0 border-slate-200"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div
          id="category-scroll"
          className="flex gap-2 overflow-x-hidden scroll-smooth flex-1"
        >
          {/* All Subjects Button */}
          <button
            onClick={() => onCategoryChange(null)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              selectedCategory === null
                ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            All Subjects
          </button>

          {/* Subject Pills */}
          {SUBJECTS.map((subject) => (
            <button
              key={subject.id}
              onClick={() => onCategoryChange(subject.id)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                selectedCategory === subject.id
                  ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {subject.displayName}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleScroll("right")}
          className="h-8 w-8 rounded-full p-0 border-slate-200"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Document Types & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Document Type Quick Buttons */}
        <div className="flex gap-2">
          {documentTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onDocumentTypeChange(type.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                documentType === type.value
                  ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Right Side: Medium & Sort */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Medium Filter */}
          <Select value={medium} onValueChange={onMediumChange}>
            <SelectTrigger className="h-9 w-[110px] rounded-full border-slate-200 bg-white text-xs sm:text-sm shadow-sm transition-colors hover:border-blue-300">
              <SelectValue placeholder="Medium" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="sinhala">Sinhala</SelectItem>
              <SelectItem value="tamil">Tamil</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="h-9 w-[140px] rounded-full border-slate-200 bg-white text-xs sm:text-sm shadow-sm transition-colors hover:border-blue-300">
              <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="downloads">Most Downloaded</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="upvotes">Most Upvoted</SelectItem>
              <SelectItem value="title-asc">A to Z</SelectItem>
              <SelectItem value="title-desc">Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
