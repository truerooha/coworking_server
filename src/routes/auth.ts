import { Router } from 'express';

const router = Router();

// Простейшая проверка доступа. При желании замените на БД/ENV.
const allowedUsers = new Set<string>(['true_rooha', 'jane_smith', 'admin_user', 'Griz9']);
const adminUsers = new Set<string>(['true_rooha']);

router.post('/check', (req, res) => {
  const usernameRaw: unknown = req.body?.username;
  const username = typeof usernameRaw === 'string' ? usernameRaw : '';

  const allowed = allowedUsers.has(username);
  const isAdmin = adminUsers.has(username);

  return res.json({
    allowed,
    isAdmin,
  });
});

export default router;


