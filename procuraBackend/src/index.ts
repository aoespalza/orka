import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './interfaces/http/routes';
import { schedulerService } from './infrastructure/services/schedulerService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler — captura SyntaxError de body-parser y errores generales
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido en el cuerpo de la solicitud' });
  }
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

// Evitar crash por excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);

  // Iniciar scheduler de notificaciones
  schedulerService.start().catch(err => {
    console.error('[Scheduler] Error al iniciar:', err);
  });
});

export default app;
