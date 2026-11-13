import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from '@supabase/ssr';
import type { Request, Response } from 'express';

export interface ServerClientContext {
  req?: Request;
  res?: Response;
}

export function createClient(context?: ServerClientContext) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase URL or public key (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY).'
    );
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        const cookieHeader = context?.req?.headers.cookie ?? '';
        return parseCookieHeader(cookieHeader).map(({ name, value }) => ({
          name,
          value: value ?? '',
        }));
      },
      setAll(cookiesToSet, headers) {
        if (!context?.res) return;

        cookiesToSet.forEach(({ name, value, options }) => {
          context.res!.append(
            'Set-Cookie',
            serializeCookieHeader(name, value, options)
          );
        });

        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            context.res!.setHeader(key, value);
          });
        }
      },
    },
  });
}

export function createServiceRoleClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY for server-only client.'
    );
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}
