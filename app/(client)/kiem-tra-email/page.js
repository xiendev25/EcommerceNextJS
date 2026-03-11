'use client';

import { Suspense } from "react";
import KiemTraEmailContent from "./KiemTraEmailContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <KiemTraEmailContent />
    </Suspense>
  );
}
