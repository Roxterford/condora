import Image from "next/image";

import { LoginForm } from "./components/login-form";
import { LoginShowcase } from "./components/login-showcase";
import { REQUEST_DEMO_HREF } from "./support-links";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <LoginShowcase />

      <main className="flex w-full flex-col px-6 py-8 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <Image
            src="/condora.svg"
            alt="Condora"
            width={160}
            height={31}
            className="h-8 w-auto"
            priority
          />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          ¿Tu condominio aún no usa Condora?{" "}
          <a
            href={REQUEST_DEMO_HREF}
            className="font-medium text-primary hover:underline"
          >
            Solicita una demo
          </a>
        </p>
      </main>
    </div>
  );
}
