import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type Control = 'PUBLIC' | 'PRIVATE_NONPROFIT' | 'PRIVATE_FORPROFIT';

// Matches what Prisma sends back (minimal fields we use)
type University = {
  id: string;
  unitId: number;
  name: string;
  city: string | null;
  state: string | null;
  control: Control | null;
};

// List response shape from the new API
type ListResponse<T> = { items: T[]; total: number; page: number; pageSize: number };

// In prod, set VITE_API_URL to your API domain. In dev, proxy handles it.
const BASE = import.meta.env.VITE_API_URL || '';

/** Form schema -> POST /api/universities */
const UniversityCreate = z.object({
  unitId: z.coerce.number().int().positive(),
  name: z.string().min(1, 'Name is required'),
  city: z.string().trim().optional(),
  state: z
    .string()
    .trim()
    .min(2, 'Use 2-letter code')
    .max(2, 'Use 2-letter code')
    .transform((s) => s.toUpperCase()),
  instUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
  alias: z.string().trim().optional(),
});
type UniversityCreateValues = z.infer<typeof UniversityCreate>;

export default function App() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['universities'],
    queryFn: async (): Promise<ListResponse<University>> => {
      const res = await fetch(`${BASE}/api/universities`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      // Back-compat: if API returns an array, wrap it
      if (Array.isArray(json)) {
        return { items: json as University[], total: json.length, page: 1, pageSize: json.length };
      }
      return json as ListResponse<University>;
    },
  });

  const { register, handleSubmit, reset } = useForm<UniversityCreateValues>({
    resolver: zodResolver(UniversityCreate),
    defaultValues: { unitId: undefined as unknown as number, name: '', city: '', state: '' },
  });

  const createUniversity = useMutation({
    mutationFn: async (payload: UniversityCreateValues) => {
      const body = UniversityCreate.parse(payload);
      const res = await fetch(`${BASE}/api/universities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Failed to create');
      }
      return (await res.json()) as University;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['universities'] });
      reset();
    },
  });

  const universities = data?.items ?? [];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Universities</h1>

      {/* Create */}
      <form
        className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-6"
        onSubmit={handleSubmit((v) => createUniversity.mutate(v))}
      >
        <input
          className="border rounded px-3 py-2"
          placeholder="UNITID"
          type="number"
          {...register('unitId')}
        />
        <input
          className="border rounded px-3 py-2 md:col-span-2"
          placeholder="Name"
          {...register('name')}
        />
        <input className="border rounded px-3 py-2" placeholder="City" {...register('city')} />
        <input
          className="border rounded px-3 py-2"
          placeholder="State (e.g. CA)"
          maxLength={2}
          {...register('state')}
        />
        <input
          className="border rounded px-3 py-2 md:col-span-3"
          placeholder="Website (optional)"
          {...register('instUrl')}
        />
        <input
          className="border rounded px-3 py-2 md:col-span-2"
          placeholder="Alias (optional)"
          {...register('alias')}
        />
        <button className="px-4 py-2 rounded bg-black text-white md:col-span-1">Add</button>
      </form>

      {/* List */}
      <ul className="space-y-2">
        {universities.map((u) => (
          <li key={u.id ?? u.unitId} className="border rounded px-3 py-2">
            <div className="font-medium">{u.name}</div>
            <div className="text-sm text-gray-600">
              UNITID {u.unitId} · {u.city ?? '—'}, {u.state ?? '—'}
            </div>
          </li>
        ))}
      </ul>

      {/* Optional: counts */}
      {data && (
        <p className="text-xs text-gray-500 mt-3">
          Showing {universities.length} of {data.total}
        </p>
      )}
    </div>
  );
}
