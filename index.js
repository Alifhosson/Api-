const express = require('express');
const ytdl = require('ytdl-core');
const yts = require('yt-search');
const fs = require('fs-extra');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/sing', async (req, res) => {
  try {
    const musicName = req.query.song;

    const searchResults = await yts(musicName);
    if (!searchResults.videos.length) {
      return res.status(404).send('No music found.');
    }

    const music = searchResults.videos[0];
    const musicUrl = music.url;

    const stream = ytdl(musicUrl, { filter: 'audioonly' });

    const fileName = `${Date.now()}.mp3`;
    const filePath = __dirname + `/cache/${fileName}`;

    const writeStream = fs.createWriteStream(filePath);

    stream.pipe(writeStream);

    writeStream.on('finish', () => {
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('[ERROR]', err);
          res.status(500).send('Internal Server Error');
        }
        // Remove the file after sending the response
        fs.unlink(filePath, (unlinkError) => {
          if (unlinkError) {
            console.error('[ERROR]', unlinkError);
          }
        });
      });
    });

    writeStream.on('error', (writeError) => {
      console.error('[ERROR]', writeError);
      res.status(500).send('Internal Server Error');
    });

  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost: ${port}`);
});