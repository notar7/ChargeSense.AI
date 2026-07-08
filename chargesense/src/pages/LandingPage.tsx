import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlobeEntry from '../components/GlobeEntry/GlobeEntry';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleIndiaClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="relative w-screen h-screen bg-[#0A0F1E] overflow-hidden">
      <GlobeEntry onIndiaClick={handleIndiaClick} />
    </div>
  );
}
