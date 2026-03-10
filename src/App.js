import React from 'react';
import './App.css';
import Card from './components/Header';


// 定义App函数组件
function App() {
  // 组件的核心：返回JSX结构（React的UI描述语法）
  return (
    <div className="App">
      <header className="App-header">
        <Card
        title="Holle World" 
        content="Wray" 
        // imageUrl="/img/sky.jpg"  
        videoUrl="/video/snow.mp4"
        />
      </header>
    </div>

  );
}

export default App;