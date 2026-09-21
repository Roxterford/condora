import { Suspense } from "react";
import { CuotasPageContent } from "./components/cuotas-page-content";

export default function CuotasPage() {
  return (
    <Suspense>
      <CuotasPageContent />
    </Suspense>
  );
}
