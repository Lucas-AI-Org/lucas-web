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
    origin: ['http://localhost:5173'],
    credentials: true,
  })
);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get('/api/universities', async (_req: Request, res: Response) => {
  const universities = await prisma.university.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(universities);
});

const CreateUniversity = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  state: z.string().min(1),
});
type CreateUniversityBody = z.infer<typeof CreateUniversity>;

app.post(
  '/api/universities',
  async (req: Request<{}, any, CreateUniversityBody>, res: Response) => {
    const parsed = CreateUniversity.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const university = await prisma.university.create({
      data: parsed.data,
    });
    res.status(201).json(university);
  }
);

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
