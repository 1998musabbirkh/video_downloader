const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to fetch available video formats
app.get('/formats', (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send('No URL provided');
  }

  const command = `yt-dlp -F "${url}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error fetching formats:', stderr);
      return res.status(500).send(`Error fetching formats: ${stderr}`);
    }

    const lines = stdout.split('\n');
    const mp4Formats = lines.filter(line => line.includes('mp4'));

    res.send(mp4Formats.join('\n'));
  });
});

// Endpoint to download video with specified format
app.get('/download', (req, res) => {
  const url = req.query.url;
  const formatId = req.query.format;

  if (!url || !formatId) {
    return res.status(400).send('URL or format not provided');
  }

  // Using a unique identifier for the file
  const uniqueId = Date.now();
  const videoFileName = `video_${uniqueId}.mp4`;
  const audioFileName = `audio_${uniqueId}.m4a`;
  const videoFilePath = path.join(__dirname, videoFileName);
  const audioFilePath = path.join(__dirname, audioFileName);
  const mergedFileName = `merged_${uniqueId}.mp4`;
  const mergedFilePath = path.join(__dirname, mergedFileName);

  // Function to clean up temporary files
  const cleanupFiles = () => {
    fs.unlink(videoFilePath, err => {
      if (err) console.error('Error deleting video file:', err);
    });

    fs.unlink(audioFilePath, err => {
      if (err) console.error('Error deleting audio file:', err);
    });

    fs.unlink(mergedFilePath, err => {
      if (err) console.error('Error deleting merged file:', err);
    });
  };

  // Download video and audio in parallel
  const videoCommand = `yt-dlp -f ${formatId} -o "${videoFilePath}" "${url}"`;
  const audioCommand = `yt-dlp -f bestaudio -o "${audioFilePath}" "${url}"`;

  Promise.all([
    new Promise((resolve, reject) => {
      exec(videoCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('Error downloading video:', stderr);
          reject(`Error downloading video: ${stderr}`);
        } else {
          resolve();
        }
      });
    }),
    new Promise((resolve, reject) => {
      exec(audioCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('Error downloading audio:', stderr);
          reject(`Error downloading audio: ${stderr}`);
        } else {
          resolve();
        }
      });
    }),
  ]).then(() => {
    // Merge video and audio
    const mergeCommand = `ffmpeg -i "${videoFilePath}" -i "${audioFilePath}" -c:v copy -c:a aac -strict experimental "${mergedFilePath}"`;
    exec(mergeCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Error merging files:', stderr);
        cleanupFiles();
        return res.status(500).send(`Error merging files: ${stderr}`);
      }

      // Serve the merged file
      res.download(mergedFilePath, err => {
        if (err) {
          console.error('Error sending file:', err);
          return res.status(500).send('Error sending file');
        }

        // Clean up after sending the file
        cleanupFiles();
      });
    });
  }).catch(errMessage => {
    cleanupFiles();
    return res.status(500).send(errMessage);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
