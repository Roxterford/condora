"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";
import type { LoginMutationVariables } from "@/providers/graphql/graphql";
import { FORGOT_PASSWORD_HREF } from "../support-links";

const LoginMutation = graphql(/* GraphQL */ `
  mutation Login($email: String!, $pass: String!) {
    login(email: $email, password: $pass) {
      token
    }
  }
`);

const COOKIE_NAME = "api_token";
const SESSION_MAX_AGE = 60 * 60 * 24;
const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const login = useMutation({
    mutationFn: (credentials: LoginMutationVariables) =>
      execute(LoginMutation, credentials),
    onSuccess: (response) => {
      const token = response.data?.login?.token;
      if (!token) return;

      const maxAge = rememberMe ? REMEMBER_ME_MAX_AGE : SESSION_MAX_AGE;
      document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;

      router.push("/dashboard");
      router.refresh();
    },
  });

  const errorMessage =
    login.error?.message ??
    login.data?.errors?.[0]?.message ??
    (login.isSuccess && !login.data?.data?.login?.token
      ? "No pudimos iniciar tu sesión. Intenta de nuevo."
      : null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    login.mutate({
      email: String(formData.get("email") ?? "").trim(),
      pass: String(formData.get("password") ?? ""),
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          ¡Bienvenido de nuevo!
        </h1>
        <p className="text-pretty text-sm text-muted-foreground">
          Ingresa tus credenciales para gestionar las finanzas de tu comunidad.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <InputGroup className="h-11">
            <InputGroupAddon>
              <Mail />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              required
            />
          </InputGroup>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="password">Contraseña</Label>
            <Button
              variant="link"
              size="sm"
              className="h-auto px-0 text-sm"
              render={<a href={FORGOT_PASSWORD_HREF} />}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </div>
          <InputGroup className="h-11">
            <InputGroupAddon>
              <Lock />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked)}
          />
          <Label
            htmlFor="remember-me"
            className="cursor-pointer font-normal text-muted-foreground"
          >
            Recordarme en este dispositivo
          </Label>
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {errorMessage}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={login.isPending}
        >
          {login.isPending ? (
            <>
              <Spinner />
              Iniciando sesión...
            </>
          ) : (
            "Iniciar Sesión"
          )}
        </Button>
      </form>
    </div>
  );
}
