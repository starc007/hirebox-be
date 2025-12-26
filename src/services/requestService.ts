import { Request } from "express";

export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
};

export type SortParams = {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type FilterParams = {
  [key: string]: unknown;
};

export function getPaginationParams(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit as string, 10) || 10)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function getSortParams(req: Request): SortParams {
  const sortBy = (req.query.sortBy as string) || undefined;
  const sortOrder =
    (req.query.sortOrder as string)?.toLowerCase() === "desc" ? "desc" : "asc";

  return { sortBy, sortOrder };
}

export function getFilterParams(req: Request): FilterParams {
  const { page, limit, sortBy, sortOrder, ...filters } = req.query;
  return filters as FilterParams;
}

export function getQueryParam(req: Request, key: string): string | undefined {
  return req.query[key] as string | undefined;
}

export function getQueryParamAsNumber(
  req: Request,
  key: string
): number | undefined {
  const value = req.query[key];
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export function getQueryParamAsBoolean(
  req: Request,
  key: string
): boolean | undefined {
  const value = req.query[key];
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return undefined;
}

export function getBodyParam<T>(req: Request, key: string): T | undefined {
  return (req.body as Record<string, unknown>)[key] as T | undefined;
}

export function getPathParam(req: Request, key: string): string | undefined {
  return req.params[key];
}

export function getHeader(req: Request, key: string): string | undefined {
  return req.headers[key.toLowerCase()] as string | undefined;
}

export function getIpAddress(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

export function getUserAgent(req: Request): string {
  return req.headers["user-agent"] || "unknown";
}
