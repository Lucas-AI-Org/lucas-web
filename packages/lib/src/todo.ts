import { z } from "zod";

export const TodoCreate = z.object({ title: z.string().min(1) });
export type TodoCreate = z.infer<typeof TodoCreate>;
