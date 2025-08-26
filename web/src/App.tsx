import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type University = { id: string; name: string; location: string; state: string };
const UniversityCreate = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  state: z.string().min(1),
});

// In prod, set VITE_API_URL to your API domain. In dev, proxy handles it.
const BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const qc = useQueryClient();

  const { data: universities } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/universities`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return (await res.json()) as University[];
    },
  });

  const { register, handleSubmit, reset } = useForm<typeof UniversityCreate>();
  const createUniversity = useMutation({
    mutationFn: async (payload: typeof UniversityCreate) => {
      const body = UniversityCreate.parse(payload);
      const res = await fetch(`${BASE}/api/universities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['universities'] });
      reset();
    },
  });

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Universities</h1>

      <form className="flex gap-2 mb-4" onSubmit={handleSubmit((v) => createUniversity.mutate(v))}>
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="New university..."
          {...register('name')}
        />
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Location..."
          {...register('location')}
        />
        <input
          type="text"
          className="border rounded px-3 py-2 flex-1"
          placeholder="State"
          {...register('state')}
        />
        <button className="px-4 py-2 rounded bg-black text-white">Add</button>
      </form>

      <ul className="space-y-2">
        {(universities ?? []).map((t) => (
          <li key={t.id} className="border rounded px-3 py-2">
            {t.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
