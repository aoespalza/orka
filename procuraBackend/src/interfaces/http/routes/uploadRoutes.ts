import { Router, Request, Response } from 'express';
import { authenticate } from '../../../shared/middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/tmp/uploads/rut';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `rut-${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

// Upload RUT file
router.post('/upload-rut', authenticate, upload.single('rutFile'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
    }

    res.json({
      message: 'Archivo subido correctamente',
      filename: req.file.filename,
      path: req.file.path,
      originalName: req.file.originalname
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get RUT file
router.get('/rut/:filename', authenticate, (req: Request, res: Response) => {
  try {
    const filePath = path.join('/tmp/uploads/rut', req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${req.params.filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
