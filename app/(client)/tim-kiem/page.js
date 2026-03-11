'use client';

import { Suspense } from "react";
import TimKiemContent from "./TimKiemContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <TimKiemContent />
    </Suspense>
  );
}
