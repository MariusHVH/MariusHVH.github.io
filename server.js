const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());

app.post('/convert', (req, res) => {
  const { url, format } = req.body;
  try {
    const outputTemplate = '%(title)s.%(ext)s';
    let cmd = `yt-dlp -o "${outputTemplate}" `;
    if (format === 'mp3') {
      cmd += `-x --audio-format mp3 --audio-quality 0 `;
    } else {
      cmd += `-f 18 `;
    }
    cmd += `"${url}"`;
    const output = execSync(cmd, { encoding: 'utf-8', timeout: 180000 });
    const match = output.match(/\[download\] Destination: (.+)/m);
    const filename = match ? match[1].trim() : 'output';
    const fileUrl = `${process.env.RENDER_EXTERNAL_URL}/download/${encodeURIComponent(filename)}`;
    res.json({ success: true, downloadUrl: fileUrl });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.get('/download/:file', (req, res) => {
  const filePath = path.join(__dirname, req.params.file);
  if (fs.existsSync(filePath)) res.download(filePath);
  else res.status(404).send('File not found');
});

const port = process.env.PORT || 3000;
app.listen(port);
