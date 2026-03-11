'use client';

import { Suspense } from "react";
import PaymentResultContent from "./PaymentResultContent";

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <PaymentResultContent />
    </Suspense>
  );
}
