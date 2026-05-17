import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './BlogEditor.css'; 

const BlogEditor = () => {
  const [content, setContent] = useState(''); // 存储 Markdown 内容
  const [title, setTitle] = useState('');     // 存储标题
  const [posts, setPosts] = useState([]);     // 模拟数据库：存储已发布的文章

  // 初始化：从本地存储加载已有的文章
  useEffect(() => {
    const savedPosts = JSON.parse(localStorage.getItem('my_blogs') || '[]');
    setPosts(savedPosts);
  }, []);

  // 发布功能
  const handlePublish = () => {
    if (!title || !content) return alert("标题和内容不能为空哦！");
     
    const newPost = {
      id: Date.now(),
      title,
      content,
      date: new Date().toLocaleString()
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem('my_blogs', JSON.stringify(updatedPosts)); // 存入本地
    
    // 清空输入框
    setTitle('');
    setContent('');
    alert("发布成功！(已保存至本地存储)");
  };

  return (
    <div className="blog-container">
      {/* 1. 编辑区域 */}
      <div className="editor-section">
        <h2>写博客</h2>
        <input 
          type="text" 
          placeholder="输入文章标题..." 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="title-input"
        />
        <textarea 
          placeholder="支持 Markdown 格式..." 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="markdown-input"
        />
        <button onClick={handlePublish} className="publish-btn">发布文章</button>
      </div>

      <hr />

      {/* 2. 展示区域（模拟你图片中的列表） */}
      <div className="posts-display">
        <h2>已发布的文章</h2>
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <h3>{post.title}</h3>
            <span className="post-date">{post.date}</span>
            <div className="markdown-preview">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogEditor;