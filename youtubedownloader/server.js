const express = require('express')
const { execFile, spawn } = require('child_process')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const os = require('os')
const crypto = require('crypto')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => res.json({ status: 'running' }))

app.get('/info', (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'No URL provided' })

  execFile('yt-dlp', [
    '--no-playlist',
    '--print', '%(title)s',
    '--print', '%(thumbnail)s',
    '--print', '%(duration_string)s',
    url
  ], { timeout: 15000 }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: 'Could not fetch video info' })
    const lines = stdout.trim().split('\n')
    res.json({
      title:     lines[0] || 'Unknown Title',
      thumbnail: lines[1] || '',
      duration:  lines[2] || '',
    })
  })
})

const jobs = {}

function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

app.post('/fetch', (req, res) => {
  const { url, videoQuality, youtubeVideoCodec, isAudioOnly } = req.body
  if (!url) return res.status(400).json({ error: 'No URL provided' })

  const id = crypto.randomBytes(8).toString('hex')
  jobs[id] = { status: 'downloading', tmpFile: null, title: 'video', error: null, isAudio: !!isAudioOnly, progress: 0 }

  const h = (videoQuality === 'max' || !videoQuality) ? 9999 : parseInt(videoQuality)
  const applyCodecFilter = h <= 1080
  const codecMap = { h264: 'avc1', h265: 'hvc1', vp9: 'vp09', av1: 'av01' }
  const vcodec = codecMap[youtubeVideoCodec] || 'avc1'

  // Always end with bestvideo+bestaudio and then 'best' so it ALWAYS downloads
  // something even if the requested resolution/codec isn't available
  let formatStr
  if (applyCodecFilter) {
    formatStr = [
      `bestvideo[vcodec^=${vcodec}][height<=${h}]+bestaudio[ext=m4a]`,
      `bestvideo[vcodec^=${vcodec}][height<=${h}]+bestaudio`,
      `bestvideo[height<=${h}]+bestaudio[ext=m4a]`,
      `bestvideo[height<=${h}]+bestaudio`,
      `bestvideo+bestaudio[ext=m4a]`,
      `bestvideo+bestaudio`,
      'best'
    ].join('/')
  } else {
    formatStr = [
      `bestvideo[height<=${h}]+bestaudio[ext=m4a]`,
      `bestvideo[height<=${h}]+bestaudio`,
      `bestvideo+bestaudio[ext=m4a]`,
      `bestvideo+bestaudio`,
      'best'
    ].join('/')
  }

  // Step 1: get title
  execFile('yt-dlp', ['--no-playlist', '--print', 'title', url], (err, stdout) => {
    const rawTitle = (stdout || '').trim()
    const title = rawTitle ? sanitizeFilename(rawTitle) : 'video'
    jobs[id].title = title

    const ext = jobs[id].isAudio ? 'mp3' : 'mp4'
    const tmpFile = path.join(os.tmpdir(), `ytdl_${id}.${ext}`)
    jobs[id].tmpFile = tmpFile

    console.log(`\n[job:${id}] "${title}" (${jobs[id].isAudio ? 'Audio' : 'Video'})`)
    console.log(`[format] ${jobs[id].isAudio ? 'mp3' : formatStr}`)

    let args = [
      '--no-playlist',
      '--no-warnings',
    ]

    if (jobs[id].isAudio) {
      args.push('-x', '--audio-format', 'mp3', '-o', tmpFile)
    } else {
      args.push('-f', formatStr, '--merge-output-format', 'mp4', '-o', tmpFile)
    }

    args.push(url)

    // Step 2: download
    const process = spawn('yt-dlp', args)

    process.stdout.on('data', (data) => {
      const output = data.toString()
      const match = output.match(/(\d+\.?\d*)%/)
      if (match) {
        jobs[id].progress = Math.round(parseFloat(match[1]))
      }
    })

    process.on('close', (code) => {
      if (code !== 0 || !fs.existsSync(tmpFile)) {
        console.error(`[job:${id}] FAILED with code ${code}`)
        jobs[id].status = 'error'
        jobs[id].error = 'Download failed. The video may be unavailable or private.'
        return
      }
      const mb = (fs.statSync(tmpFile).size / 1024 / 1024).toFixed(2)
      console.log(`[job:${id}] Done — ${mb} MB`)
      jobs[id].progress = 100
      jobs[id].status = 'done'
    })

    process.on('error', (err) => {
      console.error(`[job:${id}] PROCESS ERROR:`, err)
      jobs[id].status = 'error'
      jobs[id].error = err.message
    })
  })

  res.json({ id })
})

app.get('/status/:id', (req, res) => {
  const job = jobs[req.params.id]
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json({ status: job.status, progress: job.progress || 0, error: job.error || null })
})

app.get('/download/:id', (req, res) => {
  const job = jobs[req.params.id]
  if (!job || job.status !== 'done') return res.status(404).json({ error: 'Not ready' })

  const stat = fs.statSync(job.tmpFile)
  const ext = job.isAudio ? 'mp3' : 'mp4'
  const mime = job.isAudio ? 'audio/mpeg' : 'video/mp4'
  const asciiTitle = job.title.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_')
  const encodedTitle = encodeURIComponent(job.title + '.' + ext)
  res.setHeader('Content-Type', mime)
  res.setHeader('Content-Disposition', `attachment; filename="${asciiTitle}.${ext}"; filename*=UTF-8''${encodedTitle}`)
  res.setHeader('Content-Length', stat.size)

  const stream = fs.createReadStream(job.tmpFile)
  stream.pipe(res)
  stream.on('close', () => {
    fs.unlink(job.tmpFile, () => {})
    delete jobs[req.params.id]
  })
})

app.listen(3000, () => console.log('✅ Server running at http://localhost:3000'))