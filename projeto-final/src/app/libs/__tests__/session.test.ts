// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieStore, cookieValues, cookiesMock } = vi.hoisted(() => {
  const cookieValues: Record<string, string | undefined> = {};
  const cookieStore = {
    get: vi.fn((name: string) => {
      const value = cookieValues[name];
      return value ? { value } : undefined;
    }),
    set: vi.fn((name: string, value: string) => {
      cookieValues[name] = value;
    }),
    delete: vi.fn((name: string) => {
      delete cookieValues[name];
    }),
  };

  return {
    cookieStore,
    cookieValues,
    cookiesMock: vi.fn(async () => cookieStore),
  };
});

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

import { createSessionToken, deleteSession, getSession } from '../session';

describe('session actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const name of Object.keys(cookieValues)) {
      delete cookieValues[name];
    }
  });

  it('creates a session that identifies the authenticated user', async () => {
    await createSessionToken('user-123', 'tutorado@example.com', 'Tutorado');

    expect(cookieStore.set).toHaveBeenCalledWith(
      'sgoa_session',
      expect.any(String),
      expect.any(Object)
    );
    await expect(getSession()).resolves.toMatchObject({
      userId: 'user-123',
      email: 'tutorado@example.com',
      perfil: 'Tutorado',
    });
  });

  it('returns null when there is no session cookie', async () => {
    await expect(getSession()).resolves.toBeNull();
  });

  it('returns null when the session token is invalid', async () => {
    cookieValues.sgoa_session = 'invalid-token';

    await expect(getSession()).resolves.toBeNull();
  });

  it('deletes only the current user session cookie', async () => {
    cookieValues.sgoa_session = 'current-session';
    cookieValues.other_cookie = 'unrelated-value';

    await deleteSession();

    expect(cookieStore.delete).toHaveBeenCalledExactlyOnceWith('sgoa_session');
    expect(cookieValues.sgoa_session).toBeUndefined();
    expect(cookieValues.other_cookie).toBe('unrelated-value');
  });
});
