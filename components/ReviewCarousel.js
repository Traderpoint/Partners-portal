import { useState } from 'react';

const reviews = [
  {
    text: "Perfektní podpora a bleskový VPS! Doporučuji všem, kdo hledají stabilitu.",
    author: "Petr K."
  },
  {
    text: "Zprovoznění serveru do pár minut, skvělé ceny. Jsem spokojený!",
    author: "Jan S."
  },
  {
    text: "Migrace webu do cloudu bez problémů, ochotná technická pomoc.",
    author: "Marie D."
  }
];

export default function ReviewCarousel() {
  const [idx, setIdx] = useState(0);
  return (
    <div className="max-w-2xl mx-auto text-center">
      <p className="text-xl italic mb-2">"{reviews[idx].text}"</p>
      <div className="font-bold text-indigo-600 mb-4">{reviews[idx].author}</div>
      <button
        className="text-indigo-600 px-2"
        onClick={() => setIdx((idx + reviews.length - 1) % reviews.length)}
      >&lt;</button>
      <button
        className="text-indigo-600 px-2"
        onClick={() => setIdx((idx + 1) % reviews.length)}
      >&gt;</button>
    </div>
  );
}
