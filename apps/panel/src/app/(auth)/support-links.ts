const SUPPORT_EMAIL = "sanaruca@gmail.com";

export const FORGOT_PASSWORD_HREF =
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "Recuperación de contraseña - Condora",
  )}`;

export const REQUEST_DEMO_HREF = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  "Solicitud de demo - Condora",
)}`;
