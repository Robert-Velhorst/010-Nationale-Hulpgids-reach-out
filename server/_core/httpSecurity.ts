import type { RequestHandler } from "express";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self' https: wss:",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https:",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
].join("; ");

export const applySecurityHeaders: RequestHandler = (req, res, next) => {
  res.setHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (req.secure || forwardedProto === "https") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
  next();
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const requireSameOriginForMutation: RequestHandler = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.get("origin");
  if (!origin) return next();

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    res.status(403).json({ error: "Request origin is invalid." });
    return;
  }

  const acceptedHosts = new Set(
    [req.get("host"), req.get("x-forwarded-host")?.split(",")[0]?.trim()]
      .filter((value): value is string => Boolean(value))
      .map(value => value.toLowerCase())
  );
  if (!acceptedHosts.has(originHost)) {
    res.status(403).json({ error: "Cross-origin state change blocked." });
    return;
  }
  next();
};
