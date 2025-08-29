import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import { PrismaClient } from '../prisma/generated/prisma/client.js';
const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // server-to-server / curl
      const hostname = new URL(origin).hostname;
      const allowed = origin.startsWith('http://localhost:5173') || /\.vercel\.app$/.test(hostname);
      return allowed ? callback(null, true) : callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// small helper to avoid try/catch in every route
const asyncHandler = (fn: any) => (req: Request, res: Response, next: (err?: any) => void) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/health', (_req, res) => res.json({ ok: true }));

/** List with filters & pagination */
app.get(
  '/api/universities',
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10), 1);
    const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize ?? '25'), 10), 1), 100);
    const q = (req.query.q as string | undefined)?.trim();
    const state = (req.query.state as string | undefined)?.trim();
    const control =
      (req.query.control as 'PUBLIC' | 'PRIVATE_NONPROFIT' | 'PRIVATE_FORPROFIT' | undefined) ??
      undefined;

    const where: any = {
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      ...(state ? { state } : {}),
      ...(control ? { control } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.university.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.university.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  })
);

/** Fetch one by unitId */
app.get(
  '/api/universities/:unitId',
  asyncHandler(async (req: Request, res: Response) => {
    const unitId = Number(req.params.unitId);
    if (!Number.isInteger(unitId)) return res.status(400).json({ error: 'Invalid unitId' });

    const university = await prisma.university.findUnique({ where: { unitId } });
    if (!university) return res.status(404).json({ error: 'Not found' });
    res.json(university);
  })
);

/** Create (or idempotent upsert) */
const CreateUniversity = z.object({
  unitId: z.number().int().positive(),
  name: z.string().min(1),

  alias: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state: z.string().trim().length(2).optional().nullable(),

  control: z.enum(['PUBLIC', 'PRIVATE_NONPROFIT', 'PRIVATE_FORPROFIT']).optional().nullable(),

  accredAgency: z.string().optional().nullable(),
  instUrl: z.string().url().optional().nullable(),
  npcUrl: z.string().url().optional().nullable(),

  // add any other fields you want to accept here, all optional
});
type CreateUniversityBody = z.infer<typeof CreateUniversity>;

// Generic error handler
app.use((err: any, _req: Request, res: Response, _next: (err?: any) => void) => {
  console.error(err);
  if (err?.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({ error: err.message, code: err.code });
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
