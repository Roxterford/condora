/**
 * Cookie de sesión del panel.
 *
 * El login la escribe a mano y el cierre de sesión tiene que borrarla, así que
 * el nombre y los vencimientos viven acá. Antes eran constantes locales de
 * `login-form.tsx` y ningún otro archivo podía referenciarlas.
 */

export const COOKIE_NAME = "api_token";

/** 24 h: sesión de una jornada. */
export const SESSION_MAX_AGE = 60 * 60 * 24;

/** 30 días: "recordarme". */
export const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30;

/** Escribe la cookie de sesión. `maxAge` en segundos. */
export function setAuthCookie(token: string, maxAge: number): void {
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Borra la cookie de sesión.
 *
 * `max-age=0` es lo que la expira; hay que repetir `path` y `SameSite` porque
 * el navegador solo borra una cookie si los atributos coinciden con los del
 * `Set-Cookie` original.
 */
export function clearAuthCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}