import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Matches what Prisma sends back (minimal fields we use)

// List response shape from the new API

// In prod, set VITE_API_URL to your API domain. In dev, proxy handles it.
const BASE = import.meta.env.VITE_API_URL || '';

/** Form schema -> POST /api/universities */

const FormSchema = z.object({
  unitId: z.string().regex(/^\d+$/, 'Enter a numeric UNITID'),
  name: z.string().min(1, 'Name is required'),
  city: z.string().trim().optional(),
  state: z.string().trim().length(2, 'Use 2-letter code'),
  instUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  alias: z.string().trim().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

/** 2) API payload schema (after conversion) */
const ApiSchema = z.object({
  unitId: z.number().int().positive(),
  name: z.string(),
  city: z.string().optional(),
  state: z.string().length(2),
  instUrl: z.string().url().optional(),
  alias: z.string().optional(),
});
type ApiPayload = z.infer<typeof ApiSchema>;

const toPayload = (v: FormValues): ApiPayload => ({
  unitId: Number(v.unitId),
  name: v.name,
  city: v.city || undefined,
  state: v.state.toUpperCase(),
  instUrl: v.instUrl ? v.instUrl : undefined,
  alias: v.alias || undefined,
});

export default function App() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/universities`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      if (Array.isArray(json)) {
        return { items: json, total: json.length, page: 1, pageSize: json.length };
      }
      return json;
    },
  });

  // ✅ Use the form schema for RHF typing
  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { unitId: '', name: '', city: '', state: '' },
  });

  const createUniversity = useMutation({
    // ✅ Mutation expects the API payload (number unitId)
    mutationFn: async (payload: ApiPayload) => {
      const body = ApiSchema.parse(payload);
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
      return res.json();
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

      <form
        className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-6"
        onSubmit={handleSubmit((v) => createUniversity.mutate(toPayload(v)))}
      >
        <input className="border rounded px-3 py-2" placeholder="UNITID" {...register('unitId')} />
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

      <ul className="space-y-2">
        {universities.map((u: any) => (
          <li key={u.id ?? u.unitId} className="border rounded px-3 py-2">
            <div className="font-medium">{u.name}</div>
            <div className="text-sm text-gray-600">
              UNITID {u.unitId} · {u.city ?? '—'}, {u.state ?? '—'}
            </div>
          </li>
        ))}
      </ul>

      {data && (
        <p className="text-xs text-gray-500 mt-3">
          Showing {universities.length} of {data.total}
        </p>
      )}
    </div>
  );
}
