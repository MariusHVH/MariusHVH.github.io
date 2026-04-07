
const SERVER = 'http://localhost:3000'

async function fetchVideoInfo(ytUrl) {
  const res = await fetch(`${SERVER}/info?url=${encodeURIComponent(ytUrl)}`)
  if (!res.ok) throw new Error('Could not fetch video info')
  return res.json()
}

const QUALITY_MAP = {
  'best': 'max',
  '4k': '2160',
  '1440p': '1440',
  '1080p': '1080',
  '720p': '720',
  'mp3': 'max',
}

const CODEC_MAP = {
  'h264': 'h264',
  'h265': 'h265',
  'vp9': 'vp9',
  'av1': 'av1',
  'mp3': 'mp3',
}


async function fetchDownloadUrl(ytUrl, resolution, codec, isAudioOnly, onProgress) {

  const startRes = await fetch(`${SERVER}/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: ytUrl,
      videoQuality: QUALITY_MAP[resolution] || 'max',
      youtubeVideoCodec: CODEC_MAP[codec] || 'h264',
      isAudioOnly: !!isAudioOnly || codec === 'mp3',
    }),
  })

  if (!startRes.ok) {
    const err = await startRes.json().catch(() => ({}))
    throw new Error(err.error || `Server error ${startRes.status}`)
  }

  const { id } = await startRes.json()
  const ext = (isAudioOnly || codec === 'mp3') ? 'mp3' : 'mp4'


  await poll(id, onProgress)


  return {
    downloadUrl: `${SERVER}/download/${id}`,
    filename: `video.${ext}`,
  }
}

function poll(id, onProgress) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${SERVER}/status/${id}`)
        const data = await res.json()

        if (onProgress && data.progress !== undefined) {
          onProgress(data.progress)
        }

        if (data.status === 'done') {
          clearInterval(interval)
          resolve()
        } else if (data.status === 'error') {
          clearInterval(interval)
          reject(new Error(data.error || 'Download failed on server'))
        }
      } catch (err) {
        clearInterval(interval)
        reject(new Error('Lost connection to server'))
      }
    }, 1500)
  })
}

function triggerDownload(downloadUrl, filename) {
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => document.body.removeChild(a), 500)
}

function openCobaltFallback(ytUrl) {
  window.open(`https://cobalt.tools/?u=${encodeURIComponent(ytUrl)}`, '_blank', 'noopener,noreferrer')
}