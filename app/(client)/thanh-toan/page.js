'use client';

import { Suspense } from "react";
import ThanhToanContent from "./ThanhToanContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <ThanhToanContent />
    </Suspense>
  );
}
