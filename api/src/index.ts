import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import { PrismaClient } from './generated/prisma/client';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cookieParser());

// Dev: allow Vite origin. In prod, change to your SPA origin.
app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  })
);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/todos', async (_req, res) => {
  const todos = await prisma.todo.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(todos);
});

const CreateTodo = z.object({ title: z.string().min(1) });
app.post('/api/todos', async (req, res) => {
  const parsed = CreateTodo.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const todo = await prisma.todo.create({
    data: { title: parsed.data.title },
  });
  res.status(201).json(todo);
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
