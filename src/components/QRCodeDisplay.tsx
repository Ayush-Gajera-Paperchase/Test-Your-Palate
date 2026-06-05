'use client';

import { QRCodeCanvas } from 'qrcode.react';

export default function QRCodeDisplay() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const playUrl = `${appUrl}/play`;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-2xl">
      <QRCodeCanvas
        value={playUrl}
        size={220}
        bgColor="#FFFFFF"
        fgColor="#26014E"
        level="H"
        marginSize={1}
      />
    </div>
  );
}
