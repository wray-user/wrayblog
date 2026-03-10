// src/TestVideo.js
import React from 'react';

const TestVideo = () => {
  return (
    <div style={{ width: '500px', margin: '50px auto' }}>
      {/* 极简自动播放视频：只保留核心属性 */}
      <video
        src="/video/snow.mp4"  // 确保public/video/snow.mp4存在
        autoPlay
        muted
        loop
        playsInline
        controls
        width="400"
      />
      <p>如果视频没自动播放，看浏览器控制台（F12）的报错！</p>
    </div>
  );
};

export default TestVideo;