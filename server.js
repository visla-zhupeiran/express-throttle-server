const express = require('express');
const path = require('path');
const fs = require('fs');
const { Throttle } = require('stream-throttle');

const app = express();


// 带宽限制中间件
app.get('/*.mp4', (req, res) => {
   const fileName = req.params[0];
  console.log("request", fileName)
  const filePath = path.join(__dirname, 'public', `${fileName}.mp4`);
  const stat = fs.statSync(filePath);
  let fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // 解析 Range 头部
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    
    // 计算要发送的片段大小
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const throttleStream = new Throttle({ rate: 1000 * 1024 }); // 限制为100KB/s

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4'
    });

    file.pipe(throttleStream).pipe(res);
  } else {
    // 整个文件请求的处理
    const fileStream = fs.createReadStream(filePath);
    const throttleStream = new Throttle({ rate: 1000 * 1024 }); // 限制为100KB/s
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4'
    });
    console.log("response")
    fileStream.pipe(throttleStream).pipe(res);
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to the bandwidth throttled server!');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

