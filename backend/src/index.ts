import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';

const app = express();
const port = 5000;
const upload = multer({ dest: 'uploads/' });
app.use(cors());

app.post('/classify', upload.array('images'), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const results: { filename: string; label: string }[] = [];

  for (const file of files) {
    const form = new FormData();
    form.append('image', fs.createReadStream(file.path));

    try {
      const response = await axios.post('http://localhost:6000/predict', form, {
        headers: form.getHeaders(),
      });

      results.push({
        filename: file.originalname,
        label: response.data.label,
      });
    } catch (err) {
      console.error('Error from model server:', err);
      results.push({
        filename: file.originalname,
        label: 'Error',
      });
    }

    fs.unlinkSync(file.path); // cleanup
  }

  res.json({ results });
});

app.listen(port, () => {
  console.log(`Express server running at http://localhost:${port}`);
});
