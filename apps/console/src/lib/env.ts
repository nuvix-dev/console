import { isPlatform } from "./constants";

type EnvConfig = {
  API_ENDPOINT: string;
  PLATFORM_ENDPOINT: string;
};

export function getEnv(): EnvConfig {
  if (isPlatform || process.env.NODE_ENV === "development") {
    return {
      API_ENDPOINT: process.env.NEXT_PUBLIC_NUVIX_ENDPOINT || "http://localhost:4000/v1",
      PLATFORM_ENDPOINT: process.env.NEXT_PUBLIC_SERVER_ENDPOINT || "http://localhost:4100",
    };
  }

  if (typeof window === "undefined") {
    return {
      API_ENDPOINT: process.env.NUVIX_API_ENDPOINT || "http://localhost:4000/v1",
      PLATFORM_ENDPOINT: process.env.NUVIX_PLATFORM_ENDPOINT || "http://localhost:4100",
    };
  }

  return (window as Window & typeof globalThis & { __NUVIX__: EnvConfig }).__NUVIX__ || {};
}
