import React from 'react';
import { Music } from 'lucide-react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <Music size={32} />
          <h1>Thiiia</h1>
        </div>
        <p className="tagline">AI-Powered Music Source Separation</p>
      </div>
    </header>
  );
};

export default Header;